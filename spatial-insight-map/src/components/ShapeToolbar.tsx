import React, { useState, useEffect } from 'react';
import {
  MousePointer,
  Minus,
  MoveUpRight,
  Square,
  Circle as CircleIcon,
  Triangle as TriangleIcon,
  ArrowRight,
  Type,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  Shapes,
  X,
  Plus,
  Pentagon
} from 'lucide-react';
import { ShapeToolType } from '../types';

export interface ShapeToolbarProps {
  activeTool: ShapeToolType;
  onSelectTool: (tool: ShapeToolType) => void;
  strokeColor: string;
  onChangeStrokeColor: (color: string) => void;
  fillColor: string;
  onChangeFillColor: (color: string) => void;
  strokeWidth: number;
  onChangeStrokeWidth: (width: number) => void;
  fontSize: number;
  onChangeFontSize: (size: number) => void;
  selectedShapeId: string | null;
  onDeleteSelectedShape: () => void;
  onClearAllShapes: () => void;
  shapesCount: number;
  isVisible?: boolean;
  onToggleVisibility?: () => void;
  isEmbedded?: boolean; // True if rendered inside sidebar panel
}

const PRESET_COLORS = [
  { name: '검정', value: '#1e293b' },
  { name: '빨강', value: '#ef4444' },
  { name: '주황', value: '#f59e0b' },
  { name: '초록', value: '#10b981' },
  { name: '파랑', value: '#3b82f6' },
  { name: '보라', value: '#8b5cf6' },
  { name: '흰색', value: '#ffffff' },
];

