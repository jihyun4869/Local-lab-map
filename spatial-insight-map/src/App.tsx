import React, { useState } from 'react';
import { LayerVisibility, RegionPreference } from './types';
import { getInitialRegionPref, SAMPLE_REGION_PREFERENCES } from './data/defaultData';
import { AdminLevel } from './data/koreaGeoJson';
import { Sidebar } from './components/Sidebar';
import { MapContainer } from './components/MapContainer';
import { RegionSidePanel } from './components/RegionSidePanel';
import { CodeExportModal } from './components/CodeExportModal';

export default function App() {
  // Layer visibility state
  const [layerVisibility, setLayerVisibility] = useState<LayerVisibility>({
    boundary: true,
    preference: true,
    prefLevel1: true,
    prefLevel2: true,
    prefLevel3: true,
  });

  // Region preferences state initialized with sample data
  const [regionPreferences, setRegionPreferences] = useState<Record<string, RegionPreference>>(SAMPLE_REGION_PREFERENCES);

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

    // Ensure initial pref object exists ONLY IF NOT ALREADY INITIALIZED!
    setRegionPreferences((prev) => {
      if (prev[code]) {
        return prev;
      }
      return {
        ...prev,
        [code]: getInitialRegionPref(code, regName),
      };
    });

    setSelectedRegion({ code, name: regName });
  };

  // Update Region Preference
  const handleUpdateRegionPref = (code: string, updated: RegionPreference) => {
    setRegionPreferences((prev) => ({
      ...prev,
      [code]: updated,
    }));
  };

  // Load Sample Data (강남구, 마포구, 분당구)
  const handleLoadSampleData = () => {
    setRegionPreferences((prev) => ({
      ...prev,
      ...SAMPLE_REGION_PREFERENCES,
    }));
  };

  // Reset all evaluations
  const handleResetData = () => {
    setRegionPreferences({});
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
    ? regionPreferences[selectedRegion.code] || getInitialRegionPref(selectedRegion.code, selectedRegion.name)
    : null;

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
    </div>
  );
}
