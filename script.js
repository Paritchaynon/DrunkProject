const players = [];
let currentPlayer = '';
let currentPlayerIndex = -1;
let timerInterval = null;
let isEditMode = false;

function addPlayer() {
  const input = document.getElementById("playerInput");
  const name = input.value.trim();
  if (name) {
    players.push(name);
    input.value = "";
    updatePlayerList();
  }
}

// Add event listener for enter key
document.addEventListener('DOMContentLoaded', function() {
  const playerInput = document.getElementById("playerInput");
  playerInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addPlayer();
    }
  });
});

function updatePlayerList() {
  const listElement = document.getElementById("playerOrderList");
  listElement.innerHTML = "";
  
  players.forEach((player, index) => {
    const li = document.createElement("li");
    li.className = "player-item";
    if (isEditMode) {
      li.draggable = true;
      li.innerHTML = `
        <span class="drag-handle">⋮⋮</span>
        <span class="player-name">${player}</span>
        <button class="delete-btn" onclick="removePlayer(${index})">❌</button>
      `;
      
      // Mouse drag events
      li.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", index);
        li.classList.add("dragging");
      });
      
      li.addEventListener("dragend", () => {
        li.classList.remove("dragging");
      });
      
      li.addEventListener("dragover", (e) => {
        e.preventDefault();
      });
      
      li.addEventListener("drop", (e) => {
        e.preventDefault();
        const fromIndex = parseInt(e.dataTransfer.getData("text/plain"));
        const toIndex = index;
        
        if (fromIndex !== toIndex) {
          const [movedPlayer] = players.splice(fromIndex, 1);
          players.splice(toIndex, 0, movedPlayer);
          updatePlayerList();
        }
      });

      // Touch events for mobile
      let touchStartY = 0;
      let touchStartIndex = -1;
      let currentTouchY = 0;
      let isDragging = false;
      let targetIndex = -1;
      let initialY = 0;
      let currentY = 0;
      
      li.addEventListener("touchstart", (e) => {
        const touch = e.touches[0];
        touchStartY = touch.clientY;
        touchStartIndex = index;
        targetIndex = index;
        isDragging = true;
        initialY = touch.clientY;
        
        // Get initial position of the element
        const rect = li.getBoundingClientRect();
        li.style.position = 'fixed';
        li.style.width = rect.width + 'px';
        li.style.left = rect.left + 'px';
        li.style.top = rect.top + 'px';
        li.style.zIndex = '1000';
        li.classList.add("dragging");
        
        // Create placeholder
        const placeholder = document.createElement('li');
        placeholder.className = 'player-item placeholder';
        placeholder.style.visibility = 'hidden';
        li.parentNode.insertBefore(placeholder, li);
        
        e.preventDefault();
      }, { passive: false });

      li.addEventListener("touchmove", (e) => {
        if (!isDragging) return;
        
        const touch = e.touches[0];
        currentY = touch.clientY;
        const deltaY = currentY - initialY;
        
        // Move the dragged element
        li.style.transform = `translateY(${deltaY}px)`;
        
        // Find potential drop target
        const elements = document.elementsFromPoint(touch.clientX, touch.clientY);
        const hoverItem = elements.find(el => 
          el.classList.contains("player-item") && 
          !el.classList.contains("dragging") &&
          !el.classList.contains("placeholder")
        );
        
        if (hoverItem) {
          const hoverIndex = Array.from(listElement.children).indexOf(hoverItem);
          if (hoverIndex !== targetIndex) {
            // Move placeholder
            const placeholder = listElement.querySelector('.placeholder');
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

      li.addEventListener("touchend", () => {
        if (!isDragging) return;
        
        isDragging = false;
        li.style.position = '';
        li.style.width = '';
        li.style.left = '';
        li.style.top = '';
        li.style.zIndex = '';
        li.style.transform = '';
        li.classList.remove("dragging");
        
        // Remove placeholder and update array
        const placeholder = listElement.querySelector('.placeholder');
        if (placeholder) {
          placeholder.remove();
        }
        
        if (targetIndex !== touchStartIndex) {
          const [movedPlayer] = players.splice(touchStartIndex, 1);
          players.splice(targetIndex, 0, movedPlayer);
          updatePlayerList();
        }
      });

      li.addEventListener("touchcancel", () => {
        isDragging = false;
        li.style.position = '';
        li.style.width = '';
        li.style.left = '';
        li.style.top = '';
        li.style.zIndex = '';
        li.style.transform = '';
        li.classList.remove("dragging");
        
        // Remove placeholder
        const placeholder = listElement.querySelector('.placeholder');
        if (placeholder) {
          placeholder.remove();
        }
        
        updatePlayerList();
      });
      
    } else {
      li.innerHTML = `<span class="player-name">${player}</span>`;
    }
    listElement.appendChild(li);
  });
}

function removePlayer(index) {
  players.splice(index, 1);
  updatePlayerList();
}

function toggleEditMode() {
  isEditMode = !isEditMode;
  const editBtn = document.getElementById("editModeBtn");
  editBtn.textContent = isEditMode ? "✅ เสร็จสิ้น" : "✏️ จัดตำแหน่ง";
  updatePlayerList();
}

function startGame() {
  if (players.length === 0) {
    alert("กรุณาเพิ่มผู้เล่นก่อน!");
    return;
  }

  // Check if แม่กำปอง Edition is selected but not yet released
  const selectedIntensity = document.getElementById("intensitySelect").value;
  const releaseDate = new Date('2025-05-24');
  const currentDate = new Date();
  
  if (selectedIntensity === 'kampong' && currentDate < releaseDate) {
    alert("แม่กำปอง Edition จะเปิดให้เล่นในวันที่ 24 พฤษภาคม 2568");
    return;
  }

  document.getElementById("setupScreen").style.display = "none";
  document.getElementById("gameScreen").style.display = "block";
  currentPlayerIndex = -1; // Reset to start from the first player
  nextPlayer();
}

function backToMenu() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  
  currentPlayerIndex = -1; // Reset player index when going back to menu
  document.getElementById("gameScreen").style.display = "none";
  document.getElementById("setupScreen").style.display = "block";
  document.getElementById("timerArea").style.display = "none";
  document.getElementById("questionArea").style.display = "none";
  document.getElementById("nextButton").style.display = "none";
}

function nextPlayer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  
  // Reset all warning states and animations
  const timerArea = document.getElementById("timerArea");
  
  // Remove warning classes and reset styles
  timerArea.classList.remove("timer-warning", "times-up");
  
  // Clear any existing timer elements
  timerArea.innerHTML = '';
  timerArea.style.display = "none";
  
  // Move to next player in sequence
  currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
  currentPlayer = players[currentPlayerIndex];
  
  const playerNameElement = document.getElementById("playerName");
  playerNameElement.innerHTML = `<span class="current-player-name">${currentPlayer}</span>`;
  
  // Reset display states
  document.getElementById("choiceArea").style.display = "block";
  document.getElementById("questionArea").style.display = "none";
  document.getElementById("nextButton").style.display = "none";
}

