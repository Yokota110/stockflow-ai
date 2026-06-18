import { Module } from '@nestjs/common';
import { ProductsService, CategoriesService } from './products.service';
import { ProductsController, CategoriesController } from './products.controller';

@Module({
  controllers: [ProductsController, CategoriesController],
  providers: [ProductsService, CategoriesService],
  exports: [ProductsService],
})
export class ProductsModule {}
