const puppeteer = require('puppeteer');
(async () => {
  try {
    const browser = await puppeteer.launch({ args: ['--allow-file-access-from-files'] });
    const page = await browser.newPage();
    page.on('console', msg => {
      if(msg.type() === 'error') console.log('LOG ERROR:', msg.text());
    });
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
    await page.goto('file:///Users/rishibhardwaj/Desktop/Game/index.html');
    await new Promise(r => setTimeout(r, 1500));
    await page.evaluate(() => {
      window.gameMode = 'pvp';
      window.p1SelectionId = 'ninja';
      window.p2SelectionId = 'brawler';
      window.selectedStageId = 'dojo';
      window.startGame();
    });
    await new Promise(r => setTimeout(r, 1000));
    await browser.close();
  } catch(e) { console.error("SCRIPT ERROR:", e); }
})();
