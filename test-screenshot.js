const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 4000 });

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

  // Wait a bit for any animations
  await new Promise(resolve => setTimeout(resolve, 2000));

  await page.screenshot({ path: '/tmp/homepage-full.png', fullPage: true });

  console.log('✅ Screenshot saved to /tmp/homepage-full.png');

  await browser.close();
})();
