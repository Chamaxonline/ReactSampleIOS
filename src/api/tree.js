// The item and categoriy id domain overlap in the tree
// so we need to pad the category id in the tree
const ROOT_ID = "HOME";
const CATEGORY_PAD = 100000;

export default class Tree {
  constructor() {
    this.root = null;
  }

  getRoot() {
    return this.root;
  }

  build(data, parentId) {
    // can improve this by not calling this.add() as it calls Node.find() each time
    if (!parentId) {
      parentId = ROOT_ID;
      this.add({ id: parentId, name: parentId, type: "CATEGORY" });
    }
    data.forEach(node => {
      this.add(node, parentId);
      if (node.children) this.build(node.children, node.id + CATEGORY_PAD);
    });
  }

  add(data, parentId) {
    const newNode = new Node(data, parentId);
    const parentNode = parentId ? this.root.find(parentId) : null;
    if (parentNode) {
      parentNode.children.push(newNode);
    } else {
      if (!this.root) {
        this.root = newNode;
      } else {
        throw new Error("Couldn't find the parent node");
      }
    }
  }

  search(text) {
    let result = [];
    const queue = [this.root];
    while (queue.length) {
      const node = queue.shift();
      if (node.name && this.prepare(node.name).includes(this.prepare(text)))
        result.push(node);
      node.children.forEach(n => queue.push(n));
    }
    return result;
  }

  prepare(text) {
    return text.trim().toLowerCase();
  }

  navigate(path) {
    if (!path || !path.length) return this.root;
    let curr = path.shift();
    let queue = [this.root];
    while (queue.length) {
      const node = queue.shift();
      if (node.id === curr) {
        if (!path.length) return node;
        curr = path.shift();
      }
      node.children.forEach(n => queue.push(n));
    }
    return null;
  }

  toString() {
    const queue = [this.root];
    let string = "";
    while (queue.length) {
      const node = queue.shift();
      string += `${node.name} `;
      node.children.forEach(n => queue.push(n));
    }
    return string;
  }
}

class Node {
  constructor(data, parentId) {
    this.name = data.displayName;
    this.deliveryLeadTimeHours = data.deliveryLeadTimeHours;
    this.hireType = data.hireType;
    this.pickupLeadTimeHours = data.pickupLeadTimeHours;
    this.type = data.type;
    this.id = parentId && this.isCategory() ? data.id + CATEGORY_PAD : data.id;
    this.parentId = parentId ? parentId : null;
    this.children = [];
    this.node = data;
  }

  find(id) {
    const queue = [this];
    while (queue.length) {
      const node = queue.shift();
      if (node.id === id) return node;
      if (node.isCategory() && node.id + CATEGORY_PAD === id) return node;
      node.children.forEach(n => queue.push(n));
    }
    return null;
  }

  isCategory() {
    return this.type && this.type.toLowerCase() === "category";
  }
}
