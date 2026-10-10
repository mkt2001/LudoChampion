/* ============================================================
   LUDO CHAMP - FULL GAME & MOVEMENT ENGINE (script.js)
   ============================================================ */

let audioCtx = null;
let soundEnabled = true;

// Web Audio Context initialization
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

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
    }
}

function speakText(text) {
    if (!soundEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'hi-IN';
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    const icon = document.getElementById('soundIcon');
    if (icon) {
        icon.className = soundEnabled ? "fa-solid fa-volume-high" : "fa-solid fa-volume-xmark";
    }
}

function changeTheme(themeName) {
    document.body.className = themeName;
    playSound('move');
}

function changeTokenStyle(tokenType) {
    playSound('move');
    console.log("Token style: " + tokenType);
}

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
// LUDO GAME STATE & MOVEMENT ENGINE
// ------------------------------------------------------------
let currentDiceValue = 0;
let currentPlayer = 'red'; // red, green, yellow, blue
let playerPositions = {
    red: [-1, -1, -1, -1],     // -1 means inside base
    green: [-1, -1, -1, -1],
    yellow: [-1, -1, -1, -1],
    blue: [-1, -1, -1, -1]
};

function renderDiceFace(diceEl, value) {
    diceEl.innerHTML = '';
    const dotPositions = {
        1: ['center'],
        2: ['top-left', 'bottom-right'],
        3: ['top-left', 'center', 'bottom-right'],
        4: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
        5: ['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'],
        6: ['top-left', 'top-right', 'center-left', 'center-right', 'bottom-left', 'bottom-right']
    };
    (dotPositions[value] || ['center']).forEach(pos => {
        const dot = document.createElement('div');
        dot.className = `dot ${pos}`;
        diceEl.appendChild(dot);
    });
}

function rollDice() {
    const diceEl = document.getElementById('dice');
    if (!diceEl) return;

    playSound('roll');
    diceEl.classList.add('rolling');

    setTimeout(() => {
        diceEl.classList.remove('rolling');
        currentDiceValue = Math.floor(Math.random() * 6) + 1;
        renderDiceFace(diceEl, currentDiceValue);
        speakText("Aaya " + currentDiceValue);
        
        checkValidMovesOrSwitch();
    }, 400);
}

function checkValidMovesOrSwitch() {
    let positions = playerPositions[currentPlayer];
    let canMove = false;

    for (let pos of positions) {
        if (pos !== -1 || currentDiceValue === 6) {
            canMove = true;
            break;
        }
    }

    if (!canMove) {
        setTimeout(() => {
            switchNextPlayer();
        }, 1500);
    } else {
        autoMoveToken();
    }
}

function autoMoveToken() {
    let positions = playerPositions[currentPlayer];
    let moved = false;

    for (let i = 0; i < positions.length; i++) {
        if (positions[i] === -1 && currentDiceValue === 6) {
            positions[i] = 0; // Open token from base to start track
            moved = true;
            break;
        } else if (positions[i] !== -1 && positions[i] < 50) {
            positions[i] += currentDiceValue; // Move forward on board
            if (positions[i] > 50) positions[i] = 50; // Cap at home stretch
            moved = true;
            break;
        }
    }

    if (moved) {
        playSound('move');
        speakText(currentPlayer + " goti chali");
        updateBoardUI();
    }

    setTimeout(() => {
        switchNextPlayer();
    }, 1200);
}

function switchNextPlayer() {
    const sequence = ['red', 'green', 'yellow', 'blue'];
    let currentIndex = sequence.indexOf(currentPlayer);
    currentPlayer = sequence[(currentIndex + 1) % sequence.length];

    document.querySelectorAll('.player-card').forEach(card => card.classList.remove('active-player'));
    const activeCard = document.getElementById(`card-${currentPlayer.substring(0,1)}`);
    if (activeCard) activeCard.classList.add('active-player');

    speakText(currentPlayer + " ki baari");
}

function updateBoardUI() {
    console.log("Board updated with new positions:", playerPositions);
}

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
        const scoreText = faceUpCount === 0 ? "Aaya 8" : "Kaudi Score " + faceUpCount;
        speakText(scoreText);
    }, 300);
}

document.addEventListener('click', () => {
    initAudio();
}, { once: true });
