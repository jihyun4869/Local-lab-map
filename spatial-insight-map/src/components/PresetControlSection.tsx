import React, { useState } from 'react';
import {
  Bookmark,
  Plus,
  Pencil,
  Trash2,
  Save,
  RotateCcw
} from 'lucide-react';
import { ColoringPreset, RegionPreference } from '../types';

interface PresetControlSectionProps {
  savedPresets: ColoringPreset[];
  activePresetId: string | null;
  onSelectPreset: (presetId: string) => void;
  onOpenSaveModal: () => void;
  onRenamePreset: (presetId: string, newName: string) => void;
  onDeletePreset: (presetId: string) => void;
  onUpdatePreset?: (presetId: string) => void;
  onClearAllColoring: () => void;
}

export const PresetControlSection: React.FC<PresetControlSectionProps> = ({
  savedPresets,
  activePresetId,
  onSelectPreset,
  onOpenSaveModal,
  onRenamePreset,
  onDeletePreset,
  onUpdatePreset,
  onClearAllColoring
}) => {
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');
  const [deletingPresetId, setDeletingPresetId] = useState<string | null>(null);

  const handleStartRename = (preset: ColoringPreset, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDeletingPresetId(null);
    setEditingPresetId(preset.id);
    setEditingName(preset.name);
  };

  const handleSaveRename = (presetId: string, e: React.FormEvent | React.FocusEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (editingName.trim()) {
      onRenamePreset(presetId, editingName.trim());
    }
    setEditingPresetId(null);
  };

  const handleConfirmDelete = (presetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDeletePreset(presetId);
    setDeletingPresetId(null);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingPresetId(null);
  };

  // Currently active preset object
  const activePreset = savedPresets.find((p) => p.id === activePresetId) || null;

  // Active preset's evaluated count
  const activeEvaluatedCount = activePreset
    ? (Object.values(activePreset.preferences || {}) as RegionPreference[]).filter(
        (r) => r.prefItems?.some((i) => i.checked) || r.disprefItems?.some((i) => i.checked)
      ).length
    : 0;

  return (
    <div className="space-y-2 pb-3 border-b border-gray-100 font-sans">
      {/* Control Box Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center space-x-1.5">
          <Bookmark className="w-3.5 h-3.5 text-indigo-600" />
          <span>레이어 저장</span>
        </h2>
        <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
          {savedPresets.length}개 저장됨
        </span>
      </div>

      {/* Preset Tiles Grid Container with + Button at the end */}
      <div className="flex flex-wrap gap-2 pt-1 items-center max-h-48 overflow-y-auto pr-0.5">
        {savedPresets.map((preset) => {
          const isActive = activePresetId === preset.id;

          // Calculate evaluated region count inside preset
          const evaluatedCount = (Object.values(preset.preferences || {}) as RegionPreference[]).filter(
            (r) =>
              r.prefItems?.some((i) => i.checked) ||
              r.disprefItems?.some((i) => i.checked)
          ).length;

          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => {
                setEditingPresetId(null);
                setDeletingPresetId(null);
                onSelectPreset(preset.id);
              }}
              className={`w-[74px] h-[54px] rounded-xl border p-1.5 flex flex-col justify-between items-start transition-all cursor-pointer relative overflow-hidden select-none active:scale-95 text-left shrink-0 ${
                isActive
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200 ring-2 ring-indigo-400/30'
                  : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-800'
              }`}
              title={`${preset.name} (${evaluatedCount}개 평가 구역)`}
            >
              {/* Top status indicator & Count */}
              <div className="w-full flex items-center justify-between text-[9px] font-bold">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isActive ? 'bg-white animate-pulse' : 'bg-gray-400'
                  }`}
                />
                <span className={`px-1 py-0.2 rounded-full text-[9px] ${
                  isActive ? 'bg-indigo-700/80 text-white' : 'bg-gray-200/80 text-gray-600 font-semibold'
                }`}>
                  {evaluatedCount}개
                </span>
              </div>

              {/* Preset Name */}
              <span className={`w-full text-[11px] font-bold truncate leading-tight mt-0.5 ${
                isActive ? 'text-white' : 'text-gray-900'
              }`}>
                {preset.name}
              </span>
            </button>
          );
        })}

        {/* Plus (+) Button as Square Icon Card at the end of the list */}
        <button
          onClick={onOpenSaveModal}
          className="w-[74px] h-[54px] rounded-xl border-2 border-dashed border-indigo-300 hover:border-indigo-500 bg-indigo-50/50 hover:bg-indigo-100/80 text-indigo-600 flex flex-col items-center justify-center space-y-0.5 transition-all cursor-pointer active:scale-95 shrink-0 group shadow-2xs"
          title="현재 컬러링을 새 레이어로 저장 (+)"
        >
          <Plus className="w-4 h-4 stroke-[2.5] text-indigo-600 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-extrabold text-indigo-700">저장</span>
        </button>
      </div>

      {/* Action Toolbar directly below the active/selected preset icon */}
      {activePreset && (
        <div className="mt-2 p-2.5 bg-slate-900 text-white rounded-xl border border-slate-800 shadow-md space-y-2 text-xs animate-in fade-in zoom-in-95 duration-200">
          {/* Top Row: Selected Preset Name & Count / Rename / Delete confirm */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-1.5">
            {editingPresetId === activePreset.id ? (
              <form onSubmit={(e) => handleSaveRename(activePreset.id, e)} className="flex items-center gap-1.5 w-full">
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={(e) => handleSaveRename(activePreset.id, e)}
                  autoFocus
                  maxLength={25}
                  className="flex-1 px-2 py-0.5 text-xs font-bold rounded-md bg-slate-800 border border-indigo-400 text-white outline-none"
                />
                <button type="submit" className="text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-2.5 py-1 rounded-md shrink-0 cursor-pointer">
                  저장
                </button>
              </form>
            ) : deletingPresetId === activePreset.id ? (
              <div className="flex items-center justify-between w-full">
                <span className="text-[11px] font-bold text-red-400 truncate">
                  ‘{activePreset.name}’ 삭제할까요?
                </span>
                <div className="flex items-center space-x-1 shrink-0">
                  <button
                    onClick={(e) => handleConfirmDelete(activePreset.id, e)}
                    className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold rounded-md transition cursor-pointer"
                  >
                    삭제
                  </button>
                  <button
                    onClick={handleCancelDelete}
                    className="px-2 py-0.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-[10px] font-medium rounded-md transition cursor-pointer"
                  >
                    취소
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center space-x-1.5 min-w-0 flex-1">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0 animate-pulse" />
                  <span className="font-bold text-white text-[11px] truncate">{activePreset.name}</span>
                </div>
                <span className="text-[10px] font-semibold text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded-full border border-indigo-800/60 shrink-0">
                  {activeEvaluatedCount}개 평가 구역
                </span>
              </>
            )}
          </div>

          {/* Bottom Row: Actions in 3 equal grid columns */}
          {deletingPresetId !== activePreset.id && editingPresetId !== activePreset.id && (
            <div className="grid grid-cols-3 gap-1 pt-0.5">
              {onUpdatePreset && (
                <button
                  onClick={() => onUpdatePreset(activePreset.id)}
                  className="px-1.5 py-1.5 bg-slate-800 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-slate-700 font-bold text-[10px] rounded-lg transition cursor-pointer flex items-center justify-center space-x-1 min-w-0"
                  title="현재 지도의 컬러링으로 이 레이어 덮어쓰기"
                >
                  <Save className="w-3 h-3 text-indigo-400 shrink-0" />
                  <span className="truncate">덮어쓰기</span>
                </button>
              )}

              <button
                onClick={(e) => handleStartRename(activePreset, e)}
                className="px-1.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-[10px] rounded-lg transition cursor-pointer flex items-center justify-center space-x-1 min-w-0"
                title="레이어 이름 수정"
              >
                <Pencil className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">이름편집</span>
              </button>

              <button
                onClick={() => setDeletingPresetId(activePreset.id)}
                className="px-1.5 py-1.5 bg-slate-800 hover:bg-red-900/60 text-red-400 hover:text-red-300 border border-slate-700 font-bold text-[10px] rounded-lg transition cursor-pointer flex items-center justify-center space-x-1 min-w-0"
                title="레이어 삭제"
              >
                <Trash2 className="w-3 h-3 text-red-400 shrink-0" />
                <span className="truncate">삭제</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Clear Map Coloring Action */}
      <div className="flex items-center justify-between pt-1 text-[10px] text-gray-400">
        <button
          onClick={onClearAllColoring}
          className="text-gray-500 hover:text-red-600 flex items-center space-x-1 transition cursor-pointer"
          title="지도의 모든 컬러링을 지웁니다"
        >
          <RotateCcw className="w-3 h-3" />
          <span>현재 지도 컬러링 지우기</span>
        </button>
      </div>
    </div>
  );
};

