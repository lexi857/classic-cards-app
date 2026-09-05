/* ==========================================================================
   CRAZY EIGHTS GAME ENGINE
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
  }

  renderHTML(onClickHandler = null) {
    const cardDiv = document.createElement('div');
    
    if (!this.isFaceUp) {
      cardDiv.className = 'card back';
      if (onClickHandler) cardDiv.onclick = onClickHandler;
      return cardDiv;
    }

    cardDiv.className = `card ${this.suit.color}`;
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

/* Crazy Eights State Management */
let deck, playerHand, aiHand, discardPile;
let currentSuit = null;
let currentRank = null;
let isPlayerTurn = true;
let pendingEightCardIndex = null;

function launchGame(gameTitle) {
  document.getElementById('active-game-title').textContent = gameTitle;
  navigateTo('game-screen');
  startCrazyEights();
}

function startCrazyEights() {
  deck = new Deck();
  deck.shuffle();

  playerHand = [];
  aiHand = [];
  discardPile = [];

  // Deal 5 cards each
  for (let i = 0; i < 5; i++) {
    playerHand.push(deck.draw());
    const aiCard = deck.draw();
    aiCard.isFaceUp = false;
    aiHand.push(aiCard);
  }

  // Draw initial discard card (retry if it's an 8)
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

  // Render AI Hand (Face Down)
  const aiArea = document.getElementById('ai-hand-area');
  aiHand.forEach(card => aiArea.appendChild(card.renderHTML()));

  // Render Stock Deck
  const stockContainer = document.getElementById('stock-deck-container');
  if (deck.cards.length > 0) {
    const stockCard = new Card(SUITS[0], RANKS[0], false);
    stockContainer.appendChild(stockCard.renderHTML(() => handleDrawCard()));
  } else {
    stockContainer.innerHTML = `<div class="card back" style="opacity: 0.3;"></div>`;
  }

  // Render Discard Pile
  const discardContainer = document.getElementById('discard-container');
  const topCard = discardPile[discardPile.length - 1];
  discardContainer.appendChild(topCard.renderHTML());

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
  if (!isPlayerTurn) return;

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
  } else {
    alert("Invalid card! Play a matching rank, suit, or an 8.");
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
  const card = playerHand.splice(index, 1)[0];
  discardPile.push(card);
  currentSuit = chosenSuit;
  currentRank = card.rank.rank;

  if (checkWinner()) return;

  isPlayerTurn = false;
  renderBoard();
  setTimeout(runAITurn, 1200);
}

function handleDrawCard() {
  if (!isPlayerTurn) return;

  if (deck.cards.length > 0) {
    playerHand.push(deck.draw());
    renderBoard();
  } else {
    alert("No more cards in stock deck! Turn skipped.");
    isPlayerTurn = false;
    setTimeout(runAITurn, 1000);
  }
}

/* AI Turn Logic */
function runAITurn() {
  if (isPlayerTurn) return;

  // Find playable cards
  let playableIndices = [];
  aiHand.forEach((card, index) => {
    if (card.rank.rank === '8' || card.suit.name === currentSuit || card.rank.rank === currentRank) {
      playableIndices.push(index);
    }
  });

  if (playableIndices.length > 0) {
    const chosenIndex = playableIndices[0];
    const card = aiHand.splice(chosenIndex, 1)[0];
    card.isFaceUp = true;
    discardPile.push(card);

    if (card.rank.rank === '8') {
      // Pick AI's most frequent suit
      currentSuit = aiHand.length > 0 ? aiHand[0].suit.name : 'Spades';
    } else {
      currentSuit = card.suit.name;
    }
    currentRank = card.rank.rank;
  } else if (deck.cards.length > 0) {
    const drawnCard = deck.draw();
    drawnCard.isFaceUp = false;
    aiHand.push(drawnCard);
  }

  if (checkWinner()) return;

  isPlayerTurn = true;
  renderBoard();
}

function checkWinner() {
  if (playerHand.length === 0) {
    renderBoard();
    setTimeout(() => alert("🎉 You Win Crazy Eights!"), 100);
    return true;
  }
  if (aiHand.length === 0) {
    renderBoard();
    setTimeout(() => alert("🤖 AI Wins Crazy Eights!"), 100);
    return true;
  }
  return false;
}

/* Navigation Helpers */
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
