class Register<T> {
  name: string;
  inner: { [key: string]: T };
  constructor(name: string) {
    this.name = name;
    this.inner = {};
  }

  put(key: string, data: T) {
    this.inner[key] = data;
  }

  get(key: string): T {
    let res = this.inner[key];
    return res as any as T;
  }

  merge(other: Register<T>) {
    for (const key in other.inner) {
      this.inner[key] = other.inner[key];
    }
    return this;
  }
}

class RegisterManager {
  static _instance?: RegisterManager;
  static getInstance(): RegisterManager {
    if (!RegisterManager._instance) {
      RegisterManager._instance = new RegisterManager();
    }
    return RegisterManager._instance;
  }
  private inner: { [key: string]: Register<any> };
  constructor() {
    this.inner = {};
  }
  get<T>(key: string): Register<T> {
    return this.inner[key];
  }
  create<T>(key: string): Register<T> {
    const res = new Register<T>(key);
    this.inner[key] = res;
    return res;
  }
}

export const registerManager = RegisterManager.getInstance();
