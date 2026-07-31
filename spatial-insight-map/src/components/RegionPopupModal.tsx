import React, { useState } from 'react';
import { X, Plus, CheckCircle2, AlertCircle, Sparkles, MapPin, Trash2 } from 'lucide-react';
import { CheckItem, RegionPreference } from '../types';

interface RegionPopupModalProps {
  regionPref: RegionPreference;
  onClose: () => void;
  onUpdate: (updated: RegionPreference) => void;
}

export const RegionPopupModal: React.FC<RegionPopupModalProps> = ({
  regionPref,
  onClose,
  onUpdate,
}) => {
  const [newPrefText, setNewPrefText] = useState('');
  const [newDisprefText, setNewDisprefText] = useState('');

  // Toggle Preference Checkbox
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

  // Toggle Dispreference Checkbox
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

  // Add Custom Preference Item
  const handleAddPref = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newPrefText.trim()) return;

    const newItem: CheckItem = {
      id: `pref_custom_${Date.now()}`,
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

  // Add Custom Dispreference Item
  const handleAddDispref = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newDisprefText.trim()) return;

    const newItem: CheckItem = {
      id: `dispref_custom_${Date.now()}`,
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

  // Remove Item
  const handleRemovePref = (index: number) => {
    const updated = regionPref.prefItems.filter((_, i) => i !== index);
    onUpdate({ ...regionPref, prefItems: updated });
  };

  const handleRemoveDispref = (index: number) => {
    const updated = regionPref.disprefItems.filter((_, i) => i !== index);
    onUpdate({ ...regionPref, disprefItems: updated });
  };

  const activePrefCount = regionPref.prefItems.filter(i => i.checked).length;
  const activeDisprefCount = regionPref.disprefItems.filter(i => i.checked).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-[0_32px_64px_rgba(0,0,0,0.18)] border border-gray-100 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] font-sans">
        {/* Modal Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-white tracking-tight">{regionPref.name}</h2>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-indigo-300 px-2 py-0.5 rounded-md font-mono">
                  {regionPref.code}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Sentiment Analysis Portal & Factor Manager
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Split into Left (Preference) and Right (Dispreference) */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Preference (Blue Theme) */}
          <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-blue-100">
                <div className="flex items-center space-x-2 text-blue-700 font-bold text-xs uppercase tracking-tight">
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                  <span>선호 요인</span>
                </div>
                <span className="text-[11px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">
                  {activePrefCount}개 선택
                </span>
              </div>

              {/* Items List */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {regionPref.prefItems.map((item, idx) => (
                  <div
                    key={item.id}
                    onClick={() => handleTogglePref(idx)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition cursor-pointer ${
                      item.checked
                        ? 'bg-white border-blue-300 text-blue-900 shadow-xs'
                        : 'bg-white/60 border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <label className="flex items-center space-x-2.5 text-xs font-medium cursor-pointer flex-1 select-none">
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => {}} // Handled by parent div onClick
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className={item.checked ? 'text-gray-900 font-semibold' : ''}>
                        {item.text}
                      </span>
                    </label>
                    {item.isCustom && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemovePref(idx);
                        }}
                        className="text-gray-400 hover:text-red-500 p-1 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Add Custom Preference Item Input */}
            <form onSubmit={handleAddPref} className="pt-2 border-t border-blue-100">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newPrefText}
                  onChange={(e) => setNewPrefText(e.target.value)}
                  placeholder="선호 요인 추가..."
                  className="flex-1 bg-white border border-blue-200 rounded-xl px-3 py-1.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

          {/* Right Column: Dispreference (Red Theme) */}
          <div className="bg-red-50/50 border border-red-100 rounded-2xl p-4 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-red-100">
                <div className="flex items-center space-x-2 text-red-700 font-bold text-xs uppercase tracking-tight">
                  <span className="w-2 h-2 rounded-full bg-red-600"></span>
                  <span>비선호 요인</span>
                </div>
                <span className="text-[11px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full">
                  {activeDisprefCount}개 선택
                </span>
              </div>

              {/* Items List */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {regionPref.disprefItems.map((item, idx) => (
                  <div
                    key={item.id}
                    onClick={() => handleToggleDispref(idx)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition cursor-pointer ${
                      item.checked
                        ? 'bg-white border-red-300 text-red-900 shadow-xs'
                        : 'bg-white/60 border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <label className="flex items-center space-x-2.5 text-xs font-medium cursor-pointer flex-1 select-none">
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => {}} // Handled by parent div onClick
                        className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                      <span className={item.checked ? 'text-gray-900 font-semibold' : ''}>
                        {item.text}
                      </span>
                    </label>
                    {item.isCustom && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveDispref(idx);
                        }}
                        className="text-gray-400 hover:text-red-500 p-1 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Add Custom Dispreference Item Input */}
            <form onSubmit={handleAddDispref} className="pt-2 border-t border-red-100">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newDisprefText}
                  onChange={(e) => setNewDisprefText(e.target.value)}
                  placeholder="비선호 요인 추가..."
                  className="flex-1 bg-white border border-red-200 rounded-xl px-3 py-1.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
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
        </div>

        {/* Modal Footer / Action Button */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-3 text-xs font-medium text-gray-500">
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              <span>선호 {activePrefCount}건</span>
            </span>
            <span>/</span>
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-red-600"></span>
              <span>비선호 {activeDisprefCount}건</span>
            </span>
          </div>
          <button
            onClick={onClose}
            className="bg-slate-900 text-white font-bold text-xs py-2.5 px-6 rounded-xl hover:bg-slate-800 transition shadow-md cursor-pointer active:scale-95"
          >
            데이터 분석 반영
          </button>
        </div>
      </div>
    </div>
  );
};
