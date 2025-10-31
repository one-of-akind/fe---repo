document.addEventListener('DOMContentLoaded', function () {
    var resIcon = L.icon({
        iconUrl: 'res-icon.png',
        iconSize:     [36, 36]
    });

    const map = L.map('map').setView([10.7769, 106.7009], 13);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    const mockRestaurant = {
        id: 1,
        name: "Phở Fake HCM",
        address: "256 P. Fake Lỏ, Bla, Bla, Bla",
        description: "Một quán phở fake vcl.",
        latitude: 10.7769,
        longitude: 106.7009
    };

    const restaurantMarker = L.marker([mockRestaurant.latitude, mockRestaurant.longitude], 
                                {icon:resIcon}).addTo(map);

    const detailsPanel = document.getElementById('restaurant-details');
    const resName = document.getElementById('res-name');
    const resAddress = document.getElementById('res-address');
    const resDescription = document.getElementById('res-description');
    const closeBtn = document.getElementById('close-btn');

    restaurantMarker.on('click', function () {
        resName.textContent = mockRestaurant.name;
        resAddress.textContent = "Địa chỉ: " + mockRestaurant.address;
        resDescription.textContent = mockRestaurant.description;
        detailsPanel.classList.remove('hidden');
    });
    
    closeBtn.addEventListener('click', function() {
        detailsPanel.classList.add('hidden');
    });

    if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(function(position) {
            map.setView([position.coords.latitude, position.coords.longitude], 15);
            L.marker([position.coords.latitude, position.coords.longitude]).addTo(map)
                .bindPopup('<b>Bạn đang ở đây!</b>').openPopup();
        });
    }
});