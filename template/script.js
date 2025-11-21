document.addEventListener('DOMContentLoaded', function () {
    //ICONS
    const resIcon = L.icon({
        iconUrl: 'res-icon.png',
        iconSize: [36, 36],
        shadowSize: [36, 36]
    });
    const cafeIcon = L.icon({
        iconUrl: 'cafe-icon.png',
        iconSize: [36, 36],
        shadowSize: [36, 36]
    });
    const hotelIcon = L.icon({
        iconUrl: 'hotel-icon.png',
        iconSize: [36, 36],
        shadowSize: [36, 36]
    });
    const defaultIcon = L.icon({
    });
    

    const map = L.map('map').setView([10.7769, 106.7009], 13);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    //Data fake:
    const mockLocations = [
        {
            id: 1, name: "Phở Trang", category: "restaurant",
            address: "13 Lò Đúc", description: "面条汤.",
            lat: 10.7769, lng: 106.7009
        },
        {
            id: 2, name: "Khách sạn Hoàng Gia", category: "hotel",
            address: "169 Nguyễn Huệ", description: "Khách sạn 1 sao bần hèn.",
            lat: 10.7760, lng: 106.7020
        },
        {
            id: 3, name: "Lowlands Coffee", category: "cafe",
            address: "Dinh Độc Lập", description: "Cafe view xấu.",
            lat: 10.7780, lng: 106.6990
        },
        {
            id: 4, name: "Cơm Tấm Cali", category: "restaurant",
            address: "Quận 69, phường 3 que", description: "Cơm tấm không mắm vì không có nước.",
            lat: 10.7750, lng: 106.6950
        }
    ];

    const markersLayer =  L.layerGroup().addTo(map);

    const detailsPanel = document.getElementById('restaurant-details');
    const placeName = document.getElementById('res-name');
    const placeAddress = document.getElementById('res-address');
    const placeDescription = document.getElementById('res-description');
    const closeBtn = document.getElementById('close-btn');

    //Hàm chọn icon:
    function getIconByCategory(category) {
        if (category === 'restaurant') return resIcon;
        if (category === 'hotel') return hotelIcon;
        if (category === 'cafe') return cafeIcon;
        return defaultIcon;
    }

    //HÀM LỌC MARKER
    function renderMarkers(type){
        
        //Xoá trước
        markersLayer.clearLayers();

        //Lọc
        const taggedLocations = mockLocations.filter(location => {
            return type === 'all' || location.category === type;
        });

        //Tạo marker sau khi lọc
        taggedLocations.forEach(location => {
            const marker = L.marker([location.lat, location.lng], {icon:getIconByCategory(location.category)}).addTo(map);
            
            //Click event
            marker.on('click', function (){
                placeName.textContent =  location.name;
                placeAddress.textContent = "Địa chỉ: " + location.address;
                placeDescription.textContent = location.description;
                detailsPanel.classList.remove('hidden');
            });

            //Thêm marker vào GROUP markersLayer
            marker.addTo(markersLayer);
        
        });
    }

    //HÀM BẤM NÚT LỌC
    const tagButtons = document.querySelectorAll('.tag-btn');

    tagButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            tagButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            const type = this.getAttribute('data-type');
            renderMarkers(type);
        });
    });

    //Đóng cái ô hiển thị chi tiết
    closeBtn.addEventListener('click', () => detailsPanel.classList.add('hidden'));

    //Mặc định hiện toàn bộ
    renderMarkers('all');

    if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(pos => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            L.marker([lat, lng]).addTo(map).bindPopup('Bạn ở đây').openPopup();
            map.setView([lat, lng], 15);
        });
    }
});