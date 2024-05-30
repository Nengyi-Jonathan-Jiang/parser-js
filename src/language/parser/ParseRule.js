import {JSymbol} from "../common/JSymbol.js";
import {SymbolString} from "./SymbolString.js";

/**
 * @export
 * @typedef {{
 *      behavior?: 'unwrap' | 'wrap' | 'discard'
 * } | null} RuleOptions
 * @typedef  {RuleOptions[]} RuleOptionsList
 */

export class Rule {
    /** @type {JSymbol} */
    #lhs;
    /** @type {SymbolString} */
    #rhs;
    /** @type {boolean} */
    #empty;

    /** @type {RuleOptionsList} */
    #optionsList;

    /**
     * @param {JSymbol} lhs
     * @param {SymbolString} rhs
     * @param {RuleOptionsList} [optionsList]
     */
    constructor(lhs, rhs, optionsList=null) {
        this.#lhs = lhs;
        this.#rhs = rhs;
        this.#optionsList = optionsList || new Array(rhs.size).fill(null);
        this.#empty = rhs.size === 0;
    }

    /** @type {JSymbol} */
    get lhs() {
        return this.#lhs
    }

    /** @type {SymbolString} */
    get rhs() {
        return this.#rhs
    }

    get empty() {
        return this.#empty
    }

    get optionsList() {
        return this.#optionsList;
    }

    toString() {
        return `${JSON.stringify(this.#optionsList)} ${this.lhs} := ${this.rhs}`;
    }
}