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
  
    // true = codificar | false = decodificar
    let encodeMode = true;
  
    function clampShift(n) {
      if (Number.isNaN(n)) return 0;
      return Math.min(25, Math.max(0, n));
    }
  
    function buildRing(container, radius) {
      container.innerHTML = "";
      const count = ALPHABET.length;
      const step = 360 / count;
      const base = -90; // A no topo
  
      for (let i = 0; i < count; i++) {
        const ch = ALPHABET[i];
        const angle = base + i * step;
  
        const span = document.createElement("span");
        span.className = "letter";
        span.textContent = ch;
  
        if (i === 0) span.classList.add("is-first"); // destaca A
  
        span.style.transform = `rotate(${angle}deg) translate(${radius}px) rotate(${90}deg)`;
        container.appendChild(span);
      }
    }
  
    function buildSpokes() {
      // Linhas que começam perto do anel externo e entram no anel interno (mais para dentro)
      const count = ALPHABET.length;
      const step = 360 / count;
      const base = -90;
  
      // Ajuste aqui controla “abaixar/entrar” no disco menor:
      // - rOuter: de onde sai (mais perto do externo)
      // - rInner: até onde entra (mais perto do centro = entra mais no menor)
      const rOuter = 44; // sai do externo
      const rInner = 18; // entra bem no interno (mais “pra baixo”/mais dentro)
  
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
  
    function rotateInnerRing(shift) {
      const step = 360 / ALPHABET.length;
      const deg = -shift * step;
      innerRing.style.transform = `rotate(${deg}deg)`;
    }
  
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
      const from = "A";
      const to = caesarChar("A", shift, true);
      mapping.textContent = `${from} = ${to}`;
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
  
    function recalc() {
      const shift = clampShift(parseInt(shiftRange.value, 10));
      syncShiftUI(shift);
      rotateInnerRing(shift);
      updateMapping(shift);
  
      const txt = inputText.value || "";
      outputText.value = caesarText(txt, shift, encodeMode);
    }
  
    // =========================
    // Drag para girar (tipo cofre)
    // =========================
    const STEP_DEG = 360 / ALPHABET.length;
    let dragging = false;
    let dragStartAngle = 0;
    let dragStartShift = 0;
  
    function getPointerAngle(clientX, clientY) {
      const rect = wheel.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
  
      // atan2 retorna radianos; converte para graus
      const rad = Math.atan2(clientY - cy, clientX - cx);
      let deg = (rad * 180) / Math.PI; // -180..180
      // normaliza pra 0..360
      deg = (deg + 360) % 360;
      return deg;
    }
  
    function currentShift() {
      return clampShift(parseInt(shiftRange.value, 10));
    }
  
    wheel.addEventListener("pointerdown", (e) => {
      // evita começar drag clicando no input do centro ou controles
      const target = e.target;
      if (target === shiftCenter || target === shiftNum || target === shiftRange) return;
  
      dragging = true;
      wheel.setPointerCapture(e.pointerId);
  
      dragStartAngle = getPointerAngle(e.clientX, e.clientY);
      dragStartShift = currentShift();
  
      // durante drag, tira transição pra ficar “na mão”
      innerRing.style.transition = "none";
    });
  
    wheel.addEventListener("pointermove", (e) => {
      if (!dragging) return;
  
      const nowAngle = getPointerAngle(e.clientX, e.clientY);
      let delta = nowAngle - dragStartAngle;
  
      // escolhe o caminho mais curto (evita “pular” em 0/360)
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
  
      // quantos passos de letra?
      const steps = Math.round(delta / STEP_DEG);
  
      // arrastar no sentido horário aumenta shift (e anti-horário diminui)
      let newShift = (dragStartShift + steps) % 26;
      if (newShift < 0) newShift += 26;
  
      shiftRange.value = String(newShift);
      syncShiftUI(newShift);
      rotateInnerRing(newShift);
      updateMapping(newShift);
  
      const txt = inputText.value || "";
      outputText.value = caesarText(txt, newShift, encodeMode);
  
      updateStatus(`Deslocamento: ${newShift} (girando…)`);
    });
  
    function endDrag() {
      if (!dragging) return;
      dragging = false;
  
      // volta a transição suave
      innerRing.style.transition = "transform 220ms ease";
      updateStatus("Pronto.");
    }
  
    wheel.addEventListener("pointerup", () => endDrag());
    wheel.addEventListener("pointercancel", () => endDrag());
    wheel.addEventListener("lostpointercapture", () => endDrag());
  
    // =========================
    // Inicializa
    // =========================
    buildRing(elOuter, 145);
    buildRing(elInner, 82);
    buildSpokes();
    updateModeUI();
    recalc();
  
    // Eventos dos inputs
    shiftRange.addEventListener("input", () => recalc());
  
    shiftNum.addEventListener("input", () => {
      const shift = clampShift(parseInt(shiftNum.value, 10));
      shiftRange.value = String(shift);
      syncShiftUI(shift);
      recalc();
    });
  
    shiftCenter.addEventListener("input", () => {
      const shift = clampShift(parseInt(shiftCenter.value, 10));
      shiftRange.value = String(shift);
      syncShiftUI(shift);
      recalc();
    });
  
    shiftCenter.addEventListener("click", () => {
      shiftCenter.select?.();
    });
  
    inputText.addEventListener("input", () => recalc());
  
    swapModeBtn.addEventListener("click", () => {
      encodeMode = !encodeMode;
      updateModeUI();
      recalc();
    });
  
    resetBtn.addEventListener("click", () => {
      encodeMode = true;
      inputText.value = "";
      syncShiftUI(3);
      shiftRange.value = "3";
      updateModeUI();
      recalc();
      updateStatus("Resetado.");
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
    });
  
    useOutAsInBtn.addEventListener("click", () => {
      inputText.value = outputText.value || "";
      recalc();
      updateStatus("Saída virou entrada.");
    });
  })();