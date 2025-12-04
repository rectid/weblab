/**
 * A* Pathfinding для врагов
 * Находит оптимальный путь по сетке тайлов
 */

class PriorityQueue {
  constructor() {
    this.elements = [];
  }

  enqueue(element, priority) {
    this.elements.push({ element, priority });
    this.elements.sort((a, b) => a.priority - b.priority);
  }

  dequeue() {
    return this.elements.shift()?.element;
  }

  isEmpty() {
    return this.elements.length === 0;
  }
}

export class Pathfinding {
  constructor(levelManager) {
    this.levelManager = levelManager;
    this.tileSize = levelManager.tileSize || 32;
    
    // Кэш путей для оптимизации
    this.pathCache = new Map();
    this.cacheTimeout = 500; // мс
  }

  /**
   * Находит путь от start до end используя A*
   * @returns {Array<{x, y}>} массив точек пути в мировых координатах
   */
  findPath(startX, startY, endX, endY) {
    // Конвертируем в координаты сетки
    const startGrid = this.worldToGrid(startX, startY);
    const endGrid = this.worldToGrid(endX, endY);

    // Проверяем кэш
    const cacheKey = `${startGrid.gx},${startGrid.gy}-${endGrid.gx},${endGrid.gy}`;
    const cached = this.pathCache.get(cacheKey);
    if (cached && Date.now() - cached.time < this.cacheTimeout) {
      return cached.path;
    }

    // Если цель в стене, ищем ближайшую проходимую точку
    if (this.isBlocked(endGrid.gx, endGrid.gy)) {
      const nearestFree = this.findNearestFreeCell(endGrid.gx, endGrid.gy);
      if (nearestFree) {
        endGrid.gx = nearestFree.gx;
        endGrid.gy = nearestFree.gy;
      } else {
        return [];
      }
    }

    // A* алгоритм
    const openSet = new PriorityQueue();
    const cameFrom = new Map();
    const gScore = new Map();
    const fScore = new Map();

    const startKey = `${startGrid.gx},${startGrid.gy}`;
    const endKey = `${endGrid.gx},${endGrid.gy}`;

    gScore.set(startKey, 0);
    fScore.set(startKey, this.heuristic(startGrid, endGrid));
    openSet.enqueue(startGrid, fScore.get(startKey));

    const closedSet = new Set();
    let iterations = 0;
    const maxIterations = 500; // Защита от зацикливания

    while (!openSet.isEmpty() && iterations < maxIterations) {
      iterations++;
      const current = openSet.dequeue();
      const currentKey = `${current.gx},${current.gy}`;

      if (current.gx === endGrid.gx && current.gy === endGrid.gy) {
        // Путь найден - восстанавливаем его
        const path = this.reconstructPath(cameFrom, current);
        this.pathCache.set(cacheKey, { path, time: Date.now() });
        return path;
      }

      closedSet.add(currentKey);

      // Проверяем соседей (4 направления)
      const neighbors = this.getNeighbors(current.gx, current.gy);

      for (const neighbor of neighbors) {
        const neighborKey = `${neighbor.gx},${neighbor.gy}`;

        if (closedSet.has(neighborKey)) continue;

        const tentativeGScore = gScore.get(currentKey) + 1;

        if (!gScore.has(neighborKey) || tentativeGScore < gScore.get(neighborKey)) {
          cameFrom.set(neighborKey, current);
          gScore.set(neighborKey, tentativeGScore);
          fScore.set(neighborKey, tentativeGScore + this.heuristic(neighbor, endGrid));
          openSet.enqueue(neighbor, fScore.get(neighborKey));
        }
      }
    }

    // Путь не найден
    this.pathCache.set(cacheKey, { path: [], time: Date.now() });
    return [];
  }

  /**
   * Получить следующую точку пути для движения
   */
  getNextWaypoint(path, currentX, currentY) {
    if (!path || path.length === 0) return null;

    // Находим ближайшую точку в пути
    let closestIndex = 0;
    let closestDist = Infinity;

    for (let i = 0; i < path.length; i++) {
      const dist = Math.hypot(path[i].x - currentX, path[i].y - currentY);
      if (dist < closestDist) {
        closestDist = dist;
        closestIndex = i;
      }
    }

    // Возвращаем следующую точку (или текущую если мы в конце)
    const nextIndex = Math.min(closestIndex + 1, path.length - 1);
    return path[nextIndex];
  }

  /**
   * Эвристика для A* (манхэттенское расстояние)
   */
  heuristic(a, b) {
    return Math.abs(a.gx - b.gx) + Math.abs(a.gy - b.gy);
  }

  /**
   * Восстановление пути из cameFrom
   */
  reconstructPath(cameFrom, current) {
    const path = [this.gridToWorld(current.gx, current.gy)];
    let currentKey = `${current.gx},${current.gy}`;

    while (cameFrom.has(currentKey)) {
      const prev = cameFrom.get(currentKey);
      path.unshift(this.gridToWorld(prev.gx, prev.gy));
      currentKey = `${prev.gx},${prev.gy}`;
    }

    return path;
  }

  /**
   * Получить проходимых соседей
   */
  getNeighbors(gx, gy) {
    const neighbors = [];
    const directions = [
      { dx: 0, dy: -1 },  // вверх
      { dx: 1, dy: 0 },   // вправо
      { dx: 0, dy: 1 },   // вниз
      { dx: -1, dy: 0 }   // влево
    ];

    for (const dir of directions) {
      const nx = gx + dir.dx;
      const ny = gy + dir.dy;

      if (!this.isBlocked(nx, ny)) {
        neighbors.push({ gx: nx, gy: ny });
      }
    }

    return neighbors;
  }

  /**
   * Проверка, заблокирована ли клетка
   */
  isBlocked(gx, gy) {
    return this.levelManager.isBlocked(gx, gy);
  }

  /**
   * Найти ближайшую свободную клетку
   */
  findNearestFreeCell(gx, gy) {
    for (let radius = 1; radius <= 5; radius++) {
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue;
          
          const nx = gx + dx;
          const ny = gy + dy;
          
          if (!this.isBlocked(nx, ny)) {
            return { gx: nx, gy: ny };
          }
        }
      }
    }
    return null;
  }

  /**
   * Конвертация мировых координат в координаты сетки
   */
  worldToGrid(x, y) {
    return {
      gx: Math.floor(x / this.tileSize),
      gy: Math.floor(y / this.tileSize)
    };
  }

  /**
   * Конвертация координат сетки в мировые (центр тайла)
   */
  gridToWorld(gx, gy) {
    return {
      x: gx * this.tileSize + this.tileSize / 2,
      y: gy * this.tileSize + this.tileSize / 2
    };
  }

  /**
   * Очистка кэша
   */
  clearCache() {
    this.pathCache.clear();
  }
}
