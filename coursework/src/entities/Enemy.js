/**
 * Враг-стражник (Guard) с конечным автоматом состояний (FSM)
 * Вид сверху / Top-Down, патрулирование по точкам
 * Использует A* pathfinding для навигации
 * Состояния: PATROL, CHASE, IDLE, RETURN
 */

import { Pathfinding } from '../utils/Pathfinding.js';

// Состояния FSM
const STATES = {
  PATROL: 'patrol',
  CHASE: 'chase',
  IDLE: 'idle',
  RETURN: 'return'
};

export class Enemy {
  constructor({ x, y, patrolPath }) {
    this.x = x;
    this.y = y;
    this.spawnX = x;
    this.spawnY = y;
    this.radius = 12;

    this.color = '#ff5555';
    this.speed = 50;
    this.chaseSpeed = 85;
    this.health = 50;
    this.maxHealth = 50;
    this.damage = 100;
    this.visionRange = 5 * 32;
    this.visionAngle = 90;

    this.facingDirection = { x: 0, y: 1 };
    this.facingAngle = Math.PI / 2;

    this.state = STATES.PATROL;
    this.stateTimer = 0;
    this.alertLevel = 0;
    this.lastKnownPlayerPos = null;
    this.searchTimer = 0;

    this.patrolPath = patrolPath;
    this.patrolPoints = [];
    this.currentPatrolIndex = 0;
    this.patrolWaitTimer = 0;
    this.patrolWaitDuration = 1.5;

    this.pathfinder = null;
    this.currentPath = [];
    this.currentPathIndex = 0;
    this.pathUpdateTimer = 0;
    this.pathUpdateInterval = 0.3;

    this.attackCooldown = 0;
    this.attackRange = 28;
  }

  initPathfinding(levelManager) {
    this.pathfinder = new Pathfinding(levelManager);
  }

  update(delta, context) {
    const { player, collision, levelManager } = context;

    if (!this.pathfinder) {
      this.initPathfinding(levelManager);
    }

    this.updateFSM(delta, player, collision, levelManager);

    if (this.attackCooldown > 0) {
      this.attackCooldown -= delta;
    }
  }

  updateFSM(delta, player, collision, levelManager) {
    const canSeePlayer = this.canSeePlayer(player, levelManager);

    switch (this.state) {
      case STATES.PATROL:
        this.updatePatrol(delta, canSeePlayer, player, collision, levelManager);
        break;
      case STATES.CHASE:
        this.updateChase(delta, canSeePlayer, player, collision, levelManager);
        break;
      case STATES.IDLE:
        this.updateIdle(delta, canSeePlayer, player);
        break;
      case STATES.RETURN:
        this.updateReturn(delta, canSeePlayer, player, collision, levelManager);
        break;
    }
  }

  canSeePlayer(player, levelManager) {
    if (!player || player.isHiding) return false;

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const distance = Math.hypot(dx, dy);

    if (distance > this.visionRange) return false;

    const angleToPlayer = Math.atan2(dy, dx);
    let angleDiff = Math.abs(angleToPlayer - this.facingAngle);
    if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;

    const halfVisionAngle = (this.visionAngle / 2) * (Math.PI / 180);
    if (angleDiff > halfVisionAngle) return false;

    return levelManager.hasLineOfSight(this.x, this.y, player.x, player.y, true);
  }

  followPath(speed, delta, collision) {
    if (!this.currentPath || this.currentPath.length === 0) {
      return false;
    }

    if (this.currentPathIndex >= this.currentPath.length) {
      this.currentPath = [];
      return false;
    }

    const target = this.currentPath[this.currentPathIndex];
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 8) {
      this.currentPathIndex++;
      if (this.currentPathIndex >= this.currentPath.length) {
        this.currentPath = [];
        return false;
      }
      return true;
    }

    const vx = (dx / dist) * speed;
    const vy = (dy / dist) * speed;

    this.facingAngle = Math.atan2(dy, dx);
    this.facingDirection = { x: dx / dist, y: dy / dist };

    collision.moveWithCollisions(this, { x: vx, y: vy }, delta);

