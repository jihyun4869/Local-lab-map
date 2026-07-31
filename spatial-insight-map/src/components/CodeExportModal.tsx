import React, { useState } from 'react';
import { X, Copy, Check, Download, FileCode, ExternalLink } from 'lucide-react';
import { generateStandaloneHtml } from '../utils/singleHtmlGenerator';

interface CodeExportModalProps {
  onClose: () => void;
}

export const CodeExportModal: React.FC<CodeExportModalProps> = ({ onClose }) => {
  const [copied, setCopied] = useState(false);
  const htmlCode = generateStandaloneHtml();

  const handleCopy = () => {
    navigator.clipboard.writeText(htmlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([htmlCode], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'capital_area_preference_map.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-[0_32px_64px_rgba(0,0,0,0.18)] border border-gray-100 w-full max-w-4xl overflow-hidden flex flex-col h-[85vh] font-sans">
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shrink-0">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">단일 HTML 추출 코드</h2>
              <p className="text-xs text-slate-400">
                Leaflet.js 기반 독립실행형 웹 애플리케이션 코드가 하나로 패키징되어 있습니다.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition flex items-center space-x-1.5 shadow-md cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? '복사 완료!' : '코드 복사'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3.5 py-2 rounded-xl transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>.html 다운로드</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Code Content Viewport */}
        <div className="flex-1 bg-gray-950 p-5 overflow-auto font-mono text-xs text-slate-300 select-all custom-scrollbar">
          <pre className="whitespace-pre-wrap break-all leading-relaxed">{htmlCode}</pre>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-2">
            <ExternalLink className="w-3.5 h-3.5 text-indigo-600" />
            <span className="font-medium">.html 파일로 저장 후 브라우저에서 더블 클릭 시 즉시 독립 실행됩니다.</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900 font-bold px-4 py-1.5 rounded-xl hover:bg-gray-200 transition cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
