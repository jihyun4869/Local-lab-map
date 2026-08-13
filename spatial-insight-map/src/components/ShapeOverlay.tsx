import React, { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import { DrawnShape, ShapeToolType, DrawnPoint } from '../types';

interface ShapeOverlayProps {
  map: L.Map | null;
  activeTool: ShapeToolType;
  shapes: DrawnShape[];
  onAddShape: (shape: DrawnShape) => void;
  onUpdateShape: (shape: DrawnShape) => void;
  onDeleteShape: (id: string) => void;
  selectedShapeId: string | null;
  onSelectShape: (id: string | null) => void;
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  fontSize: number;
  layerVisible: boolean;
}

export const ShapeOverlay: React.FC<ShapeOverlayProps> = ({
  map,
  activeTool,
  shapes,
  onAddShape,
  onUpdateShape,
  onDeleteShape,
  selectedShapeId,
  onSelectShape,
  strokeColor,
  fillColor,
  strokeWidth,
  fontSize,
  layerVisible,
}) => {
  // Sync map zoom/pan ticks to trigger re-render of SVG coordinates
  const [, setMapTick] = useState<number>(0);

  // Drawing state
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [startPoint, setStartPoint] = useState<L.LatLng | null>(null);
  const [currentPoint, setCurrentPoint] = useState<L.LatLng | null>(null);
  const [freelinePoints, setFreelinePoints] = useState<L.LatLng[]>([]);

  // Dragging / Resizing existing shape state
  const [dragAction, setDragAction] = useState<{
    shapeId: string;
    type: 'move' | 'resize';
    handle?: string; // 'nw', 'ne', 'se', 'sw', 'p1', 'p2'
    startContainerPoint: L.Point;
    startLatLng: L.LatLng;
    initialPoints: DrawnPoint[];
  } | null>(null);

  // Text inline editing state
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [editingTextVal, setEditingTextVal] = useState<string>('');

  const containerRef = useRef<SVGSVGElement | null>(null);

  // Helper: compute effective fill color (semi-transparent tracks strokeColor)
  const getEffectiveFillColor = useCallback((shapeStroke: string, shapeFill: string) => {
    if (!shapeFill || shapeFill === 'none' || shapeFill === 'transparent') {
      return 'transparent';
    }
    if (shapeFill === 'semi' || shapeFill.endsWith('33') || shapeFill.startsWith('rgba') || shapeFill.length === 9) {
      if (shapeStroke.startsWith('#')) {
        // Hex color + '33' (20% opacity)
        return shapeStroke.length === 7 ? shapeStroke + '33' : shapeStroke;
      }
      return 'rgba(99, 102, 241, 0.25)';
    }
    return shapeFill;
  }, []);

  // Re-render SVG overlay on map move/zoom
  useEffect(() => {
    if (!map) return;
    const handleMapMove = () => {
      setMapTick((t) => t + 1);
    };
    map.on('move zoom zoomend moveend viewreset resize', handleMapMove);
    return () => {
      map.off('move zoom zoomend moveend viewreset resize', handleMapMove);
    };
  }, [map]);

  // Enable/Disable Leaflet dragging during shape drawing or shape moving/resizing
  useEffect(() => {
    if (!map) return;
    if (isDrawing || dragAction !== null) {
      map.dragging.disable();
    } else {
      map.dragging.enable();
    }
  }, [map, isDrawing, dragAction]);

  // Convert LatLng to container pixel point
  const latLngToPixel = useCallback(
    (lat: number, lng: number): { x: number; y: number } => {
      if (!map) return { x: 0, y: 0 };
      const point = map.latLngToContainerPoint([lat, lng]);
      return { x: point.x, y: point.y };
    },
    [map]
  );

  // Convert container pixel point to LatLng
  const pixelToLatLng = useCallback(
    (x: number, y: number): L.LatLng => {
      if (!map) return L.latLng(0, 0);
      return map.containerPointToLatLng([x, y]);
    },
    [map]
  );

  // Handle Mouse Down on SVG Container
  const handleContainerMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!map || !layerVisible) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const containerX = e.clientX - rect.left;
    const containerY = e.clientY - rect.top;
    const latLng = map.containerPointToLatLng([containerX, containerY]);

    if (activeTool === 'pointer') {
      // If clicking SVG background, deselect shape and close text editing
      if ((e.target as HTMLElement).tagName === 'svg') {
        onSelectShape(null);
        setEditingTextId(null);
      }
      return;
    }

    // Drawing mode
    onSelectShape(null);
    setEditingTextId(null);
    setIsDrawing(true);
    setStartPoint(latLng);
    setCurrentPoint(latLng);

    if (activeTool === 'freeline' || activeTool === 'freepoly') {
      setFreelinePoints([latLng]);
    }
  };

  // Handle Mouse Move over Window / Container
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!map || !layerVisible) return;
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const containerX = e.clientX - rect.left;
      const containerY = e.clientY - rect.top;
      const currentLatLng = map.containerPointToLatLng([containerX, containerY]);

      // 1. Actively Drawing
      if (isDrawing) {
        setCurrentPoint(currentLatLng);
        if (activeTool === 'freeline' || activeTool === 'freepoly') {
          setFreelinePoints((prev) => [...prev, currentLatLng]);
        }
        return;
      }

      // 2. Dragging or Resizing Shape
      if (dragAction) {
        const targetShape = shapes.find((s) => s.id === dragAction.shapeId);
        if (!targetShape) return;

        const currentContainerPoint = map.latLngToContainerPoint(currentLatLng);

        if (dragAction.type === 'move') {
          // Compute lat/lng delta from drag start
          const dLat = currentLatLng.lat - dragAction.startLatLng.lat;
          const dLng = currentLatLng.lng - dragAction.startLatLng.lng;

          const updatedPoints = dragAction.initialPoints.map((p) => ({
            lat: p.lat + dLat,
            lng: p.lng + dLng,
          }));

          onUpdateShape({ ...targetShape, points: updatedPoints });
        } else if (dragAction.type === 'resize' && dragAction.handle) {
          // Handle line / arrow endpoints ('p1', 'p2')
          if (dragAction.handle === 'p1') {
            const updatedPoints = [...dragAction.initialPoints];
            updatedPoints[0] = { lat: currentLatLng.lat, lng: currentLatLng.lng };
            onUpdateShape({ ...targetShape, points: updatedPoints });
          } else if (dragAction.handle === 'p2') {
            const updatedPoints = [...dragAction.initialPoints];
            if (updatedPoints.length < 2) {
              updatedPoints.push({ lat: currentLatLng.lat, lng: currentLatLng.lng });
            } else {
              updatedPoints[1] = { lat: currentLatLng.lat, lng: currentLatLng.lng };
            }
            onUpdateShape({ ...targetShape, points: updatedPoints });
          } else {
            // Bounding box resize ('nw', 'ne', 'se', 'sw')
            const lats = dragAction.initialPoints.map((p) => p.lat);
            const lngs = dragAction.initialPoints.map((p) => p.lng);
            let maxLat = Math.max(...lats);
            let minLat = Math.min(...lats);
            let minLng = Math.min(...lngs);
            let maxLng = Math.max(...lngs);

            if (dragAction.handle === 'nw') {
              maxLat = currentLatLng.lat;
              minLng = currentLatLng.lng;
            } else if (dragAction.handle === 'ne') {
              maxLat = currentLatLng.lat;
              maxLng = currentLatLng.lng;
            } else if (dragAction.handle === 'se') {
              minLat = currentLatLng.lat;
              maxLng = currentLatLng.lng;
            } else if (dragAction.handle === 'sw') {
              minLat = currentLatLng.lat;
              minLng = currentLatLng.lng;
            }

            onUpdateShape({
              ...targetShape,
              points: [
                { lat: maxLat, lng: minLng },
                { lat: minLat, lng: maxLng },
              ],
            });
          }
        }
      }
    },
    [map, layerVisible, isDrawing, activeTool, dragAction, shapes, onUpdateShape]
  );

  // Handle Mouse Up
  const handleMouseUp = useCallback(() => {
    if (dragAction) {
      setDragAction(null);
    }

    if (!map || !isDrawing || !startPoint || !layerVisible) {
      setIsDrawing(false);
      return;
    }

    const newId = `shape_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    let endPoint = currentPoint || startPoint;

    // Minimum line length check for Line and Arrow
    if (activeTool === 'line' || activeTool === 'arrow') {
      const p1 = latLngToPixel(startPoint.lat, startPoint.lng);
      const p2 = latLngToPixel(endPoint.lat, endPoint.lng);
      const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);

      // If user clicked or barely dragged (< 20px), make minimum 35px line
      if (dist < 20) {
        const defaultOffsetPt = pixelToLatLng(p1.x + 40, p1.y);
        endPoint = defaultOffsetPt;
      }
    }

    if (activeTool === 'freeline') {
      if (freelinePoints.length > 1) {
        const shape: DrawnShape = {
          id: newId,
          type: 'freeline',
          points: freelinePoints.map((p) => ({ lat: p.lat, lng: p.lng })),
          strokeColor,
          fillColor: 'none',
          strokeWidth,
        };
        onAddShape(shape);
      }
    } else if (activeTool === 'freepoly') {
      if (freelinePoints.length > 2) {
        const shape: DrawnShape = {
          id: newId,
          type: 'freepoly',
          points: freelinePoints.map((p) => ({ lat: p.lat, lng: p.lng })),
          strokeColor,
          fillColor: fillColor === 'none' ? strokeColor + '33' : fillColor,
          strokeWidth,
        };
        onAddShape(shape);
      }
    } else if (activeTool === 'text') {
      // Create text box instantly
      const p1 = latLngToPixel(startPoint.lat, startPoint.lng);
      const p2 = latLngToPixel(endPoint.lat, endPoint.lng);
      const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);

      if (dist < 20) {
        endPoint = pixelToLatLng(p1.x + 120, p1.y + 40);
      }

      const shape: DrawnShape = {
        id: newId,
        type: 'text',
        points: [
          { lat: startPoint.lat, lng: startPoint.lng },
          { lat: endPoint.lat, lng: endPoint.lng },
        ],
        text: '텍스트 입력',
        strokeColor,
        fillColor: fillColor === 'none' ? '#ffffff' : fillColor,
        strokeWidth,
        fontSize,
      };
      onAddShape(shape);
      onSelectShape(newId);
      setEditingTextId(newId);
      setEditingTextVal('텍스트 입력');
    } else {
      // Rectangle, Circle, Triangle, BlockArrow
      const shape: DrawnShape = {
        id: newId,
        type: activeTool as DrawnShape['type'],
        points: [
          { lat: startPoint.lat, lng: startPoint.lng },
          { lat: endPoint.lat, lng: endPoint.lng },
        ],
        strokeColor,
        fillColor,
        strokeWidth,
        fontSize,
      };
      onAddShape(shape);
      onSelectShape(newId);
    }

    setIsDrawing(false);
    setStartPoint(null);
    setCurrentPoint(null);
    setFreelinePoints([]);
  }, [
    map,
    isDrawing,
    startPoint,
    currentPoint,
    layerVisible,
    activeTool,
    freelinePoints,
    strokeColor,
    fillColor,
    strokeWidth,
    fontSize,
    dragAction,
    latLngToPixel,
    pixelToLatLng,
    onAddShape,
    onSelectShape,
  ]);

  // Global window mouse events for dragging shapes smoothly
  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // Start dragging a shape body or handle
  const startDragShape = (
    e: React.MouseEvent,
    shape: DrawnShape,
    type: 'move' | 'resize',
    handle?: string
  ) => {
    e.stopPropagation();
    if (activeTool !== 'pointer' || !map) return;

    onSelectShape(shape.id);

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const containerX = e.clientX - rect.left;
    const containerY = e.clientY - rect.top;
    const startLatLng = map.containerPointToLatLng([containerX, containerY]);

    setDragAction({
      shapeId: shape.id,
      type,
      handle,
      startContainerPoint: L.point(containerX, containerY),
      startLatLng,
      initialPoints: shape.points.map((p) => ({ ...p })),
    });
  };

  if (!layerVisible) return null;

  // Render SVG Element for a single shape
  const renderShape = (shape: DrawnShape) => {
    const isSelected = shape.id === selectedShapeId;
    const effectiveFill = getEffectiveFillColor(shape.strokeColor, shape.fillColor);

    // 1. Freehand Line
    if (shape.type === 'freeline') {
      if (!shape.points || shape.points.length < 2) return null;
      const pathData = shape.points
        .map((p: any, idx) => {
          const lat = typeof p.lat === 'number' ? p.lat : p[0];
          const lng = typeof p.lng === 'number' ? p.lng : p[1];
          const pt = latLngToPixel(lat, lng);
          return `${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`;
        })
        .join(' ');

      return (
        <g key={shape.id} className="pointer-events-auto">
          <path
            d={pathData}
            stroke={shape.strokeColor}
            strokeWidth={shape.strokeWidth + (isSelected ? 2 : 0)}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`cursor-pointer transition-all ${
              isSelected ? 'stroke-indigo-500 filter drop-shadow-md' : ''
            }`}
            onClick={(e) => {
              e.stopPropagation();
              onSelectShape(shape.id);
            }}
            onMouseDown={(e) => startDragShape(e, shape, 'move')}
          />
        </g>
      );
    }

    // 2. Freehand Polygon (자유 도형)
    if (shape.type === 'freepoly') {
      if (!shape.points || shape.points.length < 2) return null;
      const pathData =
        shape.points
          .map((p: any, idx) => {
            const lat = typeof p.lat === 'number' ? p.lat : p[0];
            const lng = typeof p.lng === 'number' ? p.lng : p[1];
            const pt = latLngToPixel(lat, lng);
            return `${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`;
          })
          .join(' ') + ' Z';

      return (
        <g key={shape.id} className="pointer-events-auto">
          <path
            d={pathData}
            stroke={shape.strokeColor}
            strokeWidth={shape.strokeWidth}
            fill={effectiveFill}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`cursor-pointer transition-all ${
              isSelected ? 'stroke-indigo-600 stroke-dasharray-4' : ''
            }`}
            onClick={(e) => {
              e.stopPropagation();
              onSelectShape(shape.id);
            }}
            onMouseDown={(e) => startDragShape(e, shape, 'move')}
          />
        </g>
      );
    }

    if (!shape.points || shape.points.length === 0) return null;

    const getPt = (p: any) => {
      if (!p) return { lat: 0, lng: 0 };
      const lat = typeof p.lat === 'number' ? p.lat : p[0];
      const lng = typeof p.lng === 'number' ? p.lng : p[1];
      return { lat, lng };
    };

    const pt1 = getPt(shape.points[0]);
    const pt2 = getPt(shape.points[1] || shape.points[0]);

    const p1 = latLngToPixel(pt1.lat, pt1.lng);
    const p2 = latLngToPixel(pt2.lat, pt2.lng);

    const minX = Math.min(p1.x, p2.x);
    const minY = Math.min(p1.y, p2.y);
    const maxX = Math.max(p1.x, p2.x);
    const maxY = Math.max(p1.y, p2.y);
    const width = Math.max(Math.abs(p2.x - p1.x), 8);
    const height = Math.max(Math.abs(p2.y - p1.y), 8);

    const handleShapeClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onSelectShape(shape.id);
    };

    const handleShapeDoubleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (shape.type === 'text') {
        setEditingTextId(shape.id);
        setEditingTextVal(shape.text || '텍스트 입력');
      }
    };

    return (
      <g key={shape.id} className="pointer-events-auto">
        {/* Shape Graphic Elements */}
        {shape.type === 'line' && (
          <line
            x1={p1.x}
            y1={p1.y}
            x2={p2.x}
            y2={p2.y}
            stroke={shape.strokeColor}
            strokeWidth={shape.strokeWidth + (isSelected ? 1 : 0)}
            strokeLinecap="round"
            className="cursor-pointer"
            onClick={handleShapeClick}
            onMouseDown={(e) => startDragShape(e, shape, 'move')}
          />
        )}

        {shape.type === 'arrow' && (
          <line
            x1={p1.x}
            y1={p1.y}
            x2={p2.x}
            y2={p2.y}
            stroke={shape.strokeColor}
            strokeWidth={shape.strokeWidth + (isSelected ? 1 : 0)}
            markerEnd="url(#arrowhead)"
            strokeLinecap="round"
            className="cursor-pointer"
            onClick={handleShapeClick}
            onMouseDown={(e) => startDragShape(e, shape, 'move')}
          />
        )}

        {shape.type === 'rectangle' && (
          <rect
            x={minX}
            y={minY}
            width={width}
            height={height}
            stroke={shape.strokeColor}
            strokeWidth={shape.strokeWidth}
            fill={effectiveFill}
            rx="4"
            className="cursor-pointer"
            onClick={handleShapeClick}
            onMouseDown={(e) => startDragShape(e, shape, 'move')}
          />
        )}

        {shape.type === 'circle' && (
          <ellipse
            cx={(p1.x + p2.x) / 2}
            cy={(p1.y + p2.y) / 2}
            rx={width / 2}
            ry={height / 2}
            stroke={shape.strokeColor}
            strokeWidth={shape.strokeWidth}
            fill={effectiveFill}
            className="cursor-pointer"
            onClick={handleShapeClick}
            onMouseDown={(e) => startDragShape(e, shape, 'move')}
          />
        )}

        {shape.type === 'triangle' && (
          <polygon
            points={`${(p1.x + p2.x) / 2},${minY} ${minX},${minY + height} ${minX + width},${minY + height}`}
            stroke={shape.strokeColor}
            strokeWidth={shape.strokeWidth}
            fill={effectiveFill}
            className="cursor-pointer"
            onClick={handleShapeClick}
            onMouseDown={(e) => startDragShape(e, shape, 'move')}
          />
        )}

        {shape.type === 'blockArrow' && (
          <polygon
            points={`
              ${minX},${minY + height * 0.25} 
              ${minX + width * 0.6},${minY + height * 0.25} 
              ${minX + width * 0.6},${minY} 
              ${minX + width},${minY + height * 0.5} 
              ${minX + width * 0.6},${minY + height} 
              ${minX + width * 0.6},${minY + height * 0.75} 
              ${minX},${minY + height * 0.75}
            `}
            stroke={shape.strokeColor}
            strokeWidth={shape.strokeWidth}
            fill={effectiveFill}
            className="cursor-pointer"
            onClick={handleShapeClick}
            onMouseDown={(e) => startDragShape(e, shape, 'move')}
          />
        )}

        {shape.type === 'text' && (
          <g
            onClick={handleShapeClick}
            onDoubleClick={handleShapeDoubleClick}
            onMouseDown={(e) => startDragShape(e, shape, 'move')}
            className="cursor-pointer select-none"
          >
            <rect
              x={minX}
              y={minY}
              width={Math.max(width, (shape.text || '').length * (shape.fontSize || 14) * 0.8 + 24)}
              height={Math.max(height, (shape.fontSize || 14) + 20)}
              stroke={shape.strokeColor}
              strokeWidth={shape.strokeWidth}
              fill={effectiveFill === 'transparent' ? '#ffffff' : effectiveFill}
              rx="6"
              className="shadow-sm"
            />
            <text
              x={minX + 10}
              y={minY + (shape.fontSize || 14) + 6}
              fill={shape.strokeColor}
              fontSize={shape.fontSize || 14}
              fontWeight="600"
              fontFamily="sans-serif"
            >
              {shape.text || '텍스트 입력'}
            </text>
          </g>
        )}

        {/* Selected Highlight & Resize Handles */}
        {isSelected && activeTool === 'pointer' && (
          <g className="pointer-events-auto">
            {/* Bounding Box Outline */}
            {shape.type !== 'line' && shape.type !== 'arrow' && (
              <rect
                x={minX - 3}
                y={minY - 3}
                width={width + 6}
                height={height + 6}
                fill="none"
                stroke="#6366f1"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                className="pointer-events-none"
              />
            )}

            {/* Line / Arrow Endpoint Handles */}
            {(shape.type === 'line' || shape.type === 'arrow') && (
              <>
                <circle
                  cx={p1.x}
                  cy={p1.y}
                  r={6}
                  fill="#ffffff"
                  stroke="#6366f1"
                  strokeWidth="2"
                  className="cursor-nwse-resize hover:scale-125 origin-center"
                  onMouseDown={(e) => startDragShape(e, shape, 'resize', 'p1')}
                />
                <circle
                  cx={p2.x}
                  cy={p2.y}
                  r={6}
                  fill="#ffffff"
                  stroke="#6366f1"
                  strokeWidth="2"
                  className="cursor-nwse-resize hover:scale-125 origin-center"
                  onMouseDown={(e) => startDragShape(e, shape, 'resize', 'p2')}
                />
              </>
            )}

            {/* Corner Resize Handles for Box Shapes */}
            {shape.type !== 'line' && shape.type !== 'arrow' && (
              <>
                <rect
                  x={minX - 6}
                  y={minY - 6}
                  width={10}
                  height={10}
                  fill="#ffffff"
                  stroke="#6366f1"
                  strokeWidth="2"
                  rx="2"
                  className="cursor-nwse-resize hover:scale-125 origin-center"
                  onMouseDown={(e) => startDragShape(e, shape, 'resize', 'nw')}
                />
                <rect
                  x={maxX - 4}
                  y={minY - 6}
                  width={10}
                  height={10}
                  fill="#ffffff"
                  stroke="#6366f1"
                  strokeWidth="2"
                  rx="2"
                  className="cursor-nesw-resize hover:scale-125 origin-center"
                  onMouseDown={(e) => startDragShape(e, shape, 'resize', 'ne')}
                />
                <rect
                  x={maxX - 4}
                  y={maxY - 4}
                  width={10}
                  height={10}
                  fill="#ffffff"
                  stroke="#6366f1"
                  strokeWidth="2"
                  rx="2"
                  className="cursor-nwse-resize hover:scale-125 origin-center"
                  onMouseDown={(e) => startDragShape(e, shape, 'resize', 'se')}
                />
                <rect
                  x={minX - 6}
                  y={maxY - 4}
                  width={10}
                  height={10}
                  fill="#ffffff"
                  stroke="#6366f1"
                  strokeWidth="2"
                  rx="2"
                  className="cursor-nesw-resize hover:scale-125 origin-center"
                  onMouseDown={(e) => startDragShape(e, shape, 'resize', 'sw')}
                />
              </>
            )}
          </g>
        )}
      </g>
    );
  };

  // Render preview while user is actively dragging to draw a new shape
  const renderDrawingPreview = () => {
    if (!isDrawing || !startPoint || !currentPoint) return null;

    const p1 = latLngToPixel(startPoint.lat, startPoint.lng);
    const p2 = latLngToPixel(currentPoint.lat, currentPoint.lng);

    const minX = Math.min(p1.x, p2.x);
    const minY = Math.min(p1.y, p2.y);
    const width = Math.abs(p2.x - p1.x);
    const height = Math.abs(p2.y - p1.y);
    const previewFill = getEffectiveFillColor(strokeColor, fillColor);

    if (activeTool === 'freeline') {
      if (freelinePoints.length < 2) return null;
      const pathData = freelinePoints
        .map((p, idx) => {
          const pt = latLngToPixel(p.lat, p.lng);
          return `${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`;
        })
        .join(' ');

      return (
        <path
          d={pathData}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.8}
        />
      );
    }

    if (activeTool === 'freepoly') {
      if (freelinePoints.length < 2) return null;
      const pathData =
        freelinePoints
          .map((p, idx) => {
            const pt = latLngToPixel(p.lat, p.lng);
            return `${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`;
          })
          .join(' ') + ' Z';

      return (
        <path
          d={pathData}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill={previewFill}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.85}
        />
      );
    }

    switch (activeTool) {
      case 'line':
        return (
          <line
            x1={p1.x}
            y1={p1.y}
            x2={p2.x}
            y2={p2.y}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray="4 4"
          />
        );

      case 'arrow':
        return (
          <line
            x1={p1.x}
            y1={p1.y}
            x2={p2.x}
            y2={p2.y}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            markerEnd="url(#arrowhead)"
            strokeDasharray="4 4"
          />
        );

      case 'rectangle':
      case 'text':
        return (
          <rect
            x={minX}
            y={minY}
            width={width}
            height={height}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill={previewFill === 'transparent' ? 'rgba(99,102,241,0.1)' : previewFill}
            strokeDasharray="4 4"
            rx="4"
          />
        );

      case 'circle': {
        return (
          <ellipse
            cx={(p1.x + p2.x) / 2}
            cy={(p1.y + p2.y) / 2}
            rx={width / 2}
            ry={height / 2}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill={previewFill === 'transparent' ? 'rgba(99,102,241,0.1)' : previewFill}
            strokeDasharray="4 4"
          />
        );
      }

      case 'triangle': {
        const topX = (p1.x + p2.x) / 2;
        return (
          <polygon
            points={`${topX},${minY} ${minX},${minY + height} ${minX + width},${minY + height}`}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill={previewFill === 'transparent' ? 'rgba(99,102,241,0.1)' : previewFill}
            strokeDasharray="4 4"
          />
        );
      }

      case 'blockArrow': {
        return (
          <polygon
            points={`
              ${minX},${minY + height * 0.25} 
              ${minX + width * 0.6},${minY + height * 0.25} 
              ${minX + width * 0.6},${minY} 
              ${minX + width},${minY + height * 0.5} 
              ${minX + width * 0.6},${minY + height} 
              ${minX + width * 0.6},${minY + height * 0.75} 
              ${minX},${minY + height * 0.75}
            `}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill={previewFill === 'transparent' ? 'rgba(99,102,241,0.1)' : previewFill}
            strokeDasharray="4 4"
          />
        );
      }

      default:
        return null;
    }
  };

  // Inline Text Editor position helper
  const editingShape = shapes.find((s) => s.id === editingTextId);
  const editingPixel = editingShape
    ? latLngToPixel(
        editingShape.points[0]?.lat || 0,
        editingShape.points[0]?.lng || 0
      )
    : null;

  return (
    <>
      <svg
        ref={containerRef}
        onMouseDown={handleContainerMouseDown}
        className={`absolute inset-0 w-full h-full z-10 ${
          activeTool === 'pointer' ? 'pointer-events-none' : 'pointer-events-auto cursor-crosshair'
        }`}
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill={strokeColor} />
          </marker>
        </defs>

        {/* Render all existing shapes */}
        {shapes.map(renderShape)}

        {/* Render current drawing preview */}
        {renderDrawingPreview()}
      </svg>

      {/* Floating Inline Text Editor Modal when editing a text shape */}
      {editingShape && editingPixel && (
        <div
          className="absolute z-30 bg-white/95 backdrop-blur-md p-2 rounded-xl shadow-xl border border-indigo-200 flex flex-col space-y-1.5 w-64"
          style={{
            left: Math.max(10, Math.min(editingPixel.x, window.innerWidth - 270)),
            top: Math.max(10, Math.min(editingPixel.y, window.innerHeight - 120)),
          }}
        >
          <div className="text-[10.5px] font-bold text-indigo-700 flex items-center justify-between">
            <span>텍스트 내용 수정</span>
            <button
              onClick={() => setEditingTextId(null)}
              className="text-slate-400 hover:text-slate-700 font-bold"
            >
              ✕
            </button>
          </div>
          <textarea
            value={editingTextVal}
            onChange={(e) => {
              setEditingTextVal(e.target.value);
              onUpdateShape({ ...editingShape, text: e.target.value });
            }}
            placeholder="내용을 입력하세요..."
            rows={2}
            autoFocus
            className="w-full text-xs p-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium resize-none bg-white text-slate-800"
          />
          <button
            onClick={() => setEditingTextId(null)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-1 rounded-lg transition"
          >
            완료
          </button>
        </div>
      )}
    </>
  );
};
