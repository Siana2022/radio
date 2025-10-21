const express = require('express');
const puppeteer = require('puppeteer');
const { exec } = require('child_process');
const util = require('util');
const cors = require('cors');

const execAsync = util.promisify(exec);
const app = express();
const port = process.env.PORT || 3001;

app.use(express.json({ limit: '10mb' }));
app.use(cors());

async function renderVideo(templateData) {
  console.log('Rendering video with data:', templateData);

  const nextAppUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const dataString = JSON.stringify(templateData);
  const encodedData = encodeURIComponent(dataString);
  const renderUrl = `${nextAppUrl}/render?data=${encodedData}`;

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({
    width: templateData.width || 1920,
    height: templateData.height || 1080,
  });

  console.log(`Navigating to ${renderUrl}`);
  await page.goto(renderUrl, { waitUntil: 'networkidle0' });
  await page.waitForSelector('#render-container .konvajs-content');

  const imagePath = `/tmp/frame-${Date.now()}.png`;
  const renderContainer = await page.$('#render-container');
  if (renderContainer) {
    await renderContainer.screenshot({ path: imagePath });
  } else {
    throw new Error('Could not find render container.');
  }
  await browser.close();

  const outputPath = `/tmp/output-${Date.now()}.mp4`;
  const ffmpegCommand = `ffmpeg -loop 1 -i ${imagePath} -c:v libx264 -t 5 -pix_fmt yuv420p -vf scale=1920:1080 ${outputPath}`;

  console.log('Executing FFmpeg command:', ffmpegCommand);
  await execAsync(ffmpegCommand);
  console.log(`Video created at ${outputPath}`);

  return outputPath;
}

app.post('/render', async (req, res) => {
  try {
    const templateData = req.body;
    if (!templateData) {
      return res.status(400).send('Template data is required.');
    }
    const videoPath = await renderVideo(templateData);
    // In a real app, we'd upload this to a storage provider and return the URL.
    // For now, we'll just return the path.
    res.status(200).json({ videoUrl: videoPath });
  } catch (error) {
    console.error('Failed to render video:', error);
    res.status(500).send('Failed to render video.');
  }
});

app.listen(port, () => {
  console.log(`Renderer server listening at http://localhost:${port}`);
});
