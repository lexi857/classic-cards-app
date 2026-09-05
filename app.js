/* ==========================================================================
   CRAZY EIGHTS ENGINE WITH PHYSICAL CARD MOTION & STRICT RULES
   ========================================================================== */

const SUITS = [
  { name: 'Spades', symbol: '♠', color: 'black' },
  { name: 'Hearts', symbol: '♥', color: 'red' },
  { name: 'Clubs', symbol: '♣', color: 'black' },
  { name: 'Diamonds', symbol: '♦', color: 'red' }
];

const RANKS = [
  { rank: 'A', value: 1 },
  { rank: '2', value: 2 },
  { rank: '3', value: 3 },
  { rank: '4', value: 4 },
  { rank: '5', value: 5 },
  { rank: '6', value: 6 },
  { rank: '7', value: 7 },
  { rank: '8', value: 8 },
  { rank: '9', value: 9 },
  { rank: '10', value: 10 },
  { rank: 'J', value: 10 },
  { rank: 'Q', value: 10 },
  { rank: 'K', value: 10 }
];

class Card {
  constructor(suit, rank, isFaceUp = true) {
    this.suit = suit;
    this.rank = rank;
    this.isFaceUp = isFaceUp;
    this.id = Math.random().toString(36).substr(2, 9);
  }

  renderHTML(onClickHandler = null, extraClasses = '') {
    const cardDiv = document.createElement('div');
    
    if (!this.isFaceUp) {
      cardDiv.className = `card back ${extraClasses}`.trim();
      if (onClickHandler) cardDiv.onclick = onClickHandler;
      return cardDiv;
    }

    cardDiv.className = `card ${this.suit.color} ${extraClasses}`.trim();
    cardDiv.innerHTML = `
      <div class="card-corner top-left">
        <span class="card-rank">${this.rank.rank}</span>
        <span class="card-suit-sm">${this.suit.symbol}</span>
      </div>
      <div class="card-center">${this.suit.symbol}</div>
      <div class="card-corner bottom-right">
        <span class="card-rank">${this.rank.rank}</span>
        <span class="card-suit-sm">${this.suit.symbol}</span>
      </div>
    `;
    if (onClickHandler) cardDiv.onclick = onClickHandler;
    return cardDiv;
  }
}

class Deck {
  constructor() {
    this.cards = [];
    this.reset();
  }

  reset() {
    this.cards = [];
    SUITS.forEach(suit => {
      RANKS.forEach(rank => {
        this.cards.push(new Card(suit, rank));
      });
    });
  }

  shuffle() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  draw() {
    return this.cards.pop();
  }
}

/* State Engine Variables */
let deck, playerHand, aiHand, discardPile;
let currentSuit = null;
let currentRank = null;
let isPlayerTurn = true;
let pendingEightCardIndex = null;
let isAnimating = false;

function launchGame(gameTitle) {
  document.getElementById('active-game-title').textContent = gameTitle;
  navigateTo('game-screen');
  startCrazyEights();
}

function restartCrazyEights() {
  closeModal('game-over-modal');
  startCrazyEights();
}

function startCrazyEights() {
  deck = new Deck();
  deck.shuffle();

  playerHand = [];
  aiHand = [];
  discardPile = [];
  isAnimating = false;

  for (let i = 0; i < 5; i++) {
    playerHand.push(deck.draw());
    const aiCard = deck.draw();
    aiCard.isFaceUp = false;
    aiHand.push(aiCard);
  }

  let initialCard = deck.draw();
  while (initialCard.rank.rank === '8') {
    deck.cards.unshift(initialCard);
    deck.shuffle();
    initialCard = deck.draw();
  }

  discardPile.push(initialCard);
  currentSuit = initialCard.suit.name;
  currentRank = initialCard.rank.rank;
  isPlayerTurn = true;

  renderBoard();
}

function hasValidPlay(hand) {
  return hand.some(card => 
    card.rank.rank === '8' || 
    card.suit.name === currentSuit || 
    card.rank.rank === currentRank
  );
}

function renderBoard() {
  const playArea = document.getElementById('table-play-area');
  playArea.innerHTML = `
    <div class="game-table">
      <div class="hand-container" id="ai-hand-area"></div>
      
      <div class="table-area" id="center-table">
        <div id="stock-deck-container"></div>
        <div id="discard-container"></div>
      </div>

      <div style="color: #ffffff; font-weight: 600; text-align: center; margin-bottom: 5px;">
        Active Suit: <strong>${getSuitSymbol(currentSuit)} ${currentSuit}</strong>
      </div>

      <div class="hand-container" id="player-hand-area"></div>
    </div>
  `;

  // Render AI Hand
  const aiArea = document.getElementById('ai-hand-area');
  aiHand.forEach(card => aiArea.appendChild(card.renderHTML()));

  // Render Stock Deck
  const stockContainer = document.getElementById('stock-deck-container');
  if (deck.cards.length > 0) {
    const stockCard = new Card(SUITS[0], RANKS[0], false);
    stockContainer.appendChild(stockCard.renderHTML(() => handleDrawCard()));
  } else {
    stockContainer.innerHTML = `<div class="card back" style="opacity: 0.25; cursor: default;"></div>`;
  }

  // Render Discard Pile
  const discardContainer = document.getElementById('discard-container');
  const topCard = discardPile[discardPile.length - 1];
  discardContainer.appendChild(topCard.renderHTML(null, 'playing'));

  // Render Player Hand
  const playerArea = document.getElementById('player-hand-area');
  playerHand.forEach((card, index) => {
    playerArea.appendChild(card.renderHTML(() => handlePlayerCardClick(index)));
  });
}

