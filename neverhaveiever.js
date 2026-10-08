let statements = [];
let currentIntensity = 'mild';
let currentIndex = 0;

// Initialize the game when the page loads
window.addEventListener('DOMContentLoaded', () => {
    const intensitySelect = document.getElementById('intensitySelect');
    if (intensitySelect) {
        currentIntensity = intensitySelect.value;
    }
});

function goToHub() {
    window.location.href = 'index.html';
}

function startGame() {
    const hubBtn = document.querySelector('.hub-button');
    if (hubBtn) hubBtn.style.display = 'none';

    const setupScreen = document.getElementById('setupScreen');
    const gameScreen = document.getElementById('gameScreen');
    const intensitySelect = document.getElementById('intensitySelect');

    if (setupScreen) setupScreen.style.display = 'none';
    if (gameScreen) gameScreen.style.display = 'block';

    if (intensitySelect) {
        currentIntensity = intensitySelect.value;
    }

    if (typeof neverQuestions !== 'undefined' && neverQuestions[currentIntensity]) {
        statements = [...neverQuestions[currentIntensity]];
        shuffleArray(statements);
    } else {
        statements = ['ไม่เคยเล่นเกมนี้มาก่อน'];
    }

    currentIndex = 0;
    updateIntensityButton();
    showCurrentStatement();
}

function backToMenu() {
    const hubBtn = document.querySelector('.hub-button');
    if (hubBtn) hubBtn.style.display = 'flex';

    const setupScreen = document.getElementById('setupScreen');
    const gameScreen = document.getElementById('gameScreen');

    if (gameScreen) gameScreen.style.display = 'none';
    if (setupScreen) setupScreen.style.display = 'flex';
}

function changeIntensity() {
    const intensities = ['mild', 'medium', 'extreme'];
    const emojis = ['😇 เบา', '😈 ปานกลาง', '🔥 แรง'];
    const currentIdx = intensities.indexOf(currentIntensity);
    const nextIdx = (currentIdx + 1) % intensities.length;
    
    currentIntensity = intensities[nextIdx];
    if (typeof neverQuestions !== 'undefined' && neverQuestions[currentIntensity]) {
        statements = [...neverQuestions[currentIntensity]];
        shuffleArray(statements);
    }
    currentIndex = 0;
    
    updateIntensityButton(emojis[nextIdx]);
    showCurrentStatement();
}

function updateIntensityButton(text) {
    const button = document.getElementById('currentIntensity');
    if (!button) return;
    const intensityEmojis = {
        'mild': '😇 เบา',
        'medium': '😈 ปานกลาง',
        'extreme': '🔥 แรง'
    };
    button.textContent = text || intensityEmojis[currentIntensity];
}

function showCurrentStatement() {
    if (statements.length === 0) return;
    const statement = statements[currentIndex];
    const neverStatement = document.getElementById('neverStatement');
    if (!neverStatement) return;
    
    neverStatement.classList.remove('animate__fadeIn', 'animate__fadeOut');
    neverStatement.classList.add('animate__fadeOut');
    
    setTimeout(() => {
        neverStatement.textContent = statement;
        neverStatement.classList.remove('animate__fadeOut');
        neverStatement.classList.add('animate__fadeIn');
    }, 200);
}

function nextQuestion() {
    if (statements.length === 0) return;
    currentIndex++;
    if (currentIndex >= statements.length) {
        shuffleArray(statements);
        currentIndex = 0;
    }
    showCurrentStatement();
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}