function startTimer(duration) {
  if (duration <= 0) return;
  
  const timerArea = document.getElementById("timerArea");
  const gameContainer = document.getElementById("gameScreen");
  
  timerArea.innerHTML = '<div class="timer-bar"></div>';
  timerArea.style.display = "block";
  timerArea.classList.remove("timer-warning", "times-up");
  
  const timerBar = timerArea.querySelector(".timer-bar");
  let timeLeft = duration;
  const totalTime = duration;
  
  if (timerInterval) {
    clearInterval(timerInterval);
  }
  
  updateTimerBar(timerBar, timeLeft, totalTime);
  
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerBar(timerBar, timeLeft, totalTime);
    
    // Warning states with just timer bar color change
    const warningThreshold = Math.min(10, totalTime * 0.3); // 30% of time or 10 seconds
    
    if (timeLeft <= warningThreshold) {
      timerArea.classList.add("timer-warning");
    }
    
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      
      // Animate the time's up state
      timerArea.classList.add("times-up");
      timerBar.style.width = '0%';
      
      // Create and animate the times up message
      const timesUpMessage = document.createElement('div');
      timesUpMessage.className = 'times-up-message animate__animated animate__bounceIn';
      timesUpMessage.innerHTML = `
        <div class="times-up-icon">⏰</div>
        <div class="times-up-text">หมดเวลา!</div>
      `;
      timerArea.appendChild(timesUpMessage);
      
      // Vibrate on mobile devices if supported
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }
    }
  }, 1000);
}

