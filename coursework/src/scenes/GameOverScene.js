import { BaseScene } from './BaseScene.js';

export class GameOverScene extends BaseScene {
  constructor(game) {
    super(game);
    this.stats = null;
  }

  async enter(params = {}) {
    this.stats = {
      victory: params.victory || false,
      level: params.level || 1,
      time: params.time || 0,
      bonuses: params.bonuses || 0,
      kills: params.kills || 0
    };

    // Сохраняем в таблицу рекордов
    if (this.stats.victory || this.stats.level > 1 || this.stats.kills > 0) {
      this.game.leaderboard.addEntry({
        name: 'Игрок',
        time: this.stats.time,
        bonuses: this.stats.bonuses,
        kills: this.stats.kills,
        level: this.stats.level
      });
    }

    this.game.ui.showGameOver(this.stats, {
      onRetry: () => this.retry(),
      onMenu: () => this.goToMenu()
    });
  }

  retry() {
    this.game.sceneManager.change('play', { levelIndex: 0 });
  }

  goToMenu() {
    this.game.sceneManager.change('menu');
  }

  update(delta) {
    // Анимации
  }

  render(ctx) {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Декоративный фон в зависимости от результата
    if (this.stats?.victory) {
      this.renderVictoryBackground(ctx);
    } else {
      this.renderDefeatBackground(ctx);
    }
  }

  renderVictoryBackground(ctx) {
    const time = Date.now() / 1000;
    
    // Конфетти
    ctx.fillStyle = '#ffcc00';
    for (let i = 0; i < 20; i++) {
      const x = Math.sin(time * 2 + i * 0.5) * 200 + ctx.canvas.width / 2;
      const y = (time * 50 + i * 40) % ctx.canvas.height;
      ctx.fillRect(x, y, 8, 8);
    }
  }

  renderDefeatBackground(ctx) {
    // Темный фон с красным оттенком
    ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }
}
