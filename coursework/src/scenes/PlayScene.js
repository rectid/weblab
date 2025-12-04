import { BaseScene } from './BaseScene.js';
import { LEVELS } from '../config/levels.js';
import { Player } from '../entities/Player.js';
import { Enemy } from '../entities/Enemy.js';
import { Bonus } from '../entities/Bonus.js';
import { EntityManager } from '../managers/EntityManager.js';
import { LevelManager } from '../managers/LevelManager.js';
import { CollisionManager } from '../managers/CollisionManager.js';

export class PlayScene extends BaseScene {
  constructor(game) {
    super(game);
    this.levelManager = new LevelManager(game.resources);
    this.entityManager = new EntityManager();
    this.collisionManager = new CollisionManager(this.levelManager);
    this.paused = false;
    this.status = 'loading';
    this.elapsedTime = 0;
    this.ready = false;
    this.showLegend = true; // Показывать легенду по умолчанию
  }

  async enter({ levelIndex = 0 } = {}) {
    this.ready = false;
    this.status = 'loading';
    
    this.levelIndex = levelIndex;
    this.levelConfig = LEVELS[this.levelIndex];
    
    if (!this.levelConfig) {
      this.levelIndex = 0;
      this.levelConfig = LEVELS[0];
    }

    console.log('Loading level:', this.levelConfig.title);
    
    try {
      await this.levelManager.loadLevel(this.levelConfig);
      console.log('Level loaded, map size:', this.levelManager.mapData.width, 'x', this.levelManager.mapData.height);
    } catch (error) {
      console.error('Failed to load level:', error);
      return;
    }
    
    this.resizeCanvas();

    // Инициализация сущностей
    this.entityManager = new EntityManager();
    this.collisionManager = new CollisionManager(this.levelManager);

    // Создание игрока - находим безопасную точку спавна
    let spawnPoint = this.levelManager.spawnPoints.player || { x: 100, y: 100 };
    spawnPoint = this.findSafeSpawnPoint(spawnPoint.x, spawnPoint.y);
    this.playerSpawnPoint = spawnPoint; // Сохраняем для респавна
    console.log('Player spawn:', spawnPoint);
    const player = new Player({ x: spawnPoint.x, y: spawnPoint.y });
    player.onDamage = () => {
      this.game.ui.flashDamage();
    };
    player.onDeath = () => {
      this.endGame(false);
    };
    player.onRespawn = () => {
      this.respawnPlayer();
    };
    this.entityManager.setPlayer(player);

    // Создание врагов
    this.spawnEnemies();
    console.log('Enemies spawned:', this.entityManager.enemies.length);

    // Создание бонусов
    this.spawnBonuses();
    console.log('Bonuses spawned:', this.entityManager.bonuses.length);

    // Состояние игры
    this.paused = false;
    this.status = 'running';
    this.elapsedTime = 0;
    this.ready = true;

    // UI
    this.game.ui.showHUD();
    this.updateUI();
    
    console.log('PlayScene entered successfully');
  }

  /**
   * Респавн игрока в начало уровня при потере жизни
   */
  respawnPlayer() {
    const player = this.entityManager.player;
    if (!player || !this.playerSpawnPoint) return;
    
    // Возвращаем игрока на точку спавна
    player.x = this.playerSpawnPoint.x;
    player.y = this.playerSpawnPoint.y;
    
    // Сбрасываем врагов в начальное положение
    this.resetEnemies();
    
    // Показываем сообщение
    this.game.ui.showToast(`Жизнь потеряна! Осталось: ${player.lives} ❤️`);
  }

  /**
   * Сброс врагов в начальное положение
   */
  resetEnemies() {
    this.entityManager.enemies.forEach(enemy => {
      enemy.x = enemy.spawnX;
      enemy.y = enemy.spawnY;
      enemy.state = 'patrol';
      enemy.alertLevel = 0;
      enemy.searchTimer = 0;
      enemy.lastKnownPlayerPos = null;
    });
  }

