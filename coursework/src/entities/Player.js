/**
 * Класс игрока (вид сверху / Top-Down)
 * Управление: WASD / Стрелки - движение, Space - атака
 */
export class Player {
  constructor({ x, y }) {
    this.x = x;
    this.y = y;
    this.radius = 12; // Уменьшенный хитбокс для плавного прохождения
    this.speed = 100;
    this.baseSpeed = 100;
    
    // Здоровье и жизни
    this.health = 100;
    this.maxHealth = 100;
    this.lives = 3;
    
    // Направление взгляда (для стелс-механики)
    this.facingAngle = 0; // радианы, 0 = вправо
    this.facingDirection = { x: 1, y: 0 };
    
    // Состояние
    this.isHiding = false;
    this.invulnerable = false;
    this.invulnTimer = 0;
    this.invulnDuration = 1.5;
    
    // Атака - размер 1 тайл (16px радиус = 32px диаметр)
    this.attackCooldown = 0;
    this.attackDuration = 0.3;
    this.isAttacking = false;
    this.attackRange = 24; // Расстояние до центра атаки
    this.attackRadius = 16; // Радиус зоны поражения (1 тайл)
    
    // Ссылка на levelManager для проверки стен
    this.levelManager = null;
    
    // Бонусы
    this.bonusTimers = {
      speed: 0,
      invuln: 0
    };
    
    // Статистика
    this.bonusesCollected = 0;
    this.enemiesKilled = 0;
    
    // Коллбеки
    this.onDamage = null;
    this.onDeath = null;
    this.onRespawn = null; // Вызывается при потере жизни (но не последней)
  }

  update(delta, context) {
    const { input, collision, levelManager } = context;
    this.levelManager = levelManager; // Сохраняем для проверки атаки
    
    // Обновление таймеров
    this.updateTimers(delta);
    
    // Движение (вид сверху - 4 направления)
    const direction = input.getMovementVector();
    const velocity = {
      x: direction.x * this.speed,
      y: direction.y * this.speed
    };
    
    // Обновляем направление взгляда
    if (direction.x !== 0 || direction.y !== 0) {
      this.facingAngle = Math.atan2(direction.y, direction.x);
      this.facingDirection = { x: direction.x, y: direction.y };
      const len = Math.hypot(this.facingDirection.x, this.facingDirection.y);
      if (len > 0) {
        this.facingDirection.x /= len;
        this.facingDirection.y /= len;
      }
    }
    
    // Применяем движение с коллизиями
    collision.moveWithCollisions(this, velocity, delta);
    
    // Атака
    if (input.isAttackJustPressed() && this.attackCooldown <= 0) {
      this.isAttacking = true;
      this.attackCooldown = this.attackDuration + 0.2;
    }
    
    // Проверка укрытия
    this.isHiding = levelManager.isWorldCover(this.x, this.y);
    
    // Проверка ловушек
    this.checkTraps(levelManager);
  }

  updateTimers(delta) {
    // Таймер неуязвимости
    if (this.invulnTimer > 0) {
      this.invulnTimer -= delta;
      if (this.invulnTimer <= 0) {
        this.invulnerable = false;
      }
    }
    
    // Таймер атаки
    if (this.attackCooldown > 0) {
      this.attackCooldown -= delta;
      if (this.attackCooldown <= this.attackDuration) {
        this.isAttacking = false;
      }
    }
    
    // Таймеры бонусов
    if (this.bonusTimers.speed > 0) {
      this.bonusTimers.speed -= delta;
      if (this.bonusTimers.speed <= 0) {
        this.speed = this.baseSpeed;
      }
    }
    
    if (this.bonusTimers.invuln > 0) {
      this.bonusTimers.invuln -= delta;
      if (this.bonusTimers.invuln <= 0) {
        this.invulnerable = false;
      }
    }
  }

  checkTraps(levelManager) {
    const trap = levelManager.getWorldTrap(this.x, this.y);
    if (trap) {
      if (trap === 'spikes') {
        this.takeDamage(Math.floor(this.maxHealth / 2)); // Шипы - половина HP
      } else if (trap === 'pit') {
        // Яма игнорирует неуязвимость - мгновенная смерть
        this.takeDamageIgnoreInvuln(this.maxHealth);
      }
    }
  }

  /**
   * Получение урона, игнорируя неуязвимость (для ям)
   */
  takeDamageIgnoreInvuln(amount) {
    this.health -= amount;
    this.invulnTimer = this.invulnDuration;
    this.invulnerable = true;
    
    if (this.onDamage) {
      this.onDamage(amount);
    }
    
    if (this.health <= 0) {
      this.health = 0;
      this.lives--;
      
      if (this.lives > 0) {
        this.health = this.maxHealth;
        if (this.onRespawn) {
          this.onRespawn();
        }
      } else if (this.onDeath) {
        this.onDeath();
      }
    }
  }

  takeDamage(amount) {
    if (this.invulnerable || this.invulnTimer > 0) return;
    
    this.health -= amount;
    this.invulnTimer = this.invulnDuration;
    this.invulnerable = true;
    
    if (this.onDamage) {
      this.onDamage(amount);
    }
    
    if (this.health <= 0) {
      this.health = 0;
      this.lives--;
      
      if (this.lives > 0) {
        this.health = this.maxHealth;
        // Респавн при потере жизни
        if (this.onRespawn) {
          this.onRespawn();
        }
      } else if (this.onDeath) {
        this.onDeath();
      }
    }
  }

