'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Stage, Layer, Rect, Text } from 'react-konva';

// Define types for the template elements
interface Element {
  type: 'rect' | 'text';
  props: Record<string, unknown>;
}

interface TemplateData {
  width: number;
  height: number;
  elements: Element[];
}

/**
 * A dedicated page for rendering Konva scenes via Puppeteer.
 * It reads template data from the 'data' URL search parameter.
 *
 * Example of template data (URL-encoded JSON):
 * {
 *   "width": 1920,
 *   "height": 1080,
 *   "elements": [
 *     { "type": "rect", "props": { "x": 0, "y": 0, "width": 1920, "height": 1080, "fill": "#f0f0f0" } },
 *     { "type": "rect", "props": { "x": 50, "y": 50, "width": 200, "height": 100, "fill": "blue" } },
 *     { "type": "text", "props": { "x": 60, "y": 70, "text": "Hello SGP!", "fontSize": 40, "fill": "white" } }
 *   ]
 * }
 */
const RenderPage = () => {
  const searchParams = useSearchParams();
  const [template, setTemplate] = useState<TemplateData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dataParam = searchParams.get('data');
    if (dataParam) {
      try {
        const decodedData = decodeURIComponent(dataParam);
        const parsedData = JSON.parse(decodedData);
        setTemplate(parsedData);
      } catch (e) {
        setError('Failed to parse template data.');
        console.error(e);
      }
    } else {
      setError('No template data provided.');
    }
  }, [searchParams]);

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!template) {
    return <div>Loading template...</div>;
  }

  return (
    <main>
      <div id="render-container">
        <Stage width={template.width} height={template.height}>
          <Layer>
            {template.elements.map((element, i) => {
              switch (element.type) {
                case 'rect':
                  return <Rect key={i} {...element.props} />;
                case 'text':
                  return <Text key={i} {...element.props} />;
                // Add other element types here in the future
                default:
                  return null;
              }
            })}
          </Layer>
        </Stage>
      </div>
    </main>
  );
};

export default RenderPage;
