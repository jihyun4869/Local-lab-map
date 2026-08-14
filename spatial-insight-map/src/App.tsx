import React, { useState, useEffect, useRef } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { LayerVisibility, RegionPreference, ColoringPreset, LegendColors, DEFAULT_LEGEND_COLORS, DrawnShape, ShapeToolType } from './types';
import { getInitialRegionPref, SAMPLE_REGION_PREFERENCES } from './data/defaultData';
import { AdminLevel } from './data/koreaGeoJson';
import { Sidebar } from './components/Sidebar';
import { MapContainer } from './components/MapContainer';
import { RegionSidePanel } from './components/RegionSidePanel';
import { CodeExportModal } from './components/CodeExportModal';
import { SavePresetModal } from './components/SavePresetModal';
import { getNextPresetName } from './utils/presetUtils';

// 🔑 비밀번호 설정 (원하시는 비밀번호로 자유롭게 변경하세요!)
const ACCESS_PASSWORD = '037275'; 

const DEFAULT_INITIAL_PRESET: ColoringPreset = {
  id: 'preset_default_1',
  name: '새파일1',
  preferences: SAMPLE_REGION_PREFERENCES,
  createdAt: new Date().toISOString(),
};

const sanitizeShapes = (shapes: any[]): DrawnShape[] => {
  if (!Array.isArray(shapes)) return [];
  return shapes.map((shape) => {
    let normalizedPoints: Array<{ lat: number; lng: number }> = [];
    if (Array.isArray(shape.points)) {
      normalizedPoints = shape.points.map((pt: any) => {
        if (Array.isArray(pt)) {
          return { lat: Number(pt[0]) || 0, lng: Number(pt[1]) || 0 };
        } else if (pt && typeof pt === 'object' && 'lat' in pt && 'lng' in pt) {
          return { lat: Number(pt.lat) || 0, lng: Number(pt.lng) || 0 };
        }
        return { lat: 0, lng: 0 };
      });
    }
    return {
      ...shape,
      points: normalizedPoints,
    };
  });
};

