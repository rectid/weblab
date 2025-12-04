import { Game } from './core/Game.js';

const bootstrap = () => {
  const mountNode = document.querySelector('#app');
  mountNode.innerHTML = '';

  const playfield = document.createElement('div');
  playfield.className = 'playfield';
  mountNode.appendChild(playfield);

  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 480;
  playfield.appendChild(canvas);

  const overlayContainer = document.createElement('div');
  overlayContainer.className = 'overlay-layer';
  playfield.appendChild(overlayContainer);

  const uiContainer = document.createElement('div');
  uiContainer.className = 'ui-layer';
  mountNode.appendChild(uiContainer);

  const leaderboardContainer = document.createElement('div');
  leaderboardContainer.className = 'leaderboard hidden';
  mountNode.appendChild(leaderboardContainer);

  const game = new Game({ canvas, uiContainer, leaderboardContainer, overlayContainer });
  game.start();
};

window.addEventListener('DOMContentLoaded', bootstrap);
