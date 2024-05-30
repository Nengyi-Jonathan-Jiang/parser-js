import {JSymbol, Token} from "./common.js";

/**
 * A class representing an abstract syntax tree
 *
 * @implements {Iterable<AbstractSyntaxTree|Token>}
 */
export class AbstractSyntaxTree {
    /** @type {JSymbol} */
    #nodeType;

    /** @type {(AbstractSyntaxTree|Token)[]} */
    #children;
    
    /**
     * @param {JSymbol} nodeType The type of the internal node
     * @param {AbstractSyntaxTree|Token} children The childNodes of the internal node
     */
    constructor(nodeType, ...children) {
        this.#nodeType = nodeType;
        this.#children = children;
    }

    /** @type {JSymbol} */
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
    [Symbol.iterator]() {
        return this.#children[Symbol.iterator]();
    }

    toString() {
        if(this.children.length === 0){
            return `${this.#nodeType}{}`;
        }
        else {
            return `${this.#nodeType} {\n    ${this.children.join('\n').replace(/\n/g, '\n    ')}\n}`;
        }
    }
}