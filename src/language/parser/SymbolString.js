import {JSymbol} from "../common/JSymbol.js";

// noinspection JSClosureCompilerSyntax
/** @implements {Iterable<JSymbol>} */
export class SymbolString {
    /** @type {JSymbol[]} */
    #symbols;
    /** @type {string} */
    #_str;

    /** @param {JSymbol} symbols */
    constructor(...symbols) {
        this.#symbols = symbols;
        this.#_str = symbols.join(' ');
    }

    /**
     * @param {number} i
     * @returns {JSymbol}
     */
    get(i){
        return this.#symbols[i]
    }

    /** @return {JSymbol|null} */
    get firstTkn(){
        return this.#symbols[0] ?? null
    }

    /** @return {JSymbol|null} */
    get lastTkn(){
        return this.#symbols[this.#symbols.length - 1] ?? null
    }

    /** @type {number} */
    get size(){return this.#symbols.length;}

    /** @type {JSymbol[]} */
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

    /** @type {IterableIterator[JSymbol]} */
    [Symbol.iterator](){
        // noinspection JSValidateTypes
        return this.symbols[Symbol.iterator]();
    }

    /**
     * @param {JSymbol} symbol
     * @return {SymbolString}
     */
    concat (symbol){
        return new SymbolString(...this, symbol);
    }

    /** @param {function(JSymbol) : any} func */
    forEach(func) {
        this.symbols.forEach(func);
    }
}