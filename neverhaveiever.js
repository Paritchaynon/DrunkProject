let statements = [];
let currentIntensity = 'mild';

// Initialize the game when the page loads
window.onload = function() {
    initializeGame();
};

function goToHub() {
    window.location.href = 'index.html';
}

function startGame() {
    document.querySelector('.hub-button').style.display = 'none';
    setupScreen.style.display = 'none';
    gameScreen.style.display = 'block';
    currentIntensity = document.getElementById('intensitySelect').value;
    statements = [...neverQuestions[currentIntensity]];
    shuffleArray(statements);
    
    updateIntensityButton();
    updateGameDisplay();
    nextQuestion();
}

function backToMenu() {
    document.querySelector('.hub-button').style.display = 'flex';
    gameScreen.style.display = 'none';
    setupScreen.style.display = 'flex';
}

function changeIntensity() {
    const intensities = ['mild', 'medium', 'extreme'];
    const emojis = ['😇 เบา', '😈 ปานกลาง', '🔥 แรง'];
    const currentIndex = intensities.indexOf(currentIntensity);
    const nextIndex = (currentIndex + 1) % intensities.length;
    
    currentIntensity = intensities[nextIndex];
    statements = [...neverQuestions[currentIntensity]];
    shuffleArray(statements);
    
    updateIntensityButton(emojis[nextIndex]);
    updateGameDisplay();
}

function updateIntensityButton(text) {
    const button = document.getElementById('currentIntensity');
    const intensityEmojis = {
        'mild': '😇 เบา',
        'medium': '😈 ปานกลาง',
        'extreme': '🔥 แรง'
    };
    button.textContent = text || intensityEmojis[currentIntensity];
}

function updateGameDisplay() {
    const statement = statements[0];
    const neverStatement = document.getElementById('neverStatement');
    
    // Remove previous animation classes
    neverStatement.classList.remove('animate__fadeIn', 'animate__fadeOut');
    
    // Add fade out animation
    neverStatement.classList.add('animate__fadeOut');
    
    // Update text and add fade in animation after a short delay
    setTimeout(() => {
        neverStatement.textContent = statement;
        neverStatement.classList.remove('animate__fadeOut');
        neverStatement.classList.add('animate__fadeIn');
    }, 300);
}

function nextQuestion() {
    statements.shift();
    
    if (statements.length === 0) {
        statements = [...neverQuestions[currentIntensity]];
        shuffleArray(statements);
    }
    
    updateGameDisplay();
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
} 