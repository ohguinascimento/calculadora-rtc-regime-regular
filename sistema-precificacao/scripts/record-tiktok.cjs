const puppeteer = require('puppeteer-core');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PORT = 5175;
const FRAMES_DIR = path.join(__dirname, 'frames_tiktok');
const OUTPUT_MP4 = path.join(__dirname, '..', 'demo-tiktok-2027.mp4');
const ARTIFACT_MP4 = 'C:\\Users\\Guilherme\\.gemini\\antigravity\\brain\\bb499f71-64f2-4ae2-8d50-d9c0ff81b0ef\\demo-tiktok-2027.mp4';
const AUDIO_WAV = path.join(__dirname, '..', 'audio_tiktok_completo.wav');

// Simple static server
function startServer() {
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.svg': 'image/svg+xml',
    '.json': 'application/json'
  };

  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/' || reqPath === '') reqPath = '/tiktok.html';
    const filePath = path.join(__dirname, reqPath);

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('Not Found: ' + reqPath);
      } else {
        const ext = path.extname(filePath);
        res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/html' });
        res.end(data);
      }
    });
  });

  return new Promise((resolve) => {
    server.listen(PORT, () => {
      console.log(`TikTok server listening on http://localhost:${PORT}`);
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

  console.log('Launching Chrome for TikTok 9:16 portrait (1080x1920)...');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--window-size=1080,1920',
      '--hide-scrollbars'
    ],
    defaultViewport: {
      width: 1080,
      height: 1920,
      deviceScaleFactor: 1
    }
  });

  const page = await browser.newPage();
  await page.goto(`http://localhost:${PORT}/tiktok.html`, { waitUntil: 'networkidle0' });

  console.log('Starting screencast recording...');
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

  // Total duration: 64.5s
  const totalSeconds = 64.5;
  const startTime = Date.now();

  console.log('Progressing through TikTok scenes...');
  while (true) {
    const elapsed = (Date.now() - startTime) / 1000;
    if (elapsed >= totalSeconds) break;

    await page.evaluate((sec) => {
      if (window.setTimeSeconds) window.setTimeSeconds(sec);
    }, elapsed);

    await sleep(40); // ~25 fps ticks
  }

  console.log(`Finished recording. Total frames captured: ${frameIndex}`);
  await client.send('Page.stopScreencast');
  await browser.close();
  server.close();

  // Encode with ffmpeg: 20fps or 25fps video + AAC audio
  const fps = (frameIndex / totalSeconds).toFixed(2);
  console.log(`Compiling vertical TikTok MP4 at ${fps} fps...`);

  const ffmpegCmd = `ffmpeg -y -framerate ${fps} -i "${path.join(FRAMES_DIR, 'frame_%06d.jpg')}" -i "${AUDIO_WAV}" -c:v libx264 -pix_fmt yuv420p -crf 22 -c:a aac -b:a 192k -shortest "${OUTPUT_MP4}"`;
  execSync(ffmpegCmd, { stdio: 'inherit' });

  fs.copyFileSync(OUTPUT_MP4, ARTIFACT_MP4);
  console.log(`Video saved to: ${OUTPUT_MP4} and ${ARTIFACT_MP4}`);

  // Cleanup frames
  fs.rmSync(FRAMES_DIR, { recursive: true, force: true });
}

run().catch(err => {
  console.error('Error recording TikTok video:', err);
  process.exit(1);
});
