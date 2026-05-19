// content.js
// ─────────────────────────────────────────────────────────────────────────────
// Accommodate Timer Alert — Content Script
// Targets Symplicity Accommodate test monitoring view.
// Timer format: "X min" (e.g. "150 min" for elapsed or allowed time)
// ─────────────────────────────────────────────────────────────────────────────

const SCAN_INTERVAL_MS = 2000;
const alerted = new Set();
let alarmPlaying = false;

console.log('CONTENT SCRIPT LOADED:', window.location.href);

// ── Audio: gentle bell using Web Audio API ──────────────────────────────────

function playAlarm() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    function tone(freq, startTime, duration) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.4, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.start(startTime);
      osc.stop(startTime + duration);
    }
    tone(880, ctx.currentTime, 1.2);
    tone(660, ctx.currentTime + 0.5, 1.2);
    tone(440, ctx.currentTime + 1.0, 1.5);
  } catch (e) {
    console.warn('[AccommodateAlert] Audio failed:', e);
  }
}

// ── Banner notification ──────────────────────────────────────────────────────
function showBanner(label) {

  const style = document.createElement('style');
  style.textContent = `
    @keyframes accSlideIn {
      from { opacity: 0; transform: translateX(30px); }
      to   { opacity: 1; transform: translateX(0); }
    }
  `;
  document.head.appendChild(style);







  const banners = document.querySelectorAll('.accommodate-alert-banner');

  const offset = 16 + (banners.length * 90);

  const banner = document.createElement('div');

  banner.className = 'accommodate-alert-banner';

  banner.style.cssText = `
    position: fixed;
    top: ${offset}px;
    right: 16px;
    z-index: 999999;
    background: #ef4444;
    color: white;
    padding: 14px 20px;
    border-radius: 10px;
    font-family: sans-serif;
    font-size: 15px;
    font-weight: 600;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    gap: 10px;
    animation: accSlideIn 0.3s ease;
    max-width: 380px;
  `;
  banner.innerHTML = `
    <span style="font-size:22px">⏰</span>
    <div>
      <div>TIME COMPLETE</div>
      <div style="font-weight:400;font-size:13px;margin-top:2px">${label}</div>
    </div>
    <button onclick="this.parentElement.remove()" style="
      margin-left:auto; background:none; border:none; color:white;
      cursor:pointer; font-size:18px; line-height:1;">&times;</button>
  `;
  document.body.appendChild(banner);
}

// ── Parse "X min" or "X" (bare number) to minutes ───────────────────────────
function parseMinutes(text) {
  if (!text) return null;
  text = text.trim();
  // "150 min", "150min", "150 minutes"
  const m = text.match(/^(\d+)\s*min(?:utes?)?$/i);
  if (m) return parseInt(m[1]);
  // bare integer (some columns may omit the unit label)
  const bare = text.match(/^(\d+)$/);
  if (bare) {
    const n = parseInt(bare[1]);
    // Only treat as minutes if it's a plausible exam duration (5–600 min)
    if (n >= 5 && n <= 600) return n;
  }
  return null;
}

// ── DOM scanning ─────────────────────────────────────────────────────────────
function scanTimers() {

  console.log('SCANNING TIMERS');

  const rows = document.querySelectorAll('tr');

  rows.forEach((row) => {

    const elapsedEl =
      row.querySelector('.elapsed');

    const allowedEl =
      row.querySelector('.allowed');

    if (!elapsedEl || !allowedEl) return;

    const elapsed =
      parseMinutes(elapsedEl.innerText);

    const allowed =
      parseMinutes(allowedEl.innerText);

    if (
      elapsed == null ||
      allowed == null
    ) return;

    const studentLabel =
        (row.cells?.[0]?.innerText || 'Student').trim();

    console.log(
      'VALUES:',
      studentLabel,
      elapsed,
      allowed
    );

    // Prevent repeated alerts
    if (
      alerted.has(studentLabel) &&
      elapsed >= allowed
    ) {
      return;
    }

    // Trigger alarm
    if (elapsed >= allowed) {

    alerted.add(studentLabel);

    console.log(
        'TRIGGERING ALARM FOR:',
        studentLabel
    );

    playAlarm();

    showBanner(studentLabel);

    }

  });

}