  /**
   * Находит безопасную точку спавна рядом с указанными координатами
   */
  findSafeSpawnPoint(x, y) {
    const tileSize = this.levelManager.tileSize;
    
    // Привязываем к центру тайла
    const gx = Math.floor(x / tileSize);
    const gy = Math.floor(y / tileSize);
    const centerX = gx * tileSize + tileSize / 2;
    const centerY = gy * tileSize + tileSize / 2;
    
    // Проверяем центр тайла
    if (!this.levelManager.isWorldBlocked(centerX, centerY)) {
      return { x: centerX, y: centerY };
    }
    
    // Ищем ближайший свободный тайл по спирали
    for (let radius = 1; radius <= 5; radius++) {
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue;
          
          const checkX = (gx + dx) * tileSize + tileSize / 2;
          const checkY = (gy + dy) * tileSize + tileSize / 2;
          
          if (!this.levelManager.isWorldBlocked(checkX, checkY)) {
            return { x: checkX, y: checkY };
          }
        }
      }
    }
    
    // Если ничего не найдено, возвращаем центр исходного тайла
    return { x: centerX, y: centerY };
  }
  
  resizeCanvas() {
    const { width, height, tilewidth, tileheight } = this.levelManager.mapData;
    this.game.canvas.width = width * tilewidth;
    this.game.canvas.height = height * tileheight;
  }

  spawnEnemies() {
    this.levelManager.spawnPoints.enemies.forEach((enemyData) => {
      // Находим безопасную точку спавна для врага
      const safeSpawn = this.findSafeSpawnPoint(enemyData.x, enemyData.y);
      
      const enemy = new Enemy({
        x: safeSpawn.x,
        y: safeSpawn.y,
        enemyType: enemyData.enemyType,
        visionRange: enemyData.visionRange,
        patrolPath: enemyData.patrolPath
      });

      // Обновляем spawnX/spawnY на безопасные координаты
      enemy.spawnX = safeSpawn.x;
      enemy.spawnY = safeSpawn.y;

      // Установка точек патрулирования
      if (enemyData.patrolPath) {
        const patrolPoints = this.levelManager.getPatrolPoints(enemyData.patrolPath);
        enemy.setPatrolPoints(patrolPoints);
      }

      this.entityManager.addEnemy(enemy);
    });
  }

  spawnBonuses() {
    this.levelManager.spawnPoints.bonuses.forEach((bonusData) => {
      const bonus = new Bonus({
        x: bonusData.x,
        y: bonusData.y,
        type: bonusData.bonusType
      });
      this.entityManager.addBonus(bonus);
    });
  }

  update(delta) {
    if (!this.ready || this.status !== 'running') return;
    if (!this.entityManager.player) return;
    
    // Пауза
    if (this.game.input.isPauseJustPressed()) {
      this.togglePause();
    }
    
    // Легенда (L)
    if (this.game.input.isLegendJustPressed()) {
      this.showLegend = !this.showLegend;
    }

    if (this.paused) return;

    this.elapsedTime += delta;

    const context = {
      input: this.game.input,
      collision: this.collisionManager,
      entityManager: this.entityManager,
      levelManager: this.levelManager,
      player: this.entityManager.player
    };

    // Обновление сущностей
    this.entityManager.update(delta, context);

    // Обновление бонусов
    this.entityManager.bonuses.forEach(bonus => bonus.update(delta));

    // Проверка коллизий
    this.handleCollisions();

    // Проверка выхода
    this.checkExit();

    // Проверка смерти
    if (this.entityManager.player.isDead()) {
      this.endGame(false);
    }

    this.updateUI();
  }

  handleCollisions() {
    const player = this.entityManager.player;
    if (!player) return;

    // Коллизии с бонусами
    this.entityManager.bonuses = this.entityManager.bonuses.filter((bonus) => {
      if (bonus.collected) return false;
      
      if (this.collisionManager.circleOverlap(player, bonus)) {
        player.applyBonus(bonus.type);
        bonus.collect();
        this.game.ui.showToast(`${bonus.description}!`);
        return false;
      }
      return true;
    });

    // Коллизии с врагами
    const attackBox = player.getAttackHitbox();
    
    this.entityManager.enemies.forEach((enemy) => {
      if (enemy.isDead()) return;

      // Проверка атаки игрока - ТОЛЬКО В СПИНУ!
      if (attackBox && this.collisionManager.circleOverlap(attackBox, enemy)) {
        // Используем метод врага для проверки "в спину"
        if (enemy.isPlayerBehind(player)) {
          // Успешная атака сзади
          enemy.takeDamage(enemy.maxHealth);
          player.enemiesKilled++;
          this.game.ui.showToast('Стелс-убийство! 💀');
        } else if (player.isAttacking) {
          // Атака спереди - враг замечает!
          this.game.ui.showToast('Атака только в спину!');
        }
      }

      // Атака врага на игрока
      if (enemy.canAttackPlayer(player, this.collisionManager)) {
        enemy.attackPlayer(player);
      }
    });

    // Удаление мёртвых врагов
    this.entityManager.enemies = this.entityManager.enemies.filter(e => !e.isDead());
  }

  checkExit() {
    const player = this.entityManager.player;
    const exit = this.levelManager.spawnPoints.exit;

    if (!exit) return;

    const distance = Math.hypot(player.x - exit.x, player.y - exit.y);
    if (distance < 32) {
      this.completeLevel();
    }
  }

  completeLevel() {
    const nextLevel = this.levelIndex + 1;
    
    if (nextLevel < LEVELS.length) {
      // Переход на следующий уровень
      this.game.ui.showToast('Уровень пройден! 🎉');
      setTimeout(() => {
        this.game.sceneManager.change('play', { levelIndex: nextLevel });
      }, 1000);
    } else {
      // Победа!
      this.endGame(true);
    }
  }

  endGame(victory) {
    this.status = victory ? 'victory' : 'defeat';
    
    const player = this.entityManager.player;
    
    setTimeout(() => {
      this.game.sceneManager.change('gameover', {
        victory,
        level: this.levelIndex + 1,
        time: this.elapsedTime,
        bonuses: player.bonusesCollected,
        kills: player.enemiesKilled
      });
    }, 500);
  }

  togglePause() {
    this.paused = !this.paused;
    if (this.paused) {
      this.game.ui.showPauseOverlay();
    } else {
      this.game.ui.hidePauseOverlay();
    }
  }

  updateUI() {
    const player = this.entityManager.player;
    if (!player) return;
    
    this.game.ui.updateHUD({
      health: player.health,
      maxHealth: player.maxHealth,
      lives: player.lives,
      levelName: this.levelConfig.title,
      bonuses: player.bonusesCollected,
      kills: player.enemiesKilled,
      time: this.elapsedTime
    });
  }

  render(ctx) {
    // Очистка
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    if (!this.ready || !this.levelManager.mapData) {
      // Показываем загрузку
      ctx.fillStyle = '#ffffff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Загрузка...', ctx.canvas.width / 2, ctx.canvas.height / 2);
      return;
    }

    // Рендер карты (из LevelManager)
    this.levelManager.render(ctx);

    // Рендер сущностей
    this.entityManager.render(ctx);
    
    // Легенда тайлов (L для переключения)
    if (this.showLegend) {
      this.levelManager.renderLegend(ctx, 10, 10);
    }
    
    // Подсказка
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(ctx.canvas.width - 200, ctx.canvas.height - 80, 190, 70);
    ctx.fillStyle = '#ffffff';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('WASD / Стрелки - движение', ctx.canvas.width - 190, ctx.canvas.height - 60);
    ctx.fillText('Space / E - атака', ctx.canvas.width - 190, ctx.canvas.height - 45);
    ctx.fillText('L - легенда, Esc - пауза', ctx.canvas.width - 190, ctx.canvas.height - 30);
  }
}
