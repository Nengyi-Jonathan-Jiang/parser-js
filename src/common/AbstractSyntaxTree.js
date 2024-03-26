import {Symbol} from "./Symbol";

export class AbstractSyntaxTree {

}

export class Node {
    /** @type {Symbol} */
    #nodeType;
}

export class LeafNode extends Node {
    #value;

    constructor(value) {
        super();
        this.#value = value;
    }

    get value() {
        return this.#value;
    }
}

/**
 * @extends {Node<T>}
 * @template T
 */
export class InternalNode extends Node {

}