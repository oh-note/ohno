export interface Node<K, V> {
  prev?: Node<K, V>;
  name?: K;
  value: V;
  next?: Node<K, V>;
}

export class LinkedDict<K extends string, V> {
  first?: Node<K, V>;
  last?: Node<K, V>;
  nodes: { [key in K]?: Node<K, V> } = {};

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

  find(name: K): [V, Node<K, V>] | null {
    const node = this.nodes[name];
    if (!node) {
      return null;
    }
    return [node.value, node];
  }

  previous(name: K): [V, Node<K, V>] | null {
    const node = this.nodes[name];
    if (!node) {
      return null;
    }
    if (!node.prev) {
      return null;
    }
    return [node.prev.value, node.prev];
  }

  next(name: K): [V, Node<K, V>] | null {
    const node = this.nodes[name];
    if (!node) {
      return null;
    }
    if (!node.next) {
      return null;
    }
    return [node.next.value, node.next];
  }

  pop(name: K): [V, Node<K, V>] | null {
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
    const newNode = { prev: node.prev, key, value, next: node } as Node<K, V>;
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
  getLast(): [V, Node<K, V>] {
    if (!this.last) {
      const node = {} as Node<K, V>;
      return [node.value, node];
    }
    return [this.last.value, this.last];
  }
}
