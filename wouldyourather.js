// Game state
let players = [];
let currentPlayerIndex = 0;
let currentIntensity = 'mild';
let usedQuestions = new Set();
let isEditMode = false;

// DOM Elements
const setupScreen = document.getElementById('setupScreen');
const gameScreen = document.getElementById('gameScreen');
const playerInput = document.getElementById('playerInput');
const playerOrderList = document.getElementById('playerOrderList');
const intensitySelect = document.getElementById('intensitySelect');
const playerNameDisplay = document.getElementById('playerName');
const optionADisplay = document.getElementById('optionA');
const optionBDisplay = document.getElementById('optionB');
const currentIntensityDisplay = document.getElementById('currentIntensity');
const nextButton = document.getElementById('nextButton');
const questionArea = document.getElementById('questionArea');

// Initialize drag and drop
function initializeDragAndDrop() {
  if (playerOrderList) {
    new Sortable(playerOrderList, {
      animation: 150,
      handle: '.drag-handle',
      disabled: !isEditMode,
      onEnd: function() {
        // Update players array after drag
        players = Array.from(playerOrderList.children).map(li => li.dataset.player);
      }
    });
  }
}

// Player Management
function addPlayer() {
  const name = playerInput.value.trim();
  if (name && !players.includes(name)) {
    players.push(name);
    updatePlayerList();
    playerInput.value = '';
  }
}

function removePlayer(index) {
  players.splice(index, 1);
  updatePlayerList();
}

function updatePlayerList() {
  if (playerOrderList) {
    playerOrderList.innerHTML = players.map((player, index) => `
      <li class="player-item" data-player="${player}">
        ${isEditMode ? '<span class="drag-handle">↕️</span>' : ''}
        <span class="player-name">${player}</span>
        ${isEditMode ? `<button class="delete-btn" onclick="removePlayer(${index})">❌</button>` : ''}
      </li>
    `).join('');
    
    // Reinitialize drag and drop after updating list
    initializeDragAndDrop();
  }
}

function toggleEditMode() {
  isEditMode = !isEditMode;
  const editBtn = document.getElementById('editModeBtn');
  editBtn.textContent = isEditMode ? '✅ เสร็จสิ้น' : '✏️ จัดตำแหน่ง';
  updatePlayerList();
  
  // Update Sortable instance
  const sortableInstance = Sortable.get(playerOrderList);
  if (sortableInstance) {
    sortableInstance.option("disabled", !isEditMode);
  }
}

// Game Logic
function startGame() {
  if (players.length < 2) {
    alert('ต้องมีผู้เล่นอย่างน้อย 2 คน');
    return;
  }
  
  currentPlayerIndex = 0;
  currentIntensity = intensitySelect.value;
  setupScreen.style.display = 'none';
  gameScreen.style.display = 'block';
  updateIntensityDisplay();
  nextQuestion();
}

function getRandomQuestion() {
  const availableQuestions = wyrQuestions[currentIntensity].filter(
    (_, index) => !usedQuestions.has(`${currentIntensity}-${index}`)
  );

  if (availableQuestions.length === 0) {
    usedQuestions.clear();
    return wyrQuestions[currentIntensity][
      Math.floor(Math.random() * wyrQuestions[currentIntensity].length)
    ];
  }

  const question = availableQuestions[
    Math.floor(Math.random() * availableQuestions.length)
  ];
  const index = wyrQuestions[currentIntensity].indexOf(question);
  usedQuestions.add(`${currentIntensity}-${index}`);
  return question;
}

function nextQuestion() {
  const question = getRandomQuestion();
  playerNameDisplay.textContent = players[currentPlayerIndex];
  optionADisplay.textContent = question.optionA;
  optionBDisplay.textContent = question.optionB;
  
  // Reset buttons and next text
  document.querySelectorAll('.choice-btn').forEach(btn => {
    btn.classList.remove('selected', 'not-selected');
    btn.disabled = false;
  });
  
  nextButton.innerHTML = '<span class="next-text">ไม่เลือกต้องดื่ม 2 เท่า!</span>';
  nextButton.classList.add('clickable');
  nextButton.onclick = () => {
    // Add shake animation to indicate penalty
    questionArea.classList.add('animate__animated', 'animate__shakeX');
    setTimeout(() => {
      questionArea.classList.remove('animate__animated', 'animate__shakeX');
      nextQuestion();
    }, 1000);
  };
  
  currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
}

function chooseOption(option) {
  // Disable all buttons
  document.querySelectorAll('.choice-btn').forEach(btn => {
    btn.disabled = true;
  });

  // Add selected/not-selected classes
  const selectedBtn = document.querySelector(`.option-${option.toLowerCase()}`);
  const otherBtn = document.querySelector(`.option-${option === 'A' ? 'b' : 'a'}`);
  
  selectedBtn.classList.add('selected');
  otherBtn.classList.add('not-selected');
  
  // Add feedback animation
  selectedBtn.classList.add('animate__pulse');
  setTimeout(() => {
    selectedBtn.classList.remove('animate__pulse');
    // Auto proceed to next question after animation
    nextQuestion();
  }, 1500);
}

function changeIntensity() {
  const intensities = ['mild', 'medium', 'extreme'];
  const currentIndex = intensities.indexOf(currentIntensity);
  currentIntensity = intensities[(currentIndex + 1) % intensities.length];
  updateIntensityDisplay();
}

function updateIntensityDisplay() {
  const intensityEmojis = {
    mild: '😇 เบา',
    medium: '😈 ปานกลาง',
    extreme: '🔥 แรง'
  };
  currentIntensityDisplay.textContent = intensityEmojis[currentIntensity];
}

function backToMenu() {
  gameScreen.style.display = 'none';
  setupScreen.style.display = 'flex';
  usedQuestions.clear();
  isEditMode = false;
  updatePlayerList();
}

function goToHub() {
  window.location.href = 'index.html';
}

// Event Listeners
playerInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    addPlayer();
  }
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  gameScreen.style.display = 'none';
  initializeDragAndDrop();
}); 