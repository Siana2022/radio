'use client';

import React, { useState, useRef, useEffect, ChangeEvent } from 'react';
import { Stage, Layer, Rect, Text } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';

// Define types for our elements
interface BaseElement {
  id: string;
  x: number;
  y: number;
}

interface RectangleElement extends BaseElement {
  type: 'rect';
  width: number;
  height: number;
  fill: string;
}

interface TextElement extends BaseElement {
  type: 'text';
  text: string;
  fontSize: number;
  fill: string;
}

type CanvasElement = RectangleElement | TextElement;

const EditorPage = () => {
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const checkSize = () => {
      if (containerRef.current) {
        setStageSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };
    checkSize();
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, []);

  const addRectangle = () => {
    const newRect: RectangleElement = {
      id: crypto.randomUUID(), type: 'rect', x: 50, y: 50, width: 200, height: 100, fill: 'lightblue',
    };
    setElements([...elements, newRect]);
  };

  const addText = () => {
    const newText: TextElement = {
      id: crypto.randomUUID(), type: 'text', x: 60, y: 70, text: 'New Text', fontSize: 30, fill: 'black',
    };
    setElements([...elements, newText]);
  };

  const checkDeselect = (e: KonvaEventObject<MouseEvent>) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      setSelectedId(null);
    }
  };

  const handlePropertyChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (!selectedId) return;

    const updatedElements = elements.map((el) => {
      if (el.id === selectedId) {
        return { ...el, [name]: value };
      }
      return el;
    });
    setElements(updatedElements);
  };

  const selectedElement = elements.find((el) => el.id === selectedId);

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-80 bg-white p-4 shadow-md overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Add Elements</h2>
        <div className="space-y-2">
          <button onClick={addRectangle} className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">Add Rectangle</button>
          <button onClick={addText} className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600">Add Text</button>
        </div>
        <hr className="my-4" />
        <h2 className="text-xl font-bold mb-4">Properties</h2>
        {selectedElement ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Fill Color</label>
              <input type="text" name="fill" value={selectedElement.fill} onChange={handlePropertyChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
            </div>
            {selectedElement.type === 'text' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Text Content</label>
                <input type="text" name="text" value={selectedElement.text} onChange={handlePropertyChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500">Select an element to see its properties.</p>
        )}
      </aside>

      <main className="flex-1 p-6 flex items-center justify-center">
        <div ref={containerRef} className="w-full h-full bg-white rounded-lg shadow-lg overflow-hidden">
          <Stage
            width={stageSize.width}
            height={stageSize.height}
            className="bg-gray-50"
            onMouseDown={checkDeselect}
            onTouchStart={checkDeselect}
          >
            <Layer>
              {elements.map((element) => {
                const isSelected = element.id === selectedId;
                const shapeProps = {
                  ...element,
                  draggable: true,
                  onClick: () => setSelectedId(element.id),
                  onTap: () => setSelectedId(element.id),
                  stroke: isSelected ? 'red' : 'black',
                  strokeWidth: isSelected ? 2 : 0,
                };
                if (element.type === 'rect') {
                  return <Rect key={element.id} {...shapeProps} />;
                }
                if (element.type === 'text') {
                  return <Text key={element.id} {...shapeProps} />;
                }
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
