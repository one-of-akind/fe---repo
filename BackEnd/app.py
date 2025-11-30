import requests
import math
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# --- 1. HÀM TÍNH KHOẢNG CÁCH (Mang từ bài cũ sang) ---
def calculate_distance(lat1, lon1, lat2, lon2):
    if not lat1 or not lon1 or not lat2 or not lon2:
        return 0
    
    R = 6371000  # Bán kính trái đất (mét)
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2)**2 + \
        math.cos(phi1) * math.cos(phi2) * \
        math.sin(delta_lambda / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return round(R * c)

# --- 2. HÀM DỌN DẸP DỮ LIỆU ---
def map_osm_to_app_data(osm_element):
    tags = osm_element.get('tags', {})
    
    # 1. Xác định Category
    category = 'other'
    amenity = tags.get('amenity', '')
    tourism = tags.get('tourism', '')
    
    if amenity == 'restaurant' or amenity == 'fast_food' or amenity == 'food_court':
        category = 'restaurant'
    elif amenity == 'cafe' or amenity == 'bar' or amenity == 'pub':
        category = 'cafe'
    elif tourism == 'hotel' or tourism == 'guest_house' or tourism == 'hostel':
        category = 'hotel'
    
    # 2. Xử lý Tên
    name = tags.get('name', 'Địa điểm chưa đặt tên')
    
    # 3. Xử lý Địa chỉ (Cố gắng lấy nhiều trường hơn)
    house_number = tags.get('addr:housenumber', '')
    street = tags.get('addr:street', '')
    full_address = tags.get('addr:full', '') # Một số người điền thẳng vào đây
    
    address = ""
    if full_address:
        address = full_address
    elif house_number and street:
        address = f"{house_number} {street}"
    elif street:
        address = f"Đường {street}"
    else:
        address = "Chưa có địa chỉ chi tiết"

    # 4. Xử lý Mô tả (Tạo mô tả phong phú hơn)
    description_parts = []
    
    # - Thêm loại món ăn (Bỏ vì quá ít dữ liệu)
    # cuisine = tags.get('cuisine')
    # if cuisine:
    #    description_parts.append(f"Món: {cuisine.replace('_', ' ').capitalize()}")
        
    # - Thêm giờ mở cửa
    opening_hours = tags.get('opening_hours')
    if opening_hours:
        description_parts.append(f"Giờ mở cửa: {opening_hours}")
        
    # - Thêm số điện thoại
    phone = tags.get('phone') or tags.get('contact:phone')
    if phone:
        description_parts.append(f"SĐT: {phone}")
        
    # - Thêm website
    # website = tags.get('website') or tags.get('contact:website')
    # if website:
    #    description_parts.append("Có website")

    # Ghép các phần lại thành mô tả. Nếu không có gì thì tạo mô tả mặc định dựa theo loại
    if description_parts:
        description = " | ".join(description_parts)
    else:
        if category == 'restaurant': description = "Nhà hàng ăn uống"
        elif category == 'cafe': description = "Quán cafe & đồ uống"
        elif category == 'hotel': description = "Dịch vụ lưu trú"
        else: description = "Địa điểm tham quan"

    return {
        "id": osm_element['id'],
        "name": name,
        "category": category,
        "address": address,
        "description": description,
        "lat": osm_element['lat'],
        "lng": osm_element['lon']
    }

@app.route('/api/locations')
def get_locations():
    # Lấy tọa độ User
    user_lat = request.args.get('lat', type=float)
    user_lng = request.args.get('lng', type=float)
    radius = request.args.get('radius', default=1000, type=int)

    if not user_lat or not user_lng:
        return jsonify([])

    # Gọi OpenStreetMap
    overpass_url = "http://overpass-api.de/api/interpreter"
    overpass_query = f"""
    [out:json];
    (
      node["amenity"="restaurant"](around:{radius},{user_lat},{user_lng});
      node["amenity"="cafe"](around:{radius},{user_lat},{user_lng});
      node["tourism"="hotel"](around:{radius},{user_lat},{user_lng});
    );
    out body;
    """

    try:
        print(f"Đang quét tại {user_lat}, {user_lng}...")
        response = requests.get(overpass_url, params={'data': overpass_query})
        data = response.json()
        
        results = []
        for element in data['elements']:
            if 'tags' in element and 'name' in element['tags']:
                # 1. Format dữ liệu
                formatted_place = map_osm_to_app_data(element)
                
                # 2. TÍNH KHOẢNG CÁCH
                dist = calculate_distance(
                    user_lat, user_lng, 
                    formatted_place['lat'], formatted_place['lng']
                )
                formatted_place['distance'] = dist
                results.append(formatted_place)
        
        # 4. Sắp xếp quán từ gần đến xa
        results.sort(key=lambda x: x['distance'])
        
        print(f"-> Tìm thấy {len(results)} địa điểm.")
        return jsonify(results)

    except Exception as e:
        print("Lỗi:", e)
        return jsonify([])

if __name__ == '__main__':
    app.run(debug=True)