import {Symbol} from "../common/Symbol.js";

// noinspection JSClosureCompilerSyntax
/** @implements {Iterable<Symbol>} */
export class SymbolString {
    /** @type {Symbol[]} */
    #symbols;
    /** @type {string} */
    #_str;

    /** @param {Symbol} symbols */
    constructor(...symbols) {
        this.#symbols = symbols;
        this.#_str = symbols.join(' ');
    }

    /**
     * @param {number} i
     * @returns {Symbol}
     */
    get(i){
        return this.#symbols[i]
    }

    /** @return {Symbol|null} */
    get firstTkn(){
        return this.#symbols[0] ?? null
    }

    /** @return {Symbol|null} */
    get lastTkn(){
        return this.#symbols[this.#symbols.length - 1] ?? null
    }

    /** @type {number} */
    get size(){return this.#symbols.length;}

    /** @type {Symbol[]} */
    get symbols() {
        return this.#symbols;
    }

    toString() {
        return this.#_str;
    }

    /**
     * @param {number} start
     * @param {number} [end]
     * @returns {SymbolString}
     */
    substring(start, end = -1){
        if(end < 0) end += this.size + 1;
        return new SymbolString(...[...this.symbols].splice(start, end - start));
    }

    /** @type {IterableIterator[Symbol]} */
    [window.Symbol.iterator](){
        // noinspection JSValidateTypes
        return this.symbols[window.Symbol.iterator]();
    }

    /**
     * @param {Symbol} symbol
     * @return {SymbolString}
     */
    concat (symbol){
        return new SymbolString(...this, symbol);
    }

    /** @param {function(Symbol) : any} func */
    forEach(func) {
        this.symbols.forEach(func);
    }
}