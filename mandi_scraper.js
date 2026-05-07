/**
 * Mandi Rate Scraper - Agmarknet.gov.in
 * Playwright use karke mandi ke bhav scrape karta hai
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// ===== CONFIGURATION - Apni zaroorat ke hisab se badlein =====
const CONFIG = {
  state: 'Uttar Pradesh',    // State ka naam
  district: '',              // Khali chhodein for all districts
  commodity: 'Wheat',        // Fasal ka naam
  date: getTodayDate(),      // Format: DD/MM/YYYY
  outputFile: path.join(__dirname, 'mandi_rates.json'),
  outputCSV: path.join(__dirname, 'mandi_rates.csv'),
};

function getTodayDate() {
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, '0');
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const yyyy = today.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

async function scrapMandiRates() {
  console.log('🌾 Mandi Rate Scraper shuru ho raha hai...');
  console.log(`📅 Aaj ki Taareekh: ${CONFIG.date}`);
  console.log(`📍 State: ${CONFIG.state} | District: ${CONFIG.district || 'All'}`);
  console.log(`🌱 Fasal: ${CONFIG.commodity}`);
  console.log('─'.repeat(60));

  const browser = await chromium.launch({
    headless: true, // headless mode for backend
  });

  const page = await browser.newPage();
  page.setDefaultTimeout(60000); // 60s timeout for slow govt site

  try {
    // ─── STEP 1: Agmarknet portal kholen
    console.log('🔗 Agmarknet portal khul raha hai...');
    await page.goto('https://agmarknet.gov.in/PriceAndArrivals/DatewiseCommodityReport.aspx', {
      waitUntil: 'domcontentloaded',
    });

    await page.waitForTimeout(2000);

    // ─── STEP 2: State select karein
    console.log(`📋 State select ho raha hai: ${CONFIG.state}`);
    const stateDropdown = await page.$('select[id*="State"], select[name*="State"], #ddlState, #cboState');
    if (stateDropdown) {
      await stateDropdown.selectOption({ label: CONFIG.state });
      await page.waitForTimeout(1500);
    } else {
      console.log('⚠️  State dropdown nahi mila');
    }

    // ─── STEP 3: District select karein
    if (CONFIG.district) {
      console.log(`📍 District select ho raha hai: ${CONFIG.district}`);
      const districtDropdown = await page.$('select[id*="District"], select[name*="District"], #ddlDistrict, #cboDistrict');
      if (districtDropdown) {
        await districtDropdown.selectOption({ label: CONFIG.district });
        await page.waitForTimeout(1500);
      }
    }

    // ─── STEP 4: Commodity select karein
    console.log(`🌱 Commodity select ho rahi hai: ${CONFIG.commodity}`);
    const commodityDropdown = await page.$('select[id*="Commodity"], select[name*="Commodity"], #ddlCommodity, #cboCommodity');
    if (commodityDropdown) {
      await commodityDropdown.selectOption({ label: CONFIG.commodity });
      await page.waitForTimeout(1000);
    }

    // ─── STEP 5: Date fill karein
    console.log(`📅 Date bhari ja rahi hai: ${CONFIG.date}`);
    const dateInput = await page.$('input[id*="Date"], input[name*="Date"], #txtDate, #dpDate');
    if (dateInput) {
      await dateInput.fill(CONFIG.date);
      await page.waitForTimeout(500);
    }

    // ─── STEP 6: Submit button click karein 
    console.log('🔍 Search button click ho raha hai...');
    const submitBtn = await page.$('input[type="submit"], button[type="submit"], #btnSubmit, input[value="Go"], input[value="Search"]');
    if (submitBtn) {
      await submitBtn.click();
      await page.waitForTimeout(5000); // Wait longer for results
    }

    // ─── STEP 7: Results extract karein
    console.log('📊 Data nikaala ja raha hai...');
    await page.waitForSelector('table', { timeout: 15000 }).catch(() => {
      console.log('⚠️  Table load nahi hua, data available nahi hai');
    });

    const mandiData = await page.evaluate(() => {
      const results = [];
      const tables = document.querySelectorAll('table');
      
      for (const table of tables) {
        const rows = table.querySelectorAll('tr');
        if (rows.length < 2) continue;

        const headers = [];
        const headerRow = rows[0].querySelectorAll('th, td');
        headerRow.forEach(cell => headers.push(cell.innerText.trim()));

        const hasPriceData = headers.some(h => /price|rate|bhav|min|max|modal/i.test(h));
        if (!hasPriceData) continue;

        for (let i = 1; i < rows.length; i++) {
          const cells = rows[i].querySelectorAll('td');
          if (cells.length === 0) continue;

          const rowData = {};
          cells.forEach((cell, idx) => {
            let key = headers[idx] || `col_${idx}`;
            // Normalize keys for easier parsing by Django
            if(key.toLowerCase().includes('modal price')) key = 'modal_price';
            if(key.toLowerCase().includes('min price')) key = 'min_price';
            if(key.toLowerCase().includes('max price')) key = 'max_price';
            if(key.toLowerCase().includes('market')) key = 'market';
            if(key.toLowerCase().includes('district')) key = 'district';
            if(key.toLowerCase().includes('state')) key = 'state';
            if(key.toLowerCase().includes('commodity')) key = 'commodity';
            
            rowData[key] = cell.innerText.trim();
          });

          if (Object.keys(rowData).length > 0 && rowData['modal_price'] && rowData['modal_price'] !== '') {
            results.push(rowData);
          }
        }
      }
      return results;
    });

    if (mandiData.length === 0) {
      console.log('⚠️  Koi data nahi mila.');
      // Optional logging of page content
    } else {
      console.log(`\n✅ Kul ${mandiData.length} records mile!`);
      
      const output = {
        scraped_at: new Date().toISOString(),
        config: CONFIG,
        total_records: mandiData.length,
        data: mandiData,
      };
      
      fs.writeFileSync(CONFIG.outputFile, JSON.stringify(output, null, 2), 'utf8');
      console.log(`\n💾 JSON file save ho gayi: ${CONFIG.outputFile}`);
    }

  } catch (error) {
    console.error('\n❌ Error aaya:', error.message);
  } finally {
    await browser.close();
    console.log('\n🏁 Scraping complete!');
  }
}

scrapMandiRates();