function updateTimerBar(timerBar, timeLeft, totalTime) {
  const percentage = (timeLeft / totalTime) * 100;
  requestAnimationFrame(() => {
    timerBar.style.width = `${percentage}%`;
  });
}

function chooseType(type) {
  const intensity = document.getElementById("intensitySelect").value;
  const questions = type === 'truth' ? truthQuestions : dareQuestions;
  
  // Double check release date for แม่กำปอง Edition
  if (intensity === 'kampong') {
    const releaseDate = new Date('2025-05-24'); // This will typically parse as YYYY-MM-DD local time midnight
    const currentDate = new Date();

    // For a more robust date comparison, ensure we are comparing dates only (not times)
    // Set releaseDate to the very start of that day.
    releaseDate.setHours(0, 0, 0, 0);
    // Create a comparable current date (start of today)
    const today = new Date();
    today.setHours(0,0,0,0);

    if (today < releaseDate) {
      const questionArea = document.getElementById("questionArea");
      const choiceArea = document.getElementById("choiceArea");
      const nextButton = document.getElementById("nextButton");
      const timerArea = document.getElementById("timerArea");

      // Hide choice buttons area
      if (choiceArea) {
        choiceArea.style.display = "none";
      }
      
      // Display message in question area
      if (questionArea) {
        // Using var(--warning-color) from styles.css for the heading
        questionArea.innerHTML = `
          <div style="padding: 20px; text-align: center;">
            <h3 style="color: var(--warning-color); margin-bottom: 10px; font-size: 1.5em;">🔒 เนื้อหาถูกล็อค</h3>
            <p style="font-size: 1.1em;"><strong>แม่กำปอง Edition</strong> จะเปิดให้เล่นในวันที่ 24 พฤษภาคม 2568</p>
            <p style="font-size: 0.9em; margin-top: 15px; color: #555;">กรุณาเลือกโหมดความรุนแรงอื่น หรือกลับไปที่เมนูหลักโดยใช้ปุ่ม '↩️ เมนู' ด้านบน</p>
          </div>
        `;
        questionArea.style.display = "block";
      }
      
      // Ensure next button is hidden (it would normally be shown after this block)
      if (nextButton) {
        nextButton.style.display = "none";
      }
      
      // Ensure timer area is hidden (timer would normally start after this block)
      if (timerArea) {
        timerArea.style.display = "none";
      }
      
      return; // Stop further processing for this choice
    }
  }
  
  const questionList = questions[intensity];
  const randomQuestion = questionList[Math.floor(Math.random() * questionList.length)];
  
  document.getElementById("choiceArea").style.display = "none";
  const questionArea = document.getElementById("questionArea");
  questionArea.innerHTML = `
    <div class="question-type">${type === 'truth' ? '🤔' : '😈'} ${type.toUpperCase()}</div>
    <div class="question-text">${randomQuestion}</div>
  `;
  questionArea.style.display = "block";
  document.getElementById("nextButton").style.display = "block";
  
  const timerDuration = parseInt(document.getElementById("timerSelect").value);
  startTimer(timerDuration);
}

function goToHub() {
  // Clear any ongoing timers
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  
  // Reset game state
  currentPlayerIndex = -1;
  players.length = 0;
  
  // Navigate to the hub page
  window.location.href = 'index.html';
} 