const ARGON2_MEMORY   = 262144;
const ARGON2_TIME     = 3;
const ARGON2_HASHLEN  = 32;
const ARGON2_PARALLEL = 1;

// Visual checksum palette
// 8 bg colors (OKLCH L0.35, dark & vivid) + paired fg (OKLCH L0.7)
const CHECKSUM_PALETTE = [
  { bg: 'oklch(0.35 0.124 0)   ', fg: 'oklch(0.7 0.124 0)  ' },
  { bg: 'oklch(0.35 0.099 45)  ', fg: 'oklch(0.7 0.124 45) ' },
  { bg: 'oklch(0.35 0.0707 90) ', fg: 'oklch(0.7 0.124 90) ' },
  { bg: 'oklch(0.35 0.1012 135)', fg: 'oklch(0.7 0.124 135)' },
  { bg: 'oklch(0.35 0.0631 180)', fg: 'oklch(0.7 0.124 180)' },
  { bg: 'oklch(0.35 0.0652 225)', fg: 'oklch(0.7 0.124 225)' },
  { bg: 'oklch(0.35 0.124 270) ', fg: 'oklch(0.7 0.124 270)' },
  { bg: 'oklch(0.35 0.124 315) ', fg: 'oklch(0.7 0.124 315)' },
];

// Unambiguous 64-char set (no 0/O, 1/l/I)
const CHECKSUM_CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz!@#$%^&*(';

let generatedPassword = null;

function toggleField(inputId, btnId) {
  const input = document.getElementById(inputId);
  const btn = document.getElementById(btnId);
  const showing = input.type === 'text';
  input.type = showing ? 'password' : 'text';
  btn.innerHTML = `<svg class="eye-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${showing ? '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>' : '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>'}</svg> ${showing ? 'Show' : 'Hide'}`;
}

function toggleOutput() {
  const btn = document.getElementById('toggleOutput');
  const valEl = document.getElementById('outputValue');

  if (!generatedPassword) return;

  let shouldMask = !valEl.classList.contains('masked');

  if (shouldMask) {
    valEl.textContent = '●'.repeat(generatedPassword.length);
    valEl.className = 'output-value masked';
    btn.innerHTML = `<svg class="eye-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> Show`;
  } else {
    valEl.textContent = generatedPassword;
    valEl.className = 'output-value';
    btn.innerHTML = `<svg class="eye-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg> Hide`;
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

  const { bg } = CHECKSUM_PALETTE[bgIdx];
  const { fg } = CHECKSUM_PALETTE[fgIdx];
  const ch = CHECKSUM_CHARS[charIdx];

  return { bg, fg, ch };
}

async function generate() {
  hideError();
  const site   = document.getElementById('site').value.trim();
  const master = document.getElementById('master').value;
  const length = parseInt(document.getElementById('length').value) || 64;

  if (!site)   { showError('Please enter a site / service name.'); return; }
  if (!master) { showError('Please enter your master password.'); return; }

  const btn = document.getElementById('generateBtn');

  btn.disabled = true;

  generatedPassword = null;
  const outEl = document.getElementById('outputValue');
  outEl.textContent = 'No password generated yet';
  outEl.className = 'output-value empty';

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

    generatedPassword = result.hash.toBase64().slice(0, length);

    outEl.textContent = '●'.repeat(length);
    outEl.className = 'output-value masked';

    const { bg, fg, ch } = visualChecksum(result.hash.slice(ARGON2_HASHLEN - 3, ARGON2_HASHLEN));
    const badge = document.getElementById('checksumBadge');
    badge.textContent = ch;
    badge.style.background = bg;
    badge.style.color = fg;

  } catch (e) {
    showError('Error: ' + (e.message || String(e)));
  } finally {
    btn.disabled = false;
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
  if (e.key === 'Enter') generate();
});
