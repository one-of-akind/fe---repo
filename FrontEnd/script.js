document.addEventListener('DOMContentLoaded', function () {
    // --- KHỞI TẠO MAP & ICON ---
    const resIcon = L.icon({ iconUrl: 'Assets/res-icon.png', iconSize: [36, 36], shadowSize: [36, 36] });
    const cafeIcon = L.icon({ iconUrl: 'Assets/cafe-icon.png', iconSize: [36, 36], shadowSize: [36, 36] });
    const hotelIcon = L.icon({ iconUrl: 'Assets/hotel-icon.png', iconSize: [36, 36], shadowSize: [36, 36] });
    const defaultIcon = L.icon({});

    const trafficFlowLayer = L.tileLayer(
        "https://api.tomtom.com/traffic/map/4/tile/flow/relative/{z}/{x}/{y}.png?key=l6e2nZO9QtCFvw3Gi69l2NjlwHiElGpC",
        { opacity: 0.8 }
    );
    
    const map = L.map('map').setView([10.7769, 106.7009], 13);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19, attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    let locations = [];
    const markersLayer = L.layerGroup().addTo(map);

    const detailsPanel = document.getElementById('restaurant-details');
    const placeName = document.getElementById('res-name');
    const placeAddress = document.getElementById('res-address');
    const placeDescription = document.getElementById('res-description');
    const closeBtn = document.getElementById('close-btn');

    // --- HÀM GỌI API MỚI (CÓ THAM SỐ) ---
    function fetchLocations(userLat, userLng, radiusInMeters) {
        const apiUrl = `http://127.0.0.1:5000/api/locations?lat=${userLat}&lng=${userLng}&radius=${radiusInMeters}`;

        console.log(`Đang quét dữ liệu thực tế...`);

        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                console.log("Dữ liệu thực tế:", data);
                locations = data;
                renderMarkers('all');
                
            })
            .catch(error => {
                console.error("Lỗi:", error);
                alert("Lỗi kết nối hoặc API quá tải.");
            });
    }

    function getIconByCategory(category) {
        if (category === 'restaurant') return resIcon;
        if (category === 'hotel') return hotelIcon;
        if (category === 'cafe') return cafeIcon;
        return defaultIcon;
    }

    function renderMarkers(type) {
        markersLayer.clearLayers();
        const filteredLocations = locations.filter(location => type === 'all' || location.category === type);

        filteredLocations.forEach(location => {
            const iconToUse = getIconByCategory(location.category);
            const marker = L.marker([location.lat, location.lng], { icon: iconToUse });
            
            marker.on('click', () => {
                placeName.textContent = location.name;
                // Hiển thị thêm khoảng cách
                placeAddress.textContent = `Cách bạn: ${location.distance} mét - Đ/c: ${location.address}`;
                placeDescription.textContent = location.description;
                detailsPanel.classList.remove('hidden');
            });
            marker.addTo(markersLayer);
        });
    }

    // Xử lý nút lọc loại (Giữ nguyên)
    const tagButtons = document.querySelectorAll('.tag-btn');
    tagButtons.forEach(btn => {
        btn.addEventListener('click', function () {
            tagButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            renderMarkers(this.getAttribute('data-type'));
        });
    });
    closeBtn.addEventListener('click', () => detailsPanel.classList.add('hidden'));
    trafficFlowLayer.addTo(map);

    // --- QUY TRÌNH CHÍNH (LOGIC MỚI) ---
    
    // 1. Kiểm tra Geolocation trước
    if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;

                // Di chuyển map về chỗ người dùng
                map.setView([lat, lng], 15);
                L.marker([lat, lng]).addTo(map).bindPopup('Bạn ở đây').openPopup();

                // 2. GỌI API LẤY DỮ LIỆU SAU KHI CÓ VỊ TRÍ
                // Tìm trong bán kính 2000 mét
                fetchLocations(lat, lng, 2000); 
            },
            // THẤT BẠI (User chặn vị trí)
            (error) => {
                alert("Bạn cần cho phép vị trí để tìm quán quanh đây. Đang dùng vị trí mặc định tại TP.HCM");
                // Dùng vị trí mặc định (Quận 1) nếu user chặn
                fetchLocations(10.7769, 106.7009, 5000);
            }
        );
    } else {
        alert("Trình duyệt không hỗ trợ vị trí.");
    }
});