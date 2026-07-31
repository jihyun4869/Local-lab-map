import React from 'react';
import {
  Layers,
  MapPin,
  TrainTrack,
  Palette,
  BarChart2,
  FileCode,
  RotateCcw,
  Sparkles,
  Info,
  ChevronRight,
  ChevronLeft,
  Sliders,
  PanelLeftClose,
  PanelLeftOpen,
  Tag,
  Eye
} from 'lucide-react';
import { LayerVisibility, RegionPreference } from '../types';
import { AdminLevel, ADMIN_LEVEL_INFOS } from '../data/koreaGeoJson';

interface SidebarProps {
  layerVisibility: LayerVisibility;
  onToggleLayer: (layerKey: keyof LayerVisibility) => void;
  evaluatedCount: number;
  totalPrefCount: number;
  totalDisprefCount: number;
  onLoadSampleData: () => void;
  onResetData: () => void;
  onOpenCodeModal: () => void;
  regionPreferences: Record<string, RegionPreference>;
  onSelectRegion: (code: string, name: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  zoomInfo?: { zoom: number; level: AdminLevel };
}

export const Sidebar: React.FC<SidebarProps> = ({
  layerVisibility,
  onToggleLayer,
  evaluatedCount,
  totalPrefCount,
  totalDisprefCount,
  onLoadSampleData,
  onResetData,
  onOpenCodeModal,
  regionPreferences,
  onSelectRegion,
  isCollapsed,
  onToggleCollapse,
  zoomInfo
}) => {
  const currentLevelInfo = zoomInfo ? ADMIN_LEVEL_INFOS[zoomInfo.level] : ADMIN_LEVEL_INFOS[2];
  const evaluatedRegions = (Object.values(regionPreferences) as RegionPreference[]).filter(r => {
    const p = r.prefItems.some(i => i.checked);
    const d = r.disprefItems.some(i => i.checked);
    return p || d;
  });

  if (isCollapsed) {
    return (
      <aside className="w-16 bg-white text-gray-800 flex flex-col items-center py-4 border-r border-gray-200 z-20 shadow-lg shrink-0 h-full font-sans transition-all duration-300">
        {/* Toggle Expand Button */}
        <button
          onClick={onToggleCollapse}
          title="사이드바 펼치기"
          className="p-2 rounded-xl bg-gray-100 hover:bg-indigo-50 text-indigo-600 transition mb-6 cursor-pointer"
        >
          <PanelLeftOpen className="w-5 h-5" />
        </button>

        {/* Quick Icon Controls */}
        <div className="space-y-4 flex-1 flex flex-col items-center">
          {/* Layer toggles */}
          <button
            onClick={() => onToggleLayer('boundary')}
            title={`행정구역 경계 ${layerVisibility.boundary ? 'ON' : 'OFF'}`}
            className={`p-2.5 rounded-xl border transition cursor-pointer ${
              layerVisibility.boundary
                ? 'bg-indigo-50 border-indigo-200 text-indigo-600 shadow-2xs'
                : 'bg-white border-gray-200 text-gray-400 opacity-60'
            }`}
          >
            <MapPin className="w-4 h-4" />
          </button>

          <button
            onClick={() => onToggleLayer('preference')}
            title={`지역 선호도 ${layerVisibility.preference ? 'ON' : 'OFF'}`}
            className={`p-2.5 rounded-xl border transition cursor-pointer ${
              layerVisibility.preference
                ? 'bg-blue-50 border-blue-200 text-blue-600 shadow-2xs'
                : 'bg-white border-gray-200 text-gray-400 opacity-60'
            }`}
          >
            <Palette className="w-4 h-4" />
          </button>

          <div className="w-8 border-t border-gray-200 my-2" />

          {/* Sample Data */}
          <button
            onClick={onLoadSampleData}
            title="샘플 데이터 적용"
            className="p-2.5 rounded-xl bg-gray-100 hover:bg-indigo-50 text-indigo-600 transition cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
          </button>

          {/* Reset */}
          <button
            onClick={onResetData}
            title="초기화"
            className="p-2.5 rounded-xl bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-600 transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Code Export */}
        <button
          onClick={onOpenCodeModal}
          title="HTML 코드 복사"
          className="p-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-md cursor-pointer"
        >
          <FileCode className="w-4 h-4" />
        </button>
      </aside>
    );
  }

  return (
    <aside className="w-[287px] bg-white text-gray-800 flex flex-col border-r border-gray-200 z-20 shadow-xl shrink-0 h-full font-sans transition-all duration-300">
      {/* Header */}
      <div className="p-3 border-b border-gray-100 bg-white flex items-center justify-between">
        <div className="flex items-center space-x-2 min-w-0">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-md shadow-indigo-200 shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-gray-900 leading-tight truncate">수도권 데이터</h1>
            <p className="text-[10px] font-semibold text-indigo-500 uppercase tracking-wider truncate">Spatia Insight</p>
          </div>
        </div>

        {/* Collapse Button */}
        <button
          onClick={onToggleCollapse}
          title="사이드바 접기"
          className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer shrink-0"
        >
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable Container (Layer Control + Stats & Evaluated Regions) */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3.5">
        {/* Layer Control Panel */}
        <div className="space-y-2 pb-3 border-b border-gray-100">
          <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
            <span>레이어 컨트롤</span>
            <Sliders className="w-3 h-3 text-indigo-500" />
          </h2>

          <div className="space-y-1.5">
            {/* 1. Administrative Boundaries (Parent: 행정구역) */}
            <div className="space-y-1">
              <label
                className={`flex items-center justify-between p-2 rounded-lg border transition-colors cursor-pointer ${
                  layerVisibility.boundary
                    ? 'bg-gray-50 border-gray-200 text-gray-900 font-semibold'
                    : 'bg-white border-gray-100 text-gray-400 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-slate-500 shrink-0"></div>
                  <span className="text-xs font-bold text-gray-800">행정구역</span>
                </div>
                <input
                  type="checkbox"
                  checked={layerVisibility.boundary}
                  onChange={() => onToggleLayer('boundary')}
                  className="w-3.5 h-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </label>
            </div>

            {/* 2. Regional Preference Layer with Sub-layers */}
            <div className={`rounded-xl border transition-colors overflow-hidden ${
              layerVisibility.preference
                ? 'bg-gray-50/70 border-gray-200'
                : 'bg-white border-gray-100'
            }`}>
              {/* Parent Preference Toggle */}
              <label className="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-100/50 transition-colors">
                <div className="flex items-center space-x-2 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 shrink-0"></div>
                  <span className="text-xs font-bold text-gray-900 truncate">지역 선호도</span>
                </div>
                <input
                  type="checkbox"
                  checked={layerVisibility.preference}
                  onChange={() => onToggleLayer('preference')}
                  className="w-3.5 h-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0"
                />
              </label>

              {/* Sub-layers for Administrative Levels */}
              {layerVisibility.preference && (
                <div className="pl-3.5 pr-2 pb-2 pt-1 space-y-1 border-t border-gray-200/60 bg-white/60">
                  {/* 1. 광역자치단체 */}
                  <label className="flex items-center justify-between text-[11px] text-gray-700 cursor-pointer hover:text-gray-900 py-1 px-1.5 rounded-md hover:bg-indigo-50/60 transition-colors">
                    <div className="flex items-center space-x-2 min-w-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></span>
                      <span className="truncate font-semibold text-gray-800">1. 광역자치단체</span>
                      <span className="text-[9.5px] text-gray-400 font-normal shrink-0">(시/도)</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={layerVisibility.prefLevel1 !== false}
                      onChange={() => onToggleLayer('prefLevel1')}
                      className="w-3 h-3 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0"
                    />
                  </label>

                  {/* 2. 기초자치단체 */}
                  <label className="flex items-center justify-between text-[11px] text-gray-700 cursor-pointer hover:text-gray-900 py-1 px-1.5 rounded-md hover:bg-indigo-50/60 transition-colors">
                    <div className="flex items-center space-x-2 min-w-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
                      <span className="truncate font-semibold text-gray-800">2. 기초자치단체</span>
                      <span className="text-[9.5px] text-gray-400 font-normal shrink-0">(시/군/구)</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={layerVisibility.prefLevel2 !== false}
                      onChange={() => onToggleLayer('prefLevel2')}
                      className="w-3 h-3 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0"
                    />
                  </label>

                  {/* 3. 읍/면/동 */}
                  <label className="flex items-center justify-between text-[11px] text-gray-700 cursor-pointer hover:text-gray-900 py-1 px-1.5 rounded-md hover:bg-indigo-50/60 transition-colors">
                    <div className="flex items-center space-x-2 min-w-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0"></span>
                      <span className="truncate font-semibold text-gray-800">3. 읍/면/동</span>
                      <span className="text-[9.5px] text-gray-400 font-normal shrink-0">(행정동)</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={layerVisibility.prefLevel3 !== false}
                      onChange={() => onToggleLayer('prefLevel3')}
                      className="w-3 h-3 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0"
                    />
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Zoom Level & Administrative Boundary Info Card */}
        {currentLevelInfo && (
          <div className="bg-indigo-50/70 rounded-xl p-2.5 border border-indigo-100/80 text-indigo-950 space-y-1.5 break-keep">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wide flex items-center gap-1 shrink-0 break-keep">
                <MapPin className="w-3 h-3 text-indigo-500 inline shrink-0" />
                <span>행정구역 레벨</span>
              </span>
              <span className="text-[10px] font-extrabold bg-indigo-600 text-white px-1.5 py-0.5 rounded-md tabular-nums shadow-2xs shrink-0 whitespace-nowrap">
                Level {currentLevelInfo.level}
              </span>
            </div>
            <div className="text-xs font-bold text-indigo-950 mt-0.5 break-keep">
              {currentLevelInfo.name}
            </div>
            <p className="text-[10px] text-indigo-700/90 leading-normal break-keep">
              <span>{currentLevelInfo.descriptionMain || currentLevelInfo.description}</span>
              {currentLevelInfo.descriptionSub && (
                <span className="inline-block whitespace-nowrap ml-1 text-indigo-800/90 font-medium">
                  {currentLevelInfo.descriptionSub}
                </span>
              )}
            </p>
            <div className="text-[9.5px] text-indigo-600/90 font-semibold pt-1.5 border-t border-indigo-100/80 flex items-center justify-between gap-1.5 break-keep min-w-0">
              <div className="flex items-center gap-1 min-w-0 break-keep leading-tight flex-wrap">
                <span className="font-semibold">{currentLevelInfo.zoomCondition || currentLevelInfo.zoomRangeText}</span>
                {currentLevelInfo.zoomLabel && (
                  <span className="inline-block whitespace-nowrap text-indigo-700 font-bold">
                    {currentLevelInfo.zoomLabel}
                  </span>
                )}
              </div>
              {zoomInfo && (
                <span className="font-extrabold tabular-nums text-indigo-700 bg-indigo-100/80 px-1.5 py-0.5 rounded text-[10px] shrink-0 whitespace-nowrap ml-auto">
                  Zoom {zoomInfo.zoom.toFixed(1)}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Legend Card */}
        <div className="bg-slate-900 rounded-xl p-3 text-white shadow-inner border border-slate-800">
          <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>데이터 범례</span>
            <Palette className="w-3 h-3 text-indigo-400" />
          </h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-300 font-medium">선호 우세</span>
              <div className="flex gap-1 items-center">
                <div className="w-2.5 h-2.5 rounded-xs bg-blue-400/50 border border-blue-400/40" title="옅음 (1~2개)"></div>
                <div className="w-2.5 h-2.5 rounded-xs bg-blue-500/80" title="보통 (3~4개)"></div>
                <div className="w-2.5 h-2.5 rounded-xs bg-blue-600 shadow-2xs" title="짙음 (5개 이상)"></div>
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-300 font-medium">선호/비선호 동률</span>
              <div className="flex gap-1 items-center">
                <div className="w-2.5 h-2.5 rounded-xs bg-purple-400/50 border border-purple-400/40" title="옅음"></div>
                <div className="w-2.5 h-2.5 rounded-xs bg-purple-500/80" title="보통"></div>
                <div className="w-2.5 h-2.5 rounded-xs bg-purple-600 shadow-2xs" title="짙음"></div>
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-300 font-medium">비선호 우세</span>
              <div className="flex gap-1 items-center">
                <div className="w-2.5 h-2.5 rounded-xs bg-red-400/50 border border-red-400/40" title="옅음"></div>
                <div className="w-2.5 h-2.5 rounded-xs bg-red-500/80" title="보통"></div>
                <div className="w-2.5 h-2.5 rounded-xs bg-red-600 shadow-2xs" title="짙음"></div>
              </div>
            </div>
          </div>
          <div className="text-[9px] text-slate-400 mt-2 pt-1.5 border-t border-slate-800/80 flex justify-between">
            <span>← 항목 적음 (옅음)</span>
            <span>항목 많음 (짙음) →</span>
          </div>
        </div>

        {/* Stats & Evaluated Regions List */}
        <div className="space-y-3 pt-0.5">
          <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-100">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-700 mb-1.5">
              <span className="flex items-center space-x-1">
                <BarChart2 className="w-3 h-3 text-indigo-600" />
                <span>데이터 현황</span>
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1 text-center text-xs">
              <div className="bg-white p-1.5 rounded-md border border-gray-200/80">
                <div className="text-gray-400 text-[9px] leading-tight">평가<br />지역</div>
                <div className="text-xs font-bold text-gray-900 mt-0.5">{evaluatedCount}개</div>
              </div>
              <div className="bg-blue-50/60 p-1.5 rounded-md border border-blue-100 flex flex-col justify-between">
                <div className="text-blue-600 text-[9px] font-medium">선호</div>
                <div className="text-xs font-bold text-blue-700">{totalPrefCount}건</div>
              </div>
              <div className="bg-red-50/60 p-1.5 rounded-md border border-red-100 flex flex-col justify-between">
                <div className="text-red-600 text-[9px] font-medium">비선호</div>
                <div className="text-xs font-bold text-red-700">{totalDisprefCount}건</div>
              </div>
            </div>
          </div>

          {/* Currently Evaluated Regions List */}
          <div>
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>평가 진행 구역 ({evaluatedRegions.length})</span>
            </div>

            {evaluatedRegions.length === 0 ? (
              <div className="text-center py-3 px-2 bg-gray-50 rounded-lg border border-gray-100">
                <Info className="w-3.5 h-3.5 text-gray-400 mx-auto mb-1" />
                <p className="text-[11px] text-gray-500 font-medium">평가된 지역이 없습니다.</p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  지도의 행정구역을 클릭하세요.
                </p>
              </div>
            ) : (
              <div className="space-y-1 max-h-32 overflow-y-auto pr-0.5">
                {evaluatedRegions.map((reg) => {
                  const pCount = reg.prefItems.filter((i) => i.checked).length;
                  const dCount = reg.disprefItems.filter((i) => i.checked).length;
                  return (
                    <div
                      key={reg.code}
                      onClick={() => onSelectRegion(reg.code, reg.name)}
                      className="flex items-center justify-between p-2 rounded-md bg-gray-50 hover:bg-gray-100 border border-gray-200/60 transition cursor-pointer text-xs"
                    >
                      <span className="font-semibold text-gray-800 truncate max-w-[90px]">{reg.name}</span>
                      <div className="flex items-center space-x-1 text-[10px]">
                        <span className="text-blue-600 font-bold">+{pCount}</span>
                        <span className="text-gray-300">/</span>
                        <span className="text-red-600 font-bold">-{dCount}</span>
                        <ChevronRight className="w-3 h-3 text-gray-400" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-1.5 pt-2 border-t border-gray-100">
          <button
            onClick={onLoadSampleData}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-semibold py-2 px-2.5 rounded-lg transition flex items-center justify-center space-x-1 border border-gray-200/80 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="truncate">샘플 데이터 적용</span>
          </button>

          <button
            onClick={onResetData}
            className="w-full bg-white hover:bg-gray-50 text-gray-400 hover:text-gray-600 text-[11px] py-1 px-2 rounded-lg transition flex items-center justify-center space-x-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>모든 평가 초기화</span>
          </button>
        </div>
      </div>

      {/* Footer / Export HTML Button */}
      <div className="p-3 bg-gray-50 border-t border-gray-100">
        <button
          onClick={onOpenCodeModal}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 px-3 rounded-lg transition shadow-md shadow-indigo-200/80 flex items-center justify-center space-x-1.5 active:scale-[0.98] cursor-pointer"
        >
          <FileCode className="w-3.5 h-3.5 shrink-0" />
          <span>단일 HTML 추출</span>
        </button>
      </div>
    </aside>
  );
};
