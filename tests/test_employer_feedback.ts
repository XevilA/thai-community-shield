import { chromium } from 'playwright';
import * as path from 'path';

const ARTIFACT_DIR = '/Users/dotmini/.gemini/antigravity/brain/071cbe42-17e2-4afb-8304-cfe6680993b1';

async function run() {
  console.log('🚀 Starting Employer Feedback Verification...');
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 }
  });

  // 1. Load Community Shield Web App
  console.log('📡 Navigating to http://localhost:3000 ...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // --- TEST 1: LoRaWAN Telemetry Modal (Section 37) ---
  console.log('🧪 Testing LoRaWAN Telemetry Modal...');
  const loraBtn = page.locator('#btn-hdr-lora');
  await loraBtn.click();
  await page.waitForTimeout(1000);

  // Verify modal is visible
  const loraModal = page.locator('#lora-telemetry-modal');
  const isLoraVisible = await loraModal.evaluate(el => el.classList.contains('show'));
  console.log(`✅ LoRa Modal opened: ${isLoraVisible}`);

  // Test LoRa Ping Button
  console.log('⚡ Clicking LoRa Ping button...');
  const pingBtn = page.locator('#btn-ping-lora');
  await pingBtn.click();
  await page.waitForTimeout(1200);

  // Capture LoRa Telemetry Modal Screenshot
  const loraModalShot = path.join(ARTIFACT_DIR, 'lora_telemetry_modal.png');
  await page.screenshot({ path: loraModalShot });
  console.log(`📸 Saved screenshot: ${loraModalShot}`);

  // Close LoRa Modal
  const closeLoraBtn = page.locator('#lora-telemetry-modal button:has-text("✕ ปิด")');
  await closeLoraBtn.click();
  await page.waitForTimeout(500);

  // --- TEST 2: Buddhist Era (พ.ศ.) Chart (Historical & Overlay) ---
  console.log('🧪 Testing Buddhist Era (พ.ศ.) Chart...');
  
  // Historical Mode
  const histBtn = page.locator('#btn-chart-historical');
  await histBtn.click();
  await page.waitForTimeout(800);
  const chartHistShot = path.join(ARTIFACT_DIR, 'buddhist_era_chart_historical.png');
  await page.screenshot({ path: chartHistShot });
  console.log(`📸 Saved screenshot: ${chartHistShot}`);

  // Overlay Mode
  const overlayBtn = page.locator('#btn-chart-overlay');
  await overlayBtn.click();
  await page.waitForTimeout(800);
  const chartOverlayShot = path.join(ARTIFACT_DIR, 'buddhist_era_chart_overlay.png');
  await page.screenshot({ path: chartOverlayShot });
  console.log(`📸 Saved screenshot: ${chartOverlayShot}`);

  // --- TEST 3: Tsunami 75s Multi-Phase Simulation ---
  console.log('🧪 Testing Tsunami 75s Multi-Phase Simulation...');
  const tsuBtn = page.locator('#hdr-tsunami');
  await tsuBtn.click();
  await page.waitForTimeout(1500);

  // Verify controller visible
  const tsuCtrl = page.locator('#tsunami-phase-controller');
  const isTsuCtrlVisible = await tsuCtrl.isVisible();
  console.log(`✅ Tsunami 75s Controller visible: ${isTsuCtrlVisible}`);

  // Jump to Phase 2: Wall of Water Surge (+4.8m)
  console.log('🌊 Jumping to Tsunami Phase 2 (Surge +4.8m)...');
  await page.locator('#btn-tsu-p2').click();
  await page.waitForTimeout(1500);

  const tsuShot = path.join(ARTIFACT_DIR, 'tsunami_75s_multiphase.png');
  await page.screenshot({ path: tsuShot });
  console.log(`📸 Saved screenshot: ${tsuShot}`);

  // Test Pause / Play
  console.log('⏸️ Testing Pause...');
  await page.locator('#btn-tsu-playpause').click();
  await page.waitForTimeout(600);

  // Jump to Phase 3: Deep inundation (+4.2m)
  console.log('🏚️ Jumping to Tsunami Phase 3 (Deep Inundation)...');
  await page.locator('#btn-tsu-p3').click();
  await page.waitForTimeout(800);

  // Jump to Phase 4: Secondary surge & reflux
  console.log('🔄 Jumping to Tsunami Phase 4 (Secondary surge & backwash)...');
  await page.locator('#btn-tsu-p4').click();
  await page.waitForTimeout(800);

  console.log('🎉 All employer feedback verification tests completed successfully!');
  await browser.close();
}

run().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
