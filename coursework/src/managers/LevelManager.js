/**
 * ЛЕГЕНДА ТАЙЛОВ:
 * ================
 * obstacles layer (слой препятствий):
 *   0 = пусто (проходимо)
 *   1-2 = пол (проходимо) - коричневый
 *   3+ = стена (непроходимо) - тёмно-серый
 * 
 * cover layer (слой укрытий):
 *   > 0 = укрытие (игрок невидим для врагов) - зелёный полупрозрачный
 * 
 * traps layer (слой ловушек):
 *   5 = шипы (наносят урон) - красный
 *   6 = яма (мгновенная смерть) - чёрный
 *   7 = рушащийся пол - оранжевый
 * 
 * objects layer (слой объектов):
 *   spawn = точка появления игрока
 *   exit = выход на следующий этаж
 *   enemy = враг (type: guard/scout/brute)
 *   bonus = бонус (type: health/speed/invuln/life/score)
 *   patrol = точка патрулирования врага
 */

export class LevelManager {
  constructor(resourceManager) {
    this.resources = resourceManager;
    this.mapData = null;
    this.tileSize = 32;
    this.collisionGrid = [];
    this.coverGrid = [];
    this.trapGrid = [];
    this.floorGrid = [];
    this.spawnPoints = {
      player: null,
      exit: null,
      enemies: [],
      bonuses: [],
      patrols: []
    };
    
    // Цвета для отрисовки - современная тёмная тема
    this.colors = {
      floor: '#2d3a4a',      // Пол - тёмно-синеватый
      floorAlt: '#354555',   // Альтернативный пол
      wall: '#1b263b',       // Стена - тёмно-синий
      wallHighlight: '#415a77', // Подсветка стены
      cover: 'rgba(42, 157, 143, 0.35)',  // Укрытие - бирюзовый
      spikes: '#e63946',     // Шипы - красный
      pit: '#0d1117',        // Яма - почти чёрный
      crumbling: '#f4a261',  // Рушащийся пол - оранжевый
      exit: '#2a9d8f',       // Выход - бирюзовый
      spawn: '#778da9'       // Спавн - серо-голубой
    };
  }

  async loadLevel(levelConfig) {
    this.mapData = await this.resources.loadJSON(levelConfig.mapPath);
    this.tileSize = this.mapData.tilewidth;
    this.buildGrids();
    this.extractSpawns();
    return this.mapData;
  }

