import {Symbol} from "../common/Symbol.js";
import {SymbolString} from "./SymbolString.js";

export class Rule {
    static #_id = 0;

    #id = ++Rule.#_id;
    /** @type {boolean} */
    #unwrap;
    /** @type {boolean} */
    #chained;
    /** @type {Symbol} */
    #lhs;
    /** @type {SymbolString} */
    #rhs;
    /** @type {boolean} */
    #empty;

    /**
     * @param {Symbol} lhs
     * @param {SymbolString} rhs
     * @param {boolean} chained
     * @param {boolean} unwrap
     */
    constructor(lhs, rhs, chained, unwrap) {
        this.#lhs = lhs;
        this.#rhs = rhs;
        this.#empty = rhs.size === 0;
        this.#chained = chained;
        this.#unwrap = unwrap;
    }

    /** @type {Symbol} */
    get lhs() {
        return this.#lhs
    }

    /** @type {SymbolString} */
    get rhs() {
        return this.#rhs
    }

    get unwrap() {
        return this.#unwrap;
    }

    get chained() {
        return this.#chained;
    }

    get empty() {
        return this.#empty
    }

    toString() {
        return `${
            this.unwrap ? '' : '__WRAP__ '
        }${
            this.chained ? '__CHAIN__ ' : ''
        }${this.lhs} := ${this.rhs}`;
    }
}