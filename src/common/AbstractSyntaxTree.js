import {Symbol} from "./Symbol";

/**
 * A class representing an abstract syntax tree
 * @template T
 */
export class AbstractSyntaxTree {
    /** @type {Symbol} */
    #nodeType;

    /** @type {(AbstractSyntaxTree|T)[]} */
    #children;
    
    /**
     * @param {Symbol} nodeType The type of the internal node
     * @param {AbstractSyntaxTree|T} children The children of the internal node
     */
    constructor(nodeType, ...children) {
        this.#nodeType = nodeType;
        this.#children = children;
    }

    /**
     * The children of this node
     * @type {(AbstractSyntaxTree|T)[]}
     */
    get children(){
        return this.#children;
    }
}