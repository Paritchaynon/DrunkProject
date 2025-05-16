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

function updatePlayerList() {
  if (playerOrderList) {
    // Clear the list first
    playerOrderList.innerHTML = '';
    
    // Create and append each player item
    players.forEach((player, index) => {
      const li = document.createElement('li');
      li.className = 'player-item';
      
      if (isEditMode) {
        li.draggable = true;
        li.innerHTML = `
          <span class="drag-handle">⋮⋮</span>
          <span class="player-name">${player}</span>
          <button type="button" class="delete-btn" data-index="${index}">❌</button>
        `;

        // Handle delete button click
        const deleteBtn = li.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          removePlayer(index);
        });
        
        // Mouse drag events
        li.addEventListener('dragstart', (e) => {
          // Don't start drag if clicking delete button
          if (e.target.closest('.delete-btn')) {
            e.preventDefault();
            return;
          }
          e.dataTransfer.setData('text/plain', index);
          li.classList.add('dragging');
        });
        
        li.addEventListener('dragend', () => {
          li.classList.remove('dragging');
        });
        
        li.addEventListener('dragover', (e) => {
          e.preventDefault();
        });
        
        li.addEventListener('drop', (e) => {
          e.preventDefault();
          const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
          const toIndex = index;
          
          if (fromIndex !== toIndex) {
            const [movedPlayer] = players.splice(fromIndex, 1);
            players.splice(toIndex, 0, movedPlayer);
            updatePlayerList();
          }
        });

        // Touch events for mobile
        let touchStartY = 0;
        let touchStartX = 0;
        let touchStartIndex = -1;
        let isDragging = false;
        let targetIndex = -1;
        let initialY = 0;
        let currentY = 0;
        let touchStartTime = 0;
        
        li.addEventListener('touchstart', (e) => {
          // Don't start drag if touching delete button
          if (e.target.closest('.delete-btn')) {
            return;
          }

          touchStartTime = Date.now();
          const touch = e.touches[0];
          touchStartY = touch.clientY;
          touchStartX = touch.clientX;
          touchStartIndex = index;
          targetIndex = index;
          
          // Get initial position of the element
          const rect = li.getBoundingClientRect();
          li.style.position = 'fixed';
          li.style.width = rect.width + 'px';
          li.style.left = rect.left + 'px';
          li.style.top = rect.top + 'px';
          li.style.zIndex = '1000';
          
          // Create placeholder
          const placeholder = document.createElement('li');
          placeholder.className = 'player-item placeholder';
          placeholder.style.visibility = 'hidden';
          li.parentNode.insertBefore(placeholder, li);
          
          e.preventDefault();
        }, { passive: false });

        li.addEventListener('touchmove', (e) => {
          if (e.target.closest('.delete-btn')) return;
          
          const touch = e.touches[0];
          const deltaX = touch.clientX - touchStartX;
          const deltaY = touch.clientY - touchStartY;
          
          // Only start dragging if moved more than 10px vertically
          if (!isDragging && Math.abs(deltaY) > 10 && Math.abs(deltaY) > Math.abs(deltaX)) {
            isDragging = true;
            initialY = touch.clientY;
            li.classList.add('dragging');
          }
          
          if (!isDragging) return;
          
          currentY = touch.clientY;
          const moveY = currentY - initialY;
          
          // Move the dragged element
          li.style.transform = `translateY(${moveY}px)`;
          
          // Find potential drop target
          const elements = document.elementsFromPoint(touch.clientX, touch.clientY);
          const hoverItem = elements.find(el => 
            el.classList.contains('player-item') && 
            !el.classList.contains('dragging') &&
            !el.classList.contains('placeholder')
          );
          
          if (hoverItem) {
            const hoverIndex = Array.from(playerOrderList.children).indexOf(hoverItem);
            if (hoverIndex !== targetIndex) {
              // Move placeholder
              const placeholder = playerOrderList.querySelector('.placeholder');
              if (hoverIndex > targetIndex) {
                hoverItem.parentNode.insertBefore(placeholder, hoverItem.nextSibling);
              } else {
                hoverItem.parentNode.insertBefore(placeholder, hoverItem);
              }
              targetIndex = hoverIndex;
            }
          }
          
          e.preventDefault();
        }, { passive: false });

        li.addEventListener('touchend', (e) => {
          // Handle tap on delete button
          if (!isDragging && e.target.closest('.delete-btn')) {
            return;
          }
          
          if (!isDragging) return;
          
          isDragging = false;
          li.style.position = '';
          li.style.width = '';
          li.style.left = '';
          li.style.top = '';
          li.style.zIndex = '';
          li.style.transform = '';
          li.classList.remove('dragging');
          
          // Remove placeholder and update array
          const placeholder = playerOrderList.querySelector('.placeholder');
          if (placeholder) {
            placeholder.remove();
          }
          
          if (targetIndex !== touchStartIndex) {
            const [movedPlayer] = players.splice(touchStartIndex, 1);
            players.splice(targetIndex, 0, movedPlayer);
            updatePlayerList();
          }
        });

        li.addEventListener('touchcancel', () => {
          isDragging = false;
          li.style.position = '';
          li.style.width = '';
          li.style.left = '';
          li.style.top = '';
          li.style.zIndex = '';
          li.style.transform = '';
          li.classList.remove('dragging');
          
          // Remove placeholder
          const placeholder = playerOrderList.querySelector('.placeholder');
          if (placeholder) {
            placeholder.remove();
          }
          
          updatePlayerList();
        });
      } else {
        li.innerHTML = `<span class="player-name">${player}</span>`;
      }
      
      // Append the li element to the list
      playerOrderList.appendChild(li);
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

function toggleEditMode() {
  isEditMode = !isEditMode;
  const editBtn = document.getElementById('editModeBtn');
  editBtn.textContent = isEditMode ? '✅ เสร็จสิ้น' : '✏️ จัดตำแหน่ง';
  updatePlayerList();
}

// Game Logic
function startGame() {
  if (players.length < 2) {
    alert('ต้องมีผู้เล่นอย่างน้อย 2 คน');
    return;
  }
  
  document.querySelector('.hub-button').style.display = 'none';
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
  document.querySelector('.hub-button').style.display = 'flex';
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
  updatePlayerList();
}); 