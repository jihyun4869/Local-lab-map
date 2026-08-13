import React, { useState, useEffect, useRef } from 'react';
import { BookmarkPlus, X, Check, Layers } from 'lucide-react';

interface SavePresetModalProps {
  defaultName: string;
  evaluatedCount: number;
  onSave: (name: string) => void;
  onClose: () => void;
}

export const SavePresetModal: React.FC<SavePresetModalProps> = ({
  defaultName,
  evaluatedCount,
  onSave,
  onClose,
}) => {
  const [presetName, setPresetName] = useState<string>(defaultName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus and select input text on open
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = presetName.trim() || defaultName;
    onSave(finalName);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-sm w-full overflow-hidden font-sans">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-white/10 rounded-xl">
              <BookmarkPlus className="w-5 h-5 text-indigo-100" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-snug">컬러링 레이어 저장</h3>
              <p className="text-xs text-indigo-100/90 font-medium">현재 지도 표시 상태 저장</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-indigo-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="bg-indigo-50/70 p-3 rounded-xl border border-indigo-100 text-xs text-indigo-900 flex items-center space-x-2.5">
            <Layers className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              현재 <strong>{evaluatedCount}개 구역</strong>의 컬러링(선호/비선호) 설정이 포함됩니다.
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              레이어 이름 설정
            </label>
            <input
              ref={inputRef}
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="예: 새파일1"
              maxLength={30}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition text-gray-900 font-semibold"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              * 기본 이름: {defaultName} (동일한 이름이 있으면 번호가 자동 증가합니다)
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 text-gray-600 font-semibold text-xs hover:bg-gray-50 transition cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-200 transition flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>레이어 저장</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
