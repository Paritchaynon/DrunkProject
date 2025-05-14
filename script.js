const players = [];
let currentPlayer = '';
let timerInterval = null;

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
  const listDiv = document.getElementById("players");
  listDiv.innerHTML = "<strong>ผู้เล่น:</strong> " + players.join(", ");
}

function startGame() {
  if (players.length === 0) {
    alert("กรุณาเพิ่มผู้เล่นก่อน!");
    return;
  }

  document.getElementById("setupScreen").style.display = "none";
  document.getElementById("gameScreen").style.display = "block";
  nextPlayer();
}

function backToMenu() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  
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
  
  currentPlayer = players[Math.floor(Math.random() * players.length)];
  
  const playerNameElement = document.getElementById("playerName");
  playerNameElement.innerHTML = `<span>${currentPlayer}</span>`;
  
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