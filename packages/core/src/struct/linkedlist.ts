export interface ListNode<V> {
  prev?: ListNode<V>;
  value: V;
  next?: ListNode<V>;
}

export class LinkedList<V> {
  first?: ListNode<V>;
  last?: ListNode<V>;
  length: number = 0;

  append(value: V): void {
    const newNode: ListNode<V> = { prev: this.last, value: value };
    if (!this.first) {
      this.first = newNode;
    }
    if (this.last) {
      this.last.next = newNode;
    }
    this.last = newNode;
    this.length++;
  }

  pop(): [V, ListNode<V>] | null {
    if (!this.first) {
      return null;
    }
    const oldFirst = this.first;

    if (oldFirst.next) {
      this.first = oldFirst.next;
      oldFirst.next.prev = oldFirst.prev;
    } else {
      this.first = oldFirst.next;
      this.last = oldFirst.prev;
    }

    this.length--;
    return [oldFirst.value, oldFirst];
  }

  popLast(): [V, ListNode<V>] | null {
    if (!this.last) {
      return null;
    }
    const oldLast = this.last;

    if (oldLast.prev) {
      this.last = oldLast.prev;
      oldLast.prev.next = oldLast.next;
    } else {
      this.first = oldLast.next;
      this.last = oldLast.prev;
    }

    this.length--;
    return [oldLast.value, oldLast];
  }

  getFirst(): [V, ListNode<V>] | null {
    if (!this.first) {
      return null;
    }
    return [this.first.value, this.first];
  }

  getLast(): [V, ListNode<V>] | null {
    if (!this.last) {
      return null;
    }
    return [this.last.value, this.last];
  }
  clear() {
    this.last = undefined;
    this.first = undefined;
  }
}
