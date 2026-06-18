import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PurchaseOrderStatus, Role } from '@prisma/client';
import { PurchaseOrdersService } from './purchase-orders.service';
import { CreatePurchaseOrderDto, UpdatePurchaseOrderDto, ReceivePODto } from './dto/po.dto';
import { JwtAuthGuard, OrganizationGuard, RolesGuard } from '../../common/guards';
import { OrgId, CurrentUser, Roles } from '../../common/decorators';

@ApiTags('Purchase Orders')
@Controller('purchase-orders')
@UseGuards(JwtAuthGuard, OrganizationGuard)
@ApiBearerAuth()
export class PurchaseOrdersController {
  constructor(private poService: PurchaseOrdersService) {}

  @Get()
  findAll(
    @OrgId() orgId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: PurchaseOrderStatus,
  ) {
    return this.poService.findAll(orgId, {
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      status,
    });
  }

  @Get(':id')
  findOne(@OrgId() orgId: string, @Param('id') id: string) {
    return this.poService.findOne(orgId, id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.MANAGER)
  create(@OrgId() orgId: string, @Body() dto: CreatePurchaseOrderDto) {
    return this.poService.create(orgId, dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.MANAGER)
  update(@OrgId() orgId: string, @Param('id') id: string, @Body() dto: UpdatePurchaseOrderDto) {
    return this.poService.update(orgId, id, dto);
  }

  @Post(':id/submit')
  @UseGuards(RolesGuard)
  @Roles(Role.MANAGER)
  submit(@OrgId() orgId: string, @Param('id') id: string) {
    return this.poService.submit(orgId, id);
  }

  @Post(':id/receive')
  @UseGuards(RolesGuard)
  @Roles(Role.STAFF)
  receive(
    @OrgId() orgId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: ReceivePODto,
  ) {
    return this.poService.receive(orgId, userId, id, dto);
  }

  @Post(':id/cancel')
  @UseGuards(RolesGuard)
  @Roles(Role.MANAGER)
  cancel(@OrgId() orgId: string, @Param('id') id: string) {
    return this.poService.cancel(orgId, id);
  }
}