/*
function scanTimers() {

  const rows = document.querySelectorAll('tr');

  rows.forEach((row) => {

    const elapsedEl =
      row.querySelector('.elapsed');

    const allowedEl =
      row.querySelector('.allowed');

    if (!elapsedEl || !allowedEl) return;

    const elapsed =
      parseMinutes(elapsedEl.innerText);

    const allowed =
      parseMinutes(allowedEl.innerText);

    if (
      elapsed == null ||
      allowed == null
    ) return;

    const studentLabel =
      row.cells?.[0]?.innerText ||
      'Student';

    const key =
      `${studentLabel}-${allowed}`;

    if (alerted.has(key)) return;

    console.log(
      'CHECKING:',
      studentLabel,
      elapsed,
      '/',
      allowed
    );

    if (elapsed >= allowed) {

      alerted.add(key);

      console.log(
        'TRIGGERING ALARM FOR:',
        studentLabel
      );

      playAlarm();

      showBanner(studentLabel);

    }

  });

}
*/

/*
function scanTimers() {
  // Find every cell/element whose text looks like "X min"
  const minPattern = /^\d+\s*min(?:utes?)?$/i;
  const allCells = document.querySelectorAll('td, span, div, p, li');

  // Group cells by their parent row so we can compare elapsed vs allowed
  const rowMap = new Map();

  allCells.forEach((el) => {
    if (el.closest('#accommodate-alert-banner')) return;
    const text = (el.innerText || el.textContent || '').trim();
    if (!minPattern.test(text) && !/^\d+$/.test(text)) return;
    const mins = parseMinutes(text);
    if (!mins) return;

    const row = el.closest('tr') || el.closest('[class*="row"]') || el.parentElement;
    if (!row) return;

    if (!rowMap.has(row)) rowMap.set(row, []);
    rowMap.get(row).push({ el, mins, text });
  });

  rowMap.forEach((entries, row) => {
    // Need at least 2 minute-valued cells: one is elapsed, one is allowed
    if (entries.length < 2) return;

    // Assume the largest value is the allowed time, smallest is elapsed
    const sorted = [...entries].sort((a, b) => a.mins - b.mins);
    const elapsed = sorted[0].mins;
    const allowed = sorted[sorted.length - 1].mins;

    if (elapsed === allowed) return; // ambiguous

    // Get student label from the row
    const allText = (row.innerText || '').split('\n').map(s => s.trim()).filter(s =>
      s.length > 2 && !/^\d/.test(s)
    );
    const studentLabel = allText[0] || 'A student exam';

    const key = `${studentLabel}-${allowed}`;
    if (alerted.has(key)) return;

    if (elapsed >= allowed) {
      alerted.add(key);
      playAlarm();
      showBanner(studentLabel);
      console.info('[AccommodateAlert] Time complete for:', studentLabel, { elapsed, allowed });
    }
  });
}
*/

// ── Start ─────────────────────────────────────────────────────────────────────
let scanTimer = null;
function startScanning() {
  if (scanTimer) return;
  scanTimer = setInterval(scanTimers, SCAN_INTERVAL_MS);
  console.info('[AccommodateAlert] Monitoring active on', location.href);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startScanning);
} else {
  startScanning();
}

// Reset on SPA navigation
let lastUrl = location.href;
new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    alerted.clear();
  }
}).observe(document.body, { childList: true, subtree: true });


chrome.runtime.onMessage.addListener((msg) => {

  console.log('MESSAGE RECEIVED:', msg);

  if (msg.type === 'TIMER_ALARM') {

    console.log('PLAYING ALARM');

    playAlarm();

    showBanner(msg.studentName || 'Test alarm');
  }
});

/*
// Listen for popup test message
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'TIMER_ALARM') {
    playAlarm();
    showBanner(msg.studentName || 'Test alarm');
  }
});
*/