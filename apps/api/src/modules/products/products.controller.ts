import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ProductsService, CategoriesService } from './products.service';
import { CreateProductDto, UpdateProductDto, CreateCategoryDto, UpdateCategoryDto } from './dto/product.dto';
import { JwtAuthGuard, OrganizationGuard, RolesGuard } from '../../common/guards';
import { OrgId, Roles } from '../../common/decorators';

@ApiTags('Products')
@Controller('products')
@UseGuards(JwtAuthGuard, OrganizationGuard)
@ApiBearerAuth()
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get()
  findAll(
    @OrgId() orgId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('lowStock') lowStock?: string,
  ) {
    return this.productsService.findAll(orgId, {
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      search,
      categoryId,
      lowStock: lowStock === 'true',
    });
  }

  @Get(':id/detail')
  getDetail(@OrgId() orgId: string, @Param('id') id: string) {
    return this.productsService.getProductDetail(orgId, id);
  }

  @Get(':id/movements')
  getMovements(
    @OrgId() orgId: string,
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.productsService.getMovements(orgId, id, Number(page) || 1, Number(limit) || 20);
  }

  @Get(':id')
  findOne(@OrgId() orgId: string, @Param('id') id: string) {
    return this.productsService.findOne(orgId, id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.MANAGER)
  create(@OrgId() orgId: string, @Body() dto: CreateProductDto) {
    return this.productsService.create(orgId, dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.MANAGER)
  update(@OrgId() orgId: string, @Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(orgId, id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  remove(@OrgId() orgId: string, @Param('id') id: string) {
    return this.productsService.remove(orgId, id);
  }
}

@ApiTags('Categories')
@Controller('categories')
@UseGuards(JwtAuthGuard, OrganizationGuard)
@ApiBearerAuth()
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  @Get()
  findAll(@OrgId() orgId: string) {
    return this.categoriesService.findAll(orgId);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.MANAGER)
  create(@OrgId() orgId: string, @Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(orgId, dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.MANAGER)
  update(@OrgId() orgId: string, @Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(orgId, id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  remove(@OrgId() orgId: string, @Param('id') id: string) {
    return this.categoriesService.remove(orgId, id);
  }
}
