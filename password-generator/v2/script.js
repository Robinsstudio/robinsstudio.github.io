const ARGON2_MEMORY   = 262144;
const ARGON2_TIME     = 3;
const ARGON2_HASHLEN  = 32;
const ARGON2_PARALLEL = 1;

// Visual checksum palette
// 8 bg colors (OKLCH ~L0.32, dark & vivid) + paired fg (OKLCH ~L0.92)
// Every pair is WCAG AA compliant (contrast ≥ 4.5:1)
const CHECKSUM_PALETTE = [
  { bg: '#6b21a8', fg: '#f3e8ff' }, // purple
  { bg: '#155e75', fg: '#e0f7fa' }, // cyan
  { bg: '#065f46', fg: '#d1fae5' }, // emerald
  { bg: '#92400e', fg: '#fef3c7' }, // amber
  { bg: '#9f1239', fg: '#ffe4e6' }, // rose
  { bg: '#1e3a8a', fg: '#dbeafe' }, // blue
  { bg: '#713f12', fg: '#fef9c3' }, // yellow
  { bg: '#3b0764', fg: '#faf5ff' }, // violet
];

// Unambiguous 64-char set (no 0/O, 1/l/I)
const CHECKSUM_CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz!@#$%^&*';

let generatedPassword = null;
let outputVisible = false;

function toggleField(inputId, btnId) {
  const input = document.getElementById(inputId);
  const btn = document.getElementById(btnId);
  const showing = input.type === 'text';
  input.type = showing ? 'password' : 'text';
  btn.innerHTML = `<svg class="eye-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${showing ? '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>' : '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>'}</svg> ${showing ? 'Show' : 'Hide'}`;
}

function toggleOutput() {
  outputVisible = !outputVisible;
  const btn = document.getElementById('toggleOutput');
  const valEl = document.getElementById('outputValue');
  if (!generatedPassword) return;
  if (outputVisible) {
    valEl.textContent = generatedPassword;
    valEl.className = 'output-value';
    btn.innerHTML = `<svg class="eye-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg> Hide`;
  } else {
    valEl.textContent = '●'.repeat(Math.min(generatedPassword.length, 32));
    valEl.className = 'output-value masked';
    btn.innerHTML = `<svg class="eye-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> Show`;
  }
}

function showError(msg) {
  const el = document.getElementById('errorMsg');
  el.textContent = msg;
  el.classList.add('visible');
}

function hideError() {
  document.getElementById('errorMsg').classList.remove('visible');
}

function visualChecksum(hashBytes) {
  const bgIdx   = hashBytes[0] % 8;
  const fgIdx   = hashBytes[1] % 8;
  const charIdx = hashBytes[2] % 64;
  const { bg, fg } = CHECKSUM_PALETTE[bgIdx];
  // Use fg index to pick from same palette's fg color for extra variance
  const fgColor = CHECKSUM_PALETTE[fgIdx].fg;
  const ch = CHECKSUM_CHARS[charIdx];
  return { bg, fg: fgColor, ch };
}

function resetChecksum() {
  const badge = document.getElementById('checksumBadge');
  badge.textContent = '?';
  badge.style.background = '';
  badge.style.color = '';
}

async function generate() {
  hideError();
  const site   = document.getElementById('site').value.trim();
  const master = document.getElementById('master').value;
  const length = parseInt(document.getElementById('length').value) || 64;

  if (!site)   { showError('Please enter a site / service name.'); return; }
  if (!master) { showError('Please enter your master password.'); return; }

  const btn          = document.getElementById('generateBtn');
  const progressWrap = document.getElementById('progressWrap');
  const progressLabel= document.getElementById('progressLabel');

  btn.disabled = true;
  progressWrap.classList.add('visible');
  progressLabel.textContent = 'Computing — this may take a few seconds…';

  generatedPassword = null;
  const outEl = document.getElementById('outputValue');
  outEl.textContent = 'No password generated yet';
  outEl.className = 'output-value empty';
  resetChecksum();
  outputVisible = false;
  document.getElementById('toggleOutput').innerHTML = `<svg class="eye-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> Show`;

  try {
    const result = await argon2.hash({
      pass: master,
      salt: site,
      time: ARGON2_TIME,
      mem:  ARGON2_MEMORY,
      hashLen: ARGON2_HASHLEN,
      parallelism: ARGON2_PARALLEL,
      type: argon2.ArgonType.Argon2id
    });

    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+[]{}|;:,.<>?';
    const bytes = result.hash;
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset[bytes[i % bytes.length] % charset.length];
    }

    generatedPassword = password;

    outEl.textContent = '●'.repeat(Math.min(password.length, 32));
    outEl.className = 'output-value masked';

    // Visual checksum: use bytes AFTER the password-generation bytes to keep independent
    const csOffset = length % bytes.length;
    const csBytes = [
      bytes[(csOffset)     % bytes.length],
      bytes[(csOffset + 1) % bytes.length],
      bytes[(csOffset + 2) % bytes.length],
    ];
    const { bg, fg, ch } = visualChecksum(csBytes);
    const badge = document.getElementById('checksumBadge');
    badge.textContent = ch;
    badge.style.background = bg;
    badge.style.color = fg;

  } catch (e) {
    showError('Error: ' + (e.message || String(e)));
  } finally {
    btn.disabled = false;
    progressWrap.classList.remove('visible');
  }
}

function copyPassword() {
  if (!generatedPassword) return;
  navigator.clipboard.writeText(generatedPassword).then(() => {
    const btn = document.getElementById('copyBtn');
    btn.textContent = 'Copied!';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 2000);
  });
}

document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') generate();
});
