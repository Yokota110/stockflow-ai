import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '../docs/screenshots');
const BASE_URL = 'http://localhost:3000';

const PAGES = [
  { name: '01-dashboard', path: '/', wait: 2500 },
  { name: '02-products', path: '/products', wait: 2000 },
  { name: '03-inventory', path: '/inventory', wait: 2000 },
  { name: '04-suppliers', path: '/suppliers', wait: 2000 },
  { name: '05-purchase-orders', path: '/purchase-orders', wait: 2000 },
  { name: '06-analytics', path: '/analytics', wait: 2500 },
];

async function login(page) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.getByLabel(/email/i).fill('demo@stockflow.app');
  await page.getByLabel(/password/i).fill('password123');
  await page.getByRole('button', { name: /sign in|log in|login/i }).click();
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });
  await page.waitForTimeout(1500);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  try {
    await login(page);

    for (const { name, path: route, wait } of PAGES) {
      await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(wait);
      await page.screenshot({
        path: path.join(OUT_DIR, `${name}.png`),
        fullPage: false,
      });
      console.log(`Captured ${name}`);
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
