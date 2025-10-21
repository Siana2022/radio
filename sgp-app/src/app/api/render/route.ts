import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

export async function POST(request: Request) {
  try {
    const templateData = await request.json();
    console.log('Received rendering request with data:', templateData);

    // 1. Prepare the URL for the rendering page
    const dataString = JSON.stringify(templateData);
    const encodedData = encodeURIComponent(dataString);
    const renderUrl = `http://localhost:3000/render?data=${encodedData}`;

    // 2. Launch Puppeteer and navigate to the rendering page
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

    // Wait for the Konva stage to be ready
    await page.waitForSelector('#render-container .konvajs-content');

    // 3. Capture a screenshot of the rendered scene
    const imagePath = `/tmp/frame-${Date.now()}.png`;
    const renderContainer = await page.$('#render-container');
    if (renderContainer) {
      await renderContainer.screenshot({ path: imagePath });
      console.log(`Screenshot saved to ${imagePath}`);
    } else {
      throw new Error('Could not find render container on the page.');
    }

    await browser.close();

    // 4. Use FFmpeg to convert the image to a video
    const outputPath = `/tmp/output-${Date.now()}.mp4`;
    const ffmpegCommand = `ffmpeg -loop 1 -i ${imagePath} -c:v libx264 -t 5 -pix_fmt yuv420p -vf scale=1920:1080 ${outputPath}`;

    console.log('Executing FFmpeg command:', ffmpegCommand);
    const { stdout, stderr } = await execAsync(ffmpegCommand);
    console.log('FFmpeg stdout:', stdout);
    if (stderr) {
      console.error('FFmpeg stderr:', stderr);
    }
    console.log(`Video created successfully at ${outputPath}`);

    // 5. Return a response
    const response = {
      message: 'Render job started successfully.',
      renderId: `render_${Date.now()}`,
      videoUrl: outputPath, // This will be the actual video path
    };

    return NextResponse.json(response, { status: 202 });
  } catch (error) {
    console.error('Error processing render request:', error);
    return NextResponse.json({ error: 'Failed to process render request.' }, { status: 500 });
  }
}
