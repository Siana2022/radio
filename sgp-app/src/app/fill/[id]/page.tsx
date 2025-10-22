'use client';

import React, { useState, useEffect, useCallback, ChangeEvent, useRef } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Stage, Layer, Rect, Text } from 'react-konva';

// Define types
interface BaseElement { id: string; x: number; y: number; }
interface RectangleElement extends BaseElement { type: 'rect'; width: number; height: number; fill: string; }
interface TextElement extends BaseElement { type: 'text'; text: string; fontSize: number; fill: string; }
type CanvasElement = RectangleElement | TextElement;
interface Template { id: string; name: string; data: { elements: CanvasElement[] }; }

const FillTemplatePage = () => {
  const params = useParams();
  const supabase = createClient();
  const templateId = params.id as string;

  const [template, setTemplate] = useState<Template | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });

  const fetchTemplate = useCallback(async () => {
    if (!templateId) return;
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.from('templates').select('*').eq('id', templateId).single();

    if (error) {
      setError(`Failed to fetch template: ${error.message}`);
    } else if (data) {
      setTemplate(data);
      const initialFormData: Record<string, string> = {};
      data.data.elements.forEach(element => {
        if (element.type === 'text') {
          initialFormData[element.id] = element.text;
        }
      });
      setFormData(initialFormData);
    }
    setLoading(false);
  }, [templateId, supabase]);

  useEffect(() => {
    fetchTemplate();
    const checkSize = () => {
      if (containerRef.current) {
        setStageSize({ width: containerRef.current.offsetWidth, height: containerRef.current.offsetHeight });
      }
    };
    checkSize();
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, [fetchTemplate]);

  const handleFormChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [name]: e.target.value }));
  };

  const updatedElements = template?.data.elements.map(element => {
    if (element.type === 'text' && formData[element.id] !== undefined) {
      return { ...element, text: formData[element.id] };
    }
    return element;
  });

  const handleGenerateVideo = async () => {
    if (!template) return;
    setIsRendering(true);
    setVideoUrl(null);
    setMessage('Generating video...');

    const finalTemplateData = {
      width: stageSize.width,
      height: stageSize.height,
      elements: updatedElements,
    };

    try {
      const response = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalTemplateData),
      });

      if (!response.ok) {
        const errorResult = await response.json();
        throw new Error(errorResult.details || 'Failed to generate video.');
      }

      const result = await response.json();
      setVideoUrl(result.videoUrl);
      setMessage('Video generated successfully!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setMessage(`Error: ${errorMessage}`);
    } finally {
      setIsRendering(false);
    }
  };

  if (loading) { return <div className="flex h-screen items-center justify-center"><p>Loading...</p></div>; }
  if (error) { return <div className="flex h-screen items-center justify-center"><p className="text-red-500">{error}</p></div>; }
  if (!template) { return <div className="flex h-screen items-center justify-center"><p>Template not found.</p></div>; }

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-96 bg-white p-6 shadow-md overflow-y-auto">
        <h1 className="text-2xl font-bold mb-2">{template.name}</h1>
        <p className="text-sm text-gray-600 mb-6">Fill the form to customize.</p>

        <form className="space-y-4">
          {template.data.elements.map(element => {
            if (element.type === 'text') {
              return (
                <div key={element.id}>
                  <label htmlFor={element.id} className="block text-sm font-medium text-gray-700">
                    Text for element starting at ({element.x}, {element.y})
                  </label>
                  <input
                    type="text" id={element.id} name={element.id}
                    value={formData[element.id] || ''} onChange={handleFormChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  />
                </div>
              );
            }
            return null;
          })}
        </form>

        <hr className="my-6" />

        <div className="space-y-2">
          <button onClick={handleGenerateVideo} disabled={isRendering} className="w-full bg-purple-600 text-white p-2 rounded disabled:bg-purple-300">
            {isRendering ? 'Rendering...' : 'Generate Video'}
          </button>
          {message && <p className="text-sm text-center mt-2">{message}</p>}
          {videoUrl && (
            <div className="text-center"><a href={videoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">View Video</a></div>
          )}
        </div>
      </aside>

      <main className="flex-1 p-6 flex items-center justify-center">
        <div ref={containerRef} className="w-full h-full bg-white rounded-lg shadow-lg">
          <Stage width={stageSize.width} height={stageSize.height}>
            <Layer>
              {updatedElements?.map(element => {
                if (element.type === 'rect') return <Rect key={element.id} {...element} />;
                if (element.type === 'text') return <Text key={element.id} {...element} />;
                return null;
              })}
            </Layer>
          </Stage>
        </div>
      </main>
    </div>
  );
};

export default FillTemplatePage;
