// =========================================================
// I'M NOT DRUNK - Party Drinking Card Game Engine
// =========================================================

// --- Web Audio Synthesizer (Zero External Dependencies) ---
class PartySoundFX {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  playFlip() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(700, this.ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  playWin() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.08);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.08 + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(this.ctx.currentTime + idx * 0.08);
      osc.stop(this.ctx.currentTime + idx * 0.08 + 0.25);
    });
  }

  playDrink() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(110, this.ctx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }

  playTap() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }
}

const sfx = new PartySoundFX();

// --- Game State ---
const state = {
  gameMode: 'circle', // 'circle' หรือ 'players'
  players: [],
  currentPlayerIndex: 0,
  selectedCategory: 'all',
  deck: [],        // ไพ่ที่ยังไม่ได้เล่น (shuffle แล้ว)
  usedIds: new Set(), // ติดตาม id ที่เล่นไปแล้ว (no-repeat)
  currentCard: null,
  isFlipped: false,
  cardCount: 0,
  totalDrinks: 0,
  playerStats: {}, // playerName -> { survive: 0, drinks: 0 }
  hasDecidedCurrentCard: false
};

// --- DOM References ---
const setupScreen = document.getElementById('setupScreen');
const gameScreen = document.getElementById('gameScreen');
const playerSetupBox = document.getElementById('playerSetupBox');
const playerInput = document.getElementById('playerInput');
const playerTagsContainer = document.getElementById('playerTags');
const flipCardEl = document.getElementById('flipCard');
const currentTurnNameEl = document.getElementById('currentTurnName');
const cardCounterEl = document.getElementById('cardCounter');
const tallyCardsEl = document.getElementById('tallyCards');
const tallyDrinksEl = document.getElementById('tallyDrinks');
const soundToggleBtn = document.getElementById('soundToggleBtn');
const partyToastEl = document.getElementById('partyToast');
const statsModal = document.getElementById('statsModal');
const statsListEl = document.getElementById('statsList');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  setupCategoryChips();
  setupModeTabs();
  
  // Enter key for player input
  if (playerInput) {
    playerInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addPlayer();
      }
    });
  }
});

// Setup Mode Tabs
function setupModeTabs() {
  const tabs = document.querySelectorAll('.mode-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const mode = tab.dataset.mode;
      state.gameMode = mode;
      sfx.playTap();
      
      if (mode === 'players') {
        playerSetupBox.style.display = 'block';
      } else {
        playerSetupBox.style.display = 'none';
      }
    });
  });
}

// Setup Category Chips
function setupCategoryChips() {
  const chips = document.querySelectorAll('.category-chips .chip');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state.selectedCategory = chip.dataset.cat;
      sfx.playTap();
    });
  });
}

// --- Player Management ---
function addPlayer() {
  if (!playerInput) return;
  const name = playerInput.value.trim();
  if (!name) return;

  if (state.players.includes(name)) {
    showToast('มีชื่อนี้ในวงแล้ว!');
    return;
  }

  state.players.push(name);
  state.playerStats[name] = { survive: 0, drinks: 0 };
  playerInput.value = '';
  renderPlayerTags();
  sfx.playTap();
}

function removePlayer(name) {
  state.players = state.players.filter(p => p !== name);
  delete state.playerStats[name];
  renderPlayerTags();
  sfx.playTap();
}

function renderPlayerTags() {
  if (!playerTagsContainer) return;
  playerTagsContainer.innerHTML = '';
  state.players.forEach(name => {
    const tag = document.createElement('div');
    tag.className = 'player-tag';
    tag.innerHTML = `
      <span>👤 ${name}</span>
      <span class="remove-tag" onclick="removePlayer('${name}')">✕</span>
    `;
    playerTagsContainer.appendChild(tag);
  });
}

// --- Sound Toggle ---
function toggleSound() {
  const isEnabled = sfx.toggle();
  soundToggleBtn.textContent = isEnabled ? '🔊' : '🔇';
  showToast(isEnabled ? 'เปิดเสียงเอฟเฟกต์ 🔊' : 'ปิดเสียง 🔇');
}

