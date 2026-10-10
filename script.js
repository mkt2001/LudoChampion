let audioCtx = null;
let soundEnabled = true;

function initAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playSound(type) {
    if (!soundEnabled) return;
    initAudio();
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    if (type === 'roll') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        osc.start(); osc.stop(audioCtx.currentTime + 0.2);
    } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.start(); osc.stop(audioCtx.currentTime + 0.1);
    }
}

function speakText(text) {
    if (!soundEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'hi-IN';
    window.speechSynthesis.speak(utterance);
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    const icon = document.getElementById('soundIcon');
    if (icon) icon.className = soundEnabled ? "fa-solid fa-volume-high" : "fa-solid fa-volume-xmark";
}

function changeTheme(themeName) {
    document.body.className = themeName;
    playSound('move');
}

function switchGameMode(mode) {
    const diceContainer = document.getElementById('diceContainer');
    const kaudiContainer = document.getElementById('kaudiContainer');
    document.getElementById('btn-mode-ludo').classList.toggle('active', mode === 'ludo');
    document.getElementById('btn-mode-kaudi').classList.toggle('active', mode === 'kaudi');
    if (mode === 'ludo') {
        diceContainer.classList.remove('hidden');
        kaudiContainer.classList.add('hidden');
        speakText("Ludo Mode");
    } else {
        diceContainer.classList.add('hidden');
        kaudiContainer.classList.remove('hidden');
        speakText("Kaudi Mode");
    }
}

let currentDiceValue = 0;
let currentPlayer = 'red';
let tokenPositions = {
    red: [-1, -1, -1, -1],
    green: [-1, -1, -1, -1],
    yellow: [-1, -1, -1, -1],
    blue: [-1, -1, -1, -1]
};

function rollDice() {
    playSound('roll');
    const diceEl = document.getElementById('dice');
    diceEl.classList.add('rolling');
    setTimeout(() => {
        diceEl.classList.remove('rolling');
        currentDiceValue = Math.floor(Math.random() * 6) + 1;
        document.getElementById('turnIndicatorTextinnerText', {toString: () => {}} );
        document.getElementById('turnIndicatorText').innerText = `${currentPlayer.toUpperCase()} rolled: ${currentDiceValue}`;
        speakText("Aaya " + currentDiceValue);
    }, 400);
}

function handleTokenClick(color, index) {
    if (color !== currentPlayer) {
        speakText("Ye aapki goti nahi hai");
        return;
    }
    if (currentDiceValue === 0) {
        speakText("Pehle dice roll karein");
        return;
    }

    let pos = tokenPositions[color][index];
    if (pos === -1 && currentDiceValue === 6) {
        tokenPositions[color][index] = 0; // Open from base
        moveTokenElementToBoard(color, index, 0);
        playSound('move');
        speakText("Goti bahar aayi");
    } else if (pos !== -1) {
        tokenPositions[color][index] += currentDiceValue;
        if (tokenPositions[color][index] > 50) tokenPositions[color][index] = 50;
        moveTokenElementToBoard(color, index, tokenPositions[color][index]);
        playSound('move');
        speakText("Goti chali");
    } else {
        speakText("6 aane par hi goti khulegi");
    }
    currentDiceValue = 0;
    switchPlayer();
}

function moveTokenElementToBoard(color, index, step) {
    const tokenEl = document.getElementById(`${color}-${index}`);
    if (!tokenEl) return;
    if (step === -1) {
        // Return to base spot
        const baseSpots = document.querySelectorAll(`.${color}-base .token-spot`);
        if (baseSpots[index]) baseSpots[index].appendChild(tokenEl);
    } else {
        // Move to board track (Place inside center/track for visual effect)
        const boardCenter = document.querySelector('.center-home');
        boardCenter.appendChild(tokenEl);
    }
}

function switchPlayer() {
    const players = ['red', 'green', 'yellow', 'blue'];
    let nextIdx = (players.indexOf(currentPlayer) + 1) % players.length;
    currentPlayer = players[nextIdx];
    document.getElementById('turnIndicatorText').innerText = `${currentPlayer.toUpperCase}'s Turn`;
    speakText(currentPlayer + " ki baari");
}

function throwKaudi() {
    playSound('roll');
    let count = 0;
    document.querySelectorAll('.kaudi-shell').forEach(k => {
        if (Math.random() > 0.5) count++;
    });
    speakText("Kaudi score " + count);
}

document.addEventListener('click', initAudio, { once: true });
