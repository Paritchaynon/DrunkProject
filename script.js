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
  
  // Move to next player in sequence
  currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
  currentPlayer = players[currentPlayerIndex];
  
  const playerNameElement = document.getElementById("playerName");
  playerNameElement.innerHTML = `<span class="current-player-name">${currentPlayer}</span>`;
  
  document.getElementById("choiceArea").style.display = "block";
  document.getElementById("questionArea").style.display = "none";
  document.getElementById("timerArea").style.display = "none";
  document.getElementById("nextButton").style.display = "none";
}

function startTimer(duration) {
  if (duration <= 0) return;
  
  const timerArea = document.getElementById("timerArea");
  const gameContainer = document.getElementById("gameScreen");
  
  timerArea.innerHTML = '<div class="timer-bar"></div>';
  timerArea.style.display = "block";
  timerArea.classList.remove("timer-warning");
  gameContainer.classList.remove("time-warning", "time-urgent");
  
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
    
    // Warning states
    const warningThreshold = Math.min(10, totalTime * 0.3); // 30% of time or 10 seconds
    const urgentThreshold = Math.min(5, totalTime * 0.15); // 15% of time or 5 seconds
    
    if (timeLeft <= urgentThreshold) {
      timerArea.classList.add("timer-warning");
      gameContainer.classList.remove("time-warning");
      gameContainer.classList.add("time-urgent");
    } else if (timeLeft <= warningThreshold) {
      timerArea.classList.add("timer-warning");
      gameContainer.classList.add("time-warning");
      gameContainer.classList.remove("time-urgent");
    }
    
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      timerBar.style.width = '0%';
      timerArea.innerHTML = '<div class="timer-bar" style="width: 0%"></div><div class="times-up">⏰ หมดเวลา!</div>';
      // Keep the warning state active
      gameContainer.classList.add("time-urgent");
    }
  }, 1000);
}

function updateTimerBar(timerBar, timeLeft, totalTime) {
  const percentage = (timeLeft / totalTime) * 100;
  timerBar.style.width = `${percentage}%`;
}

function chooseType(type) {
  const intensity = document.getElementById("intensitySelect").value;
  const questions = type === 'truth' ? truthQuestions : dareQuestions;
  
  // Double check release date for แม่กำปอง Edition
  if (intensity === 'kampong') {
    const releaseDate = new Date('2025-05-24');
    const currentDate = new Date();
    if (currentDate < releaseDate) {
      alert("แม่กำปอง Edition จะเปิดให้เล่นในวันที่ 24 พฤษภาคม 2568");
      return;
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