    return true;
  }

  updatePath(targetX, targetY) {
    if (!this.pathfinder) return;

    this.currentPath = this.pathfinder.findPath(this.x, this.y, targetX, targetY);
    this.currentPathIndex = 0;
  }

  moveTowards(targetX, targetY, speed, delta, collision) {
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 4) return false;

    const vx = (dx / dist) * speed;
    const vy = (dy / dist) * speed;

    this.facingAngle = Math.atan2(dy, dx);
    this.facingDirection = { x: dx / dist, y: dy / dist };

    collision.moveWithCollisions(this, { x: vx, y: vy }, delta);
    return true;
  }

  updatePatrol(delta, canSeePlayer, player, collision, levelManager) {
    if (canSeePlayer) {
      this.alertLevel += 150 * delta;
      if (this.alertLevel >= 100) {
        this.state = STATES.CHASE;
        this.lastKnownPlayerPos = { x: player.x, y: player.y };
        this.currentPath = [];
        return;
      }
    } else {
      this.alertLevel = Math.max(0, this.alertLevel - 30 * delta);
    }

    if (this.patrolWaitTimer > 0) {
      this.patrolWaitTimer -= delta;
      this.stateTimer += delta * 2;
      const lookAngle = Math.sin(this.stateTimer) * 0.5;
      this.facingDirection = {
        x: Math.cos(this.facingAngle + lookAngle),
        y: Math.sin(this.facingAngle + lookAngle)
      };
      return;
    }

    if (this.patrolPoints.length >= 2) {
      const target = this.patrolPoints[this.currentPatrolIndex];
      const dist = Math.hypot(target.x - this.x, target.y - this.y);

      if (dist < 8) {
        this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length;
        this.patrolWaitTimer = this.patrolWaitDuration;
        this.stateTimer = 0;
        this.currentPath = [];
      } else {
        this.pathUpdateTimer -= delta;
        if (this.pathUpdateTimer <= 0 || this.currentPath.length === 0) {
          this.updatePath(target.x, target.y);
          this.pathUpdateTimer = this.pathUpdateInterval * 2;
        }

        if (!this.followPath(this.speed, delta, collision)) {
          this.moveTowards(target.x, target.y, this.speed, delta, collision);
        }
      }
    } else {
      this.stateTimer += delta;
      const lookAngle = Math.sin(this.stateTimer * 0.8) * Math.PI * 0.4;
      this.facingDirection = {
        x: Math.cos(this.facingAngle + lookAngle),
        y: Math.sin(this.facingAngle + lookAngle)
      };
    }
  }

  updateChase(delta, canSeePlayer, player, collision, levelManager) {
    if (canSeePlayer) {
      this.lastKnownPlayerPos = { x: player.x, y: player.y };
      this.searchTimer = 4;
    } else {
      this.searchTimer -= delta;
      if (this.searchTimer <= 0) {
        this.state = STATES.RETURN;
        this.alertLevel = 0;
        this.currentPath = [];
        return;
      }
    }

    if (this.lastKnownPlayerPos) {
      const distToPlayer = Math.hypot(
        this.lastKnownPlayerPos.x - this.x,
        this.lastKnownPlayerPos.y - this.y
      );

      this.pathUpdateTimer -= delta;
      if (this.pathUpdateTimer <= 0 || this.currentPath.length === 0) {
        this.updatePath(this.lastKnownPlayerPos.x, this.lastKnownPlayerPos.y);
        this.pathUpdateTimer = this.pathUpdateInterval;
      }

      if (distToPlayer < 64 && canSeePlayer) {
        this.moveTowards(this.lastKnownPlayerPos.x, this.lastKnownPlayerPos.y, this.chaseSpeed, delta, collision);
      } else {
        if (!this.followPath(this.chaseSpeed, delta, collision)) {
          this.moveTowards(this.lastKnownPlayerPos.x, this.lastKnownPlayerPos.y, this.chaseSpeed, delta, collision);
        }
      }
    }
  }

  updateIdle(delta, canSeePlayer, player) {
    this.stateTimer -= delta;

    if (canSeePlayer) {
      this.state = STATES.CHASE;
      this.lastKnownPlayerPos = { x: player.x, y: player.y };
      this.currentPath = [];
    } else if (this.stateTimer <= 0) {
      this.state = STATES.PATROL;
      this.stateTimer = 2 + Math.random() * 3;
      this.currentPath = [];
    }
  }

  updateReturn(delta, canSeePlayer, player, collision, levelManager) {
    if (canSeePlayer) {
      this.state = STATES.CHASE;
      this.lastKnownPlayerPos = { x: player.x, y: player.y };
      this.currentPath = [];
      return;
    }

    const dist = Math.hypot(this.spawnX - this.x, this.spawnY - this.y);

    if (dist < 16) {
      this.state = STATES.PATROL;
      this.stateTimer = 2 + Math.random() * 3;
      this.currentPath = [];
    } else {
      this.pathUpdateTimer -= delta;
      if (this.pathUpdateTimer <= 0 || this.currentPath.length === 0) {
        this.updatePath(this.spawnX, this.spawnY);
        this.pathUpdateTimer = this.pathUpdateInterval * 2;
      }

      if (!this.followPath(this.speed, delta, collision)) {
        this.moveTowards(this.spawnX, this.spawnY, this.speed, delta, collision);
      }
    }
  }

  setPatrolPoints(points) {
    this.patrolPoints = points || [];
  }

  takeDamage(amount) {
    this.health -= amount;
  }

  isDead() {
    return this.health <= 0;
  }

  canAttackPlayer(player, collision) {
    if (this.attackCooldown > 0) return false;
    if (this.state !== STATES.CHASE) return false;

    const dist = Math.hypot(player.x - this.x, player.y - this.y);
    return dist < this.attackRange + player.radius;
  }

  attackPlayer(player) {
    if (this.attackCooldown > 0) return;

    player.takeDamage(this.damage);
    this.attackCooldown = 1.2;
  }

  isPlayerBehind(player) {
    const toPlayerX = player.x - this.x;
    const toPlayerY = player.y - this.y;
    const dist = Math.hypot(toPlayerX, toPlayerY);

    if (dist === 0) return false;

    const dirToPlayerX = toPlayerX / dist;
    const dirToPlayerY = toPlayerY / dist;

    const dot = dirToPlayerX * this.facingDirection.x + dirToPlayerY * this.facingDirection.y;

    return dot < -0.3;
  }

  render(ctx) {
    ctx.save();

    const baseColor = this.state === STATES.CHASE ? '#c9184a' : '#e63946';

    const glowGradient = ctx.createRadialGradient(this.x, this.y, this.radius - 2, this.x, this.y, this.radius + 6);
    glowGradient.addColorStop(0, 'rgba(230, 57, 70, 0.3)');
    glowGradient.addColorStop(1, 'rgba(230, 57, 70, 0)');
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius + 6, 0, Math.PI * 2);
    ctx.fill();

    const bodyGradient = ctx.createRadialGradient(this.x - 2, this.y - 2, 0, this.x, this.y, this.radius);
    bodyGradient.addColorStop(0, '#ff6b6b');
    bodyGradient.addColorStop(1, baseColor);
    ctx.fillStyle = bodyGradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#1b263b';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#e0e1dd';
    ctx.beginPath();
    const tipX = this.x + this.facingDirection.x * (this.radius + 5);
    const tipY = this.y + this.facingDirection.y * (this.radius + 5);
    const perpX = -this.facingDirection.y * 3;
    const perpY = this.facingDirection.x * 3;
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(this.x + this.facingDirection.x * this.radius + perpX,
               this.y + this.facingDirection.y * this.radius + perpY);
    ctx.lineTo(this.x + this.facingDirection.x * this.radius - perpX,
               this.y + this.facingDirection.y * this.radius - perpY);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = this.getStateColor();
    ctx.beginPath();
    ctx.arc(this.x, this.y - this.radius - 10, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1b263b';
    ctx.lineWidth = 1;
    ctx.stroke();

    if (this.alertLevel > 0 && this.state === STATES.PATROL) {
      ctx.fillStyle = '#1b263b';
      ctx.fillRect(this.x - 14, this.y - this.radius - 20, 28, 6);

      const alertGradient = ctx.createLinearGradient(this.x - 13, 0, this.x + 13, 0);
      alertGradient.addColorStop(0, '#f4a261');
      alertGradient.addColorStop(1, '#e76f51');
      ctx.fillStyle = alertGradient;
      ctx.fillRect(this.x - 13, this.y - this.radius - 19, 26 * (this.alertLevel / 100), 4);
    }

    ctx.restore();

    this.renderHealthBar(ctx);
  }

  getStateColor() {
    switch (this.state) {
      case STATES.PATROL: return '#2a9d8f';
      case STATES.CHASE: return '#e63946';
      case STATES.IDLE: return '#f4a261';
      case STATES.RETURN: return '#778da9';
      default: return '#415a77';
    }
  }

  renderHealthBar(ctx) {
    if (this.health >= this.maxHealth) return;

    const barWidth = 28;
    const barHeight = 5;
    const barX = this.x - barWidth / 2;
    const barY = this.y + this.radius + 5;

    ctx.fillStyle = '#1b263b';
    ctx.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);

    const healthGradient = ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
    healthGradient.addColorStop(0, '#e63946');
    healthGradient.addColorStop(0.5, '#f4a261');
    healthGradient.addColorStop(1, '#2a9d8f');
    ctx.fillStyle = healthGradient;
    ctx.fillRect(barX, barY, barWidth * (this.health / this.maxHealth), barHeight);
  }
}
