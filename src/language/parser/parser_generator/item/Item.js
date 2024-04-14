import {Rule} from "../../ParseRule.js";
import {Symbol} from "../../../common/Symbol.js";
import {SymbolSet} from "../SymbolSet.js";

export class ItemCore {
    /** @type {Rule} */
    #rule;
    /** @type {number} */
    #pos;

    /** @type {string} */
    #repr;

    /**
     * @param {Rule} rule
     * @param {number} pos
     */
    constructor(rule, pos) {
        this.#rule = rule;
        this.#pos = pos;
        this.#repr = this.#calculateRepr();
    }

    /** @type {Rule} */
    get rule () {
        return this.#rule;
    }

    /** @type {number} */
    get pos() {
        return this.#pos;
    }

    /** @type {boolean} */
    get isFinished() {
        return this.pos >= this.rule.rhs.size;
    }

    /** @type {Symbol|null} */
    get next() {
        if (this.isFinished) return null;
        return this.rule.rhs.get(this.pos);
    }

    /** @type {ItemCore} */
    get shift() {
        if (this.isFinished) throw new RangeError('Something went wrong :(');
        return new ItemCore(this.rule, this.pos + 1);
    }

    #calculateRepr() {
        let res = `${this.rule.lhs} :=`;
        for (let i = 0; i < this.rule.rhs.size; i++) {
            res += i === this.pos ? " ● " : ' ';
            res += this.rule.rhs.get(i);
        }
        if (this.isFinished) res += " ●";
        return res;
    }

    toString() {
        return this.#repr;
    }
}

export class Item {
    /** @type {ItemCore} */
    #core;

    /** @type {SymbolSet} */
    #lookahead;

    /** @type {string} */
    #repr;

    /**
     * @param {Rule} rule
     * @param {number} pos
     * @param {SymbolSet} lookahead
     */
    constructor(rule, pos, lookahead) {
        this.#core = new ItemCore(rule, pos);
        this.#lookahead = lookahead;
        this.#repr = this.#calculateRepr();
    }

    /** @type {Rule} */
    get rule () {
        return this.#core.rule;
    }

    /** @type {number} */
    get pos() {
        return this.#core.pos;
    }

    /** @type {boolean} */
    get isFinished() {
        return this.#core.isFinished;
    }

    /** @type {Symbol|null} */
    get next() {
        return this.#core.next;
    }

    /** @type {SymbolSet} */
    get lookahead() {
        return this.#lookahead;
    }

    /** @type {Item} */
    get shift() {
        if (this.isFinished) throw new RangeError('Something went wrong :(');
        return new Item(this.rule, this.pos + 1, this.lookahead);
    }

    /** @type {ItemCore} */
    get core() {
        return this.#core;
    }

    #calculateRepr() {
        return this.#core.toString() + `\t ${[...this.lookahead].map(i => `${i}`).join(' ')}`;
    }

    toString() {
        return this.#repr;
    }
}