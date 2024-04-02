import {Symbol, Token} from "./common.js";

/**
 * A class representing an abstract syntax tree
 *
 * @implements {Iterable<AbstractSyntaxTree|Token>}
 */
export class AbstractSyntaxTree {
    /** @type {Symbol} */
    #nodeType;

    /** @type {(AbstractSyntaxTree|T)[]} */
    #children;
    
    /**
     * @param {Symbol} nodeType The type of the internal node
     * @param {AbstractSyntaxTree|Token} children The childNodes of the internal node
     */
    constructor(nodeType, ...children) {
        this.#nodeType = nodeType;
        this.#children = children;
    }

    /** @type {Symbol} */
    get type() {
        return this.#nodeType;
    }

    /**
     * The childNodes of this node
     * @type {(AbstractSyntaxTree|Token)[]}
     */
    get children(){
        return this.#children;
    }

    /** @returns {IterableIterator<AbstractSyntaxTree|Token>} */
    [window.Symbol.iterator]() {
        return this.#children[window.Symbol.iterator]();
    }
}