export class ResourceManager {
  constructor() {
    this.cache = {};
  }

  async preload() {
    // Предзагрузка ресурсов (при необходимости)
    return Promise.resolve();
  }

  async loadJSON(path) {
    if (this.cache[path]) {
      return this.cache[path];
    }
    try {
      const response = await fetch(path);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      this.cache[path] = data;
      return data;
    } catch (error) {
      console.error(`Failed to load JSON from ${path}:`, error);
      throw error;
    }
  }

  async loadImage(path) {
    if (this.cache[path]) {
      return this.cache[path];
    }
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.cache[path] = img;
        resolve(img);
      };
      img.onerror = reject;
      img.src = path;
    });
  }
}
