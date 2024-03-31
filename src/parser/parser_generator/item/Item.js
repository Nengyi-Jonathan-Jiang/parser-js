import {Rule} from "../../ParseRule.js";
import {Symbol} from "../../../common/Symbol.js";
import {SymbolSet} from "../SymbolSet.js";

export class Item {
    /** @type {Rule} */
    #rule;
    /** @type {number} */
    #pos;
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
        this.#rule = rule;
        this.#pos = pos;
        this.#lookahead = lookahead;
        this.#repr = this.#calculateRepr();
    }

    /** @type {Rule} */
    get rule () {
        return this.#rule;
    }

    /** @type {int} */
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

    /** @type {SymbolSet} */
    get lookahead() {
        return this.#lookahead;
    }

    get shift() {
        if (this.isFinished) throw new RangeError('Something went wrong :(');
        return new Item(this.rule, this.pos + 1, this.lookahead);
    }

    #calculateRepr() {
        let res = `${this.rule.lhs} :=`;
        for (let i = 0; i < this.rule.rhs.size; i++) {
            res += i === this.pos ? " ● " : ' ';
            res += this.rule.rhs.get(i);
        }
        if (this.isFinished) res += " ●";
        res += ` \t${[...this.lookahead].map(i => `"${i}"`).join('/')}`;
        return res;
    }

    toString() {
        return this.#repr;
    }
}