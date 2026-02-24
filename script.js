// script.js
(() => {
  const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  // Elements
  const elOuter = document.getElementById("outerLetters");
  const elInner = document.getElementById("innerLetters");
  const innerRing = document.getElementById("innerRing");
  const wheel = document.getElementById("wheel");

  const shiftRange = document.getElementById("shift");
  const shiftNum = document.getElementById("shiftNum");
  const shiftCenter = document.getElementById("shiftCenter");

  const inputText = document.getElementById("inputText");
  const outputText = document.getElementById("outputText");

  const mapping = document.getElementById("mapping");
  const status = document.getElementById("status");

  const swapModeBtn = document.getElementById("swapMode");
  const resetBtn = document.getElementById("reset");
  const copyOutBtn = document.getElementById("copyOut");
  const useOutAsInBtn = document.getElementById("useOutAsIn");

  const modeText = document.getElementById("modeText");
  const modeBadge = document.getElementById("modeBadge");

  const spokesSvg = document.getElementById("spokes");

  // Top toggles (theme/lang stay on top)
  const themeToggle = document.getElementById("themeToggle");
  const themeIcon = document.getElementById("themeIcon");

  const langToggle = document.getElementById("langToggle");
  const langIcon = document.getElementById("langIcon");

  // Now inside card-head
  const soundToggle = document.getElementById("soundToggle");
  const soundIcon = document.getElementById("soundIcon");

  const hapticsToggle = document.getElementById("hapticsToggle");
  const hapticsIcon = document.getElementById("hapticsIcon");

  // State
  let encodeMode = true;

  // ===== Storage helpers =====
  const store = {
    get(key, fallback) {
      try {
        const v = localStorage.getItem(key);
        return v === null ? fallback : JSON.parse(v);
      } catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
    }
  };

  // Settings
  let soundEnabled = store.get("cdc_sound", true);
  let hapticsEnabled = store.get("cdc_haptics", true);
  let theme = store.get("cdc_theme", "dark");
  let lang = store.get("cdc_lang", "pt");

  // =========================
  // i18n dictionary
  // =========================
  const I18N = {
    pt: {
      appTitle: "Cifra de César",
      appSubtitle: "Disco do alfabeto + codificação automática",

      modeEncode: "Codificar",
      modeDecode: "Decodificar",

      wheelTitle: "Disco do Alfabeto",
      labelNormal: "Normal",
      labelCipher: "Cifrado",

      centerHouses: "Casas",
      centerShift: "deslocamento",

      shiftLabel: "Quantidade de casas",
      hintClassic: "Dica: 0 não muda nada. 3 é o clássico do Júlio César.",
      hintDrag: "Extra: arraste o disco (tipo cofre). Cada encaixe dá clique e vibra (se suportado).",

      btnSwapToDecode: "Alternar para decodificar",
      btnSwapToEncode: "Alternar para codificar",
      btnReset: "Reset",

      textTitle: "Texto",
      textSubtitle: "Digite aqui o texto que deseja codificar. Mantemos espaços e pontuação.",
      inputLabel: "Entrada",
      outputLabel: "Saída",

      inputPlaceholder: "Ex: ataque ao amanhecer!",
      outputPlaceholder: "O texto codificado/decodificado aparece aqui…",

      btnCopy: "Copiar saída",
      btnUseAsInput: "Usar como entrada",

      noteText:
        'Letras com acento (á, ç, ã...) são mantidas como estão. ' +
        'A cifra trabalha em <strong>A-Z</strong>. Letras minúsculas também funcionam.',

      statusReady: "Pronto.",
      statusModeEncode: "Modo: codificar.",
      statusModeDecode: "Modo: decodificar.",
      statusReset: "Resetado.",
      statusCopied: "Saída copiada ✅",
      statusOutToIn: "Saída virou entrada.",
      statusDragging: (s) => `Deslocamento: ${s} (girando…)`
    },
    en: {
      appTitle: "Caesar Cipher",
      appSubtitle: "Alphabet wheel + auto encoding",

      modeEncode: "Encode",
      modeDecode: "Decode",

      wheelTitle: "Alphabet Wheel",
      labelNormal: "Normal",
      labelCipher: "Cipher",

      centerHouses: "Shift",
      centerShift: "offset",

      shiftLabel: "Number of shifts",
      hintClassic: "Tip: 0 changes nothing. 3 is Julius Caesar's classic.",
      hintDrag: "Extra: drag the wheel (like a safe dial). Each notch clicks and vibrates (if supported).",

      btnSwapToDecode: "Switch to decode",
      btnSwapToEncode: "Switch to encode",
      btnReset: "Reset",

      textTitle: "Text",
      textSubtitle: "Type the text you want to encode. We keep spaces and punctuation.",
      inputLabel: "Input",
      outputLabel: "Output",

      inputPlaceholder: "Ex: attack at dawn!",
      outputPlaceholder: "The encoded/decoded text appears here…",

      btnCopy: "Copy output",
      btnUseAsInput: "Use as input",

      noteText:
        'Accented letters (á, ç, ã...) are kept as-is. ' +
        'The cipher works on <strong>A-Z</strong>. Lowercase letters also work.',

      statusReady: "Ready.",
      statusModeEncode: "Mode: encode.",
      statusModeDecode: "Mode: decode.",
      statusReset: "Reset.",
      statusCopied: "Output copied ✅",
      statusOutToIn: "Output became input.",
      statusDragging: (s) => `Shift: ${s} (dialing…)`
    }
  };

  function t(key) { return I18N[lang][key]; }

  function applyLanguage() {
    document.documentElement.lang = lang === "pt" ? "pt-BR" : "en";

    document.querySelectorAll("[data-i18n]").forEach(el => {
      const k = el.getAttribute("data-i18n");
      if (I18N[lang][k] != null) el.textContent = I18N[lang][k];
    });

    document.querySelectorAll("[data-i18n-ph]").forEach(el => {
      const k = el.getAttribute("data-i18n-ph");
      if (I18N[lang][k] != null) el.setAttribute("placeholder", I18N[lang][k]);
    });

    document.querySelectorAll("[data-i18n-html]").forEach(el => {
      const k = el.getAttribute("data-i18n-html");
      if (I18N[lang][k] != null) el.innerHTML = I18N[lang][k];
    });

    langIcon.textContent = (lang === "pt") ? "EN" : "BR";
    updateModeUI();
  }

  function applyTheme() {
    document.body.classList.toggle("light", theme === "light");
    themeIcon.textContent = (theme === "light") ? "🌙" : "☀️";
  }

  function applySoundUI() {
    soundToggle.classList.toggle("off", !soundEnabled);
    soundIcon.textContent = soundEnabled ? "🔊" : "🔇";
  }

  function applyHapticsUI() {
    hapticsToggle.classList.toggle("off", !hapticsEnabled);
    hapticsIcon.textContent = hapticsEnabled ? "📳" : "📴";
  }

  // =========================
  // Premium sound + haptics
  // =========================
  let audioCtx = null;
  let lastTickAt = 0;
  const TICK_MIN_INTERVAL_MS = 28;

  function ensureAudio() {
    if (audioCtx) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    audioCtx = new Ctx();
  }

  async function resumeAudioIfNeeded() {
    if (!audioCtx) return;
    if (audioCtx.state === "suspended") {
      try { await audioCtx.resume(); } catch {}
    }
  }

  function vibrate(ms) {
    if (!hapticsEnabled) return;
    if (navigator.vibrate) navigator.vibrate(ms);
  }

  function playTick({ strength = 1, direction = 1 } = {}) {
    if (!soundEnabled || !audioCtx) return;

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    const base = direction >= 0 ? 1280 : 1180;
    const jitter = 90 * (Math.random() - 0.5);
    const freq = base + jitter + 260 * strength;

    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.08 * strength, now + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.04);
  }

  function playClunk({ strength = 1 } = {}) {
    if (!soundEnabled || !audioCtx) return;

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.07);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.13 * strength, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.10);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  async function tick({ strength = 1, direction = 1 } = {}) {
    const tNow = performance.now();
    if (tNow - lastTickAt < TICK_MIN_INTERVAL_MS) return;
    lastTickAt = tNow;

    ensureAudio();
    await resumeAudioIfNeeded();

    playTick({ strength, direction });
    vibrate(10);
  }

  async function clunk({ strength = 1 } = {}) {
    ensureAudio();
    await resumeAudioIfNeeded();

    playClunk({ strength });
    vibrate(18);
  }

  // =========================
  // Smooth rotation
  // =========================
  const STEP_DEG = 360 / ALPHABET.length;

  let currentDeg = 0;
  let targetDeg = 0;

  const SMOOTHING = 0.22;
  let rafId = null;

  function normalizeDeg(d) {
    d %= 360;
    if (d < 0) d += 360;
    return d;
  }

  function shortestDelta(from, to) {
    return (to - from + 540) % 360 - 180;
  }

  function animateRotation() {
    const d = shortestDelta(currentDeg, targetDeg);
    currentDeg = normalizeDeg(currentDeg + d * SMOOTHING);
    innerRing.style.transform = `rotate(${currentDeg}deg)`;

    if (Math.abs(d) < 0.08) {
      currentDeg = normalizeDeg(targetDeg);
      innerRing.style.transform = `rotate(${currentDeg}deg)`;
      rafId = null;
      return;
    }
    rafId = requestAnimationFrame(animateRotation);
  }

  function setTargetDeg(deg) {
    targetDeg = normalizeDeg(deg);
    if (!rafId) rafId = requestAnimationFrame(animateRotation);
  }

  function shiftToDeg(shift) {
    return -shift * STEP_DEG;
  }

  function degToNearestShift(deg) {
    const raw = (-deg / STEP_DEG);
    let s = Math.round(raw) % 26;
    if (s < 0) s += 26;
    return s;
  }

  function clampShift(n) {
    if (Number.isNaN(n)) return 0;
    return Math.min(25, Math.max(0, n));
  }

  // =========================
  // Build rings + spokes
  // =========================
  function buildRing(container, radius) {
    container.innerHTML = "";
    const count = ALPHABET.length;
    const step = 360 / count;
    const base = -90;

    for (let i = 0; i < count; i++) {
      const ch = ALPHABET[i];
      const angle = base + i * step;

      const span = document.createElement("span");
      span.className = "letter";
      span.textContent = ch;

      if (i === 0) span.classList.add("is-first");
      span.style.transform = `rotate(${angle}deg) translate(${radius}px) rotate(${90}deg)`;

      container.appendChild(span);
    }
  }

  function buildSpokes() {
    const count = ALPHABET.length;
    const step = 360 / count;
    const base = -90;

    const rOuter = 44;
    const rInner = 18;

    spokesSvg.innerHTML = "";

    for (let i = 0; i < count; i++) {
      const angleDeg = base + i * step;
      const a = (angleDeg * Math.PI) / 180;

      const x1 = 50 + Math.cos(a) * rOuter;
      const y1 = 50 + Math.sin(a) * rOuter;
      const x2 = 50 + Math.cos(a) * rInner;
      const y2 = 50 + Math.sin(a) * rInner;

      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", x1.toFixed(3));
      line.setAttribute("y1", y1.toFixed(3));
      line.setAttribute("x2", x2.toFixed(3));
      line.setAttribute("y2", y2.toFixed(3));
      line.setAttribute("stroke", "rgba(255,255,255,.16)");
      line.setAttribute("stroke-width", "0.75");
      line.setAttribute("stroke-linecap", "round");
      spokesSvg.appendChild(line);

      const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      dot.setAttribute("cx", x2.toFixed(3));
      dot.setAttribute("cy", y2.toFixed(3));
      dot.setAttribute("r", "1.0");
      dot.setAttribute("fill", "rgba(43,212,255,.38)");
      spokesSvg.appendChild(dot);
    }
  }

  // =========================
  // Cipher
  // =========================
  function caesarChar(ch, shift, encode = true) {
    const upper = ch.toUpperCase();
    const idx = ALPHABET.indexOf(upper);
    if (idx === -1) return ch;

    const s = encode ? shift : (26 - shift) % 26;
    const newIdx = (idx + s) % 26;
    const out = ALPHABET[newIdx];

    return ch === upper ? out : out.toLowerCase();
  }

  function caesarText(text, shift, encode = true) {
    let result = "";
    for (const ch of text) result += caesarChar(ch, shift, encode);
    return result;
  }

  function updateMapping(shift) {
    mapping.textContent = `A = ${caesarChar("A", shift, true)}`;
  }

  function updateStatus(msg) {
    status.textContent = msg;
  }

  function updateModeUI() {
    modeText.textContent = encodeMode ? t("modeEncode") : t("modeDecode");

    const dot = modeBadge.querySelector(".dot");
    dot.style.background = encodeMode ? "var(--good)" : "var(--accent2)";
    dot.style.boxShadow = encodeMode
      ? "0 0 0 5px rgba(46,229,157,.12)"
      : "0 0 0 5px rgba(43,212,255,.12)";

    swapModeBtn.textContent = encodeMode ? t("btnSwapToDecode") : t("btnSwapToEncode");
    updateStatus(encodeMode ? t("statusModeEncode") : t("statusModeDecode"));
  }

  function syncShiftUI(shift) {
    shiftRange.value = String(shift);
    shiftNum.value = String(shift);
    shiftCenter.value = String(shift);
  }

  function applyShift(shift, { animate = true, statusMsg = null } = {}) {
    shift = clampShift(shift);
    syncShiftUI(shift);
    updateMapping(shift);

    const txt = inputText.value || "";
    outputText.value = caesarText(txt, shift, encodeMode);

    const deg = shiftToDeg(shift);
    if (animate) setTargetDeg(deg);
    else {
      currentDeg = normalizeDeg(deg);
      targetDeg = normalizeDeg(deg);
      innerRing.style.transform = `rotate(${currentDeg}deg)`;
    }

    if (statusMsg) updateStatus(statusMsg);
  }

  // =========================
  // Drag + notches
  // =========================
  let dragging = false;
  let startPointerDeg = 0;
  let startTargetDeg = 0;

  let lastSnapShift = null;
  let lastDelta = 0;

  function getPointerAngle(clientX, clientY) {
    const rect = wheel.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const rad = Math.atan2(clientY - cy, clientX - cx);
    let deg = (rad * 180) / Math.PI;
    deg = (deg + 360) % 360;
    return deg;
  }

  wheel.addEventListener("pointerdown", async (e) => {
    const target = e.target;
    if (target === shiftCenter || target === shiftNum || target === shiftRange) return;

    dragging = true;
    wheel.setPointerCapture(e.pointerId);

    startPointerDeg = getPointerAngle(e.clientX, e.clientY);
    startTargetDeg = targetDeg;

    ensureAudio();
    await resumeAudioIfNeeded();

    lastSnapShift = degToNearestShift(targetDeg);
    lastDelta = 0;
  });

  wheel.addEventListener("pointermove", (e) => {
    if (!dragging) return;

    const now = getPointerAngle(e.clientX, e.clientY);
    let delta = now - startPointerDeg;

    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;

    lastDelta = delta;

    const newTarget = startTargetDeg + delta;
    setTargetDeg(newTarget);

    const s = degToNearestShift(newTarget);

    if (lastSnapShift === null) lastSnapShift = s;
    if (s !== lastSnapShift) {
      const direction = delta >= 0 ? 1 : -1;
      const speedish = Math.min(1, Math.abs(delta) / 60);
      tick({ strength: 0.55 + 0.45 * speedish, direction }).catch(() => {});
      lastSnapShift = s;
    }

    syncShiftUI(s);
    updateMapping(s);

    const txt = inputText.value || "";
    outputText.value = caesarText(txt, s, encodeMode);

    updateStatus(t("statusDragging")(s));
  });

  async function endDrag() {
    if (!dragging) return;
    dragging = false;

    const s = degToNearestShift(targetDeg);
    applyShift(s, { animate: true, statusMsg: t("statusReady") });

    const strength = Math.min(1, 0.55 + (Math.abs(lastDelta) / 120));
    await clunk({ strength });
  }

  wheel.addEventListener("pointerup", endDrag);
  wheel.addEventListener("pointercancel", endDrag);
  wheel.addEventListener("lostpointercapture", endDrag);

  // =========================
  // UI buttons
  // =========================
  themeToggle.addEventListener("click", () => {
    theme = (theme === "dark") ? "light" : "dark";
    store.set("cdc_theme", theme);
    applyTheme();
    tick({ strength: 0.65, direction: 1 }).catch(() => {});
  });

  langToggle.addEventListener("click", () => {
    lang = (lang === "pt") ? "en" : "pt";
    store.set("cdc_lang", lang);
    applyLanguage();
    tick({ strength: 0.65, direction: 1 }).catch(() => {});
  });

  soundToggle.addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    store.set("cdc_sound", soundEnabled);
    applySoundUI();
    if (soundEnabled) {
      ensureAudio();
      resumeAudioIfNeeded().then(() => playTick({ strength: 0.7, direction: 1 }));
    }
    vibrate(12);
  });

  hapticsToggle.addEventListener("click", () => {
    hapticsEnabled = !hapticsEnabled;
    store.set("cdc_haptics", hapticsEnabled);
    applyHapticsUI();
    vibrate(18);
    tick({ strength: 0.55, direction: 1 }).catch(() => {});
  });

  // =========================
  // Other controls
  // =========================
  shiftRange.addEventListener("input", () => {
    applyShift(parseInt(shiftRange.value, 10), { animate: true });
    tick({ strength: 0.55, direction: 1 }).catch(() => {});
  });

  shiftNum.addEventListener("input", () => {
    const s = clampShift(parseInt(shiftNum.value, 10));
    applyShift(s, { animate: true });
    tick({ strength: 0.55, direction: 1 }).catch(() => {});
  });

  shiftCenter.addEventListener("input", () => {
    const s = clampShift(parseInt(shiftCenter.value, 10));
    applyShift(s, { animate: true });
    tick({ strength: 0.55, direction: 1 }).catch(() => {});
  });

  shiftCenter.addEventListener("click", () => shiftCenter.select?.());

  inputText.addEventListener("input", () => {
    applyShift(parseInt(shiftRange.value, 10), { animate: false });
  });

  swapModeBtn.addEventListener("click", () => {
    encodeMode = !encodeMode;
    updateModeUI();
    applyShift(parseInt(shiftRange.value, 10), { animate: false });
    tick({ strength: 0.6, direction: 1 }).catch(() => {});
  });

  resetBtn.addEventListener("click", async () => {
    encodeMode = true;
    inputText.value = "";
    updateModeUI();
    applyShift(3, { animate: true, statusMsg: t("statusReset") });
    await clunk({ strength: 0.75 });
  });

  copyOutBtn.addEventListener("click", async () => {
    const value = outputText.value || "";
    try {
      await navigator.clipboard.writeText(value);
      updateStatus(t("statusCopied"));
    } catch {
      outputText.focus();
      outputText.select();
      document.execCommand("copy");
      updateStatus(t("statusCopied"));
    }
    tick({ strength: 0.55, direction: 1 }).catch(() => {});
  });

  useOutAsInBtn.addEventListener("click", () => {
    inputText.value = outputText.value || "";
    applyShift(parseInt(shiftRange.value, 10), { animate: false, statusMsg: t("statusOutToIn") });
    tick({ strength: 0.55, direction: 1 }).catch(() => {});
  });

  // =========================
  // Init
  // =========================
  buildRing(elOuter, 145);
  buildRing(elInner, 82);
  buildSpokes();

  applyTheme();
  applyLanguage();
  applySoundUI();
  applyHapticsUI();

  applyShift(3, { animate: false });
  updateModeUI();
})();