import React, { useState, useEffect, useRef } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { LayerVisibility, RegionPreference, ColoringPreset, LegendColors, DEFAULT_LEGEND_COLORS, DrawnShape, ShapeToolType } from './types';
import { getInitialRegionPref, SAMPLE_REGION_PREFERENCES, sanitizeRegionPreferences } from './data/defaultData';
import { AdminLevel } from './data/koreaGeoJson';
import { Sidebar } from './components/Sidebar';
import { MapContainer } from './components/MapContainer';
import { RegionSidePanel } from './components/RegionSidePanel';
import { CodeExportModal } from './components/CodeExportModal';
import { SavePresetModal } from './components/SavePresetModal';
import { getNextPresetName } from './utils/presetUtils';

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

  // Shape Toolbar State (Default stroke: black #000000, default fill: semi-transparent #00000033)
  const [activeTool, setActiveTool] = useState<ShapeToolType>('pointer');
  const [strokeColor, setStrokeColor] = useState<string>('#000000');
  const [fillColor, setFillColor] = useState<string>('#00000033');
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

  // Global ESC key listener to return to 'pointer' tool
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveTool('pointer');
        setSelectedShapeId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 1. Load initial data from Firestore shared document ('preferences/shared') once on startup
  useEffect(() => {
    let isMounted = true;
    const docRef = doc(db, 'preferences', 'shared');

    getDoc(docRef)
      .then((docSnap) => {
        if (!isMounted) return;
        setIsSyncConnected(true);

        if (docSnap.exists()) {
          const remoteData = docSnap.data();
          if (remoteData) {
            if (remoteData.data) {
              setRegionPreferences(sanitizeRegionPreferences(remoteData.data));
            }
            if (Array.isArray(remoteData.shapes)) {
              setDrawnShapes(sanitizeShapes(remoteData.shapes));
            }
            if (Array.isArray(remoteData.presets)) {
              setSavedPresets(
                remoteData.presets.map((p: any) => ({
                  ...p,
                  preferences: sanitizeRegionPreferences(p.preferences || {}),
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
          // Document doesn't exist yet: initialize with default sample preferences & initial preset
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
      })
      .catch((error) => {
        console.error('Firestore load error:', error);
        if (isMounted) {
          setIsSyncConnected(false);
          isInitialSyncDoneRef.current = true;
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Automatically push local regionPreferences, drawnShapes, savedPresets, activePresetId & legendColors changes to Firestore with debounce
  useEffect(() => {
    if (!isInitialSyncDoneRef.current) return;

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
      // Cleanly parse serialized payload to ensure no unsupported undefined values are sent to Firestore
      const cleanPayload = JSON.parse(serialized);
      setDoc(docRef, {
        ...cleanPayload,
        updatedAt: new Date().toISOString(),
      }).catch((err) => console.error('Error writing to Firestore:', err));
    }, 600);

    return () => clearTimeout(timer);
  }, [regionPreferences, drawnShapes, savedPresets, activePresetId, legendColors]);

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

  // Select or click region strictly by unique administrative code
  const handleSelectRegion = (code: string | null, name?: string, fullName?: string) => {
    if (!code) {
      setSelectedRegion(null);
      return;
    }

    const regName = fullName || name || regionPreferences[code]?.name || `행정구역 ${code}`;

    setSelectedRegion({
      code,
      name: regionPreferences[code]?.name || regName,
    });

    // Close left sidebar on mobile when region popup opens
    if (window.innerWidth < 768) {
      setIsSidebarCollapsed(true);
    }
  };

  // Update Region Preference strictly by code
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
      preferences: sanitizeRegionPreferences(JSON.parse(JSON.stringify(regionPreferences))),
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

    setRegionPreferences(sanitizeRegionPreferences(JSON.parse(JSON.stringify(preset.preferences || {}))));
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

  // Load Sample Data (103개 샘플 평가 지역)
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

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-900 font-sans antialiased text-slate-100 select-none">
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

      {/* Right Side Panel (Factor Analysis) */}
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
