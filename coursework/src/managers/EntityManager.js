export class EntityManager {
  constructor() {
    this.player = null;
    this.enemies = [];
    this.bonuses = [];
    this.traps = [];
  }

  setPlayer(player) {
    this.player = player;
  }

  addEnemy(enemy) {
    this.enemies.push(enemy);
  }

  removeEnemy(enemy) {
    const index = this.enemies.indexOf(enemy);
    if (index !== -1) {
      this.enemies.splice(index, 1);
    }
  }

  addBonus(bonus) {
    this.bonuses.push(bonus);
  }

  removeBonus(bonus) {
    const index = this.bonuses.indexOf(bonus);
    if (index !== -1) {
      this.bonuses.splice(index, 1);
    }
  }

  addTrap(trap) {
    this.traps.push(trap);
  }

  update(delta, context) {
    if (this.player) {
      this.player.update(delta, context);
    }

    this.enemies.forEach((enemy) => {
      enemy.update(delta, context);
    });

    this.traps.forEach((trap) => {
      if (trap.update) {
        trap.update(delta, context);
      }
    });
  }

  render(ctx) {
    // Рендер ловушек (под персонажами)
    this.traps.forEach((trap) => {
      trap.render(ctx);
    });

    // Рендер бонусов
    this.bonuses.forEach((bonus) => {
      bonus.render(ctx);
    });

    // Рендер врагов
    this.enemies.forEach((enemy) => {
      enemy.render(ctx);
    });

    // Рендер игрока
    if (this.player) {
      this.player.render(ctx);
    }
  }

  clear() {
    this.player = null;
    this.enemies = [];
    this.bonuses = [];
    this.traps = [];
  }
}
