// script.js
(() => {
    const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  
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
  
    let encodeMode = true;
  
    // =========================
    // Som + Haptics (clique por “encaixe”)
    // =========================
    let audioCtx = null;
    let lastTickAt = 0;
  
    // limita o “tique-tique” pra não virar metralhadora
    const TICK_MIN_INTERVAL_MS = 35;
  
    function ensureAudio() {
      if (audioCtx) return;
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return; // navegador sem WebAudio
      audioCtx = new Ctx();
    }
  
    async function resumeAudioIfNeeded() {
      if (!audioCtx) return;
      if (audioCtx.state === "suspended") {
        try { await audioCtx.resume(); } catch {}
      }
    }
  
    function tickHaptic() {
      // Android/Chrome geralmente suporta. iOS/Safari normalmente não.
      if (navigator.vibrate) {
        navigator.vibrate(10); // curtinho
      }
    }
  
    function tickSound(strength = 1) {
      // strength 0..1 (volume)
      if (!audioCtx) return;
  
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
  
      // Um clique: seno curtinho com pitch alto
      osc.type = "sine";
      osc.frequency.setValueAtTime(1100 + 250 * strength, now);
  
      // Envelope bem rápido
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.07 * strength, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);
  
      osc.connect(gain);
      gain.connect(audioCtx.destination);
  
      osc.start(now);
      osc.stop(now + 0.045);
    }
  
    async function tick(strength = 1) {
      const t = performance.now();
      if (t - lastTickAt < TICK_MIN_INTERVAL_MS) return;
      lastTickAt = t;
  
      ensureAudio();
      await resumeAudioIfNeeded();
      tickSound(strength);
      tickHaptic();
    }
  
    // =========================
    // Suavização do giro (lerp)
    // =========================
    const STEP_DEG = 360 / ALPHABET.length;
  
    let currentDeg = 0;
    let targetDeg = 0;
  
    // menor = mais suave
    const SMOOTHING = 0.22;
  
    let rafId = null;
  
    function normalizeDeg(d) {
      d %= 360;
      if (d < 0) d += 360;
      return d;
    }
  
    function shortestDelta(from, to) {
      return (to - from + 540) % 360 - 180; // [-180..180]
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
    // Construção do disco
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
    // Cifra
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
      modeText.textContent = encodeMode ? "Codificar" : "Decodificar";
      const dot = modeBadge.querySelector(".dot");
      dot.style.background = encodeMode ? "var(--good)" : "var(--accent2)";
      dot.style.boxShadow = encodeMode
        ? "0 0 0 5px rgba(46,229,157,.12)"
        : "0 0 0 5px rgba(43,212,255,.12)";
      swapModeBtn.textContent = encodeMode ? "Alternar para decodificar" : "Alternar para codificar";
      updateStatus(encodeMode ? "Modo: codificar." : "Modo: decodificar.");
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
    // Drag + “encaixe” com som/vibração
    // =========================
    let dragging = false;
    let startPointerDeg = 0;
    let startTargetDeg = 0;
  
    let lastSnapShift = null;
  
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
  
      // garante que o áudio esteja liberado pelo gesto do usuário
      ensureAudio();
      await resumeAudioIfNeeded();
  
      lastSnapShift = degToNearestShift(targetDeg);
    });
  
    wheel.addEventListener("pointermove", (e) => {
      if (!dragging) return;
  
      const now = getPointerAngle(e.clientX, e.clientY);
      let delta = now - startPointerDeg;
  
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
  
      const newTarget = startTargetDeg + delta;
      setTargetDeg(newTarget);
  
      const s = degToNearestShift(newTarget);
  
      // “Tick” ao mudar de passo (letra)
      if (lastSnapShift === null) lastSnapShift = s;
      if (s !== lastSnapShift) {
        // força um “clique” proporcional à rapidez do giro (bem simples)
        const speedish = Math.min(1, Math.abs(delta) / 60);
        tick(0.55 + 0.45 * speedish);
        lastSnapShift = s;
      }
  
      syncShiftUI(s);
      updateMapping(s);
  
      const txt = inputText.value || "";
      outputText.value = caesarText(txt, s, encodeMode);
  
      updateStatus(`Deslocamento: ${s} (girando…)`);
    });
  
    async function endDrag() {
      if (!dragging) return;
      dragging = false;
  
      // encaixa no passo final e dá um “tick” de confirmação
      const s = degToNearestShift(targetDeg);
      applyShift(s, { animate: true, statusMsg: "Pronto." });
  
      // tick final suave
      await tick(0.65);
    }
  
    wheel.addEventListener("pointerup", endDrag);
    wheel.addEventListener("pointercancel", endDrag);
    wheel.addEventListener("lostpointercapture", endDrag);
  
    // =========================
    // Inicializa
    // =========================
    buildRing(elOuter, 145);
    buildRing(elInner, 82);
    buildSpokes();
    updateModeUI();
    applyShift(3, { animate: false });
  
    // Inputs
    shiftRange.addEventListener("input", () => {
      applyShift(parseInt(shiftRange.value, 10), { animate: true });
      tick(0.55);
    });
  
    shiftNum.addEventListener("input", () => {
      const s = clampShift(parseInt(shiftNum.value, 10));
      applyShift(s, { animate: true });
      tick(0.55);
    });
  
    shiftCenter.addEventListener("input", () => {
      const s = clampShift(parseInt(shiftCenter.value, 10));
      applyShift(s, { animate: true });
      tick(0.55);
    });
  
    shiftCenter.addEventListener("click", () => {
      shiftCenter.select?.();
    });
  
    inputText.addEventListener("input", () => {
      applyShift(parseInt(shiftRange.value, 10), { animate: false });
    });
  
    swapModeBtn.addEventListener("click", () => {
      encodeMode = !encodeMode;
      updateModeUI();
      applyShift(parseInt(shiftRange.value, 10), { animate: false });
      tick(0.6);
    });
  
    resetBtn.addEventListener("click", () => {
      encodeMode = true;
      inputText.value = "";
      updateModeUI();
      applyShift(3, { animate: true, statusMsg: "Resetado." });
      tick(0.75);
    });
  
    copyOutBtn.addEventListener("click", async () => {
      const value = outputText.value || "";
      try {
        await navigator.clipboard.writeText(value);
        updateStatus("Saída copiada ✅");
      } catch {
        outputText.focus();
        outputText.select();
        document.execCommand("copy");
        updateStatus("Saída copiada ✅");
      }
      tick(0.5);
    });
  
    useOutAsInBtn.addEventListener("click", () => {
      inputText.value = outputText.value || "";
      applyShift(parseInt(shiftRange.value, 10), { animate: false, statusMsg: "Saída virou entrada." });
      tick(0.5);
    });
  })();