export interface DictNode<K, V> {
  prev?: DictNode<K, V>;
  name?: K;
  value: V;
  next?: DictNode<K, V>;
}

export class LinkedDict<K extends string | number, V> {
  first?: DictNode<K, V>;
  last?: DictNode<K, V>;
  nodes: { [key in K]?: DictNode<K, V> } = {};

  public get length(): number {
    return Object.keys(this.nodes).length;
  }

  append(name: K, value: V) {
    const node = { prev: this.last, name, value };
    if (!this.first) {
      this.first = node;
    }
    if (this.last) {
      this.last.next = node;
    }
    this.last = node;
    this.nodes[name] = node;
  }

  find(name: K): [V, DictNode<K, V>] | null {
    const node = this.nodes[name];
    if (!node) {
      return null;
    }
    return [node.value, node];
  }

  previous(name: K): [V, DictNode<K, V>] | null {
    const node = this.nodes[name];
    if (!node) {
      return null;
    }
    if (!node.prev) {
      return null;
    }
    return [node.prev.value, node.prev];
  }

  next(name: K): [V, DictNode<K, V>] | null {
    const node = this.nodes[name];
    if (!node) {
      return null;
    }
    if (!node.next) {
      return null;
    }
    return [node.next.value, node.next];
  }

  pop(name: K): [V, DictNode<K, V>] | null {
    const node = this.nodes[name];
    if (!node) {
      return null;
    }
    if (node.prev) {
      node.prev.next = node.next;
    } else {
      this.first = node.next;
    }
    if (node.next) {
      node.next.prev = node.prev;
    } else {
      this.last = node.prev;
    }
    delete this.nodes[name];
    return [node.value, node];
  }

  insertBefore(name: K, key: K, value: V): boolean {
    const node = this.nodes[name];
    if (!node) {
      return false;
    }
    const newNode = { prev: node.prev, key, value, next: node } as DictNode<
      K,
      V
    >;
    if (node.prev) {
      node.prev.next = newNode;
    } else {
      this.first = newNode;
    }
    node.prev = newNode;
    this.nodes[key] = newNode;
    return true;
  }

  insertAfter(name: K, key: K, value: V): boolean {
    const node = this.nodes[name];
    if (!node) {
      return false;
    }
    const newNode = { prev: node, key, value, next: node.next };
    if (node.next) {
      node.next.prev = newNode;
    } else {
      this.last = newNode;
    }
    node.next = newNode;
    this.nodes[key] = newNode;
    return true;
  }
  getLast(): [V, DictNode<K, V>] {
    if (!this.last) {
      const node = {} as DictNode<K, V>;
      return [node.value, node];
    }
    return [this.last.value, this.last];
  }
}
