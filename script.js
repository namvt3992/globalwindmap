document.addEventListener('DOMContentLoaded', function() {
    // 1. CẤU HÌNH VÀ KHỞI TẠO
    const googleSheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSruhHblUuHLmn0AL5SaiQhM1Rm2gvWMRdhgtA5qMfdpdQazLWa8QRyCWkL8g7Id81UUV4KZS7rzpNG/pub?gid=0&single=true&output=csv';
    const map = L.map('map', { minZoom: 2, worldCopyJump: true, zoomControl: false }).setView([20, 0], 2);
    L.control.zoom({ position: 'topleft' }).addTo(map);

    const openTopoMap = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', { maxZoom: 17, attribution: 'Map data: © OpenStreetMap contributors, SRTM | Map style: © OpenTopoMap (CC-BY-SA)' });
    const openStreetMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap contributors' });
    openTopoMap.addTo(map);
    const baseMaps = { "Topographic Map": openTopoMap, "Street Map": openStreetMap };
    
    const mapControlsContainer = document.querySelector('.map-controls');
    const layerControl = L.control.layers(baseMaps, null, { position: 'topright' });
    layerControl.addTo(map);
    mapControlsContainer.prepend(layerControl.getContainer());

    let allGeoJsonData = null, statusColors = {}, layers = {}, statisticsChart = null;

    const countryFilterElement = document.getElementById('country-filter');
    const projectFilterElement = document.getElementById('project-filter');
    const countryChoice = new Choices(countryFilterElement, { searchResultLimit: 10, itemSelectText: '' });
    const projectChoice = new Choices(projectFilterElement, { searchResultLimit: 10, itemSelectText: '' });

    const infoPanel = document.getElementById('info-panel'), closeBtn = document.getElementById('close-btn');
    const statusFilterBtn = document.getElementById('status-filter-btn'), statusPanel = document.getElementById('status-panel');
    const closeStatusPanelBtn = document.getElementById('close-status-panel-btn'), statusListContainer = document.getElementById('status-list-container');
    const statsToggleBtn = document.getElementById('stats-toggle-btn');
    const summaryBox = L.control({ position: 'bottomright' });

    // 2. TẢI VÀ XỬ LÝ DỮ LIỆU
    fetch(googleSheetUrl).then(response => response.text()).then(csvText => {
        allGeoJsonData = csvToGeoJSON(csvText.trim());
        initializeDynamicStatusFilter(allGeoJsonData);
        populateCountryFilter(allGeoJsonData);
        updateProjectFilter();
        applyFilters();
    }).catch(error => { console.error('Lỗi khi tải dữ liệu:', error); alert('Không thể tải dữ liệu.'); });
        
    // 3. CÁC HÀM XỬ LÝ FILTER
    function populateCountryFilter(geojsonData) {
        countryChoice.clearStore();
        const countries = [...new Set(geojsonData.features.map(f => f.properties.Country))].sort();
        const choicesArray = [{ value: 'all', label: 'All Countries', selected: true }];
        countries.forEach(country => choicesArray.push({ value: country, label: country }));
        countryChoice.setChoices(choicesArray, 'value', 'label', false);
    }

    function updateProjectFilter() {
        projectChoice.clearStore();
        const selectedCountry = countryChoice.getValue(true) || 'all';
        let projects = [];
        if (allGeoJsonData) {
            if (selectedCountry === 'all') {
                projects = [...new Set(allGeoJsonData.features.map(f => f.properties['Project Name']))].sort();
            } else {
                projects = [...new Set(allGeoJsonData.features.filter(f => f.properties.Country === selectedCountry).map(f => f.properties['Project Name']))].sort();
            }
        }
        const choicesArray = [{ value: 'all', label: 'All Projects', selected: true }];
        projects.forEach(project => choicesArray.push({ value: project, label: project }));
        projectChoice.setChoices(choicesArray, 'value', 'label', false);
    }

    function applyFilters() { 
        if (!allGeoJsonData) return; 
        const selectedCountry = countryChoice.getValue(true);
        const selectedProject = projectChoice.getValue(true);
        const selectedStatuses = Array.from(document.querySelectorAll('#status-list-container input[type="checkbox"]')).filter(cb => cb.checked).map(cb => cb.value);
        
        const filteredFeatures = allGeoJsonData.features.filter(feature => {
            const countryMatch = (selectedCountry === 'all' || feature.properties.Country === selectedCountry);
            const projectMatch = (selectedProject === 'all' || feature.properties['Project Name'] === selectedProject);
            // SỬA: Sử dụng cột 'Project Status'
            const statusMatch = selectedStatuses.includes(feature.properties['Project Status'].trim());
            return countryMatch && projectMatch && statusMatch;
        });

        Object.values(layers).forEach(layer => map.removeLayer(layer));
        Object.keys(layers).forEach(status => layers[status].clearLayers());
        
        L.geoJSON(filteredFeatures, { 
            pointToLayer: (feature, latlng) => { 
                // SỬA: Sử dụng cột 'Project Status'
                const status = feature.properties['Project Status'].trim(); 
                return L.circleMarker(latlng, { radius: 8, fillColor: statusColors[status] || '#6c757d', color: '#000', weight: 1.5, opacity: 1, fillOpacity: 0.8 }); 
            }, 
            onEachFeature: function(feature, layer) { 
                // SỬA: Sử dụng cột 'Project Status'
                const status = feature.properties['Project Status'].trim(); 
                if (layers[status]) { layers[status].addLayer(layer); } 
                onEachFeature(feature, layer); 
            } 
        });
        Object.values(layers).forEach(layer => map.addLayer(layer));
        summaryBox.update(filteredFeatures, selectedCountry);
        
        // Logic Zoom
        if (selectedCountry === 'all' && selectedProject === 'all') { 
            map.flyTo([20, 0], 2); 
        } else if (countryData[selectedCountry]) { 
            const data = countryData[selectedCountry]; 
            map.flyTo([data.lat, data.lon], data.zoom); 
        } else if (filteredFeatures.length > 0) { 
            const [lon, lat] = filteredFeatures[0].geometry.coordinates; 
            map.flyTo([lat, lon], 7); 
        }
    }
    
    // 4. CÁC HÀM TIỆN ÍCH & CHART
    summaryBox.onAdd = function(map) { this._div = L.DomUtil.create('div', 'summary-box'); return this._div; };
    summaryBox.update = function(features = [], country = 'all') { 
        this._div.innerHTML = '';
        const closeBtnHTML = `<span id="close-stats-btn" class="close-button">&times;</span>`;
        if (!features || features.length === 0) {
            this._div.innerHTML = `<h3>No data to display.</h3>${closeBtnHTML}`;
        } else {
            const titleText = (country === 'all') ? 'Global Statistics' : `Statistics in ${country}`;
            // SỬA: Sử dụng cột 'Project Status' để đếm
            const counts = features.reduce((acc, f) => { const status = f.properties['Project Status'].trim(); acc[status] = (acc[status] || 0) + 1; return acc; }, {});
            const sortedCounts = Object.entries(counts).sort(([,a],[,b]) => b-a);
            let totalProjects = 0;
            let tableHTML = '<table class="stats-table">';
            sortedCounts.forEach(([status, count]) => { totalProjects += count; tableHTML += `<tr><td class="status-cell"><span class="status-dot" style="background-color: ${statusColors[status] || '#ccc'}"></span>${status}</td><td class="count-cell">${count}</td></tr>`; });
            tableHTML += `<tr class="total-row"><td>Total</td><td class="count-cell">${totalProjects}</td></tr></table>`;
            this._div.innerHTML = `<h3>${titleText}</h3>${closeBtnHTML}<div id="stats-chart-container"><canvas id="stats-chart"></canvas></div>${tableHTML}`;
            
            this._div.querySelector('#close-stats-btn').addEventListener('click', () => this.getContainer().classList.remove('summary-box-visible'));

            const labels = sortedCounts.map(item => item[0]);
            const data = sortedCounts.map(item => item[1]);
            const backgroundColors = labels.map(label => statusColors[label] || '#cccccc');
            const ctx = document.getElementById('stats-chart').getContext('2d');
            if (statisticsChart) statisticsChart.destroy();
            statisticsChart = new Chart(ctx, { type: 'bar', data: { labels: labels, datasets: [{ data: data, backgroundColor: backgroundColors }] }, options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { precision: 0 } }, y: { grid: { display: false } } } } });
        }
    };
    summaryBox.addTo(map);

    function generateHslColor(index, total) { const hue = Math.round((index * 360) / total); return `hsl(${hue}, 70%, 50%)`; }
    function initializeDynamicStatusFilter(geojsonData) { 
        // SỬA: Sử dụng cột 'Project Status' để tạo list checkbox
        const uniqueStatuses = [...new Set(geojsonData.features.map(f => f.properties['Project Status'].trim()))].sort(); 
        statusColors = {}; layers = {}; statusListContainer.innerHTML = ''; uniqueStatuses.forEach((status, index) => { const color = generateHslColor(index, uniqueStatuses.length); statusColors[status] = color; layers[status] = L.layerGroup(); const itemHTML = `<label class="status-item" style="--status-color: ${color};"><span class="status-dot" style="background-color: ${color};"></span><span class="status-name">${status}</span><input type="checkbox" value="${status}" checked><span class="slider"></span></label>`; statusListContainer.innerHTML += itemHTML; }); document.querySelectorAll('#status-list-container input[type="checkbox"]').forEach(checkbox => { checkbox.addEventListener('change', applyFilters); }); 
    }

    // --- HÀM XỬ LÝ CSV MẠNH MẼ ---
    function csvToGeoJSON(csv) {
        function parseCSV(text) {
            const result = [];
            let row = [];
            let inQuote = false;
            let currentCell = '';
            for (let i = 0; i < text.length; i++) {
                const char = text[i];
                const nextChar = text[i + 1];
                if (char === '"') {
                    if (inQuote && nextChar === '"') { currentCell += '"'; i++; } 
                    else { inQuote = !inQuote; }
                } else if (char === ',' && !inQuote) {
                    row.push(currentCell.trim()); currentCell = '';
                } else if ((char === '\r' || char === '\n') && !inQuote) {
                    if (char === '\r' && nextChar === '\n') i++;
                    if (currentCell || row.length > 0) row.push(currentCell.trim());
                    if (row.length > 0) result.push(row);
                    row = []; currentCell = '';
                } else { currentCell += char; }
            }
            if (currentCell || row.length > 0) { row.push(currentCell.trim()); result.push(row); }
            return result;
        }

        const data = parseCSV(csv);
        if (data.length < 2) return { type: 'FeatureCollection', features: [] };
        
        const headers = data[0].map(h => h.trim());
        const features = [];

        for (let i = 1; i < data.length; i++) {
            const currentline = data[i];
            if (currentline.length < headers.length) continue;
            const properties = {};
            headers.forEach((header, index) => { properties[header] = currentline[index] || ''; });

            // SỬ DỤNG Latitude và Longitude (L viết hoa)
            if (properties.Latitude && properties.Longitude && !isNaN(parseFloat(properties.Latitude)) && !isNaN(parseFloat(properties.Longitude))) {
                features.push({ type: 'Feature', geometry: { type: 'Point', coordinates: [parseFloat(properties.Longitude), parseFloat(properties.Latitude)] }, properties: properties });
            }
        }
        return { type: 'FeatureCollection', features: features };
    }

    function onEachFeature(feature, layer) { layer.on('click', () => { displayInfo(feature.properties); infoPanel.classList.add('sidebar-visible'); }); }
    
    function displayInfo(properties) { 
        document.getElementById('info-project-name').textContent = properties['Project Name'] || 'N/A'; 
        // SỬA: Lấy dữ liệu từ cột 'Project Status'
        document.getElementById('info-status').textContent = properties['Project Status'] || 'N/A'; 
        document.getElementById('info-country').textContent = properties.Country || 'N/A'; 
        document.getElementById('info-capacity').textContent = properties.Capacity ? `${properties.Capacity} MW` : 'N/A'; 
        
        const detailsContainer = document.getElementById('info-details-container'); 
        detailsContainer.innerHTML = ''; 
        
        // SỬA: Thêm 'Project Status' vào danh sách loại trừ để không bị lặp
        const excludedKeys = ['Project Name', 'Project Status', 'Country', 'Capacity', 'Latitude', 'Longitude']; 
        
        for (const key in properties) { 
            if (!excludedKeys.includes(key) && properties[key] && properties[key].trim() !== '') { 
                const itemDiv = document.createElement('div'); 
                itemDiv.className = 'detail-item'; 
                const displayValue = properties[key].replace(/\n/g, '<br>');
                itemDiv.innerHTML = `<span class="detail-item-label">${key}</span><span class="detail-item-value">${displayValue}</span>`; 
                detailsContainer.appendChild(itemDiv); 
            } 
        } 
    }

    // 5. GẮN SỰ KIỆN
    countryFilterElement.addEventListener('change', () => { updateProjectFilter(); applyFilters(); });
    projectFilterElement.addEventListener('change', applyFilters);
    closeBtn.addEventListener('click', () => { infoPanel.classList.remove('sidebar-visible'); });
    statusFilterBtn.addEventListener('click', () => { statusPanel.classList.toggle('status-panel-hidden'); });
    closeStatusPanelBtn.addEventListener('click', () => { statusPanel.classList.add('status-panel-hidden'); });
    statsToggleBtn.addEventListener('click', () => { summaryBox.getContainer().classList.toggle('summary-box-visible'); });

    // --- LOGIC KÉO GIÃN SIDEBAR (RESIZE) ---
    const sidebar = document.getElementById('info-panel');
    const resizeHandle = document.getElementById('resize-handle');
    let isResizing = false;

    resizeHandle.addEventListener('mousedown', (e) => {
        isResizing = true;
        sidebar.classList.add('resizing');
        document.body.style.cursor = 'col-resize';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;
        let newWidth = e.clientX;
        if (newWidth < 300) newWidth = 300;
        if (newWidth > window.innerWidth * 0.9) newWidth = window.innerWidth * 0.9;
        sidebar.style.width = `${newWidth}px`;
    });

    document.addEventListener('mouseup', () => {
        if (isResizing) {
            isResizing = false;
            sidebar.classList.remove('resizing');
            document.body.style.cursor = 'default';
        }
    });
});