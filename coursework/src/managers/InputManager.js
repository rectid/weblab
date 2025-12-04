/**
 * Менеджер ввода (вид сверху / Top-Down)
 * Управление: WASD / Стрелки - движение, Space/E - атака, Esc/P - пауза
 */
export class InputManager {
  constructor() {
    this.keys = {};
    this.justPressed = {};
    
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));
  }

  onKeyDown(e) {
    if (!this.keys[e.code]) {
      this.justPressed[e.code] = true;
    }
    this.keys[e.code] = true;
  }

  onKeyUp(e) {
    this.keys[e.code] = false;
    this.justPressed[e.code] = false;
  }

  isKeyDown(code) {
    return !!this.keys[code];
  }

  isKeyJustPressed(code) {
    if (this.justPressed[code]) {
      this.justPressed[code] = false;
      return true;
    }
    return false;
  }

  /**
   * Вектор движения (top-down - 4 направления)
   */
  getMovementVector() {
    let x = 0;
    let y = 0;
    
    if (this.isKeyDown('KeyA') || this.isKeyDown('ArrowLeft')) x -= 1;
    if (this.isKeyDown('KeyD') || this.isKeyDown('ArrowRight')) x += 1;
    if (this.isKeyDown('KeyW') || this.isKeyDown('ArrowUp')) y -= 1;
    if (this.isKeyDown('KeyS') || this.isKeyDown('ArrowDown')) y += 1;
    
    // Нормализация для диагонального движения
    if (x !== 0 && y !== 0) {
      const len = Math.hypot(x, y);
      x /= len;
      y /= len;
    }
    
    return { x, y };
  }

  isAttackJustPressed() {
    return this.isKeyJustPressed('Space') || this.isKeyJustPressed('KeyE');
  }

  isPauseJustPressed() {
    return this.isKeyJustPressed('Escape') || this.isKeyJustPressed('KeyP');
  }

  isLegendJustPressed() {
    return this.isKeyJustPressed('KeyL');
  }

  clearJustPressed() {
    this.justPressed = {};
  }
}
