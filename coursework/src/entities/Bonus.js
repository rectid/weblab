const BONUS_TYPES = {
  health: {
    color: '#e63946',
    glowColor: 'rgba(230, 57, 70, 0.6)',
    symbol: '❤️',
    description: 'Восстановление здоровья'
  },
  life: {
    color: '#ff6b9d',
    glowColor: 'rgba(255, 107, 157, 0.6)',
    symbol: '💖',
    description: 'Дополнительная жизнь'
  },
  speed: {
    color: '#00b4d8',
    glowColor: 'rgba(0, 180, 216, 0.6)',
    symbol: '⚡',
    description: 'Ускорение'
  },
  invuln: {
    color: '#f4a261',
    glowColor: 'rgba(244, 162, 97, 0.6)',
    symbol: '🛡️',
    description: 'Неуязвимость'
  },
  score: {
    color: '#ffd166',
    glowColor: 'rgba(255, 209, 102, 0.6)',
    symbol: '⭐',
    description: 'Очки'
  }
};

export class Bonus {
  constructor({ x, y, type = 'score' }) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.radius = 12;
    
    const config = BONUS_TYPES[type] || BONUS_TYPES.score;
    this.color = config.color;
    this.glowColor = config.glowColor;
    this.symbol = config.symbol;
    this.description = config.description;

    this.floatOffset = 0;
    this.floatSpeed = 3;
    this.collected = false;
    this.pulsePhase = Math.random() * Math.PI * 2;
  }

  update(delta) {
    this.floatOffset = Math.sin(Date.now() / 300) * 4;
    this.pulsePhase += delta * 4;
  }

  render(ctx) {
    if (this.collected) return;

    ctx.save();
    
    const pulse = 0.8 + 0.2 * Math.sin(this.pulsePhase);
    const yPos = this.y + this.floatOffset;
    
    // Внешнее свечение (пульсирующее)
    const outerGlow = ctx.createRadialGradient(
      this.x, yPos, 0,
      this.x, yPos, this.radius * 2 * pulse
    );
    outerGlow.addColorStop(0, this.glowColor);
    outerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.fillStyle = outerGlow;
    ctx.beginPath();
    ctx.arc(this.x, yPos, this.radius * 2 * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Основной круг с градиентом
    const bodyGradient = ctx.createRadialGradient(
      this.x - 3, yPos - 3, 0,
      this.x, yPos, this.radius
    );
    bodyGradient.addColorStop(0, '#ffffff');
    bodyGradient.addColorStop(0.3, this.color);
    bodyGradient.addColorStop(1, this.color);
    
    ctx.fillStyle = bodyGradient;
    ctx.beginPath();
    ctx.arc(this.x, yPos, this.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Обводка
    ctx.strokeStyle = '#e0e1dd';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Символ
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.symbol, this.x, yPos);

    ctx.restore();
  }

  collect() {
    this.collected = true;
  }
}