export default function App() {
  // 🔒 비밀번호 인증 상태 관리 (기존 인증 기록 확인)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('site_authenticated') === 'true';
  });
  const [inputPassword, setInputPassword] = useState<string>('');
  const [passwordError, setPasswordError] = useState<boolean>(false);

  // 비밀번호 제출 처리
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputPassword === ACCESS_PASSWORD) {
      localStorage.setItem('site_authenticated', 'true');
      setIsAuthenticated(true);
      setPasswordError(false);
    } else {
      setPasswordError(true);
    }
  };

  // Layer visibility state
  const [layerVisibility, setLayerVisibility] = useState<LayerVisibility>({
    boundary: true,
    preference: true,
    prefLevel1: true,
    prefLevel2: true,
    prefLevel3: true,
    shapes: true,
  });

  // Region preferences state initialized with sample data
  const [regionPreferences, setRegionPreferences] = useState<Record<string, RegionPreference>>(SAMPLE_REGION_PREFERENCES);

  // Drawn shapes state ('도형삽입' 레이어)
  const [drawnShapes, setDrawnShapes] = useState<DrawnShape[]>([]);

  // Shape Toolbar State
  const [activeTool, setActiveTool] = useState<ShapeToolType>('pointer');
  const [strokeColor, setStrokeColor] = useState<string>('#ef4444');
  const [fillColor, setFillColor] = useState<string>('none');
  const [strokeWidth, setStrokeWidth] = useState<number>(2);
  const [fontSize, setFontSize] = useState<number>(14);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);

  // Legend colors state
  const [legendColors, setLegendColors] = useState<LegendColors>(DEFAULT_LEGEND_COLORS);

  // Saved presets state & active preset ID
  const [savedPresets, setSavedPresets] = useState<ColoringPreset[]>([DEFAULT_INITIAL_PRESET]);
  const [activePresetId, setActivePresetId] = useState<string | null>('preset_default_1');

  // Modal for saving new preset
  const [isSavePresetModalOpen, setIsSavePresetModalOpen] = useState<boolean>(false);

  // Firestore sync state & refs
  const [isSyncConnected, setIsSyncConnected] = useState<boolean>(false);
  const lastLocalSerializedRef = useRef<string>('');
  const isInitialSyncDoneRef = useRef<boolean>(false);

  // 1. Subscribe to Firestore shared document
  useEffect(() => {
    if (!isAuthenticated) return; // 인증되지 않은 경우 동기화 안함

    const docRef = doc(db, 'preferences', 'shared');

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        setIsSyncConnected(true);
        if (docSnap.metadata.hasPendingWrites) return;

        if (docSnap.exists()) {
          const remoteData = docSnap.data();
          if (remoteData) {
            if (remoteData.data) {
              setRegionPreferences(remoteData.data);
            }
            if (Array.isArray(remoteData.shapes)) {
              setDrawnShapes(sanitizeShapes(remoteData.shapes));
            }
            if (Array.isArray(remoteData.presets)) {
              setSavedPresets(
                remoteData.presets.map((p: any) => ({
                  ...p,
                  shapes: sanitizeShapes(p.shapes || []),
                }))
              );
            }
            if (remoteData.activePresetId !== undefined) {
              setActivePresetId(remoteData.activePresetId);
            }
            if (remoteData.legendColors) {
              setLegendColors(remoteData.legendColors);
            }

            const serialized = JSON.stringify({
              data: remoteData.data,
              shapes: remoteData.shapes || [],
              presets: remoteData.presets,
              activePresetId: remoteData.activePresetId,
              legendColors: remoteData.legendColors,
            });
            lastLocalSerializedRef.current = serialized;
          }
        } else {
          const initialPayload = {
            data: SAMPLE_REGION_PREFERENCES,
            shapes: [],
            presets: [DEFAULT_INITIAL_PRESET],
            activePresetId: 'preset_default_1',
            legendColors: DEFAULT_LEGEND_COLORS,
            updatedAt: new Date().toISOString(),
          };
          lastLocalSerializedRef.current = JSON.stringify({
            data: SAMPLE_REGION_PREFERENCES,
            shapes: [],
            presets: [DEFAULT_INITIAL_PRESET],
            activePresetId: 'preset_default_1',
            legendColors: DEFAULT_LEGEND_COLORS,
          });
          setDoc(docRef, initialPayload).catch((err) => console.error('Error initializing Firestore:', err));
        }
        isInitialSyncDoneRef.current = true;
      },
      (error) => {
        console.error('Firestore onSnapshot error:', error);
        setIsSyncConnected(false);
      }
    );

    return () => unsubscribe();
  }, [isAuthenticated]);

  // 2. Automatically push local changes to Firestore
  useEffect(() => {
    if (!isAuthenticated || !isInitialSyncDoneRef.current) return;

    const currentPayload = {
      data: regionPreferences,
      shapes: drawnShapes,
      presets: savedPresets,
      activePresetId: activePresetId,
      legendColors: legendColors,
    };

    const serialized = JSON.stringify(currentPayload);
    if (serialized === lastLocalSerializedRef.current) return;

    const timer = setTimeout(() => {
      lastLocalSerializedRef.current = serialized;
      const docRef = doc(db, 'preferences', 'shared');
      setDoc(docRef, {
        ...currentPayload,
        updatedAt: new Date().toISOString(),
      }).catch((err) => console.error('Error writing to Firestore:', err));
    }, 600);

    return () => clearTimeout(timer);
  }, [isAuthenticated, regionPreferences, drawnShapes, savedPresets, activePresetId, legendColors]);

  // Shape action handlers
  const handleAddShape = (shape: DrawnShape) => {
    setDrawnShapes((prev) => [...prev, shape]);
  };

  const handleUpdateShape = (updatedShape: DrawnShape) => {
    setDrawnShapes((prev) => prev.map((s) => (s.id === updatedShape.id ? updatedShape : s)));
  };

  const handleDeleteShape = (id: string) => {
    setDrawnShapes((prev) => prev.filter((s) => s.id !== id));
  };

  const handleClearAllShapes = () => {
    setDrawnShapes([]);
  };

  // Selected region side panel state
  const [selectedRegion, setSelectedRegion] = useState<{ code: string; name: string } | null>(null);

  // Zoom level state
  const [zoomInfo, setZoomInfo] = useState<{ zoom: number; level: AdminLevel }>({ zoom: 11.0, level: 2 });

  // Single HTML Code Export Modal state
  const [isCodeModalOpen, setIsCodeModalOpen] = useState<boolean>(false);

  // Collapsible sidebar state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // Toggle layer visibility
  const handleToggleLayer = (layerKey: keyof LayerVisibility) => {
    setLayerVisibility((prev) => {
      if (layerKey === 'preference') {
        const nextPref = !prev.preference;
        return {
          ...prev,
          preference: nextPref,
          prefLevel1: nextPref,
          prefLevel2: nextPref,
          prefLevel3: nextPref,
        };
      }

      if (layerKey === 'prefLevel1' || layerKey === 'prefLevel2' || layerKey === 'prefLevel3') {
        const nextVal = !(prev[layerKey] !== false);
        const nextLevel1 = layerKey === 'prefLevel1' ? nextVal : (prev.prefLevel1 !== false);
        const nextLevel2 = layerKey === 'prefLevel2' ? nextVal : (prev.prefLevel2 !== false);
        const nextLevel3 = layerKey === 'prefLevel3' ? nextVal : (prev.prefLevel3 !== false);

        const hasAnySub = nextLevel1 || nextLevel2 || nextLevel3;

        return {
          ...prev,
          [layerKey]: nextVal,
          preference: hasAnySub,
        };
      }

      return {
        ...prev,
        [layerKey]: !prev[layerKey],
      };
    });
  };

  // Select or click region
  const handleSelectRegion = (code: string | null, name?: string) => {
    if (!code) {
      setSelectedRegion(null);
      return;
    }

    const regName = name || regionPreferences[code]?.name || `행정구역 ${code}`;
    let matchedKey = code;

    setRegionPreferences((prev) => {
      const existingKey = Object.keys(prev).find(
        (k) =>
          k === code ||
          prev[k]?.code === code ||
          (regName && (k === regName || prev[k]?.name === regName))
      );

      if (existingKey) {
        matchedKey = existingKey;
        return prev;
      }

      return {
        ...prev,
        [code]: getInitialRegionPref(code, regName),
      };
    });

    setSelectedRegion({ code: matchedKey, name: regName });

    if (window.innerWidth < 768) {
      setIsSidebarCollapsed(true);
    }
  };

  // Update Region Preference
  const handleUpdateRegionPref = (code: string, updated: RegionPreference) => {
    setRegionPreferences((prev) => ({
      ...prev,
      [code]: updated,
    }));
  };

  // Preset Handlers
  const handleSaveNewPreset = (presetName: string) => {
    const defaultAutoName = getNextPresetName(savedPresets);
    const finalName = presetName.trim() || defaultAutoName;

    const newPreset: ColoringPreset = {
      id: `preset_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: finalName,
      preferences: JSON.parse(JSON.stringify(regionPreferences)),
      shapes: JSON.parse(JSON.stringify(drawnShapes)),
      createdAt: new Date().toISOString(),
    };

    setSavedPresets((prev) => [...prev, newPreset]);
    setActivePresetId(newPreset.id);
    setIsSavePresetModalOpen(false);
  };

  const handleSelectPreset = (presetId: string) => {
    const preset = savedPresets.find((p) => p.id === presetId);
    if (!preset) return;

    setRegionPreferences(JSON.parse(JSON.stringify(preset.preferences || {})));
    setDrawnShapes(sanitizeShapes(preset.shapes || []));
    setActivePresetId(presetId);
    setSelectedRegion(null);
  };

  const handleRenamePreset = (presetId: string, newName: string) => {
    setSavedPresets((prev) =>
      prev.map((p) => (p.id === presetId ? { ...p, name: newName.trim() } : p))
    );
  };

  const handleDeletePreset = (presetId: string) => {
    setSavedPresets((prev) => prev.filter((p) => p.id !== presetId));
    if (activePresetId === presetId) {
      setActivePresetId(null);
    }
  };

  const handleUpdatePreset = (presetId: string) => {
    setSavedPresets((prev) =>
      prev.map((p) =>
        p.id === presetId
          ? {
              ...p,
              preferences: JSON.parse(JSON.stringify(regionPreferences)),
              shapes: JSON.parse(JSON.stringify(drawnShapes)),
              createdAt: new Date().toISOString(),
            }
          : p
      )
    );
  };

  // Load Sample Data
  const handleLoadSampleData = () => {
    setRegionPreferences(JSON.parse(JSON.stringify(SAMPLE_REGION_PREFERENCES)));
    setSelectedRegion(null);
  };

  // Reset all evaluations
  const handleResetData = () => {
    setRegionPreferences({});
    setDrawnShapes([]);
    setSelectedRegion(null);
  };

  // Calculate stats
  const prefList = Object.values(regionPreferences) as RegionPreference[];

  const evaluatedCount = prefList.filter((r) => {
    const hasP = r.prefItems.some((i) => i.checked);
    const hasD = r.disprefItems.some((i) => i.checked);
    return hasP || hasD;
  }).length;

  const totalPrefCount = prefList.reduce((acc, r) => {
    return acc + r.prefItems.filter((i) => i.checked).length;
  }, 0);

  const totalDisprefCount = prefList.reduce((acc, r) => {
    return acc + r.disprefItems.filter((i) => i.checked).length;
  }, 0);

  const activeSelectedRegionPref = selectedRegion
    ? regionPreferences[selectedRegion.code] ||
      (Object.values(regionPreferences) as RegionPreference[]).find(
        (p) => p.code === selectedRegion.code || p.name === selectedRegion.name
      ) ||
      getInitialRegionPref(selectedRegion.code, selectedRegion.name)
    : null;

  const shapeToolbarProps = {
    activeTool,
    onSelectTool: setActiveTool,
    strokeColor,
    onChangeStrokeColor: setStrokeColor,
    fillColor,
    onChangeFillColor: setFillColor,
    strokeWidth,
    onChangeStrokeWidth: setStrokeWidth,
    fontSize,
    onChangeFontSize: setFontSize,
    selectedShapeId,
    onDeleteSelectedShape: () => {
      if (selectedShapeId) {
        handleDeleteShape(selectedShapeId);
        setSelectedShapeId(null);
      }
    },
    onClearAllShapes: handleClearAllShapes,
    shapesCount: drawnShapes.length,
  };

  // 🔒 인증되지 않았을 경우 비밀번호 입력 화면만 표시
  if (!isAuthenticated) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-900 font-sans text-slate-100">
        {/* SEO 수집용 헤더는 비밀번호 화면 뒤에도 유지 */}
        <header className="sr-only">
          <h1>동네연구소 | 서울 및 전국 행정구역 경계 지도 시각화</h1>
          <h2>동별 입지 분석 및 공간 데이터 평가 도구</h2>
        </header>

        <form onSubmit={handlePasswordSubmit} className="w-full max-w-sm p-6 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 text-center">
          <div className="mb-4 text-3xl">🔒</div>
          <h2 className="text-xl font-bold mb-2">동네연구소 접속 제한</h2>
          <p className="text-sm text-slate-400 mb-6">서비스를 이용하시려면 비밀번호를 입력해 주세요.</p>
          
          <input
            type="password"
            value={inputPassword}
            onChange={(e) => setInputPassword(e.target.value)}
            placeholder="비밀번호 입력"
            className="w-full px-4 py-2 mb-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500 text-center"
            autoFocus
          />

          {passwordError && (
            <p className="text-xs text-red-400 mb-3">비밀번호가 올바르지 않습니다.</p>
          )}

          <button
            type="submit"
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition-colors"
          >
            접속하기
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-900 font-sans antialiased text-slate-100 select-none">
      {/* 🚀 검색엔진(SEO) 수집 전용 헤더 */}
      <header className="sr-only">
        <h1>동네연구소 | 서울 및 전국 행정구역 경계 지도 시각화</h1>
        <h2>동별 입지 분석 및 공간 데이터 평가 도구</h2>
        <p>전국 시군구·동별 선호/비선호 입지 요인을 시각적으로 확인하고 지도 데이터를 분석해 보세요.</p>
      </header>

      {/* Left Collapsible Sidebar */}
      <Sidebar
        layerVisibility={layerVisibility}
        onToggleLayer={handleToggleLayer}
        evaluatedCount={evaluatedCount}
        totalPrefCount={totalPrefCount}
        totalDisprefCount={totalDisprefCount}
        onLoadSampleData={handleLoadSampleData}
        onResetData={handleResetData}
        onOpenCodeModal={() => setIsCodeModalOpen(true)}
        regionPreferences={regionPreferences}
        onSelectRegion={(code, name) => handleSelectRegion(code, name)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        zoomInfo={zoomInfo}
        isSyncConnected={isSyncConnected}
        legendColors={legendColors}
        onUpdateLegendColors={setLegendColors}
        savedPresets={savedPresets}
        activePresetId={activePresetId}
        onSelectPreset={handleSelectPreset}
        onOpenSavePresetModal={() => setIsSavePresetModalOpen(true)}
        onRenamePreset={handleRenamePreset}
        onDeletePreset={handleDeletePreset}
        onUpdatePreset={handleUpdatePreset}
        shapeToolbarProps={shapeToolbarProps}
      />

      {/* Main Map Area */}
      <main className="flex-1 relative h-full w-full overflow-hidden">
        <MapContainer
          layerVisibility={layerVisibility}
          regionPreferences={regionPreferences}
          onUpdateRegionPref={handleUpdateRegionPref}
          selectedRegionCode={selectedRegion?.code || null}
          onSelectRegion={handleSelectRegion}
          isSidebarCollapsed={isSidebarCollapsed}
          onZoomChange={(zoom, level) => setZoomInfo({ zoom, level })}
          legendColors={legendColors}
          shapes={drawnShapes}
          onAddShape={handleAddShape}
          onUpdateShape={handleUpdateShape}
          onDeleteShape={handleDeleteShape}
          onClearAllShapes={handleClearAllShapes}
          activeTool={activeTool}
          onSelectTool={setActiveTool}
          strokeColor={strokeColor}
          onChangeStrokeColor={setStrokeColor}
          fillColor={fillColor}
          onChangeFillColor={setFillColor}
          strokeWidth={strokeWidth}
          onChangeStrokeWidth={setStrokeWidth}
          fontSize={fontSize}
          onChangeFontSize={setFontSize}
          selectedShapeId={selectedShapeId}
          onSelectShapeId={setSelectedShapeId}
        />
      </main>

      {/* Right Side Panel */}
      {selectedRegion && activeSelectedRegionPref && (
        <RegionSidePanel
          regionPref={activeSelectedRegionPref}
          onClose={() => setSelectedRegion(null)}
          onUpdate={(updated) => handleUpdateRegionPref(selectedRegion.code, updated)}
        />
      )}

      {/* Code Export Modal */}
      {isCodeModalOpen && (
        <CodeExportModal onClose={() => setIsCodeModalOpen(false)} />
      )}

      {/* Save Preset Modal */}
      {isSavePresetModalOpen && (
        <SavePresetModal
          defaultName={getNextPresetName(savedPresets)}
          evaluatedCount={evaluatedCount}
          onSave={handleSaveNewPreset}
          onClose={() => setIsSavePresetModalOpen(false)}
        />
      )}
    </div>
  );
}