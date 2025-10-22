const express = require('express');
const puppeteer = require('puppeteer');
const { exec } = require('child_process');
const util = require('util');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const execAsync = util.promisify(exec);
const app = express();
const port = process.env.PORT || 3001;

app.use(express.json({ limit: '10mb' }));
app.use(cors());

async function renderVideo(templateData) {
  const DURATION_IN_SECONDS = 5;
  const FRAME_RATE = 30;
  const TOTAL_FRAMES = DURATION_IN_SECONDS * FRAME_RATE;

  const tempDir = await fs.mkdtemp(path.join('/tmp', 'sgp-render-'));

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  const nextAppUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const encodedData = encodeURIComponent(JSON.stringify(templateData));
  const renderUrl = `${nextAppUrl}/render?data=${encodedData}`;

  const width = templateData.width || 1920;
  const height = templateData.height || 1080;

  await page.setViewport({ width, height });

  await page.goto(renderUrl, { waitUntil: 'networkidle0' });
  await page.waitForFunction('seekAnimation');

  console.log(`Capturing ${TOTAL_FRAMES} frames at ${width}x${height}...`);
  for (let i = 0; i < TOTAL_FRAMES; i++) {
    const time = i / FRAME_RATE;
    await page.evaluate(time => window.seekAnimation(time), time);
    const framePath = path.join(tempDir, `frame-${String(i).padStart(3, '0')}.png`);
    await page.screenshot({ path: framePath });
  }
  console.log('Finished capturing frames.');

  await browser.close();

  console.log('Stitching frames with FFmpeg...');
  const outputPath = path.join(tempDir, 'output.mp4');
  const ffmpegCommand = `ffmpeg -framerate ${FRAME_RATE} -i ${path.join(tempDir, 'frame-%03d.png')} -c:v libx264 -pix_fmt yuv420p -vf scale=${width}:${height} ${outputPath}`;

  console.log('Executing FFmpeg command:', ffmpegCommand);
  await execAsync(ffmpegCommand);
  console.log(`Video created successfully at ${outputPath}`);

  return { outputPath, tempDir };
}

app.post('/render', async (req, res) => {
  let tempDir;
  try {
    const templateData = req.body;
    if (!templateData) return res.status(400).send('Template data is required.');

    const { outputPath, tempDir: capturedTempDir } = await renderVideo(templateData);
    tempDir = capturedTempDir;

    res.status(200).json({ videoUrl: outputPath });
  } catch (error) {
    console.error('Failed to render video:', error);
    res.status(500).send('Failed to render video.');
  } finally {
    if (tempDir) {
      // For debugging, we might not want to delete the frames immediately.
      // In production, this cleanup is important.
      // fs.rm(tempDir, { recursive: true, force: true }).catch(console.error);
      console.log(`Temporary files are in ${tempDir}. Not deleting for now for debugging.`);
    }
  }
});

app.listen(port, () => {
  console.log(`Renderer server listening at http://localhost:${port}`);
});