function getSuitSymbol(suitName) {
  const s = SUITS.find(item => item.name === suitName);
  return s ? s.symbol : '';
}

function handlePlayerCardClick(index) {
  if (!isPlayerTurn || isAnimating) return;

  const card = playerHand[index];
  const isEight = card.rank.rank === '8';
  const matchesSuit = card.suit.name === currentSuit;
  const matchesRank = card.rank.rank === currentRank;

  if (isEight) {
    pendingEightCardIndex = index;
    openModal('suit-picker-modal');
    return;
  }

  if (matchesSuit || matchesRank) {
    playPlayerCard(index, card.suit.name);
  }
}

function selectEightSuit(suitName) {
  closeModal('suit-picker-modal');
  if (pendingEightCardIndex !== null) {
    playPlayerCard(pendingEightCardIndex, suitName);
    pendingEightCardIndex = null;
  }
}

function playPlayerCard(index, chosenSuit) {
  isAnimating = true;
  const card = playerHand.splice(index, 1)[0];
  discardPile.push(card);
  currentSuit = chosenSuit;
  currentRank = card.rank.rank;

  renderBoard();

  if (checkWinner()) return;

  isPlayerTurn = false;
  setTimeout(() => {
    isAnimating = false;
    runAITurn();
  }, 600);
}

function handleDrawCard() {
  if (!isPlayerTurn || isAnimating) return;

  // Rule: Player cannot draw if they already have a valid move
  if (hasValidPlay(playerHand)) {
    return;
  }

  if (deck.cards.length > 0) {
    isAnimating = true;
    const drawnCard = deck.draw();
    playerHand.push(drawnCard);
    renderBoard();

    setTimeout(() => {
      isAnimating = false;
      // If drawn card isn't playable, turn automatically passes
      if (!hasValidPlay([drawnCard])) {
        isPlayerTurn = false;
        setTimeout(runAITurn, 600);
      }
    }, 400);
  } else {
    // Stock empty: turn passes
    isPlayerTurn = false;
    setTimeout(runAITurn, 600);
  }
}

/* AI Turn Automation */
function runAITurn() {
  if (isPlayerTurn || isAnimating) return;

  let playableIndices = [];
  aiHand.forEach((card, index) => {
    if (card.rank.rank === '8' || card.suit.name === currentSuit || card.rank.rank === currentRank) {
      playableIndices.push(index);
    }
  });

  if (playableIndices.length > 0) {
    isAnimating = true;
    const chosenIndex = playableIndices[0];
    const card = aiHand.splice(chosenIndex, 1)[0];
    card.isFaceUp = true;
    discardPile.push(card);

    if (card.rank.rank === '8') {
      currentSuit = aiHand.length > 0 ? aiHand[0].suit.name : 'Spades';
    } else {
      currentSuit = card.suit.name;
    }
    currentRank = card.rank.rank;

    renderBoard();

    if (checkWinner()) return;

    setTimeout(() => {
      isAnimating = false;
      isPlayerTurn = true;
      renderBoard();
    }, 600);
  } else if (deck.cards.length > 0) {
    isAnimating = true;
    const drawnCard = deck.draw();
    drawnCard.isFaceUp = false;
    aiHand.push(drawnCard);
    renderBoard();

    setTimeout(() => {
      isAnimating = false;
      // If AI drew a playable card, attempt to play it
      drawnCard.isFaceUp = true;
      if (drawnCard.rank.rank === '8' || drawnCard.suit.name === currentSuit || drawnCard.rank.rank === currentRank) {
        setTimeout(runAITurn, 400);
      } else {
        drawnCard.isFaceUp = false;
        isPlayerTurn = true;
        renderBoard();
      }
    }, 500);
  } else {
    // Pass if stock deck empty
    isPlayerTurn = true;
    renderBoard();
  }
}

function checkWinner() {
  if (playerHand.length === 0) {
    showGameOverModal(true);
    return true;
  }
  if (aiHand.length === 0) {
    showGameOverModal(false);
    return true;
  }
  return false;
}

function showGameOverModal(playerWon) {
  const title = document.getElementById('game-over-title');
  const message = document.getElementById('game-over-message');

  if (playerWon) {
    title.textContent = "Victory!";
    message.textContent = "🎉 Congratulations! You cleared your hand and won Crazy Eights!";
  } else {
    title.textContent = "Defeat";
    message.textContent = "🤖 The AI player cleared their hand first. Better luck next time!";
  }

  openModal('game-over-modal');
}

/* Modal and Navigation Wrappers */
function navigateTo(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
  const target = document.getElementById(screenId);
  if (target) target.classList.add('active');
}

function openModal(modalId) {
  const target = document.getElementById(modalId);
  if (target) target.classList.add('active');
}

function closeModal(modalId) {
  const target = document.getElementById(modalId);
  if (target) target.classList.remove('active');
}

function selectChip(button) {
  const siblings = button.parentElement.querySelectorAll('.chip');
  siblings.forEach(chip => chip.classList.remove('active'));
  button.classList.add('active');
}

function openGameSettings(gameTitle) {
  document.getElementById('game-settings-title').textContent = `${gameTitle} Settings`;
  openModal('game-settings-modal');
}

function openGameSettingsFromInGame() {
  const activeTitle = document.getElementById('active-game-title').textContent;
  document.getElementById('game-settings-title').textContent = `${activeTitle} Settings`;
  closeModal('in-game-settings-modal');
  openModal('game-settings-modal');
}
