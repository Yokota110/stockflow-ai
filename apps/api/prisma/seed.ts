import { PrismaClient, MovementType, PurchaseOrderStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding StockFlow database (Japan SME)...');

  await prisma.inventoryMovement.deleteMany();
  await prisma.purchaseOrderItem.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.stockAlert.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.userOrganization.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 12);

  const owner = await prisma.user.create({
    data: {
      email: 'demo@stockflow.app',
      passwordHash,
      firstName: 'Haruto',
      lastName: 'Sato',
      emailVerified: true,
    },
  });

  const staffUser = await prisma.user.create({
    data: {
      email: 'staff@tokyosupply.jp',
      passwordHash,
      firstName: 'Yui',
      lastName: 'Tanaka',
      emailVerified: true,
    },
  });

  const org = await prisma.organization.create({
    data: {
      name: 'Tokyo Supply Works',
      slug: 'tokyo-supply-works',
      currency: 'JPY',
      timezone: 'Asia/Tokyo',
      taxRate: 0.10,
    },
  });

  await prisma.userOrganization.createMany({
    data: [
      { userId: owner.id, organizationId: org.id, role: 'OWNER' },
      { userId: staffUser.id, organizationId: org.id, role: 'STAFF' },
    ],
  });

  const categories = await Promise.all(
    ['Office Essentials', 'IT Accessories', 'Packaging', 'Facilities', 'Safety Gear'].map((name) =>
      prisma.category.create({
        data: { organizationId: org.id, name, description: `${name} for Japanese SMB operations` },
      }),
    ),
  );

  const productData = [
    { name: 'A4 Copy Paper 500 Sheets', sku: 'OFF-A4-500', cat: 0, price: 680, cost: 430, stock: 420, reorder: 50, unit: 'ream' },
    { name: 'Gel Ink Pen Black (Box 10)', sku: 'OFF-PEN-B10', cat: 0, price: 980, cost: 520, stock: 18, reorder: 30, unit: 'box' },
    { name: 'Heavy Duty Stapler', sku: 'OFF-STP-HD', cat: 0, price: 2480, cost: 1450, stock: 45, reorder: 15, unit: 'pcs' },
    { name: 'Clear File A4 (Pack 100)', sku: 'OFF-FLD-A4', cat: 0, price: 1280, cost: 720, stock: 8, reorder: 20, unit: 'pack' },
    { name: 'Wireless Mouse Silent Click', sku: 'IT-MS-WL', cat: 1, price: 2980, cost: 1580, stock: 67, reorder: 20, unit: 'pcs' },
    { name: 'USB-C Hub 7-Port', sku: 'IT-HUB-7P', cat: 1, price: 5980, cost: 3480, stock: 5, reorder: 10, unit: 'pcs' },
    { name: '24-inch Business Monitor', sku: 'IT-MON-24', cat: 1, price: 24800, cost: 17800, stock: 12, reorder: 5, unit: 'pcs' },
    { name: 'HD Webcam 1080p', sku: 'IT-CAM-HD', cat: 1, price: 6480, cost: 3980, stock: 34, reorder: 10, unit: 'pcs' },
    { name: 'Bubble Wrap Roll 42m', sku: 'PKG-BUB-42', cat: 2, price: 1680, cost: 920, stock: 85, reorder: 25, unit: 'roll' },
    { name: 'Cardboard Box 100 Size', sku: 'PKG-BOX-100', cat: 2, price: 190, cost: 95, stock: 0, reorder: 100, unit: 'pcs' },
    { name: 'OPP Packing Tape (5 rolls)', sku: 'PKG-TAPE-OPP', cat: 2, price: 1280, cost: 620, stock: 6, reorder: 20, unit: 'pack' },
    { name: 'Floor Cleaner 4L', sku: 'FAC-FLR-4L', cat: 3, price: 1980, cost: 980, stock: 38, reorder: 15, unit: 'bottle' },
    { name: 'Alcohol Sanitizer 1L', sku: 'FAC-ALC-1L', cat: 3, price: 1180, cost: 620, stock: 92, reorder: 30, unit: 'bottle' },
    { name: 'Nitrile Gloves (Box 100)', sku: 'FAC-GLV-100', cat: 3, price: 1680, cost: 940, stock: 4, reorder: 15, unit: 'box' },
    { name: 'Safety Helmet White', sku: 'SAF-HEL-WHT', cat: 4, price: 2380, cost: 1280, stock: 55, reorder: 20, unit: 'pcs' },
    { name: 'Reflective Safety Vest', sku: 'SAF-VST-REF', cat: 4, price: 1480, cost: 760, stock: 120, reorder: 40, unit: 'pcs' },
    { name: 'First Aid Kit Standard', sku: 'SAF-FAK-STD', cat: 4, price: 4980, cost: 2980, stock: 3, reorder: 5, unit: 'kit' },
    { name: 'Whiteboard Marker Set', sku: 'OFF-MRK-WB', cat: 0, price: 980, cost: 510, stock: 28, reorder: 20, unit: 'set' },
    { name: 'Label Printer Tape 24mm', sku: 'IT-LBL-24', cat: 1, price: 1680, cost: 920, stock: 15, reorder: 10, unit: 'roll' },
    { name: 'Stretch Film 500mm x 300m', sku: 'PKG-STF-500', cat: 2, price: 2980, cost: 1780, stock: 22, reorder: 10, unit: 'roll' },
  ];

  const products: Awaited<ReturnType<typeof prisma.product.create>>[] = [];
  for (const p of productData) {
    const product = await prisma.product.create({
      data: {
        organizationId: org.id,
        categoryId: categories[p.cat].id,
        name: p.name,
        sku: p.sku,
        barcode: `49${Math.floor(Math.random() * 1e11).toString().padStart(11, '0')}`,
        unitPrice: p.price,
        costPrice: p.cost,
        currentStock: p.stock,
        reorderPoint: p.reorder,
        reorderQty: p.reorder * 3,
        unit: p.unit,
      },
    });
    products.push(product);

    if (p.stock <= p.reorder) {
      await prisma.stockAlert.create({
        data: {
          organizationId: org.id,
          productId: product.id,
          type: p.stock === 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK',
          threshold: p.reorder,
        },
      });
    }
  }

  const suppliers = await Promise.all([
    {
      name: 'Kanda Office Partners',
      email: 'orders@kanda-office.jp',
      contact: 'Daichi Mori',
      phone: '+81 3-3251-8800',
      address: '2-8-4 Kanda Sudacho',
      city: 'Tokyo',
      website: 'https://kanda-office.jp',
    },
    {
      name: 'Osaka Tech Wholesale',
      email: 'sales@osaka-tech.jp',
      contact: 'Mika Fujimoto',
      phone: '+81 6-6341-3300',
      address: '1-3-1 Umeda',
      city: 'Osaka',
      website: 'https://osaka-tech.jp',
    },
    {
      name: 'Yokohama Packaging Hub',
      email: 'logistics@yokohama-pack.jp',
      contact: 'Riku Nakamura',
      phone: '+81 45-681-1200',
      address: '3-7-12 Shin-Yokohama',
      city: 'Yokohama',
      website: 'https://yokohama-pack.jp',
    },
    {
      name: 'Nagoya Safety Supply',
      email: 'support@nagoya-safety.jp',
      contact: 'Aoi Kobayashi',
      phone: '+81 52-221-5500',
      address: '1-11-20 Sakae',
      city: 'Nagoya',
      website: 'https://nagoya-safety.jp',
    },
    {
      name: 'Fukuoka Facilities Co.',
      email: 'wholesale@fukuoka-facilities.jp',
      contact: 'Ren Yamamoto',
      phone: '+81 92-441-7700',
      address: '2-2-1 Hakataekimae',
      city: 'Fukuoka',
    },
  ].map((s) =>
    prisma.supplier.create({
      data: {
        organizationId: org.id,
        name: s.name,
        email: s.email,
        phone: s.phone,
        contactPerson: s.contact,
        address: s.address,
        city: s.city,
        country: 'Japan',
        website: s.website,
      },
    }),
  ));

  const fastMovingSkus = ['OFF-A4-500', 'OFF-PEN-B10', 'IT-MS-WL', 'FAC-ALC-1L', 'SAF-VST-REF', 'PKG-BUB-42'];
  const mediumMovingSkus = ['OFF-STP-HD', 'IT-CAM-HD', 'FAC-FLR-4L', 'SAF-HEL-WHT', 'OFF-MRK-WB'];
  const slowMovingSkus = ['IT-MON-24', 'IT-HUB-7P', 'SAF-FAK-STD', 'PKG-STF-500'];

  const skuToProduct = new Map(products.map((p) => [p.sku, p]));

  for (let day = 90; day >= 0; day--) {
    const date = new Date();
    date.setDate(date.getDate() - day);
    const dayOfWeek = date.getDay();
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
    const monthFactor = 1 + Math.sin((day / 30) * Math.PI) * 0.3;

    if (isWeekday) {
      for (const sku of fastMovingSkus) {
        const product = skuToProduct.get(sku)!;
        const qty = Math.floor((3 + Math.random() * 5) * monthFactor);
        await prisma.inventoryMovement.create({
          data: {
            organizationId: org.id,
            productId: product.id,
            type: MovementType.STOCK_OUT,
            quantity: -qty,
            previousStock: product.currentStock,
            newStock: product.currentStock,
            performedById: staffUser.id,
            reference: `INV-${date.toISOString().slice(0, 10).replace(/-/g, '')}`,
            notes: 'Daily order fulfillment',
            createdAt: date,
          },
        });
      }

      if (day % 3 === 0) {
        for (const sku of mediumMovingSkus) {
          const product = skuToProduct.get(sku)!;
          const qty = Math.floor(1 + Math.random() * 3);
          await prisma.inventoryMovement.create({
            data: {
              organizationId: org.id,
              productId: product.id,
              type: MovementType.STOCK_OUT,
              quantity: -qty,
              previousStock: product.currentStock,
              newStock: product.currentStock,
              performedById: staffUser.id,
              reference: 'B2B order',
              createdAt: date,
            },
          });
        }
      }
    }

    if (day % 14 === 0) {
      const restockProducts = [...fastMovingSkus, ...mediumMovingSkus].slice(0, 4);
      for (const sku of restockProducts) {
        const product = skuToProduct.get(sku)!;
        const qty = 50 + Math.floor(Math.random() * 100);
        await prisma.inventoryMovement.create({
          data: {
            organizationId: org.id,
            productId: product.id,
            type: MovementType.STOCK_IN,
            quantity: qty,
            previousStock: product.currentStock,
            newStock: product.currentStock,
            performedById: owner.id,
            reference: `RESTOCK-${date.toISOString().slice(0, 7)}`,
            notes: 'Bi-weekly replenishment',
            createdAt: date,
          },
        });
      }
    }

    if (day % 30 === 0 && day > 0) {
      for (const sku of slowMovingSkus) {
        const product = skuToProduct.get(sku)!;
        await prisma.inventoryMovement.create({
          data: {
            organizationId: org.id,
            productId: product.id,
            type: MovementType.STOCK_OUT,
            quantity: -(1 + Math.floor(Math.random() * 2)),
            previousStock: product.currentStock,
            newStock: product.currentStock,
            performedById: staffUser.id,
            reference: 'Corporate order',
            createdAt: date,
          },
        });
      }
    }
  }

  const poConfigs: { supplier: number; status: PurchaseOrderStatus; items: number[]; daysAgo: number; partial?: boolean }[] = [
    { supplier: 0, status: PurchaseOrderStatus.RECEIVED, items: [0, 1, 2], daysAgo: 45 },
    { supplier: 1, status: PurchaseOrderStatus.RECEIVED, items: [4, 5, 7], daysAgo: 30 },
    { supplier: 2, status: PurchaseOrderStatus.RECEIVED, items: [8, 9, 10], daysAgo: 20 },
    { supplier: 0, status: PurchaseOrderStatus.RECEIVED, items: [0, 17], daysAgo: 10 },
    { supplier: 3, status: PurchaseOrderStatus.RECEIVED, items: [14, 15, 16], daysAgo: 7 },
    { supplier: 1, status: PurchaseOrderStatus.PARTIALLY_RECEIVED, items: [4, 6, 18], daysAgo: 5, partial: true },
    { supplier: 2, status: PurchaseOrderStatus.SUBMITTED, items: [9, 10, 19], daysAgo: 2 },
    { supplier: 4, status: PurchaseOrderStatus.SUBMITTED, items: [11, 12, 13], daysAgo: 1 },
    { supplier: 0, status: PurchaseOrderStatus.DRAFT, items: [0, 1, 3], daysAgo: 0 },
    { supplier: 3, status: PurchaseOrderStatus.CANCELLED, items: [16], daysAgo: 15 },
  ];

  for (let i = 0; i < poConfigs.length; i++) {
    const cfg = poConfigs[i];
    const orderDate = new Date();
    orderDate.setDate(orderDate.getDate() - cfg.daysAgo);
    const expectedDate = new Date(orderDate);
    expectedDate.setDate(expectedDate.getDate() + 7);

    const poItems = cfg.items.map((idx) => ({
      productId: products[idx].id,
      quantityOrdered: 50 + idx * 10,
      quantityReceived:
        cfg.status === PurchaseOrderStatus.RECEIVED ? 50 + idx * 10 : cfg.partial ? Math.floor((50 + idx * 10) * 0.6) : 0,
      unitCost: Number(products[idx].costPrice),
    }));

    const subtotal = poItems.reduce((s, item) => s + item.quantityOrdered * item.unitCost, 0);
    const tax = subtotal * 0.10;

    const po = await prisma.purchaseOrder.create({
      data: {
        organizationId: org.id,
        supplierId: suppliers[cfg.supplier].id,
        poNumber: `PO-2026-${String(i + 1).padStart(5, '0')}`,
        status: cfg.status,
        orderDate,
        expectedDate,
        receivedDate: cfg.status === PurchaseOrderStatus.RECEIVED ? new Date(expectedDate.getTime() - 86400000) : undefined,
        subtotal,
        tax,
        total: subtotal + tax,
        notes: cfg.status === PurchaseOrderStatus.CANCELLED ? 'Cancelled - supplier stock unavailable' : undefined,
        items: { create: poItems },
      },
    });

    if (cfg.status === PurchaseOrderStatus.RECEIVED || cfg.partial) {
      for (const item of poItems) {
        if (item.quantityReceived > 0) {
          await prisma.inventoryMovement.create({
            data: {
              organizationId: org.id,
              productId: item.productId,
              type: MovementType.PO_RECEIPT,
              quantity: item.quantityReceived,
              previousStock: 0,
              newStock: item.quantityReceived,
              performedById: owner.id,
              purchaseOrderId: po.id,
              reference: `PO-2026-${String(i + 1).padStart(5, '0')}`,
              createdAt: orderDate,
            },
          });
        }
      }
    }
  }

  console.log('Seed completed!');
  console.log('Demo login: demo@stockflow.app / password123');
  console.log('Staff login: staff@tokyosupply.jp / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
