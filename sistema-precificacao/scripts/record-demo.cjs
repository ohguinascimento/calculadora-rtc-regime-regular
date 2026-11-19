const puppeteer = require('puppeteer-core');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PORT = 5174;
const DIST_DIR = path.join(__dirname, 'dist');
const FRAMES_DIR = path.join(__dirname, 'frames');
const OUTPUT_MP4 = path.join(__dirname, '..', 'demo-video.mp4');
const ARTIFACT_MP4 = 'C:\\Users\\Guilherme\\.gemini\\antigravity\\brain\\bb499f71-64f2-4ae2-8d50-d9c0ff81b0ef\\demo-video.mp4';

// Simple static file server
function startServer() {
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.svg': 'image/svg+xml',
    '.json': 'application/json',
    '.png': 'image/png'
  };

  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
    const filePath = path.join(DIST_DIR, reqPath);

    fs.readFile(filePath, (err, data) => {
      if (err) {
        fs.readFile(path.join(DIST_DIR, 'index.html'), (err2, data2) => {
          if (err2) {
            res.writeHead(404);
            res.end('Not Found');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data2);
          }
        });
      } else {
        const ext = path.extname(filePath);
        res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
        res.end(data);
      }
    });
  });

  return new Promise((resolve) => {
    server.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}`);
      resolve(server);
    });
  });
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function run() {
  if (fs.existsSync(FRAMES_DIR)) {
    fs.rmSync(FRAMES_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(FRAMES_DIR, { recursive: true });

  const server = await startServer();

  console.log('Launching Chrome...');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--window-size=1440,900',
      '--hide-scrollbars'
    ],
    defaultViewport: {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1
    }
  });

  const page = await browser.newPage();
  await page.goto(`http://localhost:${PORT}`, { waitUntil: 'networkidle0' });

  // Add visual cursor helper
  await page.evaluate(() => {
    const cursor = document.createElement('div');
    cursor.id = 'demo-cursor';
    cursor.style.position = 'fixed';
    cursor.style.width = '20px';
    cursor.style.height = '20px';
    cursor.style.backgroundColor = 'rgba(239, 68, 68, 0.8)';
    cursor.style.border = '2px solid white';
    cursor.style.borderRadius = '50%';
    cursor.style.zIndex = '999999';
    cursor.style.pointerEvents = 'none';
    cursor.style.transition = 'transform 0.08s ease-out, width 0.15s, height 0.15s, background-color 0.15s';
    cursor.style.boxShadow = '0 0 10px rgba(0,0,0,0.4)';
    cursor.style.transform = 'translate(100px, 100px)';
    document.body.appendChild(cursor);

    window.moveCursorTo = (x, y) => {
      cursor.style.transform = `translate(${x}px, ${y}px)`;
    };
    window.clickCursor = () => {
      cursor.style.transform += ' scale(0.7)';
      cursor.style.backgroundColor = 'rgba(220, 38, 38, 1)';
      setTimeout(() => {
        cursor.style.backgroundColor = 'rgba(239, 68, 68, 0.8)';
        cursor.style.transform = cursor.style.transform.replace(' scale(0.7)', '');
      }, 150);
    };
  });

  console.log('Starting screencast...');
  let frameIndex = 0;
  const client = await page.target().createCDPSession();
  await client.send('Page.startScreencast', {
    format: 'jpeg',
    quality: 90,
    everyNthFrame: 1
  });

  client.on('Page.screencastFrame', async ({ data, sessionId }) => {
    const framePath = path.join(FRAMES_DIR, `frame_${String(frameIndex++).padStart(6, '0')}.jpg`);
    fs.writeFile(framePath, Buffer.from(data, 'base64'), () => {});
    try {
      await client.send('Page.screencastFrameAck', { sessionId });
    } catch (e) {}
  });

  async function moveToElement(selector) {
    const el = await page.$(selector);
    if (!el) return;
    const box = await el.boundingBox();
    if (box) {
      const targetX = box.x + box.width / 2;
      const targetY = box.y + box.height / 2;
      await page.evaluate((x, y) => window.moveCursorTo(x, y), targetX, targetY);
      await sleep(250);
    }
  }

  async function clickElement(selector) {
    await moveToElement(selector);
    await page.evaluate(() => window.clickCursor());
    await page.click(selector);
    await sleep(400);
  }

  console.log('Running interactive walkthrough...');

  // Step 1: Initial view
  await sleep(1500);

  // Step 2: Change product to Meia Esportiva
  await moveToElement('select');
  await page.select('select', 'esportiva-atoalhada');
  await sleep(1000);

  // Step 3: Change volume to 4800 pares
  const volumeInput = await page.$('input[type="number"]');
  if (volumeInput) {
    await moveToElement('input[type="number"]');
    await page.click('input[type="number"]', { clickCount: 3 });
    await page.type('input[type="number"]', '4800', { delay: 100 });
  }
  await sleep(1000);

  // Step 4: Adjust margin slider
  await moveToElement('input[type="range"]');
  await page.evaluate(() => {
    const slider = document.querySelector('input[type="range"]');
    if (slider) {
      slider.value = '32';
      slider.dispatchEvent(new Event('input', { bubbles: true }));
      slider.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await sleep(1200);

  // Step 5: Change destination UF to PR (Paraná)
  const ufSelects = await page.$$('select');
  if (ufSelects.length >= 2) {
    await page.evaluate((el) => {
      const box = el.getBoundingClientRect();
      window.moveCursorTo(box.left + box.width / 2, box.top + box.height / 2);
    }, ufSelects[1]);
    await sleep(200);
    await page.evaluate((el) => {
      el.value = 'PR';
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, ufSelects[1]);
  }
  await sleep(1500);

  // Step 6: Click on Simples Nacional profile
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.innerText, btn);
    if (text.includes('Simples / MEI')) {
      await page.evaluate((el) => {
        const box = el.getBoundingClientRect();
        window.moveCursorTo(box.left + box.width / 2, box.top + box.height / 2);
        window.clickCursor();
      }, btn);
      await btn.click();
      break;
    }
  }
  await sleep(2000);

  // Step 7: Click back to Regime Geral
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.innerText, btn);
    if (text.includes('Regime Geral')) {
      await page.evaluate((el) => {
        const box = el.getBoundingClientRect();
        window.moveCursorTo(box.left + box.width / 2, box.top + box.height / 2);
        window.clickCursor();
      }, btn);
      await btn.click();
      break;
    }
  }
  await sleep(1500);

  // Step 8: Tab 2 - Comparativo
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.innerText, btn);
    if (text.includes('Comparativo Fim do ICMS-ST')) {
      await page.evaluate((el) => {
        const box = el.getBoundingClientRect();
        window.moveCursorTo(box.left + box.width / 2, box.top + box.height / 2);
        window.clickCursor();
      }, btn);
      await btn.click();
      break;
    }
  }
  await sleep(2500);

  // Scroll down a bit on Tab 2
  await page.evaluate(() => window.scrollBy({ top: 150, behavior: 'smooth' }));
  await sleep(1500);

  // Step 9: Tab 3 - API Serpro RTC
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.innerText, btn);
    if (text.includes('Payload API Serpro RTC')) {
      await page.evaluate((el) => {
        const box = el.getBoundingClientRect();
        window.moveCursorTo(box.left + box.width / 2, box.top + box.height / 2);
        window.clickCursor();
      }, btn);
      await btn.click();
      break;
    }
  }
  await sleep(1500);

  // Click Copiar JSON
  let copyBtn = null;
  const allBtns = await page.$$('button');
  for (const b of allBtns) {
    const t = await page.evaluate(el => el.innerText, b);
    if (t.includes('Copiar JSON')) {
      copyBtn = b;
      break;
    }
  }
  if (copyBtn) {
    await page.evaluate((el) => {
      const box = el.getBoundingClientRect();
      window.moveCursorTo(box.left + box.width / 2, box.top + box.height / 2);
      window.clickCursor();
    }, copyBtn);
    await copyBtn.click();
  }
  await sleep(2000);

  // Step 10: Tab 4 - Regras Têxtil
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.innerText, btn);
    if (text.includes('Regras Têxtil / Frete')) {
      await page.evaluate((el) => {
        const box = el.getBoundingClientRect();
        window.moveCursorTo(box.left + box.width / 2, box.top + box.height / 2);
        window.clickCursor();
      }, btn);
      await btn.click();
      break;
    }
  }
  await sleep(2500);

  // Step 11: Back to Tab 1
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.innerText, btn);
    if (text.includes('Simulador Fábrica')) {
      await page.evaluate((el) => {
        const box = el.getBoundingClientRect();
        window.moveCursorTo(box.left + box.width / 2, box.top + box.height / 2);
        window.clickCursor();
      }, btn);
      await btn.click();
      break;
    }
  }
  await sleep(2000);

  console.log(`Finished walkthrough. Total frames captured: ${frameIndex}`);

  await client.send('Page.stopScreencast');
  await browser.close();
  server.close();

  // Encode with ffmpeg
  console.log('Compiling video with ffmpeg...');
  const ffmpegCmd = `ffmpeg -y -framerate 20 -i "${path.join(FRAMES_DIR, 'frame_%06d.jpg')}" -c:v libx264 -pix_fmt yuv420p -crf 22 "${OUTPUT_MP4}"`;
  execSync(ffmpegCmd, { stdio: 'inherit' });

  // Copy to artifact directory
  fs.copyFileSync(OUTPUT_MP4, ARTIFACT_MP4);
  console.log(`Video saved to ${OUTPUT_MP4} and ${ARTIFACT_MP4}`);

  // Cleanup frames
  fs.rmSync(FRAMES_DIR, { recursive: true, force: true });
}

run().catch(err => {
  console.error('Error during video recording:', err);
  process.exit(1);
});
