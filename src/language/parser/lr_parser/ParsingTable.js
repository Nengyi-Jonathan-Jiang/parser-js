import {Rule} from "../ParseRule.js";
import {Symbol} from "../../common/Symbol.js";
import {SymbolString} from "../SymbolString.js";

/**
 * @export
 * @typedef {
 *      {type: "SR", state: number, symbol: Symbol, nextState: number, rule: Rule} |
 *      {type: "RR", state: number, symbol: Symbol, rule1: Rule, rule2: Rule} |
 *      {type: "SS" } |
 *      {type: "Unknown"}
 * } ParseConflict
 */

export class ParsingTable {
    /** @type {Map<Symbol, TableEntry>[]} */
    #table;
    /** @type {number} */
    #numStates;

    /** @type {ParseConflict[]}
     */
    #conflicts = [];

    constructor(numStates) {
        this.#numStates = numStates;
        this.#table = new Array(numStates).fill(null).map(_ => new Map);
    }

    /**
     * @param {number} state
     * @param {Symbol} symbol
     * @return {TableEntry}
     */
    getAction(state, symbol) {
        return this.#table[state].get(symbol);
    }

    /**
     * @param {number} state
     * @return {Set<Symbol>}
     */
    acceptableSymbolsAtState(state) {
        return new Set(this.#table[state].keys());
    }

    /**
     * @param {number} state
     * @param {Symbol} symbol
     * @return {GotoEntry}
     */
    getGoto(state, symbol) {
        // noinspection JSValidateTypes
        return this.#table[state].get(symbol);
    }

    /**
     * @param {number} state
     * @param {Symbol} symbol
     * @param {Rule} rule
     */
    setActionReduce(state, symbol, rule) {
        let existingEntry = this.#table[state].get(symbol);
        if(existingEntry instanceof ShiftEntry) {
            this.#conflicts.push({type: "SR", state, symbol, nextState: existingEntry.nextState, rule});
        }
        else if(existingEntry instanceof ReduceEntry) {
            if(rule !== existingEntry.rule) {
                this.#conflicts.push({type: "RR", state, symbol, rule1: rule, rule2: existingEntry.rule});
            }
        }
        else if(existingEntry !== undefined) {
            console.log(existingEntry);
            this.#conflicts.push({type: "Unknown"})
        }

        this.#table[state].set(symbol, new ReduceEntry(rule));
    }

    /**
     * @param {number} state
     * @param {Symbol} symbol
     * @param {number} nextState
     */
    setActionShift(state, symbol, nextState) {
        let existingEntry = this.#table[state].get(symbol);
        if(existingEntry instanceof ReduceEntry) {
            this.#conflicts.push({type: "SR", state, symbol, nextState, rule: existingEntry.rule});
        }
        else if(existingEntry instanceof ShiftEntry) {
            if(nextState !== existingEntry.nextState) {
                this.#conflicts.push({type: "SS"})
            }
        }
        else if(existingEntry !== undefined) {
            this.#conflicts.push({type: "Unknown"});
        }

        this.#table[state].set(symbol, new ShiftEntry(nextState));
    }

    /**
     * @param {number} state
     * @param {Symbol} symbol
     */
    setActionAccept(state, symbol) {
        this.#table[state].set(symbol, new AcceptEntry);
    }

    /**
     * @param {number} state
     * @param {Symbol} symbol
     * @param {number} n
     */
    setGoto(state, symbol, n) {
        this.#table[state].set(symbol, new GotoEntry(n));
    }

    /** @type {ParseConflict[]} */
    get conflicts() {
        return this.#conflicts;
    }

    toString() {
        let res = ''
        const length = this.#table.length;
        res += length + '\n'
        for(const state of this.#table) {
            res += `state ${state.size}\n`;
            for(const [symbol, entry] of state) {
                if(entry instanceof ShiftEntry) {
                    res += `${symbol} shift ${entry.nextState}\n`
                }
                else if(entry instanceof ReduceEntry) {
                    res += `${symbol} reduce ${entry.rule}\n`
                }
                else if(entry instanceof AcceptEntry) {
                    res += `${symbol} accept\n`
                }
                else if(entry instanceof GotoEntry) {
                    res += `${symbol} goto ${entry.nextState}\n`
                }
            }
        }
        return res;
    }

    static fromString(str) {
        const arr = str.split(/\s*\n\s*/g);
        let idx = 0;
        const rules = new Map;

        const numStates = +arr[idx++];
        const res = new ParsingTable(numStates);
        for(let state = 0; state < numStates; state++) {
            for(let numEntries = +arr[idx++].split(' ')[1]; numEntries --> 0;) {
                const entry = arr[idx++];
                let [symbol, entryType, ...rest] = entry.split(' ');
                symbol = Symbol.get(symbol);
                switch(entryType) {
                    case 'shift':
                        res.setActionShift(state, symbol, +rest[0]);
                        break;
                    case 'reduce':
                        let rule_str = rest.join(' ');
                        if(!rules.has(rule_str)) {
                            let unwrap = true, chain = false;
                            if(rest[0] === '__WRAP__') {
                                unwrap = false;
                                rest.shift();
                            }
                            else if(rest[0] === '__CHAIN__') {
                                chain = true;
                                rest.shift();
                            }
                            const [lhs,, ...rhs] = rest.map(i => Symbol.get(i.trim()));
                            const rule = new Rule(lhs, new SymbolString(...rhs), chain, unwrap);
                            rules.set(rule_str, rule);
                        }
                        res.setActionReduce(state, symbol, rules.get(rule_str));
                        break;
                    case 'accept':
                        res.setActionAccept(state, symbol);
                        break;
                    case 'goto':
                        res.setGoto(state, symbol, +rest[0]);
                        break;
                }
            }
        }

        return res;
    }
}

/** @abstract */
export class TableEntry {
    static EntryType = {SHIFT: 'SHIFT', REDUCE: 'REDUCE', ACCEPT: 'ACCEPT', GOTO: 'GOTO'}

    // noinspection JSUnusedGlobalSymbols
    /**  @type {'SHIFT' | 'REDUCE' | 'ACCEPT' | 'GOTO'} */
    get actionType() {}
}

export class ReduceEntry extends TableEntry {
    /** @type {Rule} */
    #rule;

    /** @param {Rule} rule */
    constructor(rule) {
        super();
        this.#rule = rule;
    }

    get actionType() {
        return TableEntry.EntryType.REDUCE
    }

    /** @type {Rule} */
    get rule() {
        return this.#rule;
    }
}

export class ShiftEntry extends TableEntry {
    /** @type {number} */
    #nextState;

    /** @param {number} nextState */
    constructor(nextState) {
        super();
        this.#nextState = nextState;
    }

    get actionType() {
        return TableEntry.EntryType.SHIFT
    }

    /** @type {number} */
    get nextState() {
        return this.#nextState;
    }
}

export class AcceptEntry extends TableEntry {
    get actionType() {
        return TableEntry.EntryType.ACCEPT
    }
}

export class GotoEntry extends TableEntry {
    /** @type {number} */
    #nextState;

    /** @param {number} nextState */
    constructor(nextState) {
        super();
        this.#nextState = nextState;
    }

    get actionType() {
        return TableEntry.EntryType.GOTO
    }

    /** @type {number} */
    get nextState() {
        return this.#nextState;
    }
}