  buildGrids() {
    const { width, height } = this.mapData;
    this.collisionGrid = Array.from({ length: height }, () => Array(width).fill(0));
    this.coverGrid = Array.from({ length: height }, () => Array(width).fill(0));
    this.trapGrid = Array.from({ length: height }, () => Array(width).fill(null));
    this.floorGrid = Array.from({ length: height }, () => Array(width).fill(0));

    // Слой препятствий (стены, пол)
    const obstacleLayer = this.mapData.layers.find((layer) => layer.name === 'obstacles');
    if (obstacleLayer) {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const index = y * width + x;
          const value = obstacleLayer.data[index];
          // 1-2 = пол (проходимо), 3+ = стена (непроходимо)
          if (value >= 3) {
            this.collisionGrid[y][x] = 1;
          }
          if (value >= 1 && value <= 2) {
            this.floorGrid[y][x] = 1;
          }
        }
      }
    }

    // Слой укрытий
    const coverLayer = this.mapData.layers.find((layer) => layer.name === 'cover');
    if (coverLayer) {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const index = y * width + x;
          if (coverLayer.data[index] > 0) {
            this.coverGrid[y][x] = 1;
          }
        }
      }
    }

    // Слой ловушек
    const trapLayer = this.mapData.layers.find((layer) => layer.name === 'traps');
    if (trapLayer) {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const index = y * width + x;
          const value = trapLayer.data[index];
          if (value > 0) {
            if (value === 5) this.trapGrid[y][x] = 'spikes';
            else if (value === 6) this.trapGrid[y][x] = 'pit';
            else if (value === 7) this.trapGrid[y][x] = 'crumbling';
          }
        }
      }
    }
  }

  extractSpawns() {
    this.spawnPoints = {
      player: null,
      exit: null,
      enemies: [],
      bonuses: [],
      patrols: []
    };

    const objectLayer = this.mapData.layers.find((layer) => layer.type === 'objectgroup');
    if (!objectLayer) return;

    objectLayer.objects.forEach((obj) => {
      // Привязываем к центру тайла для избежания застревания в стенах
      const rawX = obj.x + (obj.width || 0) / 2;
      const rawY = obj.y + (obj.height || 0) / 2;
      const point = this.snapToTileCenter(rawX, rawY);
      
      if (obj.type === 'spawn' || obj.name === 'spawn') {
        this.spawnPoints.player = point;
      } else if (obj.type === 'exit' || obj.name === 'exit') {
        this.spawnPoints.exit = point;
      } else if (obj.type === 'enemy') {
        const enemyData = {
          ...point,
          enemyType: obj.properties?.find(p => p.name === 'enemyType')?.value || 'guard',
          visionRange: obj.properties?.find(p => p.name === 'visionRange')?.value || 5,
          patrolPath: obj.properties?.find(p => p.name === 'patrolPath')?.value || null
        };
        this.spawnPoints.enemies.push(enemyData);
      } else if (obj.type === 'bonus') {
        const bonusData = {
          ...point,
          bonusType: obj.properties?.find(p => p.name === 'bonusType')?.value || 'score'
        };
        this.spawnPoints.bonuses.push(bonusData);
      } else if (obj.type === 'patrol') {
        // Точки маршрута патрулирования
        const patrolId = obj.properties?.find(p => p.name === 'patrolId')?.value || obj.name;
        this.spawnPoints.patrols.push({ ...point, patrolId });
      }
    });
  }

  /**
   * Привязывает координаты к центру тайла
   */
  snapToTileCenter(x, y) {
    const gx = Math.floor(x / this.tileSize);
    const gy = Math.floor(y / this.tileSize);
    return {
      x: gx * this.tileSize + this.tileSize / 2,
      y: gy * this.tileSize + this.tileSize / 2
    };
  }

  worldToGrid(x, y) {
    return {
      gx: Math.floor(x / this.tileSize),
      gy: Math.floor(y / this.tileSize)
    };
  }

  gridToWorld(gx, gy) {
    return {
      x: gx * this.tileSize + this.tileSize / 2,
      y: gy * this.tileSize + this.tileSize / 2
    };
  }

  isBlocked(gx, gy) {
    if (gy < 0 || gy >= this.collisionGrid.length || gx < 0 || gx >= this.collisionGrid[0].length) {
      return true;
    }
    return this.collisionGrid[gy][gx] === 1;
  }

  isCover(gx, gy) {
    if (gy < 0 || gy >= this.coverGrid.length || gx < 0 || gx >= this.coverGrid[0].length) {
      return false;
    }
    return this.coverGrid[gy][gx] === 1;
  }

  getTrap(gx, gy) {
    if (gy < 0 || gy >= this.trapGrid.length || gx < 0 || gx >= this.trapGrid[0].length) {
      return null;
    }
    return this.trapGrid[gy][gx];
  }

  isWorldBlocked(x, y) {
    const { gx, gy } = this.worldToGrid(x, y);
    return this.isBlocked(gx, gy);
  }

  isWorldCover(x, y) {
    const { gx, gy } = this.worldToGrid(x, y);
    return this.isCover(gx, gy);
  }

  getWorldTrap(x, y) {
    const { gx, gy } = this.worldToGrid(x, y);
    return this.getTrap(gx, gy);
  }

  getWorldBounds() {
    if (!this.mapData) {
      return { minX: 0, minY: 0, maxX: 640, maxY: 480 };
    }
    return {
      minX: 0,
      minY: 0,
      maxX: this.mapData.width * this.tileSize,
      maxY: this.mapData.height * this.tileSize
    };
  }

  hasLineOfSight(ax, ay, bx, by, checkCover = true) {
    const dx = bx - ax;
    const dy = by - ay;
    const distance = Math.hypot(dx, dy);
    if (!distance) return true;

    const steps = Math.max(4, Math.ceil(distance / (this.tileSize / 2)));
    const stepX = dx / steps;
    const stepY = dy / steps;

    for (let i = 1; i < steps; i++) {
      const sampleX = ax + stepX * i;
      const sampleY = ay + stepY * i;
      
      if (this.isWorldBlocked(sampleX, sampleY)) {
        return false;
      }
      
      // Проверка укрытий (враги не видят игрока за укрытием)
      if (checkCover && this.isWorldCover(sampleX, sampleY)) {
        return false;
      }
    }
    return true;
  }

  getPatrolPoints(patrolId) {
    return this.spawnPoints.patrols
      .filter(p => p.patrolId === patrolId)
      .map(p => ({ x: p.x, y: p.y }));
  }

  /**
   * Отрисовка карты (вид сверху)
   */
  render(ctx) {
    if (!this.mapData) return;

    const { width, height } = this.mapData;
    const ts = this.tileSize;

    // Фон (пустое пространство)
    ctx.fillStyle = '#0d1b2a';
    ctx.fillRect(0, 0, width * ts, height * ts);

    // Псевдослучайное число для декораций (стабильное для каждого тайла)
    const seededRandom = (x, y, seed = 0) => {
      const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
      return n - Math.floor(n);
    };

    // Отрисовка тайлов
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const px = x * ts;
        const py = y * ts;

        // Пол с шахматным узором и декорациями
        if (this.floorGrid[y]?.[x] === 1) {
          // Основной цвет пола
          ctx.fillStyle = (x + y) % 2 === 0 ? this.colors.floor : this.colors.floorAlt;
          ctx.fillRect(px, py, ts, ts);
          
          // Тонкая сетка
          ctx.strokeStyle = 'rgba(65, 90, 119, 0.12)';
          ctx.lineWidth = 1;
          ctx.strokeRect(px, py, ts, ts);
          
          // Декорации на полу (трещины, пятна)
          const rand = seededRandom(x, y);
          if (rand < 0.15) {
            // Трещина
            ctx.strokeStyle = 'rgba(20, 30, 45, 0.4)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(px + ts * 0.2, py + ts * 0.3);
            ctx.lineTo(px + ts * 0.5, py + ts * 0.6);
            ctx.lineTo(px + ts * 0.7, py + ts * 0.5);
            ctx.stroke();
          } else if (rand < 0.25) {
            // Пятно
            ctx.fillStyle = 'rgba(20, 30, 45, 0.2)';
            ctx.beginPath();
            ctx.arc(px + ts * 0.5, py + ts * 0.5, 4 + rand * 4, 0, Math.PI * 2);
            ctx.fill();
          } else if (rand < 0.32) {
            // Маленькие точки/камешки
            ctx.fillStyle = 'rgba(100, 120, 140, 0.3)';
            for (let i = 0; i < 3; i++) {
              const dotX = px + 8 + seededRandom(x, y, i) * 16;
              const dotY = py + 8 + seededRandom(y, x, i) * 16;
              ctx.beginPath();
              ctx.arc(dotX, dotY, 1.5, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }

        // Стены с улучшенным 3D эффектом
        if (this.collisionGrid[y]?.[x] === 1) {
          // Основной цвет стены
          ctx.fillStyle = this.colors.wall;
          ctx.fillRect(px, py, ts, ts);
          
          // Верхняя и левая грань (светлее)
          ctx.fillStyle = this.colors.wallHighlight;
          ctx.fillRect(px, py, ts, 3);
          ctx.fillRect(px, py, 3, ts);
          
          // Нижняя и правая грань (темнее)
          ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
          ctx.fillRect(px + ts - 3, py, 3, ts);
          ctx.fillRect(px, py + ts - 3, ts, 3);
          
          // Внутренний блик
          ctx.fillStyle = 'rgba(65, 90, 119, 0.3)';
          ctx.fillRect(px + 4, py + 4, ts - 8, ts - 8);
        }

        // Укрытия с улучшенным видом - колонны/столбы
        if (this.coverGrid[y]?.[x] === 1) {
          // Основание колонны
          ctx.fillStyle = '#3d5a80';
          ctx.fillRect(px + 4, py + 4, ts - 8, ts - 8);
          
          // 3D эффект колонны
          ctx.fillStyle = '#5c7a9a';
          ctx.fillRect(px + 6, py + 6, ts - 14, ts - 14);
          
          // Блик
          ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.fillRect(px + 6, py + 6, 4, ts - 14);
          
          // Тень
          ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
          ctx.fillRect(px + ts - 10, py + 6, 4, ts - 14);
          
          // Верхняя грань
          ctx.fillStyle = '#6d8aaa';
          ctx.fillRect(px + 6, py + 6, ts - 12, 4);
          
          // Индикатор укрытия (круг с иконкой)
          ctx.fillStyle = 'rgba(42, 157, 143, 0.7)';
          ctx.beginPath();
          ctx.arc(px + ts/2, py + ts/2, 8, 0, Math.PI * 2);
          ctx.fill();
          
          // Символ щита
          ctx.fillStyle = '#e0e1dd';
          ctx.font = 'bold 10px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('◆', px + ts/2, py + ts/2);
        }

        // Ловушки с улучшенным видом
        const trap = this.trapGrid[y]?.[x];
        if (trap) {
          if (trap === 'spikes') {
            // Металлическая пластина под шипами
            ctx.fillStyle = '#2d3a4a';
            ctx.fillRect(px + 2, py + 2, ts - 4, ts - 4);
            
            // Сетка отверстий
            ctx.fillStyle = '#1a242f';
            for (let i = 0; i < 4; i++) {
              for (let j = 0; j < 4; j++) {
                ctx.beginPath();
                ctx.arc(px + 6 + i * 7, py + 6 + j * 7, 2, 0, Math.PI * 2);
                ctx.fill();
              }
            }
            
            // Шипы (металлические)
            for (let i = 0; i < 3; i++) {
              for (let j = 0; j < 3; j++) {
                const sx = px + 7 + i * 9;
                const sy = py + 7 + j * 9;
                
                // Тень шипа
                ctx.fillStyle = '#1a242f';
                ctx.beginPath();
                ctx.moveTo(sx + 1, sy + 7);
                ctx.lineTo(sx + 4, sy + 1);
                ctx.lineTo(sx + 7, sy + 7);
                ctx.fill();
                
                // Шип
                const spikeGrad = ctx.createLinearGradient(sx, sy, sx + 6, sy + 6);
                spikeGrad.addColorStop(0, '#c0c0c0');
                spikeGrad.addColorStop(0.5, '#808080');
                spikeGrad.addColorStop(1, '#404040');
                ctx.fillStyle = spikeGrad;
                ctx.beginPath();
                ctx.moveTo(sx, sy + 6);
                ctx.lineTo(sx + 3, sy);
                ctx.lineTo(sx + 6, sy + 6);
                ctx.fill();
              }
            }
            
            // Красная рамка опасности
            ctx.strokeStyle = 'rgba(230, 57, 70, 0.8)';
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 2]);
            ctx.strokeRect(px + 2, py + 2, ts - 4, ts - 4);
            ctx.setLineDash([]);
          } else if (trap === 'pit') {
            // Яма с градиентом глубины
            const pitGradient = ctx.createRadialGradient(
              px + ts/2, py + ts/2, 0,
              px + ts/2, py + ts/2, ts/2
            );
            pitGradient.addColorStop(0, '#000000');
            pitGradient.addColorStop(1, this.colors.pit);
            ctx.fillStyle = pitGradient;
            ctx.fillRect(px, py, ts, ts);
            
            // Тень по краям
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.lineWidth = 3;
            ctx.strokeRect(px + 2, py + 2, ts - 4, ts - 4);
          } else if (trap === 'crumbling') {
            // Рушащийся пол
            ctx.fillStyle = this.colors.crumbling;
            ctx.fillRect(px, py, ts, ts);
            
            // Трещины
            ctx.strokeStyle = '#8b4513';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(px + 4, py + 4);
            ctx.lineTo(px + ts - 8, py + ts / 2);
            ctx.lineTo(px + ts - 4, py + ts - 4);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(px + ts - 4, py + 8);
            ctx.lineTo(px + ts / 2, py + ts / 2);
            ctx.stroke();
            
            // Предупреждающая рамка
            ctx.strokeStyle = 'rgba(244, 162, 97, 0.6)';
            ctx.lineWidth = 2;
            ctx.strokeRect(px + 2, py + 2, ts - 4, ts - 4);
          }
        }
      }
    }

    // Отрисовка выхода с анимированным эффектом
    if (this.spawnPoints.exit) {
      const ex = this.spawnPoints.exit.x;
      const ey = this.spawnPoints.exit.y;
      
      // Внешнее свечение
      const glowGradient = ctx.createRadialGradient(ex, ey, 8, ex, ey, 24);
      glowGradient.addColorStop(0, 'rgba(42, 157, 143, 0.6)');
      glowGradient.addColorStop(1, 'rgba(42, 157, 143, 0)');
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(ex, ey, 24, 0, Math.PI * 2);
      ctx.fill();
      
      // Основной круг выхода
      ctx.fillStyle = this.colors.exit;
      ctx.beginPath();
      ctx.arc(ex, ey, 16, 0, Math.PI * 2);
      ctx.fill();
      
      // Белая обводка
      ctx.strokeStyle = '#e0e1dd';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Иконка двери
      ctx.fillStyle = '#ffffff';
      ctx.font = '18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🚪', ex, ey + 6);
    }
  }

  /**
   * Отрисовка легенды тайлов
   */
  renderLegend(ctx, x, y) {
    const items = [
      { color: this.colors.floor, label: 'Пол' },
      { color: this.colors.wall, label: 'Стена' },
      { color: this.colors.cover, label: 'Укрытие', isCover: true },
      { color: this.colors.spikes, label: 'Шипы' },
      { color: this.colors.pit, label: 'Яма' },
      { color: this.colors.exit, label: 'Выход' }
    ];

    // Фон легенды с градиентом
    const bgGradient = ctx.createLinearGradient(x, y, x, y + items.length * 24 + 36);
    bgGradient.addColorStop(0, 'rgba(13, 27, 42, 0.92)');
    bgGradient.addColorStop(1, 'rgba(27, 38, 59, 0.92)');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(x, y, 130, items.length * 24 + 36);
    
    // Рамка легенды
    ctx.strokeStyle = '#415a77';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, 130, items.length * 24 + 36);
    
    // Заголовок
    ctx.fillStyle = '#f4a261';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('📜 ЛЕГЕНДА', x + 12, y + 20);
    
    ctx.font = '12px sans-serif';
    items.forEach((item, i) => {
      const iy = y + 36 + i * 24;
      
      // Цветной квадрат
      ctx.fillStyle = item.color;
      ctx.fillRect(x + 12, iy, 18, 18);
      
      // Обводка квадрата
      ctx.strokeStyle = '#778da9';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 12, iy, 18, 18);
      
      // Текст
      ctx.fillStyle = '#e0e1dd';
      ctx.textAlign = 'left';
      ctx.fillText(item.label, x + 38, iy + 13);
    });
  }
}
