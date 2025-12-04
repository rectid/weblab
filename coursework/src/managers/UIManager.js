export class UIManager {
  constructor(uiContainer, leaderboardContainer, leaderboard, overlayContainer) {
    this.uiContainer = uiContainer;
    this.leaderboardContainer = leaderboardContainer;
    this.leaderboard = leaderboard;
    this.overlayContainer = overlayContainer;
    this.hudElement = null;
  }

  showMenu(callbacks) {
    this.uiContainer.innerHTML = '';
    this.hideLeaderboard();

    const container = document.createElement('div');
    container.className = 'menu-container';

    const title = document.createElement('h1');
    title.className = 'menu-title';
    title.textContent = '🏰 Башня испытаний';
    container.appendChild(title);

    const subtitle = document.createElement('p');
    subtitle.className = 'menu-subtitle';
    subtitle.textContent = 'Пройди этажи башни, избегая врагов и ловушек';
    container.appendChild(subtitle);

    const buttons = document.createElement('div');
    buttons.className = 'menu-buttons';

    const playBtn = document.createElement('button');
    playBtn.className = 'menu-btn';
    playBtn.textContent = 'Начать игру';
    playBtn.onclick = callbacks.onPlay;
    buttons.appendChild(playBtn);

    const leaderboardBtn = document.createElement('button');
    leaderboardBtn.className = 'menu-btn';
    leaderboardBtn.textContent = 'Таблица рекордов';
    leaderboardBtn.onclick = () => this.toggleLeaderboard();
    buttons.appendChild(leaderboardBtn);

    container.appendChild(buttons);

    const controls = document.createElement('div');
    controls.className = 'controls-info';
    controls.innerHTML = `
      <strong>Управление:</strong><br>
      A/D или ←/→ — движение<br>
      Space/W/↑ — прыжок<br>
      E/Shift — атака (сзади врага)<br>
      Esc/P — пауза
    `;
    container.appendChild(controls);

    this.uiContainer.appendChild(container);
  }

  showHUD() {
    this.uiContainer.innerHTML = '';

    const hud = document.createElement('div');
    hud.className = 'hud';

    const left = document.createElement('div');
    left.className = 'hud-left';

    const healthStat = document.createElement('div');
    healthStat.className = 'hud-stat';
    healthStat.innerHTML = `
      <span>❤️</span>
      <div class="health-bar">
        <div class="health-bar-fill" id="health-fill" style="width: 100%"></div>
      </div>
    `;
    left.appendChild(healthStat);

    const livesStat = document.createElement('div');
    livesStat.className = 'hud-stat';
    livesStat.innerHTML = `<span>💖</span> <span id="lives">3</span>`;
    left.appendChild(livesStat);

    hud.appendChild(left);

    const center = document.createElement('div');
    center.className = 'hud-center';
    center.innerHTML = `<span id="level-name">Этаж 1</span>`;
    hud.appendChild(center);

    const right = document.createElement('div');
    right.className = 'hud-right';

    const bonusStat = document.createElement('div');
    bonusStat.className = 'hud-stat';
    bonusStat.innerHTML = `<span>⭐</span> <span id="bonuses">0</span>`;
    right.appendChild(bonusStat);

    const killsStat = document.createElement('div');
    killsStat.className = 'hud-stat';
    killsStat.innerHTML = `<span>💀</span> <span id="kills">0</span>`;
    right.appendChild(killsStat);

    const timerStat = document.createElement('div');
    timerStat.className = 'hud-stat';
    timerStat.innerHTML = `<span>⏱️</span> <span id="timer">0:00</span>`;
    right.appendChild(timerStat);

    hud.appendChild(right);

    this.uiContainer.appendChild(hud);
    this.hudElement = hud;
  }

  updateHUD({ health, maxHealth, lives, levelName, bonuses, kills, time }) {
    if (health !== undefined && maxHealth !== undefined) {
      const fill = document.getElementById('health-fill');
      if (fill) fill.style.width = `${(health / maxHealth) * 100}%`;
    }
    if (lives !== undefined) {
      const el = document.getElementById('lives');
      if (el) el.textContent = lives;
    }
    if (levelName !== undefined) {
      const el = document.getElementById('level-name');
      if (el) el.textContent = levelName;
    }
    if (bonuses !== undefined) {
      const el = document.getElementById('bonuses');
      if (el) el.textContent = bonuses;
    }
    if (kills !== undefined) {
      const el = document.getElementById('kills');
      if (el) el.textContent = kills;
    }
    if (time !== undefined) {
      const el = document.getElementById('timer');
      if (el) {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        el.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      }
    }
  }

  showGameOver(stats, callbacks) {
    this.uiContainer.innerHTML = '';

    const container = document.createElement('div');
    container.className = 'gameover-container';

    const title = document.createElement('h1');
    title.className = `gameover-title ${stats.victory ? 'victory' : 'defeat'}`;
    title.textContent = stats.victory ? '🎉 Победа!' : '💀 Поражение';
    container.appendChild(title);

    const statsDiv = document.createElement('div');
    statsDiv.className = 'gameover-stats';
    statsDiv.innerHTML = `
      <p>Этаж: ${stats.level}</p>
      <p>Время: ${Math.floor(stats.time / 60)}:${Math.floor(stats.time % 60).toString().padStart(2, '0')}</p>
      <p>Бонусы собрано: ${stats.bonuses}</p>
      <p>Врагов убито: ${stats.kills}</p>
    `;
    container.appendChild(statsDiv);

    const buttons = document.createElement('div');
    buttons.className = 'menu-buttons';

    const retryBtn = document.createElement('button');
    retryBtn.className = 'menu-btn';
    retryBtn.textContent = 'Играть снова';
    retryBtn.onclick = callbacks.onRetry;
    buttons.appendChild(retryBtn);

    const menuBtn = document.createElement('button');
    menuBtn.className = 'menu-btn';
    menuBtn.textContent = 'В меню';
    menuBtn.onclick = callbacks.onMenu;
    buttons.appendChild(menuBtn);

    container.appendChild(buttons);
    this.uiContainer.appendChild(container);
  }

  showPauseOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'pause-overlay';
    overlay.id = 'pause-overlay';
    overlay.textContent = '⏸️ ПАУЗА';
    this.overlayContainer.appendChild(overlay);
  }

  hidePauseOverlay() {
    const overlay = document.getElementById('pause-overlay');
    if (overlay) overlay.remove();
  }

  flashDamage() {
    const flash = document.createElement('div');
    flash.className = 'damage-flash';
    this.overlayContainer.appendChild(flash);
    setTimeout(() => flash.remove(), 300);
  }

  showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    this.overlayContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  }

  toggleLeaderboard() {
    if (this.leaderboardContainer.classList.contains('hidden')) {
      this.showLeaderboard();
    } else {
      this.hideLeaderboard();
    }
  }

  showLeaderboard() {
    this.leaderboardContainer.classList.remove('hidden');
    this.renderLeaderboard();
  }

  hideLeaderboard() {
    this.leaderboardContainer.classList.add('hidden');
  }

  renderLeaderboard() {
    const entries = this.leaderboard.getEntries();
    
    this.leaderboardContainer.innerHTML = `
      <h3>🏆 Таблица рекордов</h3>
      <ul class="leaderboard-list">
        ${entries.length === 0 ? '<li class="leaderboard-item">Пока нет записей</li>' : ''}
        ${entries.map((entry, i) => `
          <li class="leaderboard-item">
            <span>#${i + 1} ${entry.name}</span>
            <span>Этаж ${entry.level} | ${Math.floor(entry.time / 60)}:${(entry.time % 60).toString().padStart(2, '0')} | ⭐${entry.bonuses} | 💀${entry.kills}</span>
          </li>
        `).join('')}
      </ul>
    `;
  }
}
