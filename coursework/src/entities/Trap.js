const TRAP_TYPES = {
  spikes: {
    color: '#888888',
    damage: 50, // Половина HP игрока
    instant: false
  },
  pit: {
    color: '#000000',
    damage: 100, // Всё HP игрока
    instant: true
  },
  crumbling: {
    color: '#aa8866',
    damage: 0,
    crumbleTime: 1.0
  }
};

export class Trap {
  constructor({ x, y, width, height, type = 'spikes' }) {
    this.x = x;
    this.y = y;
    this.width = width || 32;
    this.height = height || 16;
    this.type = type;
    this.radius = Math.min(this.width, this.height) / 2;

    const config = TRAP_TYPES[type] || TRAP_TYPES.spikes;
    this.color = config.color;
    this.damage = config.damage;
    this.instant = config.instant || false;
    
    // Для crumbling платформ
    this.crumbleTime = config.crumbleTime || 1.0;
    this.crumbleTimer = 0;
    this.isActivated = false;
    this.isCrumbled = false;

    this.cooldown = 0;
  }

  update(delta, context) {
    if (this.cooldown > 0) {
      this.cooldown -= delta;
    }

    // Логика разрушающихся платформ
    if (this.type === 'crumbling' && this.isActivated && !this.isCrumbled) {
      this.crumbleTimer += delta;
      if (this.crumbleTimer >= this.crumbleTime) {
        this.isCrumbled = true;
      }
    }
  }

  /**
   * Активация ловушки (например, когда игрок наступает)
   */
  activate() {
    if (this.type === 'crumbling' && !this.isActivated) {
      this.isActivated = true;
      this.crumbleTimer = 0;
    }
  }

  /**
   * Применение урона игроку
   */
  applyToPlayer(player) {
    if (this.type === 'crumbling') {
      if (!this.isCrumbled) {
        this.activate();
      }
      return false; // Разрушающаяся платформа не наносит урон напрямую
    }

    if (this.cooldown > 0) return false;

    player.takeDamage(this.damage);
    this.cooldown = 1;
    return true;
  }

  /**
   * Проверка, можно ли стоять на этой ловушке
   */
  isSolid() {
    if (this.type === 'crumbling') {
      return !this.isCrumbled;
    }
    if (this.type === 'pit') {
      return false;
    }
    return false;
  }

  render(ctx) {
    if (this.type === 'crumbling' && this.isCrumbled) {
      return; // Не рисуем разрушенную платформу
    }

    ctx.save();

    switch (this.type) {
      case 'spikes':
        this.renderSpikes(ctx);
        break;
      case 'pit':
        this.renderPit(ctx);
        break;
      case 'crumbling':
        this.renderCrumbling(ctx);
        break;
      default:
        this.renderDefault(ctx);
    }

    ctx.restore();
  }

  renderSpikes(ctx) {
    ctx.fillStyle = this.color;
    
    const spikeWidth = 8;
    const numSpikes = Math.floor(this.width / spikeWidth);
    
    for (let i = 0; i < numSpikes; i++) {
      const baseX = this.x - this.width / 2 + i * spikeWidth + spikeWidth / 2;
      const baseY = this.y + this.height / 2;
      const tipY = this.y - this.height / 2;

      ctx.beginPath();
      ctx.moveTo(baseX - spikeWidth / 2, baseY);
      ctx.lineTo(baseX, tipY);
      ctx.lineTo(baseX + spikeWidth / 2, baseY);
      ctx.closePath();
      ctx.fill();
    }
  }

  renderPit(ctx) {
    ctx.fillStyle = '#111';
    ctx.fillRect(
      this.x - this.width / 2,
      this.y - this.height / 2,
      this.width,
      this.height
    );

    // Предупреждающие полосы
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(
      this.x - this.width / 2,
      this.y - this.height / 2,
      this.width,
      this.height
    );
    ctx.setLineDash([]);
  }

  renderCrumbling(ctx) {
    // Эффект дрожания при активации
    let offsetX = 0;
    let offsetY = 0;
    if (this.isActivated && !this.isCrumbled) {
      const intensity = this.crumbleTimer / this.crumbleTime;
      offsetX = (Math.random() - 0.5) * 4 * intensity;
      offsetY = (Math.random() - 0.5) * 4 * intensity;
    }

    ctx.fillStyle = this.isActivated ? '#886644' : this.color;
    ctx.fillRect(
      this.x - this.width / 2 + offsetX,
      this.y - this.height / 2 + offsetY,
      this.width,
      this.height
    );

    // Трещины при активации
    if (this.isActivated) {
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(this.x - this.width / 4 + offsetX, this.y - this.height / 2 + offsetY);
      ctx.lineTo(this.x + offsetX, this.y + offsetY);
      ctx.lineTo(this.x + this.width / 4 + offsetX, this.y + this.height / 2 + offsetY);
      ctx.stroke();
    }
  }

  renderDefault(ctx) {
    ctx.fillStyle = this.color;
    ctx.fillRect(
      this.x - this.width / 2,
      this.y - this.height / 2,
      this.width,
      this.height
    );
  }
}
