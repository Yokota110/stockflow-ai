import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { MovementType, Role } from '@prisma/client';
import { InventoryService } from './inventory.service';
import { StockActionDto } from './dto/inventory.dto';
import { JwtAuthGuard, OrganizationGuard, RolesGuard } from '../../common/guards';
import { OrgId, CurrentUser, Roles } from '../../common/decorators';

@ApiTags('Inventory')
@Controller('inventory')
@UseGuards(JwtAuthGuard, OrganizationGuard)
@ApiBearerAuth()
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  @Post('stock-in')
  @UseGuards(RolesGuard)
  @Roles(Role.STAFF)
  stockIn(@OrgId() orgId: string, @CurrentUser('id') userId: string, @Body() dto: StockActionDto) {
    return this.inventoryService.stockIn(orgId, userId, dto);
  }

  @Post('stock-out')
  @UseGuards(RolesGuard)
  @Roles(Role.STAFF)
  stockOut(@OrgId() orgId: string, @CurrentUser('id') userId: string, @Body() dto: StockActionDto) {
    return this.inventoryService.stockOut(orgId, userId, dto);
  }

  @Post('adjust')
  @UseGuards(RolesGuard)
  @Roles(Role.MANAGER)
  adjust(
    @OrgId() orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: StockActionDto & { newQuantity: number },
  ) {
    return this.inventoryService.adjust(orgId, userId, dto);
  }

  @Get('movements')
  getMovements(
    @OrgId() orgId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('type') type?: MovementType,
    @Query('productId') productId?: string,
  ) {
    return this.inventoryService.getMovements(orgId, {
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      type,
      productId,
    });
  }

  @Get('alerts')
  getAlerts(@OrgId() orgId: string) {
    return this.inventoryService.getAlerts(orgId);
  }

  @Patch('alerts/:id/resolve')
  @UseGuards(RolesGuard)
  @Roles(Role.MANAGER)
  resolveAlert(@OrgId() orgId: string, @Param('id') id: string) {
    return this.inventoryService.resolveAlert(orgId, id);
  }
}
