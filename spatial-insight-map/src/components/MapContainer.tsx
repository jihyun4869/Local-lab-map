import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Layers, Globe, Eye, Loader2 } from 'lucide-react';
import { LayerVisibility, RegionPreference } from '../types';
import {
  AdminLevel,
  ADMIN_LEVEL_INFOS,
  fetchNationwideGeoJson,
} from '../data/koreaGeoJson';

interface MapContainerProps {
  layerVisibility: LayerVisibility;
  regionPreferences: Record<string, RegionPreference>;
  onUpdateRegionPref: (code: string, updated: RegionPreference) => void;
  selectedRegionCode: string | null;
  onSelectRegion: (code: string | null, name?: string) => void;
  isSidebarCollapsed: boolean;
  onZoomChange?: (zoom: number, activeLevel: AdminLevel) => void;
}

export const MapContainer: React.FC<MapContainerProps> = ({
  layerVisibility,
  regionPreferences,
  selectedRegionCode,
  onSelectRegion,
  isSidebarCollapsed,
  onZoomChange,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Keep state refs up to date to prevent closure staleness in event handlers
  const regionPreferencesRef = useRef(regionPreferences);
  const layerVisibilityRef = useRef(layerVisibility);
  const selectedRegionCodeRef = useRef(selectedRegionCode);

  useEffect(() => {
    regionPreferencesRef.current = regionPreferences;
  }, [regionPreferences]);

  useEffect(() => {
    layerVisibilityRef.current = layerVisibility;
  }, [layerVisibility]);

  useEffect(() => {
    selectedRegionCodeRef.current = selectedRegionCode;
  }, [selectedRegionCode]);

  // Read Map API key from environment variables
  const mapApiKey =
    import.meta.env.VITE_MAP_API_KEY ||
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
    import.meta.env.VITE_KAKAO_MAP_KEY ||
    '';

  // Tile layers
  const standardTileRef = useRef<L.TileLayer | null>(null);
  const satelliteTileRef = useRef<L.TileLayer | null>(null);
  const [mapType, setMapType] = useState<'standard' | 'satellite'>('standard');
  const mapTypeRef = useRef<'standard' | 'satellite'>(mapType);
  const [zoomLevel, setZoomLevel] = useState<number>(11.0);
  const [activeAdminLevel, setActiveAdminLevel] = useState<AdminLevel>(2);
  const activeAdminLevelRef = useRef<AdminLevel>(2);
  const [isLoadingGeoData, setIsLoadingGeoData] = useState<boolean>(true);

  // Boundary Layer Groups for 4 Levels
  const level1GroupRef = useRef<L.FeatureGroup>(L.featureGroup());
  const level2GroupRef = useRef<L.FeatureGroup>(L.featureGroup());
  const level3GroupRef = useRef<L.FeatureGroup>(L.featureGroup());
  const level4GroupRef = useRef<L.FeatureGroup>(L.featureGroup());

  // Function to determine active administrative level from zoom level
  const calculateAdminLevel = (zoom: number): AdminLevel => {
    if (zoom < 9.5) return 1;        // 축소 레벨: 광역자치단체 (시/도)
    if (zoom < 11.5) return 2;       // 중간 레벨: 기초자치단체 (시/군/구)
    if (zoom < 12.5) return 3;       // 확대 레벨: 3단계 행정구역 (일반구/행정구/행정시) (11.5 < zoom < 12.5)
    return 4;                        // 고배율 확대 레벨: 4단계 행정구역 (전국 읍·면·동) (zoom >= 12.5)
  };

  // Helper to determine if Preference Layer is enabled for a specific AdminLevel
  const isPrefEnabledForLevel = (level: AdminLevel, vis: LayerVisibility): boolean => {
    if (!vis.preference) return false;
    if (level === 1) return vis.prefLevel1 !== false;
    if (level === 2 || level === 3) return vis.prefLevel2 !== false;
    if (level === 4) return vis.prefLevel3 !== false;
    return true;
  };

  // Helper to calculate exact dynamic style for a feature
  const getFeatureStyle = (
    feature: any,
    level: AdminLevel,
    activeLevel: AdminLevel,
    preferences: Record<string, RegionPreference>,
    showPrefLayer: boolean,
    isSelected: boolean
  ): L.PathOptions => {
    const isSatellite = mapTypeRef.current === 'satellite';
    let color = '#475569';
    let weight = 1.4;
    let opacity = 0.55;
    let dashArray: string | undefined = undefined;
    let fillColor = '#3b82f6';
    let fillOpacity = 0.02;

    if (level < activeLevel) {
      // 상위 레벨 경계면: 더 진하고 두껍게 처리하여 하위 구역과 완벽히 구분
      const diff = activeLevel - level;
      if (isSatellite) {
        // 위성 지도 모드: 어두운 배경에서 확연히 눈에 띄도록 선명한 흰색(#ffffff) 경계선 적용
        color = '#ffffff';
        weight = diff === 1 ? 2.8 : diff === 2 ? 3.2 : 3.6;
        opacity = 0.95;
      } else {
        if (diff === 1) {
          color = level === 1 ? '#020617' : level === 2 ? '#0f172a' : '#1e293b';
          weight = 2.8;
          opacity = 0.92;
        } else if (diff === 2) {
          color = '#020617';
          weight = 3.2;
          opacity = 0.95;
        } else {
          color = '#020617';
          weight = 3.6;
          opacity = 0.95;
        }
      }
    } else {
      // 현재 레벨 경계면
      if (isSatellite) {
        // 위성 지도 모드: 선명한 흰색 / 밝은 하늘색 경계선으로 암두운 위성 영상 보완
        if (level === 1) {
          color = '#ffffff';
          weight = 2.0;
          opacity = 0.88;
          fillColor = '#818cf8';
          fillOpacity = 0.05;
        } else if (level === 2) {
          color = '#ffffff';
          weight = 1.65;
          opacity = 0.86;
          fillColor = '#60a5fa';
          fillOpacity = 0.05;
        } else if (level === 3) {
          color = '#38bdf8';
          weight = 1.3;
          opacity = 0.78;
          dashArray = '4, 4';
          fillColor = '#38bdf8';
          fillOpacity = 0.04;
        } else {
          // Level 4 (읍/면/동)
          color = '#38bdf8';
          weight = 1.2;
          opacity = 0.72;
          dashArray = '3, 3';
          fillColor = '#0ea5e9';
          fillOpacity = 0.04;
        }
      } else {
        if (level === 1) {
          color = '#475569';
          weight = 1.8;
          opacity = 0.65;
          fillColor = '#6366f1';
          fillOpacity = 0.02;
        } else if (level === 2) {
          color = '#475569';
          weight = 1.55;
          opacity = 0.63;
          fillColor = '#3b82f6';
          fillOpacity = 0.03;
        } else if (level === 3) {
          color = '#38bdf8';
          weight = 1.1;
          opacity = 0.48;
          dashArray = '4, 4';
          fillColor = '#38bdf8';
          fillOpacity = 0.02;
        } else {
          color = '#0284c7';
          weight = 1.0;
          opacity = 0.45;
          dashArray = '3, 3';
          fillColor = '#0ea5e9';
          fillOpacity = 0.03;
        }
      }
    }

    const base: L.PathOptions = { color, weight, opacity, dashArray, fillColor, fillOpacity };

    // 1. Highlight purple IF feature is currently selected (popup/modal is open)
    if (isSelected) {
      return {
        ...base,
        color: isSatellite ? '#c084fc' : '#4f46e5',
        weight: (base.weight as number) + 1.6,
        opacity: 1.0,
        fillColor: isSatellite ? '#e9d5ff' : '#6366f1',
        fillOpacity: 0.38,
      };
    }

    // 2. If Preference layer is visible, apply Preference color & depth/opacity
    if (showPrefLayer) {
      const properties = feature.properties || {};
      const fCode = String(properties.code || properties.SIG_CD || properties.EMD_CD || '').trim();
      const fName = String(properties.name || properties.SIG_KOR_NM || properties.CTP_KOR_NM || '').trim();
      const fFullName = String(properties.fullName || '').trim();

      // Find direct preference for this feature
      let pref: RegionPreference | undefined;
      if (fCode && preferences[fCode]) {
        pref = preferences[fCode];
      } else if (fName && preferences[fName]) {
        pref = preferences[fName];
      } else {
        pref = Object.values(preferences).find((p) => {
          if (!p) return false;
          if (fCode && p.code && p.code === fCode) return true;
          if (fName && p.name && (p.name === fName || p.name.includes(fName) || fName.includes(p.name))) return true;
          if (fFullName && p.name && fFullName.includes(p.name)) return true;
          return false;
        });
      }

      if (pref) {
        const pCount = pref.prefItems ? pref.prefItems.filter((i) => i.checked).length : 0;
        const dCount = pref.disprefItems ? pref.disprefItems.filter((i) => i.checked).length : 0;

        if (pCount > 0 || dCount > 0) {
          const netScore = pCount - dCount;

          if (netScore > 0) {
            // 선호 우세 (파란색 / Blue)
            const opacityVal = Math.min(0.28 + Math.min(netScore, 5) * 0.11, 0.80);
            return {
              ...base,
              color: '#1d4ed8',
              weight: Math.max((base.weight as number) || 2, 2.4),
              opacity: 0.95,
              fillColor: '#3b82f6',
              fillOpacity: opacityVal,
            };
          } else if (netScore < 0) {
            // 비선호 우세 (빨간색 / Red)
            const absNet = Math.abs(netScore);
            const opacityVal = Math.min(0.28 + Math.min(absNet, 5) * 0.11, 0.80);
            return {
              ...base,
              color: '#b91c1c',
              weight: Math.max((base.weight as number) || 2, 2.4),
              opacity: 0.95,
              fillColor: '#ef4444',
              fillOpacity: opacityVal,
            };
          } else {
            // 동률 (보라색 / Purple)
            const totalCount = pCount + dCount;
            const opacityVal = Math.min(0.30 + Math.min(totalCount, 6) * 0.08, 0.75);
            return {
              ...base,
              color: '#7e22ce',
              weight: Math.max((base.weight as number) || 2, 2.4),
              opacity: 0.95,
              fillColor: '#a855f7',
              fillOpacity: opacityVal,
            };
          }
        }
      }
    }

    return base;
  };

  // Function to re-evaluate and apply styles across all active map features
  const updateAllFeatureStyles = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const currentSelectedCode = selectedRegionCodeRef.current;
    const currentPreferences = regionPreferencesRef.current;
    const currentActiveLevel = activeAdminLevelRef.current;
    const currentVis = layerVisibilityRef.current;

    const groups = [
      { group: level1GroupRef.current, level: 1 as AdminLevel },
      { group: level2GroupRef.current, level: 2 as AdminLevel },
      { group: level3GroupRef.current, level: 3 as AdminLevel },
      { group: level4GroupRef.current, level: 4 as AdminLevel },
    ];

    groups.forEach(({ group, level }) => {
      const showPrefLayer = isPrefEnabledForLevel(level, currentVis);

      group.eachLayer((geoJsonLayer: any) => {
        if (geoJsonLayer.eachLayer) {
          geoJsonLayer.eachLayer((layer: any) => {
            const feature = layer.feature;
            if (!feature) return;

            const fCode = String(feature.properties?.code || feature.properties?.SIG_CD || feature.properties?.EMD_CD || feature.properties?.name || '').trim();
            const fName = String(feature.properties?.name || feature.properties?.fullName || '').trim();

            const isSelected = !!currentSelectedCode && (
              currentSelectedCode === fCode ||
              currentSelectedCode === fName
            );

            const newStyle = getFeatureStyle(
              feature,
              level,
              currentActiveLevel,
              currentPreferences,
              showPrefLayer,
              isSelected
            );

            layer.setStyle(newStyle);
          });
        }
      });
    });
  };

  // Re-apply feature styles reactively whenever preferences, selection, layer visibility, or mapType change
  useEffect(() => {
    mapTypeRef.current = mapType;
    updateAllFeatureStyles();
  }, [mapType, selectedRegionCode, regionPreferences, layerVisibility]);

  // Switch displayed boundary group based on active level & visibility setting
  const updateBoundaryVisibility = (zoom: number, isVisible: boolean) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const currentLevel = calculateAdminLevel(zoom);
    setActiveAdminLevel(currentLevel);
    activeAdminLevelRef.current = currentLevel;

    const levelGroups: Record<AdminLevel, L.FeatureGroup> = {
      1: level1GroupRef.current,
      2: level2GroupRef.current,
      3: level3GroupRef.current,
      4: level4GroupRef.current,
    };

    // If boundary visibility is toggled off, remove all boundary groups
    if (!isVisible) {
      ([1, 2, 3, 4] as AdminLevel[]).forEach((lvl) => {
        if (map.hasLayer(levelGroups[lvl])) {
          map.removeLayer(levelGroups[lvl]);
        }
      });
      return;
    }

    const activeLevelsToDisplay = new Set<AdminLevel>();
    if (currentLevel === 1) {
      activeLevelsToDisplay.add(1);
    } else if (currentLevel === 2) {
      activeLevelsToDisplay.add(1);
      activeLevelsToDisplay.add(2);
    } else if (currentLevel === 3) {
      activeLevelsToDisplay.add(1);
      activeLevelsToDisplay.add(2);
      activeLevelsToDisplay.add(3);
    } else if (currentLevel === 4) {
      activeLevelsToDisplay.add(1);
      activeLevelsToDisplay.add(2);
      activeLevelsToDisplay.add(3);
      activeLevelsToDisplay.add(4);
    }

    ([1, 2, 3, 4] as AdminLevel[]).forEach((lvl) => {
      if (activeLevelsToDisplay.has(lvl)) {
        if (!map.hasLayer(levelGroups[lvl])) {
          map.addLayer(levelGroups[lvl]);
        }
      } else {
        if (map.hasLayer(levelGroups[lvl])) {
          map.removeLayer(levelGroups[lvl]);
        }
      }
    });

    updateAllFeatureStyles();
  };

  // Helper to attach tooltips and click handlers to GeoJSON features
  const createGeoJsonLayer = (data: any, level: AdminLevel) => {
    return L.geoJSON(data, {
      style: (feature) => {
        const properties = feature?.properties || {};
        const fCode = String(properties.code || properties.SIG_CD || properties.EMD_CD || '').trim();
        const fName = String(properties.name || properties.SIG_KOR_NM || properties.CTP_KOR_NM || '').trim();

        const isSelected = !!selectedRegionCodeRef.current && (
          selectedRegionCodeRef.current === fCode ||
          selectedRegionCodeRef.current === fName
        );

        return getFeatureStyle(
          feature,
          level,
          activeAdminLevelRef.current,
          regionPreferencesRef.current,
          isPrefEnabledForLevel(level, layerVisibilityRef.current),
          isSelected
        );
      },
      onEachFeature: (feature, layer) => {
        const rawName = feature.properties?.name || feature.properties?.SIG_KOR_NM || feature.properties?.fullName || '알 수 없음';
        const code = String(feature.properties?.code || feature.properties?.SIG_CD || feature.properties?.EMD_CD || rawName);
        
        let typeInfo = feature.properties?.type || ADMIN_LEVEL_INFOS[level].name;
        let displayName = rawName;

        if (level === 4) {
          typeInfo = '4단계 행정구역';
        }

        // Clean hover tooltip
        layer.bindTooltip(
          `<div class="font-sans px-1 text-center">
            <div class="text-[10px] font-semibold text-slate-500 leading-tight">${typeInfo}</div>
            <div class="text-xs font-bold text-slate-900 leading-snug">${displayName}</div>
          </div>`,
          {
            permanent: false,
            direction: 'center',
            className: 'admin-boundary-tooltip border-0 bg-white/95 shadow-md backdrop-blur-xs rounded-md py-1 px-2 pointer-events-none',
          }
        );

        layer.on({
          mouseover: (e) => {
            const target = e.target;
            const targetFeature = target.feature;
            if (!targetFeature) return;

            const fCode = String(targetFeature.properties?.code || targetFeature.properties?.SIG_CD || targetFeature.properties?.EMD_CD || '').trim();
            const fName = String(targetFeature.properties?.name || targetFeature.properties?.fullName || '').trim();

            const isSelected = !!selectedRegionCodeRef.current && (
              selectedRegionCodeRef.current === fCode ||
              selectedRegionCodeRef.current === fName
            );

            const currStyle = getFeatureStyle(
              targetFeature,
              level,
              activeAdminLevelRef.current,
              regionPreferencesRef.current,
              isPrefEnabledForLevel(level, layerVisibilityRef.current),
              isSelected
            );

            target.setStyle({
              ...currStyle,
              weight: (currStyle.weight as number) + 1.2,
              fillOpacity: Math.min((currStyle.fillOpacity as number) + 0.15, 0.8),
            });
          },
          mouseout: (e) => {
            const target = e.target;
            const targetFeature = target.feature;
            if (!targetFeature) return;

            const fCode = String(targetFeature.properties?.code || targetFeature.properties?.SIG_CD || targetFeature.properties?.EMD_CD || '').trim();
            const fName = String(targetFeature.properties?.name || targetFeature.properties?.fullName || '').trim();

            const isSelected = !!selectedRegionCodeRef.current && (
              selectedRegionCodeRef.current === fCode ||
              selectedRegionCodeRef.current === fName
            );

            const normStyle = getFeatureStyle(
              targetFeature,
              level,
              activeAdminLevelRef.current,
              regionPreferencesRef.current,
              isPrefEnabledForLevel(level, layerVisibilityRef.current),
              isSelected
            );

            target.setStyle(normStyle);
          },
          click: (e) => {
            if (e.originalEvent && e.originalEvent.target) {
              (e.originalEvent.target as HTMLElement).blur?.();
            }

            const map = mapInstanceRef.current;
            if (map && e.target && typeof e.target.getBounds === 'function') {
              const bounds = e.target.getBounds();
              if (bounds && bounds.isValid()) {
                map.panTo(bounds.getCenter(), {
                  animate: true,
                  duration: 0.8,
                });
              }
            }

            onSelectRegion(code, displayName);
          },
        });
      },
    });
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [37.5665, 126.9780],
      zoom: 11,
      zoomControl: false,
    });

    L.control.zoom({ position: 'topright' }).addTo(map);

    // Base Tile Layers
    const standardTileUrl = mapApiKey
      ? `https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&key=${mapApiKey}`
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    const satelliteTileUrl = mapApiKey
      ? `https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}&key=${mapApiKey}`
      : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

    const standardTile = L.tileLayer(standardTileUrl, {
      maxZoom: 19,
      attribution: mapApiKey
        ? '&copy; Google Maps API'
        : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
    });

    const satelliteTile = L.tileLayer(satelliteTileUrl, {
      maxZoom: 19,
      attribution: mapApiKey ? '&copy; Google Maps API Satellite' : 'Tiles &copy; Esri',
    });

    standardTileRef.current = standardTile;
    satelliteTileRef.current = satelliteTile;
    standardTile.addTo(map);

    mapInstanceRef.current = map;

    // Listen to map zoom changes
    const handleZoom = () => {
      if (!mapInstanceRef.current) return;
      const z = mapInstanceRef.current.getZoom();
      setZoomLevel(z);
      const lvl = calculateAdminLevel(z);
      updateBoundaryVisibility(z, layerVisibility.boundary);
      onZoomChange?.(z, lvl);
    };

    map.on('zoom zoomend', handleZoom);

    // Async fetch nationwide GeoJSON (Level 1, Level 2, Level 3, Level 4)
    setIsLoadingGeoData(true);
    fetchNationwideGeoJson().then(({ level1, level2, level3, level4 }) => {
      if (!mapInstanceRef.current) return;

      // Level 1 (광역자치단체)
      level1GroupRef.current.clearLayers();
      if (level1) {
        const l1Layer = createGeoJsonLayer(level1, 1);
        level1GroupRef.current.addLayer(l1Layer);
      }

      // Level 2 (기초자치단체)
      level2GroupRef.current.clearLayers();
      if (level2) {
        const l2Layer = createGeoJsonLayer(level2, 2);
        level2GroupRef.current.addLayer(l2Layer);
      }

      // Level 3 (3단계 행정구역: 일반구/행정구)
      level3GroupRef.current.clearLayers();
      if (level3) {
        const l3Layer = createGeoJsonLayer(level3, 3);
        level3GroupRef.current.addLayer(l3Layer);
      }

      // Level 4 (4단계 행정구역: 전국 읍·면·동)
      level4GroupRef.current.clearLayers();
      if (level4) {
        const l4Layer = createGeoJsonLayer(level4, 4);
        level4GroupRef.current.addLayer(l4Layer);
      }

      setIsLoadingGeoData(false);

      // Apply initial boundary visibility
      updateBoundaryVisibility(mapInstanceRef.current.getZoom(), layerVisibility.boundary);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update layer visibility when layerVisibility prop changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      updateBoundaryVisibility(mapInstanceRef.current.getZoom(), layerVisibility.boundary);
    }
  }, [layerVisibility.boundary]);

  // ResizeObserver for clean map canvas resizing without bouncing
  useEffect(() => {
    if (!mapContainerRef.current) return;
    const observer = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize({ animate: false });
      }
    });
    observer.observe(mapContainerRef.current);
    return () => observer.disconnect();
  }, []);

  // Fly camera to selected region when selectedRegionCode changes
  useEffect(() => {
    if (!selectedRegionCode || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    const groups = [
      level4GroupRef.current,
      level3GroupRef.current,
      level2GroupRef.current,
      level1GroupRef.current,
    ];

    for (const group of groups) {
      let foundBounds: L.LatLngBounds | null = null;
      group.eachLayer((geoJsonLayer: any) => {
        if (foundBounds) return;
        if (geoJsonLayer.eachLayer) {
          geoJsonLayer.eachLayer((layer: any) => {
            if (foundBounds) return;
            const feature = layer.feature;
            if (!feature) return;
            const fCode = String(feature.properties?.code || feature.properties?.SIG_CD || feature.properties?.EMD_CD || '').trim();
            const fName = String(feature.properties?.name || feature.properties?.fullName || '').trim();

            if (selectedRegionCode === fCode || selectedRegionCode === fName) {
              if (layer.getBounds && layer.getBounds().isValid()) {
                foundBounds = layer.getBounds();
              }
            }
          });
        }
      });

      if (foundBounds) {
        map.panTo(foundBounds.getCenter(), {
          animate: true,
          duration: 0.8,
        });
        break;
      }
    }
  }, [selectedRegionCode]);

  // Switch Base Map (Standard vs Satellite)
  const handleToggleMapType = (type: 'standard' | 'satellite') => {
    if (!mapInstanceRef.current || type === mapType) return;
    const map = mapInstanceRef.current;

    if (type === 'satellite') {
      if (standardTileRef.current && map.hasLayer(standardTileRef.current)) {
        map.removeLayer(standardTileRef.current);
      }
      if (satelliteTileRef.current && !map.hasLayer(satelliteTileRef.current)) {
        satelliteTileRef.current.addTo(map);
      }
    } else {
      if (satelliteTileRef.current && map.hasLayer(satelliteTileRef.current)) {
        map.removeLayer(satelliteTileRef.current);
      }
      if (standardTileRef.current && !map.hasLayer(standardTileRef.current)) {
        standardTileRef.current.addTo(map);
      }
    }
    mapTypeRef.current = type;
    setMapType(type);
    updateAllFeatureStyles();
  };

  const currentLevelInfo = ADMIN_LEVEL_INFOS[activeAdminLevel];

  return (
    <div className="relative w-full h-full bg-[#CBD5E0]">
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Loading Indicator for Nationwide GeoJSON */}
      {isLoadingGeoData && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 bg-slate-900/90 text-white text-xs px-3.5 py-2 rounded-full shadow-lg backdrop-blur-md flex items-center space-x-2 border border-slate-700 animate-pulse">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
          <span>대한민국 전국 행정구역(시도/시군구/일반구/읍면동) 경계 로딩 중...</span>
        </div>
      )}

      {/* Floating Bottom Zoom Level Badge (Positioned above Google Maps API attribution) */}
      <div className="absolute bottom-8 right-3 z-10 bg-white/70 backdrop-blur-md px-2.5 py-1 rounded-md shadow-2xs border border-slate-200/70 flex items-center space-x-1.5 font-sans text-[11px] font-bold text-slate-800 select-none pointer-events-none transition-all">
        <span className="flex h-1.5 w-1.5 relative shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-600"></span>
        </span>
        <span className="text-slate-800 font-bold whitespace-nowrap">
          Level {activeAdminLevel}: {currentLevelInfo.name}
        </span>
      </div>

      {/* Horizontal Floating Map Type Switcher Badge (Positioned to the left of zoom controls) */}
      <div className="absolute top-2.5 right-14 z-10 bg-white/95 backdrop-blur-md p-1 rounded-xl shadow-md border border-slate-200/80 flex items-center space-x-1 font-sans text-xs select-none pointer-events-auto">
        <button
          onClick={() => handleToggleMapType('standard')}
          title="일반 지도"
          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            mapType === 'standard'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-3.5 h-3.5 shrink-0" />
          <span>일반</span>
        </button>
        <button
          onClick={() => handleToggleMapType('satellite')}
          title="위성 지도"
          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            mapType === 'satellite'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Globe className="w-3.5 h-3.5 shrink-0" />
          <span>위성</span>
        </button>
      </div>
    </div>
  );
};
