import React, { useState } from 'react';
import { MapPin, X, Plus, Trash2, Save, Palette, RotateCcw } from 'lucide-react';
import { RegionPreference, CheckItem } from '../types';

const COLOR_PRESETS = [
  { name: '파랑', value: '#3b82f6' },
  { name: '보라', value: '#8b5cf6' },
  { name: '초록', value: '#10b981' },
  { name: '노랑', value: '#f59e0b' },
  { name: '주황', value: '#f97316' },
  { name: '빨강', value: '#ef4444' },
  { name: '분홍', value: '#ec4899' },
  { name: '청록', value: '#06b6d4' },
  { name: '검정', value: '#1e293b' },
];

interface RegionSidePanelProps {
  regionPref: RegionPreference;
  onClose: () => void;
  onUpdate: (updated: RegionPreference) => void;
}

export const RegionSidePanel: React.FC<RegionSidePanelProps> = ({
  regionPref,
  onClose,
  onUpdate,
}) => {
  const [newPrefText, setNewPrefText] = useState('');
  const [newDisprefText, setNewDisprefText] = useState('');

  // Toggle Direct Preference item
  const handleTogglePref = (index: number) => {
    const updatedPrefItems = regionPref.prefItems.map((item, i) =>
      i === index ? { ...item, checked: !item.checked } : item
    );
    onUpdate({
      ...regionPref,
      prefItems: updatedPrefItems,
      lastUpdated: new Date().toISOString(),
    });
  };

  // Toggle Direct Dispreference item
  const handleToggleDispref = (index: number) => {
    const updatedDisprefItems = regionPref.disprefItems.map((item, i) =>
      i === index ? { ...item, checked: !item.checked } : item
    );
    onUpdate({
      ...regionPref,
      disprefItems: updatedDisprefItems,
      lastUpdated: new Date().toISOString(),
    });
  };

  // Add custom preference factor
  const handleAddPref = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrefText.trim()) return;

    const newItem: CheckItem = {
      id: `pref-custom-${Date.now()}`,
      text: newPrefText.trim(),
      checked: true,
      isCustom: true,
    };

    onUpdate({
      ...regionPref,
      prefItems: [...regionPref.prefItems, newItem],
      lastUpdated: new Date().toISOString(),
    });
    setNewPrefText('');
  };

  // Add custom dispreference factor
  const handleAddDispref = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDisprefText.trim()) return;

    const newItem: CheckItem = {
      id: `dispref-custom-${Date.now()}`,
      text: newDisprefText.trim(),
      checked: true,
      isCustom: true,
    };

    onUpdate({
      ...regionPref,
      disprefItems: [...regionPref.disprefItems, newItem],
      lastUpdated: new Date().toISOString(),
    });
    setNewDisprefText('');
  };

  // Remove custom preference factor
  const handleRemovePref = (index: number) => {
    const updatedPrefItems = regionPref.prefItems.filter((_, i) => i !== index);
    onUpdate({
      ...regionPref,
      prefItems: updatedPrefItems,
      lastUpdated: new Date().toISOString(),
    });
  };

  // Remove custom dispreference factor
  const handleRemoveDispref = (index: number) => {
    const updatedDisprefItems = regionPref.disprefItems.filter((_, i) => i !== index);
    onUpdate({
      ...regionPref,
      disprefItems: updatedDisprefItems,
      lastUpdated: new Date().toISOString(),
    });
  };

  const activePrefCount = regionPref.prefItems.filter((i) => i.checked).length;
  const activeDisprefCount = regionPref.disprefItems.filter((i) => i.checked).length;

  return (
    <div className="fixed inset-0 z-50 md:relative md:z-20 flex items-center justify-center p-3 md:p-0 bg-slate-900/50 md:bg-transparent backdrop-blur-xs md:backdrop-blur-none transition-all duration-300">
      {/* Clickable backdrop overlay for mobile */}
      <div className="absolute inset-0 md:hidden" onClick={onClose} />

      <aside className="relative w-full max-w-[390px] md:max-w-none md:w-[420px] max-h-[85vh] md:max-h-none h-auto md:h-full bg-white rounded-2xl md:rounded-none border border-gray-200 md:border-y-0 md:border-r-0 md:border-l shadow-2xl flex flex-col shrink-0 font-sans animate-in zoom-in-95 md:zoom-in-100 slide-in-from-bottom-4 md:slide-in-from-right duration-300 overflow-hidden z-10">
        {/* Side Panel Header */}
        <div className="p-3 md:p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5 md:space-x-3 min-w-0">
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shrink-0">
              <MapPin className="w-4 h-4 md:w-5 md:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h2 className="text-sm md:text-base font-bold text-white tracking-tight truncate">{regionPref.name}</h2>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-indigo-300 px-2 py-0.5 rounded-md font-mono shrink-0">
                  {regionPref.code}
                </span>
              </div>
              <p className="text-[10px] md:text-[11px] text-slate-400 mt-0.5 truncate">
                지역 선호 및 비선호 요인 설정
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            title="창 닫기"
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Side Panel Body */}
        <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3.5 md:space-y-5 max-h-[calc(85vh-110px)] md:max-h-none">
          {/* 1. Preference Factors Section (Blue Theme) */}
          <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-3 md:p-3.5 space-y-2.5 md:space-y-3">
            <div className="flex items-center justify-between pb-1.5 md:pb-2 border-b border-blue-100">
              <div className="flex items-center space-x-2 text-blue-700 font-bold text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                <span>선호 요인</span>
              </div>
              <span className="text-[10px] md:text-[11px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">
                {activePrefCount}개 선택
              </span>
            </div>

            <div className="space-y-1.5 max-h-36 sm:max-h-44 md:max-h-52 overflow-y-auto pr-1">
              {regionPref.prefItems.length === 0 ? (
                <p className="text-xs text-blue-500/80 py-2.5 md:py-3 text-center font-medium bg-white/40 rounded-xl border border-blue-100/50">
                  등록된 선호 요인이 없습니다. 아래에 직접 입력해보세요.
                </p>
              ) : (
                regionPref.prefItems.map((item, idx) => (
                  <div
                    key={item.id}
                    onClick={() => handleTogglePref(idx)}
                    className={`flex items-center justify-between p-2 md:p-2.5 rounded-xl border transition cursor-pointer ${
                      item.checked
                        ? 'bg-white border-blue-300 text-blue-900 shadow-2xs'
                        : 'bg-white/60 border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <label className="flex items-center space-x-2 text-xs font-medium cursor-pointer flex-1 select-none min-w-0">
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => {}}
                        className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                      />
                      <span className={`truncate ${item.checked ? 'text-gray-900 font-semibold' : ''}`}>
                        {item.text}
                      </span>
                    </label>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemovePref(idx);
                      }}
                      className="text-gray-400 hover:text-red-500 p-1 transition cursor-pointer shrink-0"
                      title="요인 삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add Preference Input */}
            <form onSubmit={handleAddPref} className="pt-1.5 md:pt-2 border-t border-blue-100">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newPrefText}
                  onChange={(e) => setNewPrefText(e.target.value)}
                  placeholder="선호 요인 입력..."
                  className="flex-1 bg-white border border-blue-200 rounded-xl px-2.5 py-1.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center space-x-1 shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>추가</span>
                </button>
              </div>
            </form>
          </div>

          {/* 2. Dispreference Factors Section (Red Theme) */}
          <div className="bg-red-50/50 border border-red-100 rounded-2xl p-3 md:p-3.5 space-y-2.5 md:space-y-3">
            <div className="flex items-center justify-between pb-1.5 md:pb-2 border-b border-red-100">
              <div className="flex items-center space-x-2 text-red-700 font-bold text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
                <span>비선호 요인</span>
              </div>
              <span className="text-[10px] md:text-[11px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full">
                {activeDisprefCount}개 선택
              </span>
            </div>

            <div className="space-y-1.5 max-h-36 sm:max-h-44 md:max-h-52 overflow-y-auto pr-1">
              {regionPref.disprefItems.length === 0 ? (
                <p className="text-xs text-red-500/80 py-2.5 md:py-3 text-center font-medium bg-white/40 rounded-xl border border-red-100/50">
                  등록된 비선호 요인이 없습니다. 아래에 직접 입력해보세요.
                </p>
              ) : (
                regionPref.disprefItems.map((item, idx) => (
                  <div
                    key={item.id}
                    onClick={() => handleToggleDispref(idx)}
                    className={`flex items-center justify-between p-2 md:p-2.5 rounded-xl border transition cursor-pointer ${
                      item.checked
                        ? 'bg-white border-red-300 text-red-900 shadow-2xs'
                        : 'bg-white/60 border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <label className="flex items-center space-x-2 text-xs font-medium cursor-pointer flex-1 select-none min-w-0">
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => {}}
                        className="w-3.5 h-3.5 rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer shrink-0"
                      />
                      <span className={`truncate ${item.checked ? 'text-gray-900 font-semibold' : ''}`}>
                        {item.text}
                      </span>
                    </label>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveDispref(idx);
                      }}
                      className="text-gray-400 hover:text-red-500 p-1 transition cursor-pointer shrink-0"
                      title="요인 삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add Dispreference Input */}
            <form onSubmit={handleAddDispref} className="pt-1.5 md:pt-2 border-t border-red-100">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newDisprefText}
                  onChange={(e) => setNewDisprefText(e.target.value)}
                  placeholder="비선호 요인 입력..."
                  className="flex-1 bg-white border border-red-200 rounded-xl px-2.5 py-1.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center space-x-1 shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>추가</span>
                </button>
              </div>
            </form>
          </div>

          {/* 3. Custom Region Color Override Section */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 md:p-3.5 space-y-2.5">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
              <div className="flex items-center space-x-1.5 text-slate-700 font-bold text-xs">
                <Palette className="w-3.5 h-3.5 text-indigo-600" />
                <span>지역 고유 색상 지정</span>
              </div>
              {regionPref.customColor && (
                <button
                  type="button"
                  onClick={() => {
                    const newPref = { ...regionPref, lastUpdated: new Date().toISOString() };
                    delete newPref.customColor;
                    onUpdate(newPref);
                  }}
                  className="text-[10px] text-slate-500 hover:text-slate-800 flex items-center space-x-1 bg-white px-2 py-0.5 rounded-md border border-slate-200 transition cursor-pointer"
                  title="기본 범례 색상으로 초기화"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>기본값 초기화</span>
                </button>
              )}
            </div>

            <p className="text-[11px] text-slate-500">
              {regionPref.customColor ? '사용자 지정 색상이 적용 중입니다.' : '설정하지 않으면 선호/비선호 점수에 따른 범례 색상이 자동 적용됩니다.'}
            </p>

            {/* Presets and Custom Color Input */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {COLOR_PRESETS.map((preset) => {
                const isSelected = regionPref.customColor?.toLowerCase() === preset.value.toLowerCase();
                return (
                  <button
                    key={preset.value}
                    type="button"
                    title={preset.name}
                    onClick={() => {
                      if (isSelected) {
                        const newPref = { ...regionPref, lastUpdated: new Date().toISOString() };
                        delete newPref.customColor;
                        onUpdate(newPref);
                      } else {
                        onUpdate({
                          ...regionPref,
                          customColor: preset.value,
                          lastUpdated: new Date().toISOString(),
                        });
                      }
                    }}
                    style={{ backgroundColor: preset.value }}
                    className={`w-6 h-6 rounded-lg transition-transform cursor-pointer border ${
                      isSelected ? 'ring-2 ring-indigo-600 ring-offset-2 scale-110 border-white' : 'border-black/10 hover:scale-105'
                    }`}
                  />
                );
              })}

              {/* Direct Color Picker input */}
              <label className="relative w-6 h-6 rounded-lg border border-slate-300 bg-white hover:border-indigo-400 flex items-center justify-center cursor-pointer transition overflow-hidden" title="직접 색상 선택">
                <input
                  type="color"
                  value={regionPref.customColor || '#3b82f6'}
                  onChange={(e) => {
                    onUpdate({
                      ...regionPref,
                      customColor: e.target.value,
                      lastUpdated: new Date().toISOString(),
                    });
                  }}
                  className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                />
                <span className="text-[10px] font-bold text-slate-600">+</span>
              </label>
            </div>
          </div>
        </div>

        {/* Side Panel Footer */}
        <div className="p-3 md:p-3.5 bg-gray-50 border-t border-gray-200 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2 text-xs font-semibold text-gray-600">
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              <span>선호 {activePrefCount}</span>
            </span>
            <span>/</span>
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-red-600"></span>
              <span>비선호 {activeDisprefCount}</span>
            </span>
          </div>

          <button
            onClick={onClose}
            className="bg-slate-900 text-white font-bold text-xs py-1.5 md:py-2 px-4 md:px-5 rounded-xl hover:bg-slate-800 transition shadow-md cursor-pointer active:scale-95 flex items-center space-x-1.5"
          >
            <Save className="w-3.5 h-3.5 text-indigo-400" />
            <span>완료</span>
          </button>
        </div>
      </aside>
    </div>
  );
};
