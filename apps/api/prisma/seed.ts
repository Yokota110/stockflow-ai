import { PrismaClient, MovementType, PurchaseOrderStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding StockFlow database (Malaysian SME)...');

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

  const user = await prisma.user.create({
    data: {
      email: 'demo@stockflow.app',
      passwordHash,
      firstName: 'Ahmad',
      lastName: 'Razak',
      emailVerified: true,
    },
  });

  const staffUser = await prisma.user.create({
    data: {
      email: 'siti@acmesupplies.my',
      passwordHash,
      firstName: 'Siti',
      lastName: 'Aminah',
      emailVerified: true,
    },
  });

  const org = await prisma.organization.create({
    data: {
      name: 'Acme Supplies Co.',
      slug: 'acme-supplies',
      currency: 'MYR',
      timezone: 'Asia/Kuala_Lumpur',
      taxRate: 0.06,
    },
  });

  await prisma.userOrganization.createMany({
    data: [
      { userId: user.id, organizationId: org.id, role: 'OWNER' },
      { userId: staffUser.id, organizationId: org.id, role: 'STAFF' },
    ],
  });

  const categories = await Promise.all(
    ['Office Supplies', 'Electronics', 'Packaging', 'Cleaning', 'Safety Equipment'].map((name) =>
      prisma.category.create({
        data: { organizationId: org.id, name, description: `${name} for Malaysian businesses` },
      }),
    ),
  );

  const productData = [
    { name: 'A4 Copy Paper 80gsm (Ream)', sku: 'OFF-A4-80', cat: 0, price: 18.9, cost: 12.5, stock: 420, reorder: 50, unit: 'ream' },
    { name: 'Ballpoint Pen Blue (Box 50)', sku: 'OFF-PEN-B50', cat: 0, price: 15.5, cost: 8.2, stock: 18, reorder: 30, unit: 'box' },
    { name: 'Stapler Heavy Duty', sku: 'OFF-STP-HD', cat: 0, price: 32.0, cost: 18.0, stock: 45, reorder: 15, unit: 'pcs' },
    { name: 'Manila Folder A4 (Pack 100)', sku: 'OFF-FLD-A4', cat: 0, price: 28.5, cost: 16.0, stock: 8, reorder: 20, unit: 'pack' },
    { name: 'Wireless Mouse', sku: 'ELC-MS-WL', cat: 1, price: 45.0, cost: 22.0, stock: 67, reorder: 20, unit: 'pcs' },
    { name: 'USB-C Hub 7-Port', sku: 'ELC-HUB-7P', cat: 1, price: 89.0, cost: 48.0, stock: 5, reorder: 10, unit: 'pcs' },
    { name: '24" LED Monitor', sku: 'ELC-MON-24', cat: 1, price: 599.0, cost: 420.0, stock: 12, reorder: 5, unit: 'pcs' },
    { name: 'HD Webcam 1080p', sku: 'ELC-CAM-HD', cat: 1, price: 129.0, cost: 75.0, stock: 34, reorder: 10, unit: 'pcs' },
    { name: 'Bubble Wrap Roll 100m', sku: 'PKG-BUB-100', cat: 2, price: 35.0, cost: 18.0, stock: 85, reorder: 25, unit: 'roll' },
    { name: 'Carton Box 40x30x25cm', sku: 'PKG-BOX-4030', cat: 2, price: 3.5, cost: 1.8, stock: 0, reorder: 100, unit: 'pcs' },
    { name: 'Packing Tape 48mm (6 rolls)', sku: 'PKG-TAPE-48', cat: 2, price: 22.0, cost: 11.0, stock: 6, reorder: 20, unit: 'pack' },
    { name: 'Floor Cleaner 5L', sku: 'CLN-FLR-5L', cat: 3, price: 28.0, cost: 15.0, stock: 38, reorder: 15, unit: 'bottle' },
    { name: 'Disinfectant Spray 500ml', sku: 'CLN-DIS-500', cat: 3, price: 12.5, cost: 6.5, stock: 92, reorder: 30, unit: 'bottle' },
    { name: 'Rubber Gloves (Box 100)', sku: 'CLN-GLV-100', cat: 3, price: 25.0, cost: 14.0, stock: 4, reorder: 15, unit: 'box' },
    { name: 'Safety Helmet White', sku: 'SAF-HEL-WHT', cat: 4, price: 35.0, cost: 18.0, stock: 55, reorder: 20, unit: 'pcs' },
    { name: 'Safety Vest Reflective', sku: 'SAF-VST-REF', cat: 4, price: 18.0, cost: 9.0, stock: 120, reorder: 40, unit: 'pcs' },
    { name: 'First Aid Kit Standard', sku: 'SAF-FAK-STD', cat: 4, price: 85.0, cost: 52.0, stock: 3, reorder: 5, unit: 'kit' },
    { name: 'Whiteboard Marker Set', sku: 'OFF-MRK-WB', cat: 0, price: 16.0, cost: 8.5, stock: 28, reorder: 20, unit: 'set' },
    { name: 'Label Printer Tape 62mm', sku: 'ELC-LBL-62', cat: 1, price: 42.0, cost: 24.0, stock: 15, reorder: 10, unit: 'roll' },
    { name: 'Stretch Film 500mm x 300m', sku: 'PKG-STF-500', cat: 2, price: 48.0, cost: 28.0, stock: 22, reorder: 10, unit: 'roll' },
  ];

  const products: Awaited<ReturnType<typeof prisma.product.create>>[] = [];
  for (const p of productData) {
    const product = await prisma.product.create({
      data: {
        organizationId: org.id,
        categoryId: categories[p.cat].id,
        name: p.name,
        sku: p.sku,
        barcode: `955${Math.floor(Math.random() * 1e10).toString().padStart(10, '0')}`,
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
      name: 'KL Office Mart Sdn Bhd',
      email: 'orders@kloffice.my',
      contact: 'Tan Wei Ming',
      phone: '+60 3-2141 8800',
      address: '12 Jalan Sultan Ismail',
      city: 'Kuala Lumpur',
      website: 'https://kloffice.my',
    },
    {
      name: 'Penang Tech Distributors',
      email: 'sales@penangtech.com.my',
      contact: 'Lim Mei Ling',
      phone: '+60 4-262 3300',
      address: '45 Jalan Macalister',
      city: 'Penang',
      website: 'https://penangtech.com.my',
    },
    {
      name: 'JB Packaging Solutions',
      email: 'info@jbpackaging.my',
      contact: 'Raj Kumar',
      phone: '+60 7-355 1200',
      address: '88 Jalan Tebrau',
      city: 'Johor Bahru',
      website: 'https://jbpackaging.my',
    },
    {
      name: 'Selangor Safety Supplies',
      email: 'orders@safetyplus.my',
      contact: 'Nurul Huda',
      phone: '+60 3-8060 5500',
      address: '23 Jalan USJ 10/1',
      city: 'Subang Jaya',
      website: 'https://safetyplus.my',
    },
    {
      name: 'Melaka Cleaning Products',
      email: 'wholesale@melakaclean.my',
      contact: 'Ong Boon Huat',
      phone: '+60 6-282 7700',
      address: '7 Jalan Merdeka',
      city: 'Melaka',
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
        country: 'Malaysia',
        website: s.website,
      },
    }),
  ));

  const fastMovingSkus = ['OFF-A4-80', 'OFF-PEN-B50', 'ELC-MS-WL', 'CLN-DIS-500', 'SAF-VST-REF', 'PKG-BUB-100'];
  const mediumMovingSkus = ['OFF-STP-HD', 'ELC-CAM-HD', 'CLN-FLR-5L', 'SAF-HEL-WHT', 'OFF-MRK-WB'];
  const slowMovingSkus = ['ELC-MON-24', 'ELC-HUB-7P', 'SAF-FAK-STD', 'PKG-STF-500'];

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
            notes: 'Daily sales',
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
              reference: 'Retail sale',
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
            performedById: user.id,
            reference: `RESTOCK-${date.toISOString().slice(0, 7)}`,
            notes: 'Bi-weekly restock',
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
            reference: 'Bulk order',
            createdAt: date,
          },
        });
      }
    }
  }

  const poConfigs: { supplier: number; status: PurchaseOrderStatus; items: number[]; daysAgo: number; partial?: boolean }[] = [
    { supplier: 0, status: 'RECEIVED', items: [0, 1, 2], daysAgo: 45 },
    { supplier: 1, status: 'RECEIVED', items: [4, 5, 7], daysAgo: 30 },
    { supplier: 2, status: 'RECEIVED', items: [8, 9, 10], daysAgo: 20 },
    { supplier: 0, status: 'RECEIVED', items: [0, 17], daysAgo: 10 },
    { supplier: 3, status: 'RECEIVED', items: [14, 15, 16], daysAgo: 7 },
    { supplier: 1, status: 'PARTIALLY_RECEIVED', items: [4, 6, 18], daysAgo: 5, partial: true },
    { supplier: 2, status: 'SUBMITTED', items: [9, 10, 19], daysAgo: 2 },
    { supplier: 4, status: 'SUBMITTED', items: [11, 12, 13], daysAgo: 1 },
    { supplier: 0, status: 'DRAFT', items: [0, 1, 3], daysAgo: 0 },
    { supplier: 3, status: 'CANCELLED', items: [16], daysAgo: 15 },
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
        cfg.status === 'RECEIVED' ? 50 + idx * 10 : cfg.partial ? Math.floor((50 + idx * 10) * 0.6) : 0,
      unitCost: Number(products[idx].costPrice),
    }));

    const subtotal = poItems.reduce((s, item) => s + item.quantityOrdered * item.unitCost, 0);
    const tax = subtotal * 0.06;

    const po = await prisma.purchaseOrder.create({
      data: {
        organizationId: org.id,
        supplierId: suppliers[cfg.supplier].id,
        poNumber: `PO-2026-${String(i + 1).padStart(5, '0')}`,
        status: cfg.status,
        orderDate,
        expectedDate,
        receivedDate: cfg.status === 'RECEIVED' ? new Date(expectedDate.getTime() - 86400000) : undefined,
        subtotal,
        tax,
        total: subtotal + tax,
        notes: cfg.status === 'CANCELLED' ? 'Cancelled — supplier out of stock' : undefined,
        items: { create: poItems },
      },
    });

    if (cfg.status === 'RECEIVED' || cfg.partial) {
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
              performedById: user.id,
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
  console.log('Staff login: siti@acmesupplies.my / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
