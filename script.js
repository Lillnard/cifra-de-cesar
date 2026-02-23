// script.js
(() => {
    const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  
    const elOuter = document.getElementById("outerLetters");
    const elInner = document.getElementById("innerLetters");
    const innerRing = document.getElementById("innerRing");
  
    const shiftRange = document.getElementById("shift");
    const shiftNum = document.getElementById("shiftNum");
    const shiftValue = document.getElementById("shiftValue");
  
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
  
      for (let i = 0; i < count; i++) {
        const ch = ALPHABET[i];
        const angle = i * step;
  
        const span = document.createElement("span");
        span.className = "letter";
        span.textContent = ch;
  
        // Posiciona cada letra ao redor do círculo
        // Rotaciona no centro e empurra para fora (translate)
        span.style.transform = `rotate(${angle}deg) translate(${radius}px) rotate(${90}deg)`;
  
        container.appendChild(span);
      }
    }
  
    function rotateInnerRing(shift) {
      // Se o shift é +3, o anel interno gira -3 "passos" para alinhar correspondência visual:
      const step = 360 / ALPHABET.length;
      const deg = -shift * step;
      innerRing.style.transform = `rotate(${deg}deg)`;
    }
  
    function caesarChar(ch, shift, encode = true) {
      const upper = ch.toUpperCase();
      const idx = ALPHABET.indexOf(upper);
      if (idx === -1) return ch; // mantém espaços, acentos, pontuação, etc.
  
      const s = encode ? shift : (26 - shift) % 26;
      const newIdx = (idx + s) % 26;
      const out = ALPHABET[newIdx];
  
      // preserva caixa (maiúscula/minúscula)
      return ch === upper ? out : out.toLowerCase();
    }
  
    function caesarText(text, shift, encode = true) {
      let result = "";
      for (const ch of text) result += caesarChar(ch, shift, encode);
      return result;
    }
  
    function updateMapping(shift) {
      const from = "A";
      const to = caesarChar("A", shift, true); // sempre mostra mapeamento de codificação
      mapping.textContent = `${from} = ${to}`;
    }
  
    function updateStatus(msg) {
      status.textContent = msg;
    }
  
    function updateModeUI() {
      modeText.textContent = encodeMode ? "Codificar" : "Decodificar";
      // muda a cor do pontinho (sem mexer no CSS com variável, só classe inline simples)
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
      shiftValue.textContent = String(shift);
    }
  
    function recalc() {
      const shift = clampShift(parseInt(shiftRange.value, 10));
      syncShiftUI(shift);
      rotateInnerRing(shift);
      updateMapping(shift);
  
      const txt = inputText.value || "";
      const out = caesarText(txt, shift, encodeMode);
      outputText.value = out;
    }
  
    // Inicializa
    buildRing(elOuter, 145); // raio aproximado para anel externo
    buildRing(elInner, 82);  // raio aproximado para anel interno
    updateModeUI();
    recalc();
  
    // Eventos
    shiftRange.addEventListener("input", () => {
      recalc();
    });
  
    shiftNum.addEventListener("input", () => {
      const shift = clampShift(parseInt(shiftNum.value, 10));
      syncShiftUI(shift);
      recalc();
    });
  
    inputText.addEventListener("input", () => {
      recalc();
    });
  
    swapModeBtn.addEventListener("click", () => {
      encodeMode = !encodeMode;
      updateModeUI();
      recalc();
    });
  
    resetBtn.addEventListener("click", () => {
      encodeMode = true;
      inputText.value = "";
      syncShiftUI(3);
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
        // fallback simples
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