// --- Start Game ---
function startGame() {
  if (state.gameMode === 'players' && state.players.length < 2) {
    showToast('กรุณาเพิ่มชื่อผู้เล่นอย่างน้อย 2 คน!');
    return;
  }

  state.deck = buildFreshDeck();
  if (state.deck.length === 0) {
    showToast('ไม่มีการ์ดในหมวดที่เลือก!');
    return;
  }

  state.usedIds = new Set(); // รีเซ็ต tracking
  state.cardCount = 0;
  state.totalDrinks = 0;
  state.currentPlayerIndex = 0;

  // Transition UI
  setupScreen.style.display = 'none';
  gameScreen.style.display = 'block';

  sfx.playFlip();
  drawNextCard(false);
}

function backToSetup() {
  sfx.playTap();
  gameScreen.style.display = 'none';
  setupScreen.style.display = 'block';
  state.isFlipped = false;
  if (flipCardEl) flipCardEl.classList.remove('is-flipped');
}

function buildFreshDeck() {
  let availableCards = [];
  const isPlayers = state.gameMode === 'players' && state.players.length > 0;
  if (typeof getFilteredCards === 'function') {
    availableCards = getFilteredCards(state.selectedCategory, isPlayers);
  } else if (typeof imNotDrunkCards !== 'undefined') {
    availableCards = isPlayers ? [...imNotDrunkCards] : imNotDrunkCards.filter(c => !c.requiresPlayer);
  }

  // สำหรับการ์ดที่ตั้ง allowRepeat ให้ใส่เพิ่มในสำรับเพื่อให้มีโอกาสสุ่มได้ซ้ำเรื่อยๆ ในรอบเดียวกัน
  const extraRepeatCards = availableCards.filter(c => c.allowRepeat);
  let finalDeck = [...availableCards];
  if (extraRepeatCards.length > 0) {
    for (let i = 0; i < 3; i++) {
      finalDeck.push(...extraRepeatCards);
    }
  }

  return shuffle(finalDeck);
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatCardTextWithPlayers(text, currentPlayer, targetPlayer) {
  if (!text) return '';
  let formatted = escapeHtml(text);

  const playerTag = currentPlayer 
    ? `<span class="player-highlight">👤 ${escapeHtml(currentPlayer)}</span>` 
    : '';
  const targetTag = targetPlayer 
    ? `<span class="player-highlight">🎯 ${escapeHtml(targetPlayer)}</span>` 
    : '';

  // 1. ถ้าการ์ดมี placeholder {player} หรือ {target} ให้แทนที่ตรงจุด
  if (formatted.includes('{player}') || formatted.includes('{target}')) {
    if (playerTag) formatted = formatted.replaceAll('{player}', playerTag);
    if (targetTag) formatted = formatted.replaceAll('{target}', targetTag);
    return formatted;
  }

  // 2. ถ้าเป็นการ์ดทั่วไปที่ไม่มี placeholder แต่เล่นโหมดใส่ชื่อ
  // สุ่มประมาณ 35% ของการ์ด ให้เจาะจงชื่อผู้เล่นชัดเจนไปเลย
  if (currentPlayer && state.gameMode === 'players') {
    // กำหนด deterministic นิดหน่อยจาก id เพื่อไม่ให้กระพริบเปลี่ยนไปเปลี่ยนมา
    const shouldTarget = (state.cardCount % 3 === 0);
    if (shouldTarget) {
      if (targetPlayer && (formatted.startsWith('คุณ') || formatted.startsWith('สั่งใคร'))) {
        formatted = `${playerTag} สั่ง ${targetTag}: ` + formatted.replace(/^(คุณ|สั่งใครก็ได้ในวง|เลือกเพื่อน 1 คน)/, '');
      } else {
        formatted = `${playerTag} : ` + formatted;
      }
    }
  }

  return formatted;
}

function drawNextCard(advancePlayer = true) {
  // ถ้า deck หมด → สับใหม่ทั้งหมด รีเซ็ต usedIds ด้วย
  if (state.deck.length === 0) {
    state.deck = buildFreshDeck();
    state.usedIds = new Set();
    showToast('สับการ์ดกองใหม่เรียบร้อย! ไม่มีซ้ำรอบนี้ 🃏');
  }

  // กรองการ์ดที่เคยออกไปแล้วออกก่อน pop (ยกเว้นการ์ดที่ตั้ง allowRepeat: true)
  let nextCard = null;
  let attempts = 0;
  while (state.deck.length > 0 && attempts < state.deck.length) {
    const candidate = state.deck[state.deck.length - 1];
    if (candidate.allowRepeat || !state.usedIds.has(candidate.id)) {
      nextCard = state.deck.pop();
      break;
    }
    state.deck.unshift(state.deck.pop());
    attempts++;
  }

  // ถ้าทุกใบซ้ำหมดแล้ว → สับใหม่
  if (!nextCard) {
    state.deck = buildFreshDeck();
    state.usedIds = new Set();
    nextCard = state.deck.pop();
    showToast('เล่นครบทุกใบแล้ว! สับกองใหม่ให้ 🎊');
  }

  if (!nextCard.allowRepeat) {
    state.usedIds.add(nextCard.id);
  }

  if (advancePlayer && state.gameMode === 'players' && state.players.length > 0) {
    state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
  }

  state.currentCard = nextCard;
  state.cardCount++;
  state.hasDecidedCurrentCard = false;

  // Reset Card Flip state
  state.isFlipped = false;
  if (flipCardEl) {
    flipCardEl.classList.remove('is-flipped');
  }

  updateTurnDisplay();
  populateCardFront(state.currentCard);
  updateTally();
}

function flipCurrentCard() {
  if (state.isFlipped) return;
  state.isFlipped = true;
  flipCardEl.classList.add('is-flipped');
  sfx.playFlip();

  if (navigator.vibrate) {
    navigator.vibrate(50);
  }
}

function populateCardFront(card) {
  if (!card) return;

  const cardFront = document.getElementById('cardFrontFace');
  const catBadge = document.getElementById('cardCategoryBadge');
  const badgePill = document.getElementById('cardBadgePill');
  const headline = document.getElementById('cardHeadline');
  const instruction = document.getElementById('cardInstruction');
  const surviveText = document.getElementById('cardSurviveText');
  const penaltyText = document.getElementById('cardPenaltyText');

  // Reset classes
  cardFront.className = 'card-face card-front theme-' + card.category;

  catBadge.textContent = card.categoryName || '🃏 การ์ดวงเหล้า';
  badgePill.textContent = card.badge || 'ทั่วไป';
  headline.textContent = card.title;

  // คำนวณผู้เล่นปัจจุบัน และผู้เล่นเป้าหมาย
  let currentPlayer = null;
  let targetPlayer = null;

  if (state.gameMode === 'players' && state.players.length > 0) {
    currentPlayer = state.players[state.currentPlayerIndex];
    if (state.players.length > 1) {
      // สุ่มผู้เล่นเป้าหมายที่ไม่ใช่คนปัจจุบัน
      const otherPlayers = state.players.filter(p => p !== currentPlayer);
      targetPlayer = otherPlayers[Math.floor(Math.random() * otherPlayers.length)];
    } else {
      targetPlayer = currentPlayer;
    }
  }

  // แปลงข้อความพร้อมใส่ highlight ให้ชื่อผู้เล่น
  instruction.innerHTML = formatCardTextWithPlayers(card.text, currentPlayer, targetPlayer);
  surviveText.innerHTML = formatCardTextWithPlayers(card.survive, currentPlayer, targetPlayer);
  penaltyText.innerHTML = formatCardTextWithPlayers(card.penalty, currentPlayer, targetPlayer);
}

function updateTurnDisplay() {
  if (state.gameMode === 'players' && state.players.length > 0) {
    const currentName = state.players[state.currentPlayerIndex];
    currentTurnNameEl.textContent = `ตาของ: ${currentName}`;
  } else {
    currentTurnNameEl.textContent = 'วงเหล้าเปิดการ์ด 🍻';
  }
  cardCounterEl.textContent = `ใบที่ #${state.cardCount}`;
}

function updateTally() {
  if (tallyCardsEl) tallyCardsEl.textContent = state.cardCount;
  if (tallyDrinksEl) tallyDrinksEl.textContent = `${state.totalDrinks} ช็อต`;
}

// --- Action Handlers (Survive / Drink / Next) ---
function handleSurvive() {
  if (!state.isFlipped) return; // safety guard (CSS ซ่อนปุ่มไว้แล้ว โดย pointer-events)

  if (state.hasDecidedCurrentCard) {
    showToast('ตัดสินการ์ดใบนี้ไปแล้ว!');
    return;
  }

  state.hasDecidedCurrentCard = true;
  sfx.playWin();

  if (state.gameMode === 'players' && state.players.length > 0) {
    const name = state.players[state.currentPlayerIndex];
    if (state.playerStats[name]) {
      state.playerStats[name].survive++;
    }
  }

  showToast('🎉 รอดตัว! ฝีมือยอดเยี่ยม');
  
  if (navigator.vibrate) {
    navigator.vibrate([40, 60, 40]);
  }

  setTimeout(() => {
    drawNextCard(true);
  }, 1000);
}

function handleDrink() {
  if (!state.isFlipped) return; // safety guard

  if (state.hasDecidedCurrentCard) {
    showToast('ตัดสินการ์ดใบนี้ไปแล้ว!');
    return;
  }

  state.hasDecidedCurrentCard = true;
  sfx.playDrink();

  const shots = state.currentCard ? (state.currentCard.shots || 1) : 1;
  state.totalDrinks += shots;

  if (state.gameMode === 'players' && state.players.length > 0) {
    const name = state.players[state.currentPlayerIndex];
    if (state.playerStats[name]) {
      state.playerStats[name].drinks += shots;
    }
  }

  updateTally();
  showToast(`🍺 ดื่ม ${shots} ช็อต! ไม่ไหวบอกไหว`);

  if (navigator.vibrate) {
    navigator.vibrate(150);
  }

  setTimeout(() => {
    drawNextCard(true);
  }, 1000);
}

function handleNextCard() {
  // บังคับให้เปิดการ์ดก่อนกดข้ามได้
  if (!state.isFlipped) {
    showToast('👆 แตะการ์ดเพื่อเปิดก่อนนะ!');
    if (flipCardEl) {
      // เขย่าการ์ดเพื่อให้รู้ว่ายังไม่ได้เปิด
      flipCardEl.style.animation = 'none';
      flipCardEl.offsetHeight; // reflow
      flipCardEl.style.animation = 'shakeCard 0.4s ease';
      setTimeout(() => { flipCardEl.style.animation = ''; }, 450);
    }
    return;
  }
  sfx.playTap();
  drawNextCard(true);
}

// --- Stats Modal ---
function openStatsModal() {
  sfx.playTap();
  if (!statsModal || !statsListEl) return;

  statsListEl.innerHTML = '';

  const totalRow = document.createElement('div');
  totalRow.className = 'stats-row';
  totalRow.style.borderColor = 'var(--neon-cyan)';
  totalRow.innerHTML = `
    <span><strong>รวมทั้งวง:</strong> เปิดไป ${state.cardCount} ใบ</span>
    <span style="color: var(--neon-yellow); font-weight: bold;">ดื่มรวม ${state.totalDrinks} ช็อต</span>
  `;
  statsListEl.appendChild(totalRow);

  if (state.gameMode === 'players' && state.players.length > 0) {
    state.players.forEach(name => {
      const pStats = state.playerStats[name] || { survive: 0, drinks: 0 };
      const row = document.createElement('div');
      row.className = 'stats-row';
      row.innerHTML = `
        <span>👤 <strong>${name}</strong></span>
        <span>🛡️ รอด ${pStats.survive} ครั้ง | 🍺 ดื่ม ${pStats.drinks} ช็อต</span>
      `;
      statsListEl.appendChild(row);
    });
  }

  statsModal.style.display = 'flex';
}

function closeStatsModal() {
  sfx.playTap();
  if (statsModal) statsModal.style.display = 'none';
}

// --- Toast Helper ---
let toastTimeout = null;
function showToast(msg) {
  if (!partyToastEl) return;
  partyToastEl.textContent = msg;
  partyToastEl.classList.add('show');
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    partyToastEl.classList.remove('show');
  }, 2500);
}

// --- Array Shuffle ---
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