export const ShapeToolbarControls: React.FC<ShapeToolbarProps> = ({
  activeTool,
  onSelectTool,
  strokeColor,
  onChangeStrokeColor,
  fillColor,
  onChangeFillColor,
  strokeWidth,
  onChangeStrokeWidth,
  fontSize,
  onChangeFontSize,
  selectedShapeId,
  onDeleteSelectedShape,
  onClearAllShapes,
  shapesCount,
  isEmbedded = false,
}) => {
  const [savedCustomColors, setSavedCustomColors] = useState<string[]>(() => {
    try {
      const cached = localStorage.getItem('custom_shape_colors');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [customInputColor, setCustomInputColor] = useState<string>('#ec4899');

  const handleSaveCustomColor = (color: string) => {
    if (!color) return;
    if (savedCustomColors.includes(color)) return;
    const updated = [color, ...savedCustomColors].slice(0, 10);
    setSavedCustomColors(updated);
    try {
      localStorage.setItem('custom_shape_colors', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemoveCustomColor = (colorToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedCustomColors.filter((c) => c !== colorToRemove);
    setSavedCustomColors(updated);
    try {
      localStorage.setItem('custom_shape_colors', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
  };

  const handleStrokeColorChange = (color: string) => {
    onChangeStrokeColor(color);
    if (fillColor !== 'none') {
      onChangeFillColor(color + '33');
    }
  };

  const isSemiTransparent = fillColor !== 'none';

  return (
    <div className={`p-2.5 space-y-2.5 font-sans ${isEmbedded ? 'bg-slate-50/90 rounded-xl border border-slate-200' : ''}`}>
      {/* 1. Shape Tool Palette */}
      <div>
        <div className="text-[10px] font-bold text-slate-500 mb-1 flex items-center justify-between">
          <span>도형 및 그리기 도구</span>
          {activeTool === 'pointer' && (
            <span className="text-indigo-600 font-semibold text-[9.5px]">
              Tip: '선택' 모드에서는 지도 이동 및 도형 크기 조절이 가능합니다
            </span>
          )}
        </div>
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-1 bg-white p-1.5 rounded-xl border border-slate-200/80 shadow-xs">
          {/* Pointer / Select */}
          <button
            onClick={() => onSelectTool('pointer')}
            className={`p-1.5 rounded-lg flex flex-col items-center justify-center transition cursor-pointer ${
              activeTool === 'pointer'
                ? 'bg-indigo-600 text-white shadow-xs font-bold'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
            title="선택 / 편집 (클릭 후 이동/크기 조절/삭제)"
          >
            <MousePointer className="w-4 h-4" />
            <span className="text-[9px] mt-0.5 break-keep">선택</span>
          </button>

          {/* Line */}
          <button
            onClick={() => onSelectTool('line')}
            className={`p-1.5 rounded-lg flex flex-col items-center justify-center transition cursor-pointer ${
              activeTool === 'line'
                ? 'bg-indigo-600 text-white shadow-xs font-bold'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
            title="직선 그리기"
          >
            <Minus className="w-4 h-4" />
            <span className="text-[9px] mt-0.5 break-keep">직선</span>
          </button>

          {/* Arrow Line */}
          <button
            onClick={() => onSelectTool('arrow')}
            className={`p-1.5 rounded-lg flex flex-col items-center justify-center transition cursor-pointer ${
              activeTool === 'arrow'
                ? 'bg-indigo-600 text-white shadow-xs font-bold'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
            title="화살표 선 그리기"
          >
            <MoveUpRight className="w-4 h-4" />
            <span className="text-[9px] mt-0.5 break-keep">화살표</span>
          </button>

          {/* Rectangle */}
          <button
            onClick={() => onSelectTool('rectangle')}
            className={`p-1.5 rounded-lg flex flex-col items-center justify-center transition cursor-pointer ${
              activeTool === 'rectangle'
                ? 'bg-indigo-600 text-white shadow-xs font-bold'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
            title="직사각형 그리기"
          >
            <Square className="w-4 h-4" />
            <span className="text-[9px] mt-0.5 break-keep">사각형</span>
          </button>

          {/* Circle / Ellipse */}
          <button
            onClick={() => onSelectTool('circle')}
            className={`p-1.5 rounded-lg flex flex-col items-center justify-center transition cursor-pointer ${
              activeTool === 'circle'
                ? 'bg-indigo-600 text-white shadow-xs font-bold'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
            title="원 / 타원 그리기"
          >
            <CircleIcon className="w-4 h-4" />
            <span className="text-[9px] mt-0.5 break-keep">원</span>
          </button>

          {/* Triangle */}
          <button
            onClick={() => onSelectTool('triangle')}
            className={`p-1.5 rounded-lg flex flex-col items-center justify-center transition cursor-pointer ${
              activeTool === 'triangle'
                ? 'bg-indigo-600 text-white shadow-xs font-bold'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
            title="삼각형 그리기"
          >
            <TriangleIcon className="w-4 h-4" />
            <span className="text-[9px] mt-0.5 break-keep">삼각형</span>
          </button>

          {/* Block Arrow */}
          <button
            onClick={() => onSelectTool('blockArrow')}
            className={`p-1.5 rounded-lg flex flex-col items-center justify-center transition cursor-pointer ${
              activeTool === 'blockArrow'
                ? 'bg-indigo-600 text-white shadow-xs font-bold'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
            title="블록 화살표 그리기"
          >
            <ArrowRight className="w-4 h-4" />
            <span className="text-[9px] mt-0.5 break-keep">큰화살표</span>
          </button>

          {/* Text Box */}
          <button
            onClick={() => onSelectTool('text')}
            className={`p-1.5 rounded-lg flex flex-col items-center justify-center transition cursor-pointer ${
              activeTool === 'text'
                ? 'bg-indigo-600 text-white shadow-xs font-bold'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
            title="텍스트 상자 추가 (지도 클릭 시 생성)"
          >
            <Type className="w-4 h-4" />
            <span className="text-[9px] mt-0.5 break-keep">텍스트</span>
          </button>

          {/* Freehand Line Pen */}
          <button
            onClick={() => onSelectTool('freeline')}
            className={`p-1.5 rounded-lg flex flex-col items-center justify-center transition cursor-pointer ${
              activeTool === 'freeline'
                ? 'bg-indigo-600 text-white shadow-xs font-bold'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
            title="자유곡선 / 펜 그리기"
          >
            <Pencil className="w-4 h-4" />
            <span className="text-[9px] mt-0.5 break-keep">자유선</span>
          </button>

          {/* Freehand Polygon (자유 도형) */}
          <button
            onClick={() => onSelectTool('freepoly')}
            className={`p-1.5 rounded-lg flex flex-col items-center justify-center transition cursor-pointer ${
              activeTool === 'freepoly'
                ? 'bg-indigo-600 text-white shadow-xs font-bold'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
            title="자유도형 (닫힌 영역을 그려 내부에 색상을 채울 수 있습니다)"
          >
            <Pentagon className="w-4 h-4" />
            <span className="text-[9px] mt-0.5 break-keep">자유도형</span>
          </button>
        </div>
      </div>

      {/* 2. Shape Customization Bar (Color, Thickness, Fill, Font, Delete) */}
      <div className="space-y-2 pt-1 border-t border-slate-200/80">
        {/* Stroke & Custom Palette */}
        <div>
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1">
            <span>선 및 테두리 색상</span>
            {savedCustomColors.length > 0 && (
              <span className="text-[9px] text-slate-400 font-normal">저장된 색상 {savedCustomColors.length}개</span>
            )}
          </div>
          <div className="flex items-center space-x-1 flex-wrap gap-y-1">
            {/* Presets */}
            {PRESET_COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => handleStrokeColorChange(c.value)}
                className={`w-5 h-5 rounded-full border border-slate-300 transition cursor-pointer hover:scale-110 shrink-0 ${
                  strokeColor === c.value ? 'ring-2 ring-indigo-500 ring-offset-1' : ''
                }`}
                style={{ backgroundColor: c.value }}
                title={c.name}
              />
            ))}

            {/* Saved Custom Colors */}
            {savedCustomColors.map((hex) => (
              <div key={hex} className="relative group shrink-0">
                <button
                  onClick={() => handleStrokeColorChange(hex)}
                  className={`w-5 h-5 rounded-full border border-slate-300 transition cursor-pointer hover:scale-110 ${
                    strokeColor === hex ? 'ring-2 ring-indigo-500 ring-offset-1' : ''
                  }`}
                  style={{ backgroundColor: hex }}
                  title={`저장된 커스텀 색상 (${hex})`}
                />
                <button
                  onClick={(e) => handleRemoveCustomColor(hex, e)}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-2.5 h-2.5 flex items-center justify-center text-[7px] opacity-0 group-hover:opacity-100 transition"
                  title="삭제"
                >
                  ×
                </button>
              </div>
            ))}

            {/* Custom Color Picker Input & Add Button */}
            <div className="flex items-center space-x-1 ml-1 pl-1 border-l border-slate-200">
              <input
                type="color"
                value={customInputColor}
                onChange={(e) => {
                  setCustomInputColor(e.target.value);
                  handleStrokeColorChange(e.target.value);
                }}
                className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0 shrink-0"
                title="커스텀 색상 피커"
              />
              <button
                onClick={() => handleSaveCustomColor(customInputColor)}
                className="p-1 text-[10px] bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded border border-indigo-200 font-bold transition flex items-center space-x-0.5 cursor-pointer"
                title="현재 피커 색상을 커스텀 목록에 저장"
              >
                <Plus className="w-2.5 h-2.5" />
                <span className="text-[9px] break-keep">저장</span>
              </button>
            </div>
          </div>
        </div>

        {/* Fill & Thickness & Font Size */}
        <div className="flex items-center justify-between gap-1.5 flex-wrap text-xs">
          {/* Fill Color */}
          <div className="flex items-center space-x-1.5">
            <span className="text-[10px] font-bold text-slate-500 shrink-0">채우기</span>
            <button
              onClick={() => onChangeFillColor('none')}
              className={`px-2 py-0.5 text-[10px] rounded border transition cursor-pointer ${
                !isSemiTransparent
                  ? 'bg-slate-800 text-white border-slate-800 font-bold'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              투명
            </button>
            <button
              onClick={() => onChangeFillColor(strokeColor + '33')}
              className={`px-2 py-0.5 text-[10px] rounded border transition cursor-pointer font-bold ${
                isSemiTransparent
                  ? 'bg-indigo-100 text-indigo-700 border-indigo-300 ring-1 ring-indigo-400'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
              style={isSemiTransparent ? { backgroundColor: strokeColor + '25', color: strokeColor === '#ffffff' ? '#1e293b' : strokeColor } : {}}
            >
              반투명
            </button>
          </div>

          {/* Stroke Width Selector */}
          <div className="flex items-center space-x-1">
            <span className="text-[10px] font-bold text-slate-500 shrink-0">두께</span>
            {[1, 2, 3, 5].map((w) => (
              <button
                key={w}
                onClick={() => onChangeStrokeWidth(w)}
                className={`px-1.5 py-0.5 text-[10px] rounded border font-medium transition cursor-pointer ${
                  strokeWidth === w
                    ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {w}px
              </button>
            ))}
          </div>

          {/* Font Size for Text */}
          {activeTool === 'text' && (
            <div className="flex items-center space-x-1">
              <span className="text-[10px] font-bold text-slate-500 shrink-0">글자</span>
              {[12, 14, 16, 20].map((s) => (
                <button
                  key={s}
                  onClick={() => onChangeFontSize(s)}
                  className={`px-1.5 py-0.5 text-[10px] rounded border font-medium transition cursor-pointer ${
                    fontSize === s
                      ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Actions: Delete selected / Clear all */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
          <div className="text-[10px] text-slate-400">
            {shapesCount > 0 ? `총 ${shapesCount}개 도형` : '도형을 그려보세요'}
          </div>
          <div className="flex items-center space-x-1">
            {selectedShapeId && (
              <button
                onClick={onDeleteSelectedShape}
                className="flex items-center space-x-1 px-2 py-0.5 rounded bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition text-[10px] font-bold cursor-pointer"
                title="선택한 도형 삭제"
              >
                <Trash2 className="w-3 h-3" />
                <span className="break-keep">도형 삭제</span>
              </button>
            )}
            {shapesCount > 0 && (
              <button
                onClick={onClearAllShapes}
                className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-300/80 transition text-[10px] font-medium cursor-pointer break-keep"
                title="그린 모든 도형 지우기"
              >
                전체 지우기
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const ShapeToolbar: React.FC<ShapeToolbarProps> = (props) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  if (props.isVisible === false) return null;

  return (
    <div className="hidden sm:block absolute top-3 left-3 z-20 font-sans transition-all duration-200">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/90 overflow-hidden text-slate-800 w-[380px] sm:w-[460px]">
        {/* Toolbar Header (도형 삽입) */}
        <div className="px-3 py-2 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between select-none">
          <div className="flex items-center space-x-2">
            <Shapes className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold tracking-wide break-keep">도형 삽입 툴바</span>
            {props.shapesCount > 0 && (
              <span className="bg-indigo-500/80 text-white text-[9.5px] px-1.5 py-0.2 rounded-full font-semibold">
                {props.shapesCount}개
              </span>
            )}
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-slate-700/80 rounded-md text-slate-300 hover:text-white transition cursor-pointer"
              title={isExpanded ? '접기' : '펼치기'}
            >
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {props.onToggleVisibility && (
              <button
                onClick={props.onToggleVisibility}
                className="p-1 hover:bg-slate-700/80 rounded-md text-slate-300 hover:text-white transition cursor-pointer"
                title="도형 툴바 닫기"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Toolbar Main Body */}
        {isExpanded && <ShapeToolbarControls {...props} />}
      </div>
    </div>
  );
};
