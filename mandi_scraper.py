"""
Mandi Rate Fetcher v3.0 - Hybrid (API + Web Scraper)
Features: API integration, CSV/JSON export, Fallback Scraping, Dynamic Dates
"""
import sys
import json
import csv
import os
import time
import requests
from datetime import datetime, timedelta
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout

# ===== CONFIGURATION =====
yesterday = datetime.now() - timedelta(days=1)
two_days_ago = datetime.now() - timedelta(days=2)

date_str = yesterday.strftime('%d-%b-%Y') # Format: 01-Apr-2026
base_dir = os.path.dirname(os.path.abspath(__file__))

CONFIG = {
    # --- API SETTINGS ---
    'USE_API': True,  # True = Use API (Fast), False = Use Web Scraping (Slow)
    'API_KEY': '579b464db66ec23bdd000001de83fc07b14447535ee3b0203e7e5f2e',
    'API_URL': 'https://api.data.gov.in/resource/35985678-0d79-46b4-9cd6-6f13308a1d24', # e.g., https://api.data.gov.in/resource/...
    
    # --- GENERAL SETTINGS ---
    'state': 'Uttar Pradesh',
    'district': 'Lucknow',      # Leave empty '' for all districts
    'date': date_str,       
    'date_fallback': two_days_ago.strftime('%d-%b-%Y'),
    'jsonOutputFile': os.path.join(base_dir, f'mandi_rates_{date_str}.json'),
    'csvOutputFile': os.path.join(base_dir, f'mandi_rates_{date_str}.csv'),
    
    # --- SCRAPER SETTINGS (Used only if USE_API is False) ---
    'max_retries': 2,
    'headless': True,           
}

# All commodities to scrape (Used mainly for Web Scraping)
COMMODITIES = [
    'Wheat', 'Rice', 'Maize', 'Potato', 'Tomato', 'Onion',
    'Mustard', 'Sugarcane', 'Soybean', 'Lentil', 'Chickpea',
]

# ==========================================
#              API FUNCTION
# ==========================================
def fetch_via_api():
    print('=' * 60)
    print('🚀 Mandi Rate API Fetcher v3.0')
    print(f"📅 Target Date: {CONFIG['date']}")
    print('=' * 60)

    params = {
        'api-key': CONFIG['API_KEY'],
        'format': 'json',
        'offset': 0,
        'limit': 3000  # API se zyada records ek baar me lane ke liye
    }

    try:
        response = requests.get(CONFIG['API_URL'], params=params)
        
        if response.status_code == 200:
            data = response.json()
            records = data.get('records', [])
            
            if not records:
                print("⚠️ API hit successful, par data abhi update nahi hua hai.")
                return []
            
            # Agar State/District filter karna ho (kyunki API sab de sakti hai)
            filtered_records = []
            for r in records:
                # API me state/district keys alag ho sakti hain, unhe lowercase me check karein
                api_state = r.get('state', '').lower()
                api_district = r.get('district', '').lower()
                
                state_match = CONFIG['state'].lower() in api_state if CONFIG['state'] else True
                dist_match = CONFIG['district'].lower() in api_district if CONFIG['district'] else True
                
                if state_match and dist_match:
                    filtered_records.append(r)

            print(f"✅ API Success! Found {len(filtered_records)} records for selected State/District.")
            return filtered_records
        else:
            print(f"❌ API Error: Status Code {response.status_code}")
            return []
    except Exception as e:
        print(f"❌ Connection Error: {e}")
        return []


# ==========================================
#          WEB SCRAPING FUNCTIONS
# ==========================================
def wait_and_select(page, selectors_list, label='', value_label=None, value_index=None):
    for sel in selectors_list:
        try:
            el = page.query_selector(sel)
            if el:
                if value_label:
                    el.select_option(label=value_label)
                elif value_index is not None:
                    el.select_option(index=value_index)
                page.wait_for_timeout(1200)
                return True
        except Exception:
            continue
    return False

def fill_date(page, date_str):
    date_selectors = ['input#txtDate', 'input[id*="txtDate"]', '#dpDate']
    for sel in date_selectors:
        try:
            el = page.query_selector(sel)
            if el:
                el.triple_click()
                el.fill(date_str)
                page.wait_for_timeout(500)
                return True
        except Exception:
            continue
    return False

def click_submit(page):
    submit_selectors = ['input#btnSubmit', 'input[value="Submit"]', 'input[type="submit"]']
    for sel in submit_selectors:
        try:
            el = page.query_selector(sel)
            if el:
                el.click()
                page.wait_for_timeout(4000)
                return True
        except Exception:
            continue
    page.keyboard.press('Enter')
    page.wait_for_timeout(4000)
    return False

