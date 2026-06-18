import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { MovementType, AlertType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { StockActionDto } from './dto/inventory.dto';
import { paginate, paginationMeta } from '../../common/dto/pagination.dto';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async stockIn(orgId: string, userId: string, dto: StockActionDto) {
    return this.createMovement(orgId, userId, dto, MovementType.STOCK_IN, dto.quantity);
  }

  async stockOut(orgId: string, userId: string, dto: StockActionDto) {
    return this.createMovement(orgId, userId, dto, MovementType.STOCK_OUT, -dto.quantity);
  }

  async adjust(orgId: string, userId: string, dto: StockActionDto & { newQuantity: number }) {
    const product = await this.getProduct(orgId, dto.productId);
    const diff = dto.newQuantity - product.currentStock;
    return this.createMovement(
      orgId,
      userId,
      { ...dto, quantity: Math.abs(diff), notes: dto.notes || `Adjusted to ${dto.newQuantity}` },
      MovementType.ADJUSTMENT,
      diff,
    );
  }

  async getMovements(
    orgId: string,
    params: { page?: number; limit?: number; type?: MovementType; productId?: string },
  ) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const where = {
      organizationId: orgId,
      ...(params.type && { type: params.type }),
      ...(params.productId && { productId: params.productId }),
    };

    const [movements, total] = await Promise.all([
      this.prisma.inventoryMovement.findMany({
        where,
        include: {
          product: { select: { id: true, name: true, sku: true } },
          performedBy: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
        ...paginate(page, limit),
      }),
      this.prisma.inventoryMovement.count({ where }),
    ]);

    return { data: movements, meta: paginationMeta(total, page, limit) };
  }

  async getAlerts(orgId: string) {
    return this.prisma.stockAlert.findMany({
      where: { organizationId: orgId, isResolved: false },
      include: { product: { select: { id: true, name: true, sku: true, currentStock: true, reorderPoint: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async resolveAlert(orgId: string, alertId: string) {
    const alert = await this.prisma.stockAlert.findFirst({
      where: { id: alertId, organizationId: orgId },
    });
    if (!alert) throw new NotFoundException('Alert not found');
    return this.prisma.stockAlert.update({
      where: { id: alertId },
      data: { isResolved: true, resolvedAt: new Date() },
    });
  }

  private async createMovement(
    orgId: string,
    userId: string,
    dto: StockActionDto,
    type: MovementType,
    quantityChange: number,
    purchaseOrderId?: string,
  ) {
    const product = await this.getProduct(orgId, dto.productId);
    const newStock = product.currentStock + quantityChange;

    if (newStock < 0) {
      throw new ConflictException('Insufficient stock');
    }

    const [movement] = await this.prisma.$transaction([
      this.prisma.inventoryMovement.create({
        data: {
          organizationId: orgId,
          productId: dto.productId,
          type,
          quantity: quantityChange,
          previousStock: product.currentStock,
          newStock,
          reference: dto.reference,
          notes: dto.notes,
          performedById: userId,
          purchaseOrderId,
        },
        include: {
          product: { select: { id: true, name: true, sku: true } },
          performedBy: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.product.update({
        where: { id: dto.productId },
        data: { currentStock: newStock },
      }),
    ]);

    await this.checkStockAlerts(orgId, dto.productId, newStock, product.reorderPoint);

    return movement;
  }

  async createPOMovement(
    orgId: string,
    userId: string,
    productId: string,
    quantity: number,
    purchaseOrderId: string,
    reference: string,
  ) {
    return this.createMovement(
      orgId,
      userId,
      { productId, quantity, reference, notes: 'PO Receipt' },
      MovementType.PO_RECEIPT,
      quantity,
      purchaseOrderId,
    );
  }

  private async getProduct(orgId: string, productId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, organizationId: orgId, deletedAt: null },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  private async checkStockAlerts(orgId: string, productId: string, stock: number, reorderPoint: number) {
    await this.prisma.stockAlert.updateMany({
      where: { organizationId: orgId, productId, isResolved: false },
      data: { isResolved: true, resolvedAt: new Date() },
    });

    if (stock <= reorderPoint) {
      await this.prisma.stockAlert.create({
        data: {
          organizationId: orgId,
          productId,
          type: stock === 0 ? AlertType.OUT_OF_STOCK : AlertType.LOW_STOCK,
          threshold: reorderPoint,
        },
      });
    }
  }
}
