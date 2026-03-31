const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('console', msg => {
    if(msg.type() === 'error') console.log('PAGE CONSOLE ERROR:', msg.text());
  });
  await page.goto('http://localhost:3000');
  await page.evaluate(() => {
    window.gameMode = 'pvp';
    window.p1SelectionId = 'ninja';
    window.p2SelectionId = 'brawler';
    window.selectedStageId = 'dojo';
    window.startGame();
  });
  await new Promise(r => setTimeout(r, 1000));
  await browser.close();
})();
