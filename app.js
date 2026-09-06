/* ==========================================================================
   CLASSIC CARDS: CRAZY EIGHTS ENGINE WITH EXACT END-OF-ROUND MODALS
   ========================================================================== */

const TARGET_SCORE = 100; // Target score to win full game

let playerScore = 0;
let opponentScore = 0;
let highestScore = 135; // Default record high score anchor

let deck, playerHand, aiHand, discardPile;
let currentSuit = null;
let currentRank = null;
let isPlayerTurn = true;
let pendingEightCardIndex = null;
let isAnimating = false;

function startCrazyEights() {
  playerScore = 0;
  opponentScore = 0;
  startNewRound();
}

function restartCrazyEightsGame() {
  closeModal('game-over-modal');
  startCrazyEights();
}

function nextCrazyEightsRound() {
  closeModal('round-over-modal');
  startNewRound();
}

function startNewRound() {
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

function calculateHandPoints(hand) {
  return hand.reduce((sum, card) => {
    const r = card.rank.rank;
    if (r === '8') return sum + 50;
    if (['K', 'Q', 'J', '10'].includes(r)) return sum + 10;
    if (r === 'A') return sum + 1;
    return sum + parseInt(r, 10);
  }, 0);
}

function handleRoundEnd(playerWon) {
  let roundPoints = 0;

  if (playerWon) {
    roundPoints = calculateHandPoints(aiHand);
    playerScore += roundPoints;
  } else {
    roundPoints = calculateHandPoints(playerHand);
    opponentScore += roundPoints;
  }

  if (playerScore > highestScore) highestScore = playerScore;
  if (opponentScore > highestScore) highestScore = opponentScore;

  if (playerScore >= TARGET_SCORE || opponentScore >= TARGET_SCORE) {
    showGameOverModal(playerWon);
  } else {
    showRoundOverModal(playerWon, roundPoints);
  }
}

function showRoundOverModal(playerWon, roundPoints) {
  const title = document.getElementById('round-result-title');
  const body = document.getElementById('round-scores-body');

  if (playerWon) {
    title.textContent = `You Won ${roundPoints} Points!`;
  } else {
    title.textContent = `Opponent Won ${roundPoints} Points`;
  }

  body.innerHTML = `
    <p style="margin: 6px 0;">Current Score: ${playerScore} Points</p>
    <p style="margin: 6px 0;">Opponent Score: ${opponentScore} Points</p>
    <br>
    <p style="margin: 6px 0; color: #a0a0a0;">Highest Score: ${highestScore} Points</p>
  `;

  openModal('round-over-modal');
}

function showGameOverModal(playerWon) {
  const title = document.getElementById('game-result-title');
  const body = document.getElementById('game-scores-body');

  if (playerWon) {
    title.textContent = "You Won!";
  } else {
    title.textContent = "Opponent Won";
  }

  body.innerHTML = `
    <p style="margin: 6px 0;">Final Score: ${playerScore} Points</p>
    <p style="margin: 6px 0;">Opponent Score: ${opponentScore} Points</p>
    <br>
    <p style="margin: 6px 0; color: #a0a0a0;">Highest Score: ${highestScore} Points</p>
  `;

  openModal('game-over-modal');
}

function checkWinner() {
  if (playerHand.length === 0) {
    handleRoundEnd(true);
    return true;
  }
  if (aiHand.length === 0) {
    handleRoundEnd(false);
    return true;
  }
  return false;
}
