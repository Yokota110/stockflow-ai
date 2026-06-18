import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSupplierDto, UpdateSupplierDto } from './dto/supplier.dto';
import { paginate, paginationMeta, toNumber } from '../../common/dto/pagination.dto';

@Injectable()
export class SuppliersService {
  constructor(private prisma: PrismaService) {}

  async findAll(orgId: string, params: { page?: number; limit?: number; search?: string }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const where: Prisma.SupplierWhereInput = {
      organizationId: orgId,
      deletedAt: null,
      ...(params.search && {
        OR: [
          { name: { contains: params.search, mode: 'insensitive' } },
          { email: { contains: params.search, mode: 'insensitive' } },
          { contactPerson: { contains: params.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [suppliers, total] = await Promise.all([
      this.prisma.supplier.findMany({
        where,
        include: { _count: { select: { purchaseOrders: true } } },
        orderBy: { name: 'asc' },
        ...paginate(page, limit),
      }),
      this.prisma.supplier.count({ where }),
    ]);

    return { data: suppliers, meta: paginationMeta(total, page, limit) };
  }

  async findOne(orgId: string, id: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
      include: { _count: { select: { purchaseOrders: true } } },
    });
    if (!supplier) throw new NotFoundException('Supplier not found');
    const stats = await this.getStats(orgId, id);
    return { ...supplier, stats };
  }

  async getProductsSupplied(orgId: string, id: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
    });
    if (!supplier) throw new NotFoundException('Supplier not found');

    const items = await this.prisma.purchaseOrderItem.findMany({
      where: { purchaseOrder: { organizationId: orgId, supplierId: id } },
      include: {
        product: { select: { id: true, name: true, sku: true, currentStock: true, unitPrice: true, costPrice: true } },
      },
    });

    const productMap = new Map<string, { product: typeof items[0]['product']; totalOrdered: number }>();
    for (const item of items) {
      const existing = productMap.get(item.productId);
      if (existing) {
        existing.totalOrdered += item.quantityOrdered;
      } else {
        productMap.set(item.productId, { product: item.product, totalOrdered: item.quantityOrdered });
      }
    }

    return Array.from(productMap.values()).map((v) => ({
      ...v.product,
      unitPrice: toNumber(v.product!.unitPrice),
      costPrice: toNumber(v.product!.costPrice),
      totalOrdered: v.totalOrdered,
    }));
  }

  async getStats(orgId: string, id: string) {
    const orders = await this.prisma.purchaseOrder.findMany({
      where: { organizationId: orgId, supplierId: id, status: { not: 'CANCELLED' } },
      select: { total: true, orderDate: true, status: true, receivedDate: true, expectedDate: true },
      orderBy: { orderDate: 'desc' },
    });

    const totalSpend = orders.reduce((sum, o) => sum + toNumber(o.total), 0);
    const receivedOrders = orders.filter((o) => o.status === 'RECEIVED' || o.status === 'PARTIALLY_RECEIVED');
    const onTime = receivedOrders.filter((o) => {
      if (!o.receivedDate || !o.expectedDate) return true;
      return o.receivedDate <= o.expectedDate;
    }).length;

    const avgDeliveryDays = receivedOrders
      .filter((o) => o.receivedDate)
      .map((o) => Math.ceil((o.receivedDate!.getTime() - o.orderDate.getTime()) / (24 * 60 * 60 * 1000)));

    const avgDelivery = avgDeliveryDays.length > 0
      ? Math.round(avgDeliveryDays.reduce((a, b) => a + b, 0) / avgDeliveryDays.length)
      : null;

    return {
      totalOrders: orders.length,
      totalSpend: Math.round(totalSpend * 100) / 100,
      lastOrderDate: orders[0]?.orderDate || null,
      avgOrderValue: orders.length > 0 ? Math.round((totalSpend / orders.length) * 100) / 100 : 0,
      onTimeRate: receivedOrders.length > 0 ? Math.round((onTime / receivedOrders.length) * 100) : null,
      fulfillmentRate: orders.length > 0 ? Math.round((receivedOrders.length / orders.length) * 100) : 0,
      avgDeliveryDays: avgDelivery,
      reliabilityScore: receivedOrders.length > 0 ? Math.round((onTime / receivedOrders.length) * 100) : 95,
    };
  }

  async create(orgId: string, dto: CreateSupplierDto) {
    return this.prisma.supplier.create({
      data: { ...dto, organizationId: orgId },
    });
  }

  async update(orgId: string, id: string, dto: UpdateSupplierDto) {
    await this.findOne(orgId, id);
    return this.prisma.supplier.update({ where: { id }, data: dto });
  }

  async remove(orgId: string, id: string) {
    await this.findOne(orgId, id);
    await this.prisma.supplier.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
    return { message: 'Supplier deleted' };
  }

  async getPurchaseOrders(orgId: string, id: string, page = 1, limit = 20) {
    await this.findOne(orgId, id);
    const where = { organizationId: orgId, supplierId: id };
    const [orders, total] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        where,
        include: { items: { include: { product: true } } },
        orderBy: { createdAt: 'desc' },
        ...paginate(page, limit),
      }),
      this.prisma.purchaseOrder.count({ where }),
    ]);
    return {
      data: orders.map((o) => ({
        ...o,
        subtotal: toNumber(o.subtotal),
        tax: toNumber(o.tax),
        total: toNumber(o.total),
      })),
      meta: paginationMeta(total, page, limit),
    };
  }
}
