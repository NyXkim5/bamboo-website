import puppeteer from 'puppeteer';
import { mkdir } from 'fs/promises';
import { resolve } from 'path';

const OUT = resolve(import.meta.dirname, '../public/screens');
const APP_URL = 'http://localhost:8081';

async function main() {
  await mkdir(OUT, { recursive: true });

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 393, height: 852, deviceScaleFactor: 2 });

  // Load app and click "explore with sample data"
  console.log('Loading app...');
  await page.goto(APP_URL, { waitUntil: 'networkidle2', timeout: 20000 });
  await new Promise((r) => setTimeout(r, 2000));

  // Find and click "explore with sample data"
  const clicked = await page.evaluate(() => {
    const allElements = document.querySelectorAll('*');
    for (const el of allElements) {
      if (el.textContent?.trim().toLowerCase() === 'explore with sample data') {
        el.click();
        return true;
      }
    }
    return false;
  });
  console.log(`Sample data click: ${clicked}`);
  await new Promise((r) => setTimeout(r, 4000));

  // Navigate via tab bar clicks instead of URL changes
  // First capture current screen (should be home after sample data loads)
  async function captureScreen(name, tabIndex, wait = 2000) {
    console.log(`Capturing ${name}...`);

    if (tabIndex !== null) {
      // Click the tab bar button
      const tabClicked = await page.evaluate((idx) => {
        const tabButtons = document.querySelectorAll('[role="tab"], [accessibilityRole="tab"]');
        // Fallback: find buttons in the bottom nav area
        const allButtons = [...document.querySelectorAll('div[role="button"], button')];
        const bottomButtons = allButtons.filter((el) => {
          const rect = el.getBoundingClientRect();
          return rect.top > window.innerHeight - 100;
        });
        if (bottomButtons[idx]) {
          bottomButtons[idx].click();
          return true;
        }
        return false;
      }, tabIndex);

      if (!tabClicked) {
        // Try direct navigation as fallback
        const paths = [null, '/', '/log', '/insights', '/gut', '/profile', '/cycle'];
        if (paths[tabIndex]) {
          await page.goto(`${APP_URL}${paths[tabIndex]}`, { waitUntil: 'networkidle2', timeout: 10000 });
        }
      }
    }

    await new Promise((r) => setTimeout(r, wait));
    await page.screenshot({
      path: `${OUT}/${name}.png`,
      type: 'png',
      clip: { x: 0, y: 0, width: 393, height: 852 },
    });
    console.log(`  Saved ${name}.png`);
  }

  // Capture home (already there after sample data)
  await captureScreen('home', null, 2000);

  // Try clicking each tab (Home=0, Log=1, Stats=2, Gut=3, Profile=4)
  await captureScreen('log', 1);
  await captureScreen('stats', 2);
  await captureScreen('gut', 3);
  await captureScreen('profile', 4);

  // Navigate to cycle screen
  await page.goto(`${APP_URL}/cycle`, { waitUntil: 'networkidle2', timeout: 10000 });
  await new Promise((r) => setTimeout(r, 2000));
  await page.screenshot({
    path: `${OUT}/cycle.png`,
    type: 'png',
    clip: { x: 0, y: 0, width: 393, height: 852 },
  });
  console.log('  Saved cycle.png');

  // Capture the onboarding welcome
  await page.evaluate(() => localStorage.clear());
  await page.goto(APP_URL, { waitUntil: 'networkidle2', timeout: 15000 });
  await new Promise((r) => setTimeout(r, 2000));
  await page.screenshot({
    path: `${OUT}/onboarding.png`,
    type: 'png',
    clip: { x: 0, y: 0, width: 393, height: 852 },
  });
  console.log('  Saved onboarding.png');

  await browser.close();
  console.log('Done!');
}

main();
