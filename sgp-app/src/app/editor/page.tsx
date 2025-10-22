'use client';

import React, { useState, useRef, useEffect, ChangeEvent, useCallback } from 'react';
import { Stage, Layer, Rect, Text, Image as KonvaImage } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';
import Cropper from 'react-easy-crop';
import { Point, Area } from 'react-easy-crop/types';
import useImage from 'use-image';
import getCroppedImg from '@/lib/cropImage';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';

// Define types
interface Animation {
  type: 'none' | 'fadeIn' | 'slideInLeft';
  duration: number;
}
interface BaseElement {
  id: string;
  x: number;
  y: number;
  animation?: Animation;
}
interface RectangleElement extends BaseElement { type: 'rect'; width: number; height: number; fill: string; }
interface TextElement extends BaseElement { type: 'text'; text: string; fontSize: number; fill: string; }
interface ImageElement extends BaseElement { type: 'image'; src: string; width: number; height: number; }
type CanvasElement = RectangleElement | TextElement | ImageElement;
interface Template { id: string; name: string; data: { elements: CanvasElement[] }; }

const ImageComponent = ({ element, onSelect, isSelected }: { element: ImageElement, onSelect: () => void, isSelected: boolean }) => {
  const [image] = useImage(element.src);
  return <KonvaImage image={image} id={element.id} x={element.x} y={element.y} width={element.width} height={element.height} draggable onClick={onSelect} onTap={onSelect} stroke={isSelected ? 'red' : undefined} strokeWidth={isSelected ? 2 : 0} />;
};

