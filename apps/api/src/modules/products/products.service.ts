import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto, CreateCategoryDto, UpdateCategoryDto } from './dto/product.dto';
import { paginate, paginationMeta, toNumber } from '../../common/dto/pagination.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    orgId: string,
    params: { page?: number; limit?: number; search?: string; categoryId?: string; lowStock?: boolean },
  ) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const where: Prisma.ProductWhereInput = {
      organizationId: orgId,
      deletedAt: null,
      ...(params.categoryId && { categoryId: params.categoryId }),
      ...(params.search && {
        OR: [
          { name: { contains: params.search, mode: 'insensitive' } },
          { sku: { contains: params.search, mode: 'insensitive' } },
          { barcode: { contains: params.search, mode: 'insensitive' } },
        ],
      }),
    };

    if (params.lowStock) {
      const products = await this.prisma.product.findMany({
        where: { organizationId: orgId, deletedAt: null, isActive: true },
        include: { category: true },
      });
      const filtered = products.filter((p) => p.currentStock <= p.reorderPoint);
      const start = (page - 1) * limit;
      const data = filtered.slice(start, start + limit).map((p) => this.formatProduct(p));
      return { data, meta: paginationMeta(filtered.length, page, limit) };
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: { category: true },
        orderBy: { createdAt: 'desc' },
        ...paginate(page, limit),
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: products.map((p) => this.formatProduct(p)),
      meta: paginationMeta(total, page, limit),
    };
  }

  async findOne(orgId: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
      include: { category: true },
    });
    if (!product) throw new NotFoundException('Product not found');
    return this.formatProduct(product);
  }

  async create(orgId: string, dto: CreateProductDto) {
    const existing = await this.prisma.product.findUnique({
      where: { organizationId_sku: { organizationId: orgId, sku: dto.sku } },
    });
    if (existing) throw new ConflictException('SKU already exists');

    const product = await this.prisma.product.create({
      data: { ...dto, organizationId: orgId },
      include: { category: true },
    });
    return this.formatProduct(product);
  }

  async update(orgId: string, id: string, dto: UpdateProductDto) {
    await this.findOne(orgId, id);
    const product = await this.prisma.product.update({
      where: { id },
      data: dto,
      include: { category: true },
    });
    return this.formatProduct(product);
  }

  async remove(orgId: string, id: string) {
    await this.findOne(orgId, id);
    await this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
    return { message: 'Product deleted' };
  }

  async getProductDetail(orgId: string, id: string) {
    const product = await this.findOne(orgId, id);

    const [movements, stockOutAgg, poItem] = await Promise.all([
      this.prisma.inventoryMovement.findMany({
        where: { organizationId: orgId, productId: id },
        include: { performedBy: { select: { firstName: true, lastName: true } } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      this.prisma.inventoryMovement.aggregate({
        where: {
          organizationId: orgId,
          productId: id,
          type: 'STOCK_OUT',
          createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
        },
        _sum: { quantity: true },
      }),
      this.prisma.purchaseOrderItem.findFirst({
        where: { productId: id, purchaseOrder: { organizationId: orgId } },
        include: { purchaseOrder: { include: { supplier: { select: { id: true, name: true } } } } },
        orderBy: { purchaseOrder: { createdAt: 'desc' } },
      }),
    ]);

    const unitsSold = Math.abs(stockOutAgg._sum.quantity || 0);
    const dailyRate = unitsSold / 90;
    const daysRemaining = dailyRate > 0 ? Math.ceil(product.currentStock / dailyRate) : null;
    const turnover = product.currentStock > 0 ? Math.round((unitsSold / product.currentStock) * 100) / 100 : 0;

    let status = 'healthy';
    if (product.currentStock === 0) status = 'out_of_stock';
    else if (product.currentStock <= product.reorderPoint) status = 'low_stock';

    return {
      product,
      supplier: poItem?.purchaseOrder?.supplier || null,
      recentMovements: movements,
      performance: {
        unitsSold,
        turnover,
        daysRemaining,
        dailyRate: Math.round(dailyRate * 10) / 10,
      },
      status,
    };
  }

  async getMovements(orgId: string, id: string, page = 1, limit = 20) {
    await this.findOne(orgId, id);
    const where = { organizationId: orgId, productId: id };
    const [movements, total] = await Promise.all([
      this.prisma.inventoryMovement.findMany({
        where,
        include: {
          performedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        ...paginate(page, limit),
      }),
      this.prisma.inventoryMovement.count({ where }),
    ]);
    return { data: movements, meta: paginationMeta(total, page, limit) };
  }

  private formatProduct(product: any) {
    return {
      ...product,
      unitPrice: toNumber(product.unitPrice),
      costPrice: toNumber(product.costPrice),
    };
  }
}

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll(orgId: string) {
    const categories = await this.prisma.category.findMany({
      where: { organizationId: orgId, parentId: null },
      include: {
        children: true,
        _count: { select: { products: true } },
      },
      orderBy: { name: 'asc' },
    });
    return categories;
  }

  async create(orgId: string, dto: CreateCategoryDto) {
    return this.prisma.category.create({
      data: { ...dto, organizationId: orgId },
    });
  }

  async update(orgId: string, id: string, dto: UpdateCategoryDto) {
    const cat = await this.prisma.category.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!cat) throw new NotFoundException('Category not found');
    return this.prisma.category.update({ where: { id }, data: dto });
  }

  async remove(orgId: string, id: string) {
    const count = await this.prisma.product.count({ where: { categoryId: id } });
    if (count > 0) throw new ConflictException('Category has products');
    await this.prisma.category.delete({ where: { id } });
    return { message: 'Category deleted' };
  }
}
