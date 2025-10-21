import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const templateData = await request.json();
    const rendererUrl = process.env.RENDERER_BASE_URL || 'http://localhost:3001';

    console.log(`Forwarding render request to: ${rendererUrl}/render`);

    const response = await fetch(`${rendererUrl}/render`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(templateData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Renderer service failed: ${response.status} ${errorText}`);
    }

    const result = await response.json();

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error forwarding render request:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to process render request.', details: errorMessage }, { status: 500 });
  }
}
