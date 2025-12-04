/**
 * Менеджер коллизий (вид сверху / Top-Down)
 * Сущности занимают меньше 1 тайла для плавного прохождения
 */
export class CollisionManager {
  constructor(levelManager) {
    this.levelManager = levelManager;
  }

  /**
   * Перемещение с коллизиями (top-down)
   * Уменьшенный хитбокс для плавного прохождения через проходы
   */
  moveWithCollisions(entity, velocity, delta) {
    const bounds = this.levelManager.getWorldBounds();
    const tileSize = this.levelManager.tileSize || 32;
    // Хитбокс = 12px (меньше половины тайла для свободного прохода)
    const halfSize = 12;

    // Горизонтальное движение
    const newX = entity.x + velocity.x * delta;
    
    // Проверяем 4 угла по X
    let canMoveX = true;
    const checkPointsX = [
      { x: newX + halfSize, y: entity.y + halfSize - 2 },
      { x: newX + halfSize, y: entity.y - halfSize + 2 },
      { x: newX - halfSize, y: entity.y + halfSize - 2 },
      { x: newX - halfSize, y: entity.y - halfSize + 2 }
    ];
    
    for (const point of checkPointsX) {
      if (this.levelManager.isWorldBlocked(point.x, point.y)) {
        canMoveX = false;
        break;
      }
    }
    
    if (canMoveX) {
      entity.x = Math.max(halfSize, Math.min(bounds.maxX - halfSize, newX));
    }

    // Вертикальное движение
    const newY = entity.y + velocity.y * delta;
    
    // Проверяем 4 угла по Y (используем обновлённый X)
    let canMoveY = true;
    const checkPointsY = [
      { x: entity.x + halfSize - 2, y: newY + halfSize },
      { x: entity.x + halfSize - 2, y: newY - halfSize },
      { x: entity.x - halfSize + 2, y: newY + halfSize },
      { x: entity.x - halfSize + 2, y: newY - halfSize }
    ];
    
    for (const point of checkPointsY) {
      if (this.levelManager.isWorldBlocked(point.x, point.y)) {
        canMoveY = false;
        break;
      }
    }
    
    if (canMoveY) {
      entity.y = Math.max(halfSize, Math.min(bounds.maxY - halfSize, newY));
    }

    return { blockedX: !canMoveX, blockedY: !canMoveY };
  }

  /**
   * Проверка пересечения двух прямоугольников
   */
  rectOverlap(a, b) {
    const aWidth = a.width || a.radius * 2 || 16;
    const aHeight = a.height || a.radius * 2 || 24;
    const bWidth = b.width || b.radius * 2 || 16;
    const bHeight = b.height || b.radius * 2 || 16;

    return (
      a.x - aWidth / 2 < b.x + bWidth / 2 &&
      a.x + aWidth / 2 > b.x - bWidth / 2 &&
      a.y - aHeight / 2 < b.y + bHeight / 2 &&
      a.y + aHeight / 2 > b.y - bHeight / 2
    );
  }

  /**
   * Проверка пересечения двух кругов
   */
  circleOverlap(a, b) {
    const aRadius = a.radius || 8;
    const bRadius = b.radius || 8;
    const dist = Math.hypot(a.x - b.x, a.y - b.y);
    return dist < aRadius + bRadius;
  }

  /**
   * Проверка, находится ли точка в прямоугольнике
   */
  pointInRect(px, py, rect) {
    const width = rect.width || rect.radius * 2 || 16;
    const height = rect.height || rect.radius * 2 || 16;
    return (
      px >= rect.x - width / 2 &&
      px <= rect.x + width / 2 &&
      py >= rect.y - height / 2 &&
      py <= rect.y + height / 2
    );
  }

  /**
   * Расстояние между двумя сущностями
   */
  distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }
}
