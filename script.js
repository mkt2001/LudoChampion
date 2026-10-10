/* ============================================================
   LUDO CHAMP - GAME LOGIC & AUDIO ENGINE (script.js)
   ============================================================ */

// ------------------------------------------------------------
// 1. SOUND ENGINE (Web Audio API)
// ------------------------------------------------------------
let audioCtx = null;
let soundEnabled = true;

// Web Audio Context initialization (Fixes Mobile/Browser Autoplay Restriction)
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

// Generate synthesized sound effects
function playSound(type) {
    if (!soundEnabled) return;
    initAudio();

    if (!audioCtx) return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === 'roll') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
    } else if (type === 'move') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'win') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
    }
}

// Speech Voice System (Hindi Accent)
function speakText(text) {
    if (!soundEnabled || !('speechSynthesis' in window)) return;
    
    // Stop any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'hi-IN'; // Indian Accent / Hindi voice
    utterance.rate = 1.0;
    utterance.pitch = 1.1;
    window.speechSynthesis.speak(utterance);
}

// Toggle Sound ON / OFF
function toggleSound() {
    soundEnabled = !soundEnabled;
    const icon = document.getElementById('soundIcon');
    if (icon) {
        icon.className = soundEnabled ? "fa-solid fa-volume-high" : "fa-solid fa-volume-xmark";
    }
    if (soundEnabled) {
        playSound('move');
        speakText("Sound On");
    }
}

// ------------------------------------------------------------
// 2. THEME & GOTI (TOKEN) CUSTOMIZATION
// ------------------------------------------------------------

// Theme Switcher
function changeTheme(themeName) {
    document.body.className = themeName;
    playSound('move');
}

// Token (Goti) Style Switcher
function changeTokenStyle(tokenType) {
    const tokens = document.querySelectorAll('.token, .token-spot');
    tokens.forEach(token => {
        token.classList.remove('token-standard', 'token-gem', 'token-metal');
        token.classList.add(tokenType);
    });
    playSound('move');
    console.log("Token style changed to: " + tokenType);
}

// ------------------------------------------------------------
// 3. GAME MODES (LUDO VS KAUDI)
// ------------------------------------------------------------
function switchGameMode(mode) {
    const diceContainer = document.getElementById('diceContainer');
    const kaudiContainer = document.getElementById('kaudiContainer');
    const ludoBtn = document.getElementById('btn-mode-ludo');
    const kaudiBtn = document.getElementById('btn-mode-kaudi');

    if (mode === 'ludo') {
        if (diceContainer) diceContainer.classList.remove('hidden');
        if (kaudiContainer) kaudiContainer.classList.add('hidden');
        if (ludoBtn) ludoBtn.classList.add('active');
        if (kaudiBtn) kaudiBtn.classList.remove('active');
        speakText("Ludo Game Selected");
    } else {
        if (diceContainer) diceContainer.classList.add('hidden');
        if (kaudiContainer) kaudiContainer.classList.remove('hidden');
        if (kaudiBtn) kaudiBtn.classList.add('active');
        if (ludoBtn) ludoBtn.classList.remove('active');
        speakText("Kaudi Game Selected");
    }
    playSound('move');
}

// ------------------------------------------------------------
// 4. DICE & KAUDI CONTROLLERS
// ------------------------------------------------------------

// Render Dots on Ludo Dice based on value (1 - 6)
function renderDiceFace(diceEl, value) {
    diceEl.innerHTML = ''; // Clear previous dots
    const dotPositions = {
        1: ['center'],
        2: ['top-left', 'bottom-right'],
        3: ['top-left', 'center', 'bottom-right'],
        4: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
        5: ['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'],
        6: ['top-left', 'top-right', 'center-left', 'center-right', 'bottom-left', 'bottom-right']
    };

    const positions = dotPositions[value] || ['center'];
    positions.forEach(pos => {
        const dot = document.createElement('div');
        dot.className = `dot ${pos}`;
        diceEl.appendChild(dot);
    });
}

// Roll Ludo Dice
function rollDice() {
    const diceEl = document.getElementById('dice');
    if (!diceEl) return;

    playSound('roll');
    diceEl.classList.add('rolling');

    setTimeout(() => {
        diceEl.classList.remove('rolling');
        const value = Math.floor(Math.random() * 6) + 1;
        renderDiceFace(diceEl, value);
        speakText("Aaya " + value);
    }, 400);
}

// Throw Kaudi (Chaupar/Traditional Shells)
function throwKaudi() {
    const kaudis = document.querySelectorAll('.kaudi-shell');
    playSound('roll');

    let faceUpCount = 0;
    kaudis.forEach(k => {
        const isOpen = Math.random() > 0.5;
        if (isOpen) {
            k.style.transform = "rotateX(0deg)";
            faceUpCount++;
        } else {
            k.style.transform = "rotateX(180deg)";
        }
    });

    setTimeout(() => {
        const scoreText = faceUpCount === 0 ? "Aaya 8" : "Kaudi Score " + faceUpCodeText(faceUpCount);
        speakText(scoreText);
    }, 300);
}

function faceUpCodeText(count) {
    return count;
}

// Initial audio trigger on user first tap anywhere on screen
document.addEventListener('click', () => {
    initAudio();
}, { once: true });