const EditorPage = () => {
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [templateName, setTemplateName] = useState('My New Template');
  const [currentTemplateId, setCurrentTemplateId] = useState<string | null>(null);
  const [savedTemplates, setSavedTemplates] = useState<Template[]>([]);
  const [message, setMessage] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const router = useRouter();
  const supabase = createClient();

  const fetchTemplates = useCallback(async (userId: string) => {
    const { data, error } = await supabase.from('templates').select('*').eq('user_id', userId);
    if (error) setMessage(`Error fetching templates: ${error.message}`);
    else if (data) setSavedTemplates(data);
  }, [supabase]);

  useEffect(() => {
    const initialize = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) router.push('/login');
      else {
        setUser(session.user);
        fetchTemplates(session.user.id);
      }
    };
    initialize();
    const checkSize = () => {
      if (containerRef.current) setStageSize({ width: containerRef.current.offsetWidth, height: containerRef.current.offsetHeight });
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
    if (error) setMessage(`Error saving: ${error.message}`);
    else {
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

  const addRectangle = () => setElements(prev => [...prev, { id: crypto.randomUUID(), type: 'rect', x: 50, y: 50, width: 200, height: 100, fill: 'lightblue', animation: { type: 'none', duration: 1 } }]);
  const addText = () => setElements(prev => [...prev, { id: crypto.randomUUID(), type: 'text', x: 60, y: 70, text: 'New Text', fontSize: 30, fill: 'black', animation: { type: 'none', duration: 1 } }]);
  const checkDeselect = (e: KonvaEventObject<MouseEvent>) => { if (e.target === e.target.getStage()) setSelectedId(null); };

  const handlePropertyChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!selectedId) return;
    const { name, value } = e.target;
    setElements(elements.map(el => el.id === selectedId ? { ...el, [name]: value } : el));
  };

  const handleAnimationChange = (e: ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    if (!selectedId) return;
    const { name, value } = e.target;
    setElements(elements.map(el => {
      if (el.id === selectedId) {
        const newAnimation = { ...el.animation, [name]: name === 'duration' ? parseFloat(value) : value };
        return { ...el, animation: newAnimation as Animation };
      }
      return el;
    }));
  };

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const showCroppedImage = useCallback(async () => {
    if (!image || !croppedAreaPixels) return;
    try {
      const croppedImage = await getCroppedImg(image, croppedAreaPixels);
      if (croppedImage) {
        const newImageElement: ImageElement = {
          id: crypto.randomUUID(), type: 'image', src: croppedImage, x: 50, y: 50,
          width: croppedAreaPixels.width, height: croppedAreaPixels.height,
          animation: { type: 'none', duration: 1 },
        };
        setElements(prev => [...prev, newImageElement]);
        setImage(null);
      }
    } catch (e) { console.error(e); }
  }, [image, croppedAreaPixels]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => setImage(reader.result as string));
      reader.readAsDataURL(e.target.files[0]);
    }
  };
  const onAddImageClick = () => fileInputRef.current?.click();

  const selectedElement = elements.find((el) => el.id === selectedId);
  if (!user) { return <div>Loading...</div>; }

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-80 bg-white p-4 shadow-md overflow-y-auto">
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
          <button onClick={onAddImageClick} className="w-full bg-orange-500 text-white p-2 rounded">Add Image</button>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept="image/*" />
        </div>
        <hr className="my-4" />
        <h2 className="text-xl font-bold mb-4">Properties</h2>
        {selectedElement ? (
          <div className="space-y-4">
            {selectedElement.type !== 'image' && <div><label className="block text-sm">Fill</label><input type="text" name="fill" value={selectedElement.fill} onChange={handlePropertyChange} className="w-full p-2 border rounded" /></div>}
            {selectedElement.type === 'text' && <div><label className="block text-sm">Text</label><input type="text" name="text" value={selectedElement.text} onChange={handlePropertyChange} className="w-full p-2 border rounded" /></div>}
            <hr />
            <h3 className="text-lg font-semibold">Animation</h3>
            <div>
              <label className="block text-sm">Type</label>
              <select name="type" value={selectedElement.animation?.type || 'none'} onChange={handleAnimationChange} className="w-full p-2 border rounded mt-1">
                <option value="none">None</option>
                <option value="fadeIn">Fade In</option>
                <option value="slideInLeft">Slide In From Left</option>
              </select>
            </div>
            <div>
              <label className="block text-sm">Duration (s)</label>
              <input type="number" name="duration" value={selectedElement.animation?.duration || 1} onChange={handleAnimationChange} className="w-full p-2 border rounded mt-1" step="0.1" />
            </div>
          </div>
        ) : <p className="text-sm text-gray-500">Select an element.</p>}
      </aside>
      <main className="flex-1 p-6">
        <div ref={containerRef} className="w-full h-full bg-white rounded-lg shadow-lg">
          <Stage width={stageSize.width} height={stageSize.height} onMouseDown={checkDeselect}>
            <Layer>
              {elements.map((el) => {
                const isSelected = el.id === selectedId;
                if (el.type === 'rect') return <Rect key={el.id} {...el} draggable onClick={() => setSelectedId(el.id)} stroke={isSelected ? 'red' : undefined} strokeWidth={isSelected ? 2 : 0} />;
                if (el.type === 'text') return <Text key={el.id} {...el} draggable onClick={() => setSelectedId(el.id)} stroke={isSelected ? 'red' : undefined} strokeWidth={isSelected ? 2 : 0} />;
                if (el.type === 'image') return <ImageComponent key={el.id} element={el} isSelected={isSelected} onSelect={() => setSelectedId(el.id)} />;
                return null;
              })}
            </Layer>
          </Stage>
        </div>
      </main>
      {image && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-lg w-3/4 h-3/4 flex flex-col">
            <h2 className="text-xl font-bold mb-4">Crop Image</h2>
            <div className="flex-grow relative">
              <Cropper image={image} crop={crop} zoom={zoom} aspect={4 / 3} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete} />
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <button onClick={() => setImage(null)} className="px-4 py-2 bg-gray-500 text-white rounded">Cancel</button>
              <button onClick={showCroppedImage} className="px-4 py-2 bg-blue-500 text-white rounded">Crop & Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditorPage;
