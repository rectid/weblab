export class BaseScene {
  constructor(game) {
    this.game = game;
  }

  async enter(params = {}) {
    // Переопределяется в наследниках
  }

  async exit() {
    // Переопределяется в наследниках
  }

  update(delta) {
    // Переопределяется в наследниках
  }

  render(ctx) {
    // Переопределяется в наследниках
  }
}
