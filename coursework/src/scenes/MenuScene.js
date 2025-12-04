import { BaseScene } from './BaseScene.js';

export class MenuScene extends BaseScene {
  constructor(game) {
    super(game);
  }

  async enter() {
    // Устанавливаем размер canvas для меню
    this.game.canvas.width = 640;
    this.game.canvas.height = 480;
    
    this.game.ui.showMenu({
      onPlay: () => this.startGame()
    });
  }

  startGame() {
    this.game.sceneManager.change('play', { levelIndex: 0 });
  }

  update(delta) {
    // Анимации меню при необходимости
  }

  render(ctx) {
    // Очистка и фон
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Декоративные элементы
    this.renderDecorations(ctx);

    // Название игры на canvas
    ctx.fillStyle = '#ffcc00';
    ctx.font = 'bold 32px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🏰 Башня испытаний 🏰', ctx.canvas.width / 2, 60);
  }

  renderDecorations(ctx) {
    const time = Date.now() / 1000;
    
    // Анимированные блоки на фоне
    ctx.fillStyle = '#2a2a4a';
    for (let i = 0; i < 8; i++) {
      const x = 50 + i * 80;
      const y = 120 + Math.sin(time + i) * 20;
      ctx.fillRect(x, y, 32, 32);
    }

    for (let i = 0; i < 8; i++) {
      const x = 50 + i * 80;
      const y = 340 + Math.sin(time + i + Math.PI) * 20;
      ctx.fillRect(x, y, 32, 32);
    }

    // Рисуем декоративные башни по краям
    ctx.fillStyle = '#3a3a5a';
    // Левая башня
    ctx.fillRect(20, 180, 40, 140);
    ctx.fillRect(10, 160, 60, 30);
    // Правая башня
    ctx.fillRect(580, 180, 40, 140);
    ctx.fillRect(570, 160, 60, 30);
  }
}
