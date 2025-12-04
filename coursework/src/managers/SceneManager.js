export class SceneManager {
  constructor(game) {
    this.game = game;
    this.scenes = {};
    this.currentScene = null;
  }

  register(name, scene) {
    this.scenes[name] = scene;
  }

  async change(name, params = {}) {
    if (this.currentScene && this.currentScene.exit) {
      await this.currentScene.exit();
    }
    this.currentScene = this.scenes[name];
    if (this.currentScene && this.currentScene.enter) {
      await this.currentScene.enter(params);
    }
  }

  update(delta) {
    if (this.currentScene && this.currentScene.update) {
      this.currentScene.update(delta);
    }
  }

  render(ctx) {
    if (this.currentScene && this.currentScene.render) {
      this.currentScene.render(ctx);
    }
  }
}
