/* ==========================================================================
   PHASE 2: CARD ENGINE ARCHITECTURE
   ========================================================================== */

const SUITS = [
  { name: 'Spades', symbol: '♠', color: 'black' },
  { name: 'Hearts', symbol: '♥', color: 'red' },
  { name: 'Clubs', symbol: '♣', color: 'black' },
  { name: 'Diamonds', symbol: '♦', color: 'red' }
];

const RANKS = [
  { rank: 'A', value: 11 },
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

// Card Representation Class
class Card {
  constructor(suit, rank, isFaceUp = true) {
    this.suit = suit;
    this.rank = rank;
    this.isFaceUp = isFaceUp;
  }

  flip() {
    this.isFaceUp = !this.isFaceUp;
  }

  renderHTML() {
    const cardDiv = document.createElement('div');
    
    if (!this.isFaceUp) {
      cardDiv.className = 'card back';
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
    return cardDiv;
  }
}

// Standard Deck Engine
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

// Player Hand Class
class Hand {
  constructor() {
    this.cards = [];
  }

  addCard(card) {
    this.cards.push(card);
  }

  clear() {
    this.cards = [];
  }

  renderInto(containerElement) {
    containerElement.innerHTML = '';
    this.cards.forEach(card => {
      containerElement.appendChild(card.renderHTML());
    });
  }
}

/* Navigation & Modal Controllers */
function navigateTo(screenId) {
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.remove('active');
  });
  document.querySelectorAll('.modal').forEach(modal => {
    modal.classList.remove('active');
  });
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

// Game Launcher Test Harness
let currentDeck = null;
let playerHand = null;

function launchGame(gameTitle) {
  document.getElementById('active-game-title').textContent = gameTitle;
  navigateTo('game-screen');

  // Initialize interactive demo deck on play area
  const playArea = document.getElementById('table-play-area');
  playArea.innerHTML = `
    <div class="game-table">
      <div class="table-area" id="dealer-area"></div>
      <div class="table-area" id="center-table"></div>
      <div class="hand-container" id="player-hand-area"></div>
    </div>
  `;

  // Demo deal to verify engine functionality
  currentDeck = new Deck();
  currentDeck.shuffle();
  playerHand = new Hand();

  for (let i = 0; i < 5; i++) {
    playerHand.addCard(currentDeck.draw());
  }

  // Draw face down card in center table
  const centerTable = document.getElementById('center-table');
  const stockCard = currentDeck.draw();
  stockCard.isFaceUp = false;
  centerTable.appendChild(stockCard.renderHTML());

  // Render player hand
  playerHand.renderInto(document.getElementById('player-hand-area'));
}