def extract_table_data(page):
    return page.evaluate("""
    () => {
        const results = [];
        const tables = document.querySelectorAll('table');
        for (const table of tables) {
            const rows = table.querySelectorAll('tr');
            if (rows.length < 2) continue;
            
            const headers = [];
            rows[0].querySelectorAll('th, td').forEach(c => headers.push(c.innerText.trim().toLowerCase()));
            
            if (!headers.some(h => /price|min|max|modal/.test(h))) continue;

            for (let i = 1; i < rows.length; i++) {
                const cells = rows[i].querySelectorAll('td');
                if (cells.length < 3) continue;

                const rowData = {};
                cells.forEach((cell, idx) => {
                    let key = headers[idx] || `col_${idx}`;
                    if (key.includes('modal')) key = 'modal_price';
                    else if (key.includes('min')) key = 'min_price';
                    else if (key.includes('max')) key = 'max_price';
                    else if (key.includes('market')) key = 'market';
                    else if (key.includes('commodity') || key.includes('crop')) key = 'commodity';
                    rowData[key] = cell.innerText.trim();
                });

                if (rowData['modal_price'] && rowData['modal_price'] !== '-' && rowData['modal_price'] !== '') {
                    results.push(rowData);
                }
            }
        }
        return results;
    }
    """)

def scrape_commodity(page, commodity, date, state, district):
    print(f"\n  🌾 Scraping: {commodity} | Date: {date}")
    try:
        page.goto('https://agmarknet.gov.in/PriceAndArrivals/DatewiseCommodityReport.aspx', wait_until='domcontentloaded', timeout=30000)
        page.wait_for_timeout(2000)
    except PlaywrightTimeout:
        return []

    wait_and_select(page, ['select#ddlState', '#cboState'], label='State', value_label=state)
    if district:
        wait_and_select(page, ['select#ddlDistrict', '#cboDistrict'], label='District', value_label=district)
    wait_and_select(page, ['select#ddlCommodity', '#cboCommodity'], label='Commodity', value_label=commodity)
    fill_date(page, date)
    click_submit(page)

    try:
        page.wait_for_selector('table', timeout=12000)
    except PlaywrightTimeout:
        print(f"  ⚠️  Table not loaded for {commodity}")
        return []

    data = extract_table_data(page)
    for row in data:
        row['commodity'] = row.get('commodity') or commodity
        row['state'] = row.get('state') or state
        row['variety'] = row.get('variety') or 'Other'
        if district and not row.get('district'):
            row['district'] = district

    print(f"  ✅ Found {len(data)} records for {commodity}")
    return data

def fetch_via_scraper():
    print('=' * 60)
    print('🌾 Mandi Rate Web Scraper v3.0')
    print(f"📅 Target Date: {CONFIG['date']}")
    print('=' * 60)
    all_data = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=CONFIG['headless'], args=['--no-sandbox'])
        context = browser.new_context(user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122 Safari/537.36')
        page = context.new_page()
        page.set_default_timeout(30000)

        for commodity in COMMODITIES:
            for attempt in range(CONFIG['max_retries']):
                date_to_try = CONFIG['date'] if attempt == 0 else CONFIG['date_fallback']
                try:
                    data = scrape_commodity(page, commodity, date_to_try, CONFIG['state'], CONFIG['district'])
                    if data:
                        all_data.extend(data)
                        break
                    else:
                        print(f"  ↩️  No data, retrying with fallback date ({date_to_try})...")
                except Exception as e:
                    print(f"  ❌ Error: {e}")
            time.sleep(1.5)
        browser.close()
    return all_data


# ==========================================
#             MAIN EXECUTION
# ==========================================
def save_to_csv(data, filename):
    if not data: return
    headers = set()
    for row in data: headers.update(row.keys())
    
    try:
        with open(filename, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=list(headers))
            writer.writeheader()
            writer.writerows(data)
        print(f"  📊 CSV Saved: {filename}")
    except Exception as e:
        print(f"  ❌ Failed to save CSV: {e}")

def main():
    # 1. Decide which method to use
    if CONFIG['USE_API']:
        if 'AAPKI_API_KEY' in CONFIG['API_KEY']:
            print("⚠️ PLEASE SET YOUR API_KEY AND API_URL IN CONFIG FIRST!")
            return
        final_data = fetch_via_api()
    else:
        final_data = fetch_via_scraper()

    # 2. Process and Save Results
    print(f"\n{'=' * 60}")
    if not final_data:
        print("⚠️ No data was fetched.")
        return

    print(f"📊 Total records successfully gathered: {len(final_data)}")

    # Save JSON
    output = {
        "fetched_at": datetime.now().isoformat(),
        "method_used": "API" if CONFIG['USE_API'] else "Web Scraper",
        "total_records": len(final_data),
        "data": final_data,
    }
    with open(CONFIG['jsonOutputFile'], 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    print(f"  💾 JSON Saved: {CONFIG['jsonOutputFile']}")

    # Save CSV
    save_to_csv(final_data, CONFIG['csvOutputFile'])
    print('🏁 Process Complete!\n')


if __name__ == "__main__":
    if len(sys.argv) > 1:
        CONFIG['commodity'] = sys.argv[1]
        COMMODITIES.clear()
        COMMODITIES.append(sys.argv[1])
    main()