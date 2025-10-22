'use client';

import React, { useState, useRef, useEffect, ChangeEvent, useCallback } from 'react';
import { Stage, Layer, Rect, Text } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';

// Define types
interface BaseElement { id: string; x: number; y: number; }
interface RectangleElement extends BaseElement { type: 'rect'; width: number; height: number; fill: string; }
interface TextElement extends BaseElement { type: 'text'; text: string; fontSize: number; fill: string; }
type CanvasElement = RectangleElement | TextElement;
interface Template { id: string; name: string; data: { elements: CanvasElement[] }; }

const EditorPage = () => {
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [templateName, setTemplateName] = useState('My New Template');
  const [currentTemplateId, setCurrentTemplateId] = useState<string | null>(null);
  const [savedTemplates, setSavedTemplates] = useState<Template[]>([]);
  const [message, setMessage] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const router = useRouter();
  const supabase = createClient();

  const fetchTemplates = useCallback(async (userId: string) => {
    const { data, error } = await supabase.from('templates').select('*').eq('user_id', userId);
    if (error) {
      setMessage(`Error fetching templates: ${error.message}`);
    } else if (data) {
      setSavedTemplates(data);
    }
  }, [supabase]);

  useEffect(() => {
    const initialize = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
      } else {
        setUser(session.user);
        fetchTemplates(session.user.id);
      }
    };
    initialize();

    const checkSize = () => {
      if (containerRef.current) {
        setStageSize({ width: containerRef.current.offsetWidth, height: containerRef.current.offsetHeight });
      }
    };
    checkSize();
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, [router, supabase.auth, fetchTemplates]);

  const handleSaveTemplate = async () => {
    if (!user) return;
    setMessage('Saving...');
    const templateData = { id: currentTemplateId, user_id: user.id, name: templateName, data: { elements } };
    const { data, error } = await supabase.from('templates').upsert(templateData).select().single();
    if (error) {
      setMessage(`Error saving: ${error.message}`);
    } else {
      setMessage('Saved successfully!');
      if (data) setCurrentTemplateId(data.id);
      fetchTemplates(user.id);
    }
  };

  const handleLoadTemplate = (template: Template) => {
    setElements(template.data.elements);
    setTemplateName(template.name);
    setCurrentTemplateId(template.id);
    setMessage(`Loaded template: ${template.name}`);
  };

  const handleNewTemplate = () => {
    setElements([]);
    setTemplateName('My New Template');
    setCurrentTemplateId(null);
    setSelectedId(null);
    setMessage('Started a new template.');
  };

  const handleGenerateVideo = async () => {
    setIsRendering(true);
    setVideoUrl(null);
    setMessage('Generating video...');

    const templateData = {
      width: stageSize.width,
      height: stageSize.height,
      elements: elements,
    };

    try {
      const response = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData),
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

  const addRectangle = () => setElements([...elements, { id: crypto.randomUUID(), type: 'rect', x: 50, y: 50, width: 200, height: 100, fill: 'lightblue' }]);
  const addText = () => setElements([...elements, { id: crypto.randomUUID(), type: 'text', x: 60, y: 70, text: 'New Text', fontSize: 30, fill: 'black' }]);
  const checkDeselect = (e: KonvaEventObject<MouseEvent>) => { if (e.target === e.target.getStage()) setSelectedId(null); };

  const handlePropertyChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!selectedId) return;
    const { name, value } = e.target;
    setElements(elements.map(el => el.id === selectedId ? { ...el, [name]: value } : el));
  };

  const selectedElement = elements.find((el) => el.id === selectedId);

  if (!user) { return <div className="flex h-screen items-center justify-center"><p>Loading...</p></div>; }

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-80 bg-white p-4 shadow-md overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Actions</h2>
        <div className="space-y-2">
          <button onClick={handleGenerateVideo} disabled={isRendering} className="w-full bg-purple-600 text-white p-2 rounded disabled:bg-purple-300">
            {isRendering ? 'Rendering...' : 'Generate Video'}
          </button>
          {videoUrl && (
            <div className="text-center"><a href={videoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">View Video</a></div>
          )}
        </div>
        <hr className="my-4" />
        <h2 className="text-xl font-bold mb-4">Template</h2>
        <div className="space-y-2">
          <input type="text" value={templateName} onChange={(e) => setTemplateName(e.target.value)} className="w-full border p-2 rounded" />
          <button onClick={handleSaveTemplate} className="w-full bg-indigo-600 text-white p-2 rounded">Save</button>
          <button onClick={handleNewTemplate} className="w-full bg-gray-500 text-white p-2 rounded">New</button>
        </div>
        {message && <p className="text-sm text-center mt-2">{message}</p>}
        <hr className="my-4" />
        <h2 className="text-xl font-bold mb-4">My Templates</h2>
        <div className="space-y-1">
          {savedTemplates.map(t => <button key={t.id} onClick={() => handleLoadTemplate(t)} className="w-full text-left p-2 rounded hover:bg-gray-100">{t.name}</button>)}
        </div>
        <hr className="my-4" />
        <h2 className="text-xl font-bold mb-4">Add Elements</h2>
        <div className="space-y-2">
          <button onClick={addRectangle} className="w-full bg-blue-500 text-white p-2 rounded">Add Rectangle</button>
          <button onClick={addText} className="w-full bg-green-500 text-white p-2 rounded">Add Text</button>
        </div>
        <hr className="my-4" />
        <h2 className="text-xl font-bold mb-4">Properties</h2>
        {selectedElement ? (
          <div className="space-y-4">
            <div><label className="block text-sm">Fill</label><input type="text" name="fill" value={selectedElement.fill} onChange={handlePropertyChange} className="w-full p-2 border rounded" /></div>
            {selectedElement.type === 'text' && <div><label className="block text-sm">Text</label><input type="text" name="text" value={selectedElement.text} onChange={handlePropertyChange} className="w-full p-2 border rounded" /></div>}
          </div>
        ) : <p className="text-sm text-gray-500">Select an element.</p>}
      </aside>
      <main className="flex-1 p-6 flex items-center justify-center">
        <div ref={containerRef} className="w-full h-full bg-white rounded-lg shadow-lg overflow-hidden">
          <Stage width={stageSize.width} height={stageSize.height} onMouseDown={checkDeselect}>
            <Layer>
              {elements.map((el) => {
                const isSelected = el.id === selectedId;
                const shapeProps = { ...el, draggable: true, onClick: () => setSelectedId(el.id), stroke: isSelected ? 'red' : undefined, strokeWidth: isSelected ? 2 : 0 };
                if (el.type === 'rect') return <Rect key={el.id} {...shapeProps} />;
                if (el.type === 'text') return <Text key={el.id} {...shapeProps} />;
                return null;
              })}
            </Layer>
          </Stage>
        </div>
      </main>
    </div>
  );
};

export default EditorPage;
