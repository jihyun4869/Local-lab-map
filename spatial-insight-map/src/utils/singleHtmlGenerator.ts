export function generateStandaloneHtml(): string {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>동네연구소 (Local Lab)</title>
  <!-- Leaflet CSS -->
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <!-- Leaflet JS -->
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Google Fonts -->
  <link href="https://fonts.googleapis.com/css2?family=Pretendard:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif; }
    #map { height: 100vh; width: 100%; }
    .custom-scrollbar::-webkit-scrollbar {
      width: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 4px;
    }
  </style>
</head>
<body class="bg-[#F1F3F5] text-gray-800 antialiased overflow-hidden select-none">
  <div class="flex h-screen w-screen overflow-hidden">
    <!-- 좌측 사이드바 -->
    <aside id="left-sidebar" class="w-[215px] bg-white text-gray-800 flex flex-col border-r border-gray-200 z-20 shadow-xl shrink-0 font-sans transition-all duration-300">
      <!-- Header -->
      <div class="p-3 border-b border-gray-100 bg-white flex items-center justify-between">
        <div class="flex items-center space-x-2 min-w-0">
          <div class="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-md shadow-indigo-200 shrink-0">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><line x1="8" y1="2" x2="8" y2="18" stroke-width="2.5"/><line x1="16" y1="6" x2="16" y2="22" stroke-width="2.5"/></svg>
          </div>
          <div class="min-w-0">
            <h1 class="text-sm font-bold text-gray-900 leading-tight truncate">동네연구소</h1>
            <p class="text-[10px] font-semibold text-indigo-500 uppercase tracking-wider truncate">Local Lab</p>
          </div>
        </div>
      </div>

      <!-- 정보 안내 -->
      <div class="flex-1 overflow-y-auto p-3 space-y-3.5 text-xs text-gray-500">
        <div class="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
          <div class="text-gray-800 font-bold mb-1">💡 안내</div>
          <p class="text-[11px] text-gray-600">지도가 정상적으로 초기화되었습니다.</p>
        </div>
      </div>
    </aside>

    <!-- 중앙 지도 영역 -->
    <main id="main-map-container" class="flex-1 relative bg-[#CBD5E0] h-full overflow-hidden">
      <!-- Floating Zoom Level Indicator -->
      <div class="absolute bottom-7 right-3 z-10 bg-white/80 backdrop-blur-xs px-2.5 py-1 rounded-md shadow-sm border border-slate-300/60 flex items-center space-x-1.5 font-sans text-xs font-semibold text-slate-700 select-none pointer-events-none">
        <span id="zoom-level-badge" class="tabular-nums">Zoom: 11.0</span>
      </div>

      <!-- Floating Map Type Switcher -->
      <div class="absolute top-[82px] right-3 z-10 bg-white/95 backdrop-blur-md p-1 rounded-xl shadow-lg border border-slate-200/80 flex flex-col space-y-1 font-sans transition-all duration-300 ease-in-out w-[34px] hover:w-[60px] overflow-hidden group">
        <button id="map-type-standard-btn" title="일반 지도" class="h-7 px-1 rounded-lg text-xs font-bold transition-all bg-indigo-600 text-white shadow-xs cursor-pointer flex items-center justify-start space-x-1 w-full">
          <svg class="w-4 h-4 shrink-0 mx-auto group-hover:mx-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polygon points="12 2 2 7 12 12 22 7 12 2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><polyline points="2 17 12 22 22 17" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><polyline points="2 12 17 22 12" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <span class="hidden group-hover:inline text-[11px] whitespace-nowrap">일반</span>
        </button>
        <button id="map-type-satellite-btn" title="위성 지도" class="h-7 px-1 rounded-lg text-xs font-bold transition-all text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer flex items-center justify-start space-x-1 w-full">
          <svg class="w-4 h-4 shrink-0 mx-auto group-hover:mx-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-width="2"/><line x1="2" y1="12" x2="22" y2="12" stroke-width="2"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke-width="2"/></svg>
          <span class="hidden group-hover:inline text-[11px] whitespace-nowrap">위성</span>
        </button>
      </div>

      <div id="map" class="w-full h-full z-0"></div>
    </main>
  </div>

  <script>
    document.addEventListener('DOMContentLoaded', function() {
      var map = L.map('map', {
        center: [37.5665, 126.9780],
        zoom: 11,
        zoomControl: false
      });

      L.control.zoom({ position: 'topright' }).addTo(map);

      var standardTile = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap &copy; CARTO'
      });

      var satelliteTile = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        attribution: 'Tiles &copy; Esri'
      });

      standardTile.addTo(map);

      var currentTile = 'standard';
      document.getElementById('map-type-standard-btn').addEventListener('click', function() {
        if (currentTile !== 'standard') {
          map.removeLayer(satelliteTile);
          standardTile.addTo(map);
          currentTile = 'standard';
          document.getElementById('map-type-standard-btn').className = 'h-7 px-1 rounded-lg text-xs font-bold transition-all bg-indigo-600 text-white shadow-xs cursor-pointer flex items-center justify-start space-x-1 w-full';
          document.getElementById('map-type-satellite-btn').className = 'h-7 px-1 rounded-lg text-xs font-bold transition-all text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer flex items-center justify-start space-x-1 w-full';
        }
      });

      document.getElementById('map-type-satellite-btn').addEventListener('click', function() {
        if (currentTile !== 'satellite') {
          map.removeLayer(standardTile);
          satelliteTile.addTo(map);
          currentTile = 'satellite';
          document.getElementById('map-type-satellite-btn').className = 'h-7 px-1 rounded-lg text-xs font-bold transition-all text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer flex items-center justify-start space-x-1 w-full';
          document.getElementById('map-type-satellite-btn').className = 'h-7 px-1 rounded-lg text-xs font-bold transition-all bg-indigo-600 text-white shadow-xs cursor-pointer flex items-center justify-start space-x-1 w-full';
        }
      });

      map.on('zoom zoomend', function() {
        var z = map.getZoom();
        document.getElementById('zoom-level-badge').innerText = 'Zoom: ' + z.toFixed(1);
      });
    });
  </script>
</body>
</html>`;
}
