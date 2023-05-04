export interface ConfigItem<T> {
  namespace: string;
  key: string;
  value: T;
}

export interface IConfig {
  get<T>(key: string): T | null;
  get<T>(key: string, defaultValue: T): T;
  set<T>(key: string, namespace: string, value: T): void;
  list(): ConfigItem<any>[];
  dict(): { [key: string]: { [key: string]: any } };
}
