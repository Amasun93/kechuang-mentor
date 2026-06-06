import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

const consoleMessages = [];
const pageErrors = [];

page.on('console', msg => {
  consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
});
page.on('pageerror', err => {
  pageErrors.push(`PAGEERROR: ${err.message}\n${err.stack || ''}`);
});
page.on('requestfailed', req => {
  pageErrors.push(`REQFAIL: ${req.url()} - ${req.failure()?.errorText}`);
});

console.log('Opening http://localhost:3000/...');
try {
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle', timeout: 15000 });
} catch (e) {
  console.log('Navigation error:', e.message);
}

await page.waitForTimeout(5000);

const rootLen = await page.evaluate(() => document.getElementById('root')?.innerHTML?.length || 0);
const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 500));
const title = await page.title();

console.log('---');
console.log('Title:', title);
console.log('Root content length:', rootLen);
console.log('Body text (first 500):', bodyText);
console.log('---');
console.log('Console messages:');
consoleMessages.forEach(m => console.log(' ', m));
console.log('---');
console.log('Page errors:');
pageErrors.forEach(e => console.log(' ', e));
console.log('---');

await page.screenshot({ path: '/app/data/所有对话/主对话/kechuang-mentor/docs/screenshots/debug-pw.png', fullPage: true });
console.log('Screenshot saved');

await browser.close();
