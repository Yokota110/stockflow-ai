import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PurchaseOrderStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { CreatePurchaseOrderDto, UpdatePurchaseOrderDto, ReceivePODto } from './dto/po.dto';
import { paginate, paginationMeta, toNumber } from '../../common/dto/pagination.dto';

@Injectable()
export class PurchaseOrdersService {
  constructor(
    private prisma: PrismaService,
    private inventoryService: InventoryService,
  ) {}

  async findAll(orgId: string, params: { page?: number; limit?: number; status?: PurchaseOrderStatus }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const where = {
      organizationId: orgId,
      ...(params.status && { status: params.status }),
    };

    const [orders, total] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        where,
        include: {
          supplier: { select: { id: true, name: true } },
          items: { include: { product: { select: { id: true, name: true, sku: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        ...paginate(page, limit),
      }),
      this.prisma.purchaseOrder.count({ where }),
    ]);

    return {
      data: orders.map((o) => this.formatPO(o)),
      meta: paginationMeta(total, page, limit),
    };
  }

  async findOne(orgId: string, id: string) {
    const po = await this.prisma.purchaseOrder.findFirst({
      where: { id, organizationId: orgId },
      include: {
        supplier: true,
        items: { include: { product: true } },
      },
    });
    if (!po) throw new NotFoundException('Purchase order not found');
    return this.formatPO(po);
  }

  async create(orgId: string, dto: CreatePurchaseOrderDto) {
    const poNumber = await this.generatePONumber(orgId);
    const subtotal = dto.items.reduce((sum, item) => sum + item.quantityOrdered * item.unitCost, 0);
    const taxRate = await this.getTaxRate(orgId);
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    const po = await this.prisma.purchaseOrder.create({
      data: {
        organizationId: orgId,
        supplierId: dto.supplierId,
        poNumber,
        expectedDate: dto.expectedDate ? new Date(dto.expectedDate) : undefined,
        notes: dto.notes,
        subtotal,
        tax,
        total,
        items: {
          create: dto.items.map((item) => ({
            productId: item.productId,
            quantityOrdered: item.quantityOrdered,
            unitCost: item.unitCost,
          })),
        },
      },
      include: {
        supplier: true,
        items: { include: { product: true } },
      },
    });

    return this.formatPO(po);
  }

  async update(orgId: string, id: string, dto: UpdatePurchaseOrderDto) {
    const po = await this.findOne(orgId, id);
    if (po.status !== 'DRAFT') throw new ConflictException('Only draft POs can be updated');

    if (dto.items) {
      await this.prisma.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: id } });
      const subtotal = dto.items.reduce((sum, item) => sum + item.quantityOrdered * item.unitCost, 0);
      const taxRate = await this.getTaxRate(orgId);
      const tax = subtotal * taxRate;

      const updated = await this.prisma.purchaseOrder.update({
        where: { id },
        data: {
          supplierId: dto.supplierId,
          expectedDate: dto.expectedDate ? new Date(dto.expectedDate) : undefined,
          notes: dto.notes,
          subtotal,
          tax,
          total: subtotal + tax,
          items: {
            create: dto.items.map((item) => ({
              productId: item.productId,
              quantityOrdered: item.quantityOrdered,
              unitCost: item.unitCost,
            })),
          },
        },
        include: { supplier: true, items: { include: { product: true } } },
      });
      return this.formatPO(updated);
    }

    const updated = await this.prisma.purchaseOrder.update({
      where: { id },
      data: {
        supplierId: dto.supplierId,
        expectedDate: dto.expectedDate ? new Date(dto.expectedDate) : undefined,
        notes: dto.notes,
      },
      include: { supplier: true, items: { include: { product: true } } },
    });
    return this.formatPO(updated);
  }

  async submit(orgId: string, id: string) {
    const po = await this.findOne(orgId, id);
    if (po.status !== 'DRAFT') throw new ConflictException('Only draft POs can be submitted');

    const updated = await this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: 'SUBMITTED' },
      include: { supplier: true, items: { include: { product: true } } },
    });
    return this.formatPO(updated);
  }

  async receive(orgId: string, userId: string, id: string, dto: ReceivePODto) {
    const po = await this.prisma.purchaseOrder.findFirst({
      where: { id, organizationId: orgId },
      include: { items: true },
    });
    if (!po) throw new NotFoundException('Purchase order not found');
    if (!['SUBMITTED', 'PARTIALLY_RECEIVED'].includes(po.status)) {
      throw new BadRequestException('PO cannot be received in current status');
    }

    for (const receiveItem of dto.items) {
      const poItem = po.items.find((i) => i.id === receiveItem.itemId);
      if (!poItem) throw new NotFoundException(`Item ${receiveItem.itemId} not found`);

      const remaining = poItem.quantityOrdered - poItem.quantityReceived;
      if (receiveItem.quantityReceived > remaining) {
        throw new ConflictException(`Cannot receive more than ${remaining} for item`);
      }

      await this.prisma.purchaseOrderItem.update({
        where: { id: receiveItem.itemId },
        data: { quantityReceived: poItem.quantityReceived + receiveItem.quantityReceived },
      });

      await this.inventoryService.createPOMovement(
        orgId,
        userId,
        poItem.productId,
        receiveItem.quantityReceived,
        id,
        po.poNumber,
      );
    }

    const updatedItems = await this.prisma.purchaseOrderItem.findMany({
      where: { purchaseOrderId: id },
    });

    const allReceived = updatedItems.every((i) => i.quantityReceived >= i.quantityOrdered);
    const anyReceived = updatedItems.some((i) => i.quantityReceived > 0);

    const status: PurchaseOrderStatus = allReceived
      ? 'RECEIVED'
      : anyReceived
        ? 'PARTIALLY_RECEIVED'
        : po.status;

    const updated = await this.prisma.purchaseOrder.update({
      where: { id },
      data: {
        status,
        receivedDate: allReceived ? new Date() : undefined,
        notes: dto.notes ? `${po.notes || ''}\n${dto.notes}` : po.notes,
      },
      include: { supplier: true, items: { include: { product: true } } },
    });

    return this.formatPO(updated);
  }

  async cancel(orgId: string, id: string) {
    const po = await this.findOne(orgId, id);
    if (['RECEIVED', 'CANCELLED'].includes(po.status)) {
      throw new ConflictException('Cannot cancel this PO');
    }

    const updated = await this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: { supplier: true, items: { include: { product: true } } },
    });
    return this.formatPO(updated);
  }

  private async getTaxRate(orgId: string) {
    const org = await this.prisma.organization.findUnique({ where: { id: orgId }, select: { taxRate: true } });
    return toNumber(org?.taxRate ?? 0.06);
  }

  private async generatePONumber(orgId: string) {
    const count = await this.prisma.purchaseOrder.count({ where: { organizationId: orgId } });
    const year = new Date().getFullYear();
    return `PO-${year}-${String(count + 1).padStart(5, '0')}`;
  }

  private formatPO(po: any) {
    return {
      ...po,
      subtotal: toNumber(po.subtotal),
      tax: toNumber(po.tax),
      total: toNumber(po.total),
      items: po.items?.map((item: any) => ({
        ...item,
        unitCost: toNumber(item.unitCost),
        product: item.product
          ? { ...item.product, unitPrice: toNumber(item.product.unitPrice), costPrice: toNumber(item.product.costPrice) }
          : undefined,
      })),
    };
  }
}
