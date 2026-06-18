import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto, UpdateSupplierDto } from './dto/supplier.dto';
import { JwtAuthGuard, OrganizationGuard, RolesGuard } from '../../common/guards';
import { OrgId, Roles } from '../../common/decorators';

@ApiTags('Suppliers')
@Controller('suppliers')
@UseGuards(JwtAuthGuard, OrganizationGuard)
@ApiBearerAuth()
export class SuppliersController {
  constructor(private suppliersService: SuppliersService) {}

  @Get()
  findAll(
    @OrgId() orgId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
  ) {
    return this.suppliersService.findAll(orgId, {
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      search,
    });
  }

  @Get(':id/products')
  getProducts(@OrgId() orgId: string, @Param('id') id: string) {
    return this.suppliersService.getProductsSupplied(orgId, id);
  }

  @Get(':id/purchase-orders')
  getPurchaseOrders(
    @OrgId() orgId: string,
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.suppliersService.getPurchaseOrders(orgId, id, Number(page) || 1, Number(limit) || 20);
  }

  @Get(':id')
  findOne(@OrgId() orgId: string, @Param('id') id: string) {
    return this.suppliersService.findOne(orgId, id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.MANAGER)
  create(@OrgId() orgId: string, @Body() dto: CreateSupplierDto) {
    return this.suppliersService.create(orgId, dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.MANAGER)
  update(@OrgId() orgId: string, @Param('id') id: string, @Body() dto: UpdateSupplierDto) {
    return this.suppliersService.update(orgId, id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  remove(@OrgId() orgId: string, @Param('id') id: string) {
    return this.suppliersService.remove(orgId, id);
  }
}
