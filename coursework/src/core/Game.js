import { InputManager } from '../managers/InputManager.js';
import { ResourceManager } from '../managers/ResourceManager.js';
import { LeaderboardManager } from '../managers/LeaderboardManager.js';
import { UIManager } from '../managers/UIManager.js';
import { SceneManager } from '../managers/SceneManager.js';
import { MenuScene } from '../scenes/MenuScene.js';
import { PlayScene } from '../scenes/PlayScene.js';
import { GameOverScene } from '../scenes/GameOverScene.js';

export class Game {
  constructor({ canvas, uiContainer, leaderboardContainer, overlayContainer }) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.input = new InputManager();
    this.resources = new ResourceManager();
    this.leaderboard = new LeaderboardManager();
    this.ui = new UIManager(uiContainer, leaderboardContainer, this.leaderboard, overlayContainer);
    this.sceneManager = new SceneManager(this);
    this.lastTime = 0;
    this.ready = false;
  }

  async start() {
    await this.resources.preload();
    this.sceneManager.register('menu', new MenuScene(this));
    this.sceneManager.register('play', new PlayScene(this));
    this.sceneManager.register('gameover', new GameOverScene(this));
    await this.sceneManager.change('menu');
    this.ready = true;
    requestAnimationFrame((time) => this.loop(time));
  }

  loop(timestamp) {
    if (!this.ready) return;
    if (!this.lastTime) {
      this.lastTime = timestamp;
    }
    const delta = Math.min((timestamp - this.lastTime) / 1000, 0.1);
    this.lastTime = timestamp;
    this.sceneManager.update(delta);
    this.sceneManager.render(this.ctx);
    requestAnimationFrame((time) => this.loop(time));
  }
}
