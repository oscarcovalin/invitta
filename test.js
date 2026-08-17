const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  await page.goto('https://invitta.vercel.app/invitacion.html?slug=paola-xv&preview=studio&v=123', {waitUntil: 'networkidle0'});
  
  console.log("Done");
  await browser.close();
})();
