import {JSymbol} from "../../common/JSymbol.js";
import {Rule} from "../ParseRule.js";
import {SymbolString} from "../SymbolString.js";
import {SymbolSet} from "../parser_generator/SymbolSet.js";
import {SMap} from "../../util/FMap.js";

/**
 * @param {Set<T>} set
 * @param {Iterable<T>} elements
 * @returns {boolean}
 * @template T
 */
function addAll(set, elements) {
    let res = false;
    for(const i of elements) {
        if(!set.has(i)) {
            res = true;
            set.add(i);
        }
    }
    return res;
}

export class Grammar {
    /** @type {Rule[]} */
    #rules;
    /** @type {Rule} */
    #startRule;

    /** @type {Map<JSymbol, Rule[]>} */
    #startsWith = new Map;
    /** @type {Set<JSymbol>} */
    #allSymbols = new Set;
    /** @type {Set<JSymbol>} */
    #terminals = new Set;
    /** @type {Set<JSymbol>} */
    #nonTerminals = new Set;
    /** @type {Set<JSymbol>} */
    #nullableSymbols = new Set;

    /** @type {Map<JSymbol, Set<JSymbol>>} */
    #firstSets = new Map;
    /** @type {Map<JSymbol, Set<JSymbol>>} */
    #followSets = new Map;

    /** @type {SMap<SymbolString, Set<JSymbol>>} */
    #firstCache = new SMap;
    /** @type {SMap<SymbolString, Set<JSymbol>>} */
    #followCache = new SMap;

    /**
     * @param {Rule[]} rules
     * @param {JSymbol} startSymbol
     */
    constructor(rules, startSymbol) {
        this.#rules = rules;

        // Augment the grammar
        this.#startRule = new Rule(JSymbol.__START__, new SymbolString(startSymbol));
        this.#rules.push(this.#startRule);

        // Classify symbols as terminals or nonterminals

        this.#allSymbols.add(JSymbol.__START__);
        this.#allSymbols.add(JSymbol.__EOF__);

        this.#nonTerminals.add(JSymbol.__START__);

        for (const rule of this.#rules) {
            this.#nonTerminals.add(rule.lhs);
            this.#allSymbols.add(rule.lhs);

            addAll(this.#allSymbols, rule.rhs);
        }

        this.#terminals = new Set(this.#allSymbols);

        this.#nonTerminals.forEach(i => this.#terminals.delete(i));

        // Compute for each symbol the set of rules whose left-hand-sides match
        // said symbol

        for (const sym of this.#allSymbols) this.#startsWith.set(sym, []);

        for (const rule of this.#rules) this.#startsWith.get(rule.lhs).push(rule);

        //Initialize FIRST sets, FOLLOW sets, nullable set

        for (const sym of this.#allSymbols) {
            this.#firstSets.set(sym, new SymbolSet());
            this.#followSets.set(sym, new SymbolSet());
            if (this.#terminals.has(sym)) {
                this.#firstSets.get(sym).add(sym);
            }
        }

        this.#followSets.get(JSymbol.__START__).add(JSymbol.__EOF__);

        // Calculate FIRST sets, FOLLOW sets, and the set of nullable symbols

        let updated = true;
        while (updated) {
            updated = false;
            for (const rule of this.#rules) {
                const {lhs, rhs} = rule;

                let brk = false;

                for (const sym of rhs) {
                    updated |= addAll(this.#firstSets.get(lhs), this.first(sym));

                    if (!this.isNullable(sym)) {
                        brk = true;
                        break;
                    }
                }
                if (!brk) {
                    if(!this.isNullable(lhs)) {
                        this.#nullableSymbols.add(lhs);
                        updated = true;
                    }
                }

                let aux = this.follow(lhs);

                for (let i = rhs.size - 1; i >= 0; i--) {
                    if (this.#nonTerminals.has(rhs.get(i))) {
                        updated |= addAll(this.#followSets.get(rhs.get(i)), aux);
                    }
                    if (this.isNullable(rhs.get(i))) {
                        aux = new Set(aux);
                        addAll(aux, this.first(rhs.get(i)));
                    } else aux = this.first(rhs.get(i));
                }
            }
        }
    }

    /** @type {ReadonlyArray<Rule>} */
    get rules() {
        // noinspection JSValidateTypes
        return this.#rules;
    }

    /**
     * @param {JSymbol} sym
     * @returns {ReadonlyArray<Rule>}
     */
    getRules(sym) {
        // noinspection JSValidateTypes
        return this.#startsWith.get(sym);
    }

    /** @type {ReadonlySet<JSymbol>} */
    get allSymbols() {
        return this.#allSymbols;
    }

    /** @type {ReadonlySet<JSymbol>} */
    get nonTerminals() {
        return this.#nonTerminals;
    }

    /** @type {ReadonlySet<JSymbol>} */
    get terminals() {
        return this.#terminals;
    }

    /** @type {Rule} */
    get startRule(){
        return this.#startRule;
    }

    toString(){
        return this.rules.join('\n');
    }

    /**
     * @param {JSymbol|SymbolString} symbols
     * @returns {boolean}
     */
    isNullable(symbols) {
        if(symbols instanceof JSymbol) return this.#nullableSymbols.has(symbols);

        if (symbols.size === 0) return true;

        for (const tkn of symbols)
            if (!this.isNullable(tkn))
                return false;
        return true;
    }

    /**
     * @param {SymbolString|JSymbol} symbols
     * @returns {ReadonlySet<JSymbol>}
     */
    follow(symbols) {
        if(symbols instanceof JSymbol) return this.#followSets.get(symbols);

        // Follow set of empty token string is {epsilon}
        if (symbols.size === 0) return new Set([JSymbol.__EPSILON__]);

        // Check result in cache
        if (this.#followCache.has(symbols)) return this.#followCache.get(symbols);

        // Otherwise follow set of token string is follow set of last token
        const res = new Set(this.follow(symbols.lastTkn));

        // If last token is nullable, then also add the follow set of the rest
        // of the token string
        if (this.#nullableSymbols.has(symbols.lastTkn)) {
            addAll(res, this.follow(symbols.substring(0, symbols.size - 1)));
        }

        // Cache result
        this.#followCache.set(symbols, res);

        return res;
    }

    /**
     * @param {SymbolString|JSymbol} symbols
     * @returns {ReadonlySet<JSymbol>}
     */
    first(symbols) {
        if(symbols instanceof JSymbol) return this.#firstSets.get(symbols);

        // First set of empty token string is {epsilon}
        if (symbols.size === 0) return new Set([JSymbol.__EPSILON__]);

        // Check result in cache
        if (this.#firstCache.has(symbols)) return this.#firstCache.get(symbols);

        // Otherwise follow set of token string is follow set of last token
        const res = new Set(this.first(symbols.firstTkn));

        // If last token is nullable, then also add the follow set of the rest
        // of the token string
        if (this.#nullableSymbols.has(symbols.firstTkn)) {
            addAll(res, this.first(symbols.substring(1)));
        }

        // Cache result
        this.#firstCache.set(symbols, res);

        return res;
    }
}