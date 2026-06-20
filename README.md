# StockFlow

Production-grade inventory management platform for Japanese SMEs.

![Tech Stack](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![NestJS](https://img.shields.io/badge/NestJS-11-red?style=flat-square&logo=nestjs)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?style=flat-square&logo=postgresql)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=flat-square&logo=typescript)

## Demo

### App Walkthrough

<p align="center">
  <img src="docs/demo.gif" alt="StockFlow app walkthrough — dashboard, products, inventory, suppliers, purchase orders, and analytics" width="960">
  <br>
  <sub>End-to-end walkthrough of the Japan demo workspace (JPY, Asia/Tokyo, 10% consumption tax)</sub>
  <br>
  <sub><a href="docs/demo.mp4">▶ Watch full HD demo video (MP4)</a></sub>
</p>

> GitHub README renders GIF previews reliably. For the full-quality recording, use the MP4 link above.

<p align="center">
  <img src="docs/japan-warehouse-hero.png" alt="StockFlow Japan warehouse operations hero" width="800">
  <br>
  <sub>Japan-ready inventory operations workspace</sub>
</p>

### Screenshots

| Dashboard | Products | Inventory |
|:---:|:---:|:---:|
| <img src="docs/screenshots/01-dashboard.png" alt="Dashboard KPIs and inventory health" width="420"> | <img src="docs/screenshots/02-products.png" alt="Product catalog with search and filters" width="420"> | <img src="docs/screenshots/03-inventory.png" alt="Stock in/out and movement ledger" width="420"> |

| Suppliers | Purchase Orders | Analytics |
|:---:|:---:|:---:|
| <img src="docs/screenshots/04-suppliers.png" alt="Supplier CRM profiles" width="420"> | <img src="docs/screenshots/05-purchase-orders.png" alt="Purchase order lifecycle" width="420"> | <img src="docs/screenshots/06-analytics.png" alt="Inventory aging and category performance" width="420"> |

Regenerate preview assets after seeding Japan demo data:

```bash
pnpm db:seed
pnpm dev
pnpm capture:screenshots   # requires dev server on :3000
```

## Features

- **Authentication** - JWT auth with refresh tokens and role-based access control (OWNER, ADMIN, MANAGER, STAFF, VIEWER)
- **Dashboard** - KPI cards, inventory value trend (JPY), health score, and turnover metrics
- **Products** - Catalog management with search, low-stock filters, and slide-out product detail drawer
- **Inventory** - Stock in/out workflows, immutable movement ledger, and low-stock notification panel
- **Suppliers** - CRM-style supplier profiles with spend, reliability, and supplied products
- **Purchase Orders** - Complete PO lifecycle with status timeline, partial receiving, and Japanese consumption tax (10%)
- **Analytics** - Inventory aging, category performance, low-stock risk, top supplier rankings, and monthly trends
- **Settings** - Organization config, team roles, notifications, and light/dark mode
- **Japan-ready demo data** - JPY currency, Asia/Tokyo timezone, consumption tax, and realistic Tokyo/Osaka/Nagoya suppliers

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React 18, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, Recharts |
| Backend | NestJS 11, Prisma, PostgreSQL |
| Auth | JWT + Refresh Tokens, RBAC |
| Infra | Docker Compose (PostgreSQL), Railway API deploy config, Vercel web config |

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker Desktop

### Setup

```bash
pnpm install
pnpm db:up

cd apps/api
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:seed

cd ../..
pnpm dev
```

- **Frontend:** http://localhost:3000
- **API:** http://localhost:3001
- **Swagger Docs:** http://localhost:3001/docs

No extra environment variables are required for local development. The frontend defaults to `http://localhost:3001/v1`.

### Demo Credentials

```text
Email:    demo@stockflow.app
Password: password123
```

Staff account:

```text
Email:    staff@tokyosupply.jp
Password: password123
```

## Project Structure

```text
stockflow/
|-- apps/
|   |-- api/          # NestJS backend
|   `-- web/          # Next.js frontend
|-- packages/
|   `-- shared/       # Shared TypeScript types and enums
|-- docs/
|   |-- demo.gif
|   |-- demo.mp4
|   |-- japan-warehouse-hero.png
|   `-- screenshots/
|-- scripts/
|   `-- capture-screenshots.mjs
|-- docker-compose.yml
`-- package.json
```

## API Endpoints

| Module | Endpoints |
|--------|-----------|
| Auth | `POST /v1/auth/register`, `POST /v1/auth/login`, `POST /v1/auth/refresh`, `POST /v1/auth/logout`, `GET /v1/auth/me` |
| Organizations | `GET/PATCH /v1/organizations/:id`, members and role management |
| Products | `GET/POST/PATCH/DELETE /v1/products`, categories CRUD |
| Inventory | `POST /v1/inventory/stock-in`, `stock-out`, `adjust`, movements, alerts |
| Suppliers | Full CRUD, supplied products, purchase history |
| Purchase Orders | Create, submit, receive, cancel |
| Analytics | Dashboard KPIs, health score, inventory aging, category performance, low-stock risk, monthly trends |

All protected endpoints require:

- `Authorization: Bearer <token>`
- `X-Organization-Id: <orgId>`

## Architecture Highlights

- **Multi-tenant by design** - row-level isolation through `organizationId`
- **Inventory ledger** - immutable movement records support reliable stock history
- **PO lifecycle** - draft, submitted, partial receipt, full receipt, and cancellation
- **Japan localization** - JPY formatting, Asia/Tokyo defaults, and 10% consumption tax
- **Type-safe monorepo** - shared domain types across frontend and backend
- **Production-style UI** - dense operational screens, charts, responsive layout, and polished empty/loading states

## Author

**Yokota Ishun** - Full Stack Developer, Shiki, Saitama, Japan

Portfolio project showcasing end-to-end SaaS development, from multi-tenant API design to production UI.

| | |
|---|---|
| **GitHub** | [Yokota110/stockflow-ai](https://github.com/Yokota110/stockflow-ai) |
| **Email** | [richunyokota93@gmail.com](mailto:richunyokota93@gmail.com) |
| **Languages** | Chinese (native), Japanese (JLPT N2), English (business) |
| **Experience** | Neusoft, Neusoft Reach (2015-2022), Freelance Full Stack Developer (2023-present) |
| **Stack** | TypeScript, React, Next.js, Node.js, NestJS, PostgreSQL, AWS, Docker |

## License

MIT
