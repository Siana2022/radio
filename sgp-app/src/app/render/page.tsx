'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Stage, Layer, Rect, Text, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';
import gsap from 'gsap';
import { Layer as KonvaLayerType } from 'konva/lib/Layer';
import { KonvaNode } from 'konva/lib/Node';

// Define types
interface Animation { type: 'none' | 'fadeIn' | 'slideInLeft'; duration: number; }
interface BaseElement { id: string; x: number; y: number; animation?: Animation; }
interface RectangleElement extends BaseElement { type: 'rect'; width: number; height: number; fill: string; }
interface TextElement extends BaseElement { type: 'text'; text: string; fontSize: number; fill: string; }
interface ImageElement extends BaseElement { type: 'image'; src: string; width: number; height: number; }
type CanvasElement = RectangleElement | TextElement | ImageElement;
interface TemplateData { width: number; height: number; elements: CanvasElement[]; }

const ImageComponent = ({ src, ...props }: ImageElement & { key: string }) => {
  const [image] = useImage(src);
  return <KonvaImage image={image} {...props} />;
};

const RenderPage = () => {
  const searchParams = useSearchParams();
  const [template, setTemplate] = useState<TemplateData | null>(null);
  const layerRef = useRef<KonvaLayerType>(null);

  useEffect(() => {
    const dataParam = searchParams.get('data');
    if (dataParam) {
      try {
        const decodedData = decodeURIComponent(dataParam);
        setTemplate(JSON.parse(decodedData));
      } catch (e) { console.error("Failed to parse template data", e); }
    }
  }, [searchParams]);

  useEffect(() => {
    if (template && layerRef.current) {
      const timeline = gsap.timeline({ paused: true });

      template.elements.forEach(element => {
        const node: KonvaNode | undefined = layerRef.current?.findOne(`#${element.id}`);
        if (node && element.animation) {
          switch (element.animation.type) {
            case 'fadeIn':
              timeline.from(node, { opacity: 0, duration: element.animation.duration }, 0);
              break;
            case 'slideInLeft':
              timeline.from(node, { x: -node.width(), duration: element.animation.duration, ease: 'power2.out' }, 0);
              break;
            default:
              break;
          }
        }
      });

      (window as Window & { seekAnimation: (time: number) => void }).seekAnimation = (time: number) => {
        timeline.seek(time);
      };
    }
  }, [template]);

  if (!template) { return <div>Loading...</div>; }

  return (
    <main>
      <div id="render-container">
        <Stage width={template.width} height={template.height}>
          <Layer ref={layerRef}>
            {template.elements.map((element) => {
              const props = { ...element, id: element.id };
              if (element.type === 'rect') return <Rect key={element.id} {...props} />;
              if (element.type === 'text') return <Text key={element.id} {...props} />;
              if (element.type === 'image') return <ImageComponent key={element.id} {...props} />;
              return null;
            })}
          </Layer>
        </Stage>
      </div>
    </main>
  );
};

export default RenderPage;
