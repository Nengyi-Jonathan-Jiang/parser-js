import {Symbol} from "../../common/Symbol.js";
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

    /** @type {Map<Symbol, Rule[]>} */
    #startsWith = new Map;
    /** @type {Set<Symbol>} */
    #allSymbols = new Set;
    /** @type {Set<Symbol>} */
    #terminals = new Set;
    /** @type {Set<Symbol>} */
    #nonTerminals = new Set;
    /** @type {Set<Symbol>} */
    #nullableSymbols = new Set;

    /** @type {Map<Symbol, Set<Symbol>>} */
    #firstSets = new Map;
    /** @type {Map<Symbol, Set<Symbol>>} */
    #followSets = new Map;

    /** @type {SMap<SymbolString, Set<Symbol>>} */
    #firstCache = new SMap;
    /** @type {SMap<SymbolString, Set<Symbol>>} */
    #followCache = new SMap;

    /**
     * @param {Rule[]} rules
     * @param {Symbol} startSymbol
     */
    constructor(rules, startSymbol) {
        this.#rules = rules;

        // Augment the grammar
        this.#startRule = new Rule(Symbol.__START__, new SymbolString(startSymbol), false, true);
        this.#rules.push(this.#startRule);

        // Classify symbols as terminals or nonterminals

        this.#allSymbols.add(Symbol.__START__);
        this.#allSymbols.add(Symbol.__EOF__);

        this.#nonTerminals.add(Symbol.__START__);

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

        this.#followSets.get(Symbol.__START__).add(Symbol.__EOF__);

        // Calculate FIRST sets, FOLLOW sets, and the set of nullable symbols

        let updated = true;
        while (updated) {
            updated = false;
            for (const rule of this.#rules) {
                const {lhs, rhs} = rule;

                let brk = false;

                for (const sym of rhs) {
                    updated |= addAll(this.first(lhs), this.first(sym));

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
                        updated |= addAll(this.follow(rhs.get(i)), aux);
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
     * @param {Symbol} sym
     * @returns {ReadonlyArray<Rule>}
     */
    getRules(sym) {
        // noinspection JSValidateTypes
        return this.#startsWith.get(sym);
    }

    /** @type {ReadonlySet<Symbol>} */
    get allSymbols() {
        return this.#allSymbols;
    }

    /** @type {ReadonlySet<Symbol>} */
    get nonTerminals() {
        return this.#nonTerminals;
    }

    /** @type {ReadonlySet<Symbol>} */
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
     * @param {Symbol|SymbolString} tkns
     * @returns {boolean}
     */
    isNullable(tkns) {
        if(tkns instanceof Symbol) return this.#nullableSymbols.has(tkns);

        if (tkns.size === 0) return true;

        for (const tkn of tkns)
            if (!this.isNullable(tkn))
                return false;
        return true;
    }

    /**
     * @param {SymbolString|Symbol} tkns
     * @returns {ReadonlySet<Symbol>}
     */
    follow(tkns) {
        if(tkns instanceof Symbol) return this.#followSets.get(tkns);

        // Follow set of empty token string is {epsilon}
        if (tkns.size === 0) return new Set([Symbol.__EPSILON__]);

        // Check result in cache
        if (this.#followCache.has(tkns)) return this.#followCache.get(tkns);

        // Otherwise follow set of token string is follow set of last token
        const res = new Set(this.follow(tkns.lastTkn));

        // If last token is nullable, then also add the follow set of the rest
        // of the token string
        if (this.#nullableSymbols.has(tkns.lastTkn)) {
            addAll(res, this.follow(tkns.substring(0, tkns.size - 1)));
        }

        // Cache result
        this.#followCache.set(tkns, res);

        return res;
    }

    /**
     * @param {SymbolString|Symbol} tkns
     * @returns {ReadonlySet<Symbol>}
     */
    first(tkns) {
        if(tkns instanceof Symbol) return this.#firstSets.get(tkns);

        // First set of empty token string is {epsilon}
        if (tkns.size === 0) return new Set([Symbol.__EPSILON__]);

        // Check result in cache
        if (this.#firstCache.has(tkns)) return this.#firstCache.get(tkns);

        // Otherwise follow set of token string is follow set of last token
        const res = new Set(this.first(tkns.firstTkn));

        // If last token is nullable, then also add the follow set of the rest
        // of the token string
        if (this.#nullableSymbols.has(tkns.firstTkn)) {
            addAll(res, this.first(tkns.substring(1)));
        }

        // Cache result
        this.#firstCache.set(tkns, res);

        return res;
    }
}