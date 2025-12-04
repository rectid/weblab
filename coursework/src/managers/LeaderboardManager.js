const STORAGE_KEY = 'tower_of_trials_leaderboard';
const MAX_ENTRIES = 10;

export class LeaderboardManager {
  constructor() {
    this.entries = this.load();
  }

  load() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.entries));
    } catch {
      // localStorage может быть недоступен
    }
  }

  addEntry({ name, time, bonuses, kills, level }) {
    const entry = {
      name: name || 'Аноним',
      time: Math.round(time),
      bonuses: bonuses || 0,
      kills: kills || 0,
      level: level || 1,
      date: Date.now()
    };
    
    this.entries.push(entry);
    // Сортировка: сначала по уровню (больше - лучше), потом по времени (меньше - лучше)
    this.entries.sort((a, b) => {
      if (b.level !== a.level) return b.level - a.level;
      return a.time - b.time;
    });
    this.entries = this.entries.slice(0, MAX_ENTRIES);
    this.save();
    return this.entries.indexOf(entry);
  }

  getEntries() {
    return [...this.entries];
  }

  clear() {
    this.entries = [];
    this.save();
  }
}
