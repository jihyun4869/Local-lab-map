import React, { useState, useEffect, useRef } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from './firebase';
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

  // Firestore sync state & refs
  const [isSyncConnected, setIsSyncConnected] = useState<boolean>(false);
  const lastLocalSerializedRef = useRef<string>('');
  const isInitialSyncDoneRef = useRef<boolean>(false);

  // 1. Subscribe to Firestore shared document ('preferences/shared') in real-time
  useEffect(() => {
    const docRef = doc(db, 'preferences', 'shared');

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        setIsSyncConnected(true);
        if (docSnap.exists()) {
          const remoteData = docSnap.data();
          if (remoteData && remoteData.data) {
            const serialized = JSON.stringify(remoteData.data);
            if (serialized !== lastLocalSerializedRef.current) {
              lastLocalSerializedRef.current = serialized;
              setRegionPreferences(remoteData.data);
            }
          }
        } else {
          // Document doesn't exist yet: initialize with default sample preferences
          const initialSerialized = JSON.stringify(SAMPLE_REGION_PREFERENCES);
          lastLocalSerializedRef.current = initialSerialized;
          setDoc(docRef, {
            data: SAMPLE_REGION_PREFERENCES,
            updatedAt: new Date().toISOString(),
          }).catch((err) => console.error('Error initializing Firestore:', err));
        }
        isInitialSyncDoneRef.current = true;
      },
      (error) => {
        console.error('Firestore onSnapshot error:', error);
        setIsSyncConnected(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // 2. Automatically push local regionPreferences changes to Firestore
  useEffect(() => {
    if (!isInitialSyncDoneRef.current) return;

    const serialized = JSON.stringify(regionPreferences);
    if (serialized !== lastLocalSerializedRef.current) {
      lastLocalSerializedRef.current = serialized;
      const docRef = doc(db, 'preferences', 'shared');
      setDoc(docRef, {
        data: regionPreferences,
        updatedAt: new Date().toISOString(),
      }).catch((err) => console.error('Error writing to Firestore:', err));
    }
  }, [regionPreferences]);

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
      // Find existing matching key by key, code, or name
      const existingKey = Object.keys(prev).find(
        (k) =>
          k === code ||
          k === regName ||
          prev[k]?.code === code ||
          prev[k]?.name === regName ||
          (regName && prev[k]?.name && (prev[k].name === regName || prev[k].name.includes(regName) || regName.includes(prev[k].name)))
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
    ? regionPreferences[selectedRegion.code] ||
      (Object.values(regionPreferences) as RegionPreference[]).find(
        (p) => p.code === selectedRegion.code || p.name === selectedRegion.name
      ) ||
      getInitialRegionPref(selectedRegion.code, selectedRegion.name)
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
        isSyncConnected={isSyncConnected}
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
