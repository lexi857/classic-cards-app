let currentGame = "";

function navigateTo(screenId) {
  // Close all active modals when changing main screens
  document.querySelectorAll('.modal').forEach(modal => modal.classList.remove('active'));
  
  // Hide all screens
  document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
  
  // Show target screen
  const target = document.getElementById(screenId);
  if (target) {
    target.classList.add('active');
  }
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
  }
}

function openGameSettings(gameName) {
  currentGame = gameName;
  document.getElementById('game-settings-title').textContent = `${gameName} Settings`;
  openModal('game-settings-modal');
}

function openGameSettingsFromInGame() {
  closeModal('in-game-settings-modal');
  openGameSettings(currentGame);
}

function launchGame(gameName) {
  currentGame = gameName;
  document.getElementById('active-game-title').textContent = gameName;
  document.getElementById('in-game-title').textContent = gameName;
  navigateTo('game-screen');
}

function selectChip(element) {
  // Find all chips in the same option group and unselect them
  const parent = element.parentElement;
  parent.querySelectorAll('.chip').forEach(chip => chip.classList.remove('active'));
  
  // Select the tapped chip
  element.classList.add('active');
}