  applyBonus(type) {
    switch (type) {
      case 'health':
      case 'heal':
        this.health = Math.min(this.maxHealth, this.health + 30);
        break;
      case 'life':
        this.lives++;
        break;
      case 'speed':
        this.speed = this.baseSpeed * 1.5;
        this.bonusTimers.speed = 10;
        break;
      case 'invuln':
        this.invulnerable = true;
        this.bonusTimers.invuln = 8;
        break;
      case 'score':
        // Просто увеличивает счёт (обрабатывается в PlayScene)
        break;
    }
    this.bonusesCollected++;
  }

  /**
   * Проверка, можно ли убить врага (атака сзади)
   */
  canKillEnemy(enemy) {
    if (!this.isAttacking) return false;
    
    // Вектор от врага к игроку
    const toPlayer = {
      x: this.x - enemy.x,
      y: this.y - enemy.y
    };
    const len = Math.hypot(toPlayer.x, toPlayer.y);
    if (len === 0) return false;
    
    toPlayer.x /= len;
    toPlayer.y /= len;
    
    // Скалярное произведение с направлением взгляда врага
    // Если > 0, игрок позади врага
    const dot = toPlayer.x * enemy.facingDirection.x + toPlayer.y * enemy.facingDirection.y;
    
    return dot > 0.3; // Игрок должен быть позади врага
  }

  /**
   * Получить область атаки (размер 1 тайл)
   * Атака не проходит через стены
   */
  getAttackHitbox() {
    if (!this.isAttacking) return null;
    
    const attackX = this.x + this.facingDirection.x * this.attackRange;
    const attackY = this.y + this.facingDirection.y * this.attackRange;
    
    // Проверяем, не находится ли точка атаки за стеной
    if (this.levelManager && this.levelManager.isWorldBlocked(attackX, attackY)) {
      return null; // Атака заблокирована стеной
    }
    
    // Проверяем линию видимости от игрока до точки атаки
    if (this.levelManager && !this.levelManager.hasLineOfSight(this.x, this.y, attackX, attackY, false)) {
      return null; // Между игроком и точкой атаки есть стена
    }
    
    return {
      x: attackX,
      y: attackY,
      radius: this.attackRadius // 16px = 1 тайл
    };
  }

  render(ctx) {
    ctx.save();
    
    // Мигание при неуязвимости
    if (this.invulnTimer > 0) {
      const alpha = 0.5 + 0.5 * Math.sin(this.invulnTimer * 20);
      ctx.globalAlpha = alpha;
    }
    
    // Эффект укрытия
    if (this.isHiding) {
      ctx.globalAlpha *= 0.5;
    }
    
    // Внешнее свечение игрока
    const glowGradient = ctx.createRadialGradient(this.x, this.y, this.radius - 2, this.x, this.y, this.radius + 8);
    glowGradient.addColorStop(0, 'rgba(119, 141, 169, 0.4)');
    glowGradient.addColorStop(1, 'rgba(119, 141, 169, 0)');
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius + 8, 0, Math.PI * 2);
    ctx.fill();
    
    // Тело игрока (круг с градиентом)
    const bodyGradient = ctx.createRadialGradient(this.x - 3, this.y - 3, 0, this.x, this.y, this.radius);
    bodyGradient.addColorStop(0, '#a8dadc');
    bodyGradient.addColorStop(1, '#457b9d');
    ctx.fillStyle = bodyGradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Обводка
    ctx.strokeStyle = '#e0e1dd';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Направление взгляда (треугольник)
    ctx.fillStyle = '#e0e1dd';
    ctx.beginPath();
    const tipX = this.x + this.facingDirection.x * (this.radius + 6);
    const tipY = this.y + this.facingDirection.y * (this.radius + 6);
    const perpX = -this.facingDirection.y * 4;
    const perpY = this.facingDirection.x * 4;
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(this.x + this.facingDirection.x * this.radius + perpX, 
               this.y + this.facingDirection.y * this.radius + perpY);
    ctx.lineTo(this.x + this.facingDirection.x * this.radius - perpX, 
               this.y + this.facingDirection.y * this.radius - perpY);
    ctx.closePath();
    ctx.fill();
    
    // Хитбокс атаки (1 тайл = 32px)
    if (this.isAttacking) {
      const attackBox = this.getAttackHitbox();
      if (attackBox) {
        // Внешнее свечение атаки
        const attackGlow = ctx.createRadialGradient(
          attackBox.x, attackBox.y, attackBox.radius * 0.5,
          attackBox.x, attackBox.y, attackBox.radius * 1.5
        );
        attackGlow.addColorStop(0, 'rgba(244, 162, 97, 0.6)');
        attackGlow.addColorStop(1, 'rgba(244, 162, 97, 0)');
        ctx.fillStyle = attackGlow;
        ctx.beginPath();
        ctx.arc(attackBox.x, attackBox.y, attackBox.radius * 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Основная зона атаки
        ctx.fillStyle = 'rgba(244, 162, 97, 0.4)';
        ctx.beginPath();
        ctx.arc(attackBox.x, attackBox.y, attackBox.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Обводка атаки
        ctx.strokeStyle = 'rgba(244, 162, 97, 0.9)';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Крестик в центре
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(attackBox.x - 6, attackBox.y);
        ctx.lineTo(attackBox.x + 6, attackBox.y);
        ctx.moveTo(attackBox.x, attackBox.y - 6);
        ctx.lineTo(attackBox.x, attackBox.y + 6);
        ctx.stroke();
      }
    }
    
    ctx.restore();
    
    // Индикатор укрытия
    if (this.isHiding) {
      ctx.fillStyle = '#2a9d8f';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('◆ СКРЫТ', this.x, this.y - this.radius - 12);
    }
  }

  isDead() {
    return this.lives <= 0 && this.health <= 0;
  }
}
