import sys
import json
import csv
import os
import requests
from datetime import datetime

# ==========================================
# CONFIGURATION
# ==========================================
CONFIG = {
    'API_KEY': '579b464db66ec23bdd000001de83fc07b14447535ee3b0203e7e5f2e',
    'API_URL': 'https://api.data.gov.in/resource/35985678-0d79-46b4-9cd6-6f13308a1d24',
    'state': 'Uttar Pradesh'
}

TARGET_CROPS = [
    "Wheat", "Paddy", "Tomato", "Potato", "Onion", "Mustard", "Garlic", 
    "Pea", "Gram", "Lentil", "Sugarcane", "Maize", "Bajra", "Jowar", "Barley", 
    "Cauliflower", "Cabbage", "Radish", "Carrot", "Brinjal", "Chilli", "Okra", 
    "Bottle Gourd", "Pumpkin", "Spinach", "Fenugreek", "Coriander", "Moong", 
    "Urad", "Arhar", "Soyabean", "Cotton"
]

def fetch_and_save_data(target_district="Lucknow"):
    print(f"🚀 Fetching REAL Live Data for District: {target_district}")
    
    params = {
        'api-key': CONFIG['API_KEY'],
        'format': 'json',
        'limit': 1000,
        'filters[state]': CONFIG['state'],
        'filters[district]': target_district
    }

    try:
        response = requests.get(CONFIG['API_URL'], params=params)
        
        if response.status_code == 200:
            data = response.json()
            records = data.get('records', [])
            
            filtered_data = []
            for record in records:
                commodity = record.get('commodity', '')
                if any(crop.lower() in commodity.lower() for crop in TARGET_CROPS):
                    filtered_data.append({
                        "Crop": commodity.title(),
                        "District": record.get('district'),
                        "Market": record.get('market'),
                        "Modal Price": record.get('modal_price'),
                        "Min Price": record.get('min_price'),
                        "Arrival Date": record.get('arrival_date')
                    })
            
            if not filtered_data:
                print(f"⚠️ No real data available today for the 32 crops in {target_district}.")
                return
                
            print(f"✅ Success: Found {len(filtered_data)} matching records. Saving files...")
            
            # Save to JSON
            date_str = datetime.now().strftime('%Y-%m-%d')
            base_dir = os.path.dirname(os.path.abspath(__file__))
            
            json_file = os.path.join(base_dir, f'mandi_data_{target_district}_{date_str}.json')
            with open(json_file, 'w', encoding='utf-8') as f:
                json.dump(filtered_data, f, indent=4)
                
            # Save to CSV
            csv_file = os.path.join(base_dir, f'mandi_data_{target_district}_{date_str}.csv')
            with open(csv_file, 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=filtered_data[0].keys())
                writer.writeheader()
                writer.writerows(filtered_data)
                
            print("💾 Files successfully saved!")
        else:
            print(f"❌ API Error: Connection failed. Status code {response.status_code}")
            
    except Exception as e:
        print(f"❌ Network Error: {e}")

if __name__ == "__main__":
    district = sys.argv[1] if len(sys.argv) > 1 else 'Lucknow'
    fetch_and_save_data(district)