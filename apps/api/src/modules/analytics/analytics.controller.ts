import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard, OrganizationGuard } from '../../common/guards';
import { OrgId } from '../../common/decorators';

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard, OrganizationGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('dashboard')
  getDashboard(@OrgId() orgId: string) {
    return this.analyticsService.getDashboard(orgId);
  }

  @Get('inventory-value')
  getInventoryValue(@OrgId() orgId: string, @Query('days') days?: number) {
    return this.analyticsService.getInventoryValue(orgId, Number(days) || 30);
  }

  @Get('inventory-turnover')
  getInventoryTurnover(@OrgId() orgId: string, @Query('days') days?: number) {
    return this.analyticsService.getInventoryTurnover(orgId, Number(days) || 90);
  }

  @Get('fast-moving')
  getFastMoving(@OrgId() orgId: string, @Query('limit') limit?: number) {
    return this.analyticsService.getFastMoving(orgId, Number(limit) || 10);
  }

  @Get('supplier-performance')
  getSupplierPerformance(@OrgId() orgId: string, @Query('limit') limit?: number) {
    return this.analyticsService.getSupplierPerformance(orgId, Number(limit) || 8);
  }

  @Get('po-status-breakdown')
  getPOStatusBreakdown(@OrgId() orgId: string) {
    return this.analyticsService.getPOStatusBreakdown(orgId);
  }

  @Get('low-stock')
  getLowStock(@OrgId() orgId: string) {
    return this.analyticsService.getLowStock(orgId);
  }

  @Get('low-stock-forecast')
  getLowStockForecast(@OrgId() orgId: string) {
    return this.analyticsService.getLowStockForecast(orgId);
  }

  @Get('health-score')
  getHealthScore(@OrgId() orgId: string) {
    return this.analyticsService.getHealthScore(orgId);
  }

  @Get('inventory-aging')
  getInventoryAging(@OrgId() orgId: string) {
    return this.analyticsService.getInventoryAging(orgId);
  }

  @Get('category-performance')
  getCategoryPerformance(@OrgId() orgId: string) {
    return this.analyticsService.getCategoryPerformance(orgId);
  }

  @Get('low-stock-risk')
  getLowStockRisk(@OrgId() orgId: string) {
    return this.analyticsService.getLowStockRiskAnalysis(orgId);
  }

  @Get('monthly-trends')
  getMonthlyTrends(@OrgId() orgId: string, @Query('months') months?: number) {
    return this.analyticsService.getMonthlyTrends(orgId, Number(months) || 6);
  }
}
