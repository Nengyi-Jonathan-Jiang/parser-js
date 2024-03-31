import {Rule} from "../ParseRule";
import {Symbol} from "../../common/Symbol";

export class ParsingTable {
    /** @type {Map<Symbol, TableEntry>[]} */
    #actionTable;
    /** @type {Map<Symbol, GotoEntry>[]} */
    #gotoTable;

    /** @type {number} */
    #numStates;

    constructor(numStates) {
        this.#numStates = numStates;
        this.#actionTable = new Array(numStates).fill(null).map(_ => new Map);
        this.#gotoTable = new Array(numStates).fill(null).map(_ => new Map);
    }

    /**
     * @param {number} state
     * @param {Symbol} symbol
     * @return {TableEntry}
     */
    getAction(state, symbol) {
        return this.#actionTable[state].get(symbol);
    }

    /**
     * @param {number} state
     * @return {TableEntry}
     */
    acceptableSymbolsAtState(state) {
        return new Set(this.#actionTable[state].keys());
    }

    /**
     * @param {number} state
     * @param {Symbol} symbol
     * @return {GotoEntry}
     */
    getGoto(state, symbol) {
        return this.#gotoTable[state].get(symbol);
    }

    /**
     * @param {number} state
     * @param {Symbol} symbol
     * @param {Rule} rule
     */
    setActionReduce(state, symbol, rule) {
        this.#actionTable[state].set(symbol, new ReduceEntry(rule));
    }

    /**
     * @param {number} state
     * @param {Symbol} symbol
     * @param {number} nextState
     */
    setActionShift(state, symbol, nextState) {
        this.#actionTable[state].set(symbol, new ShiftEntry(nextState));
    }

    /**
     * @param {number} state
     * @param {Symbol} symbol
     */
    setActionAccept(state, symbol) {
        this.#actionTable[state].set(symbol, new AcceptEntry);
    }

    /**
     * @param {number} state
     * @param {Symbol} symbol
     * @param {number} n
     */
    setGoto(state, symbol, n) {
        this.#actionTable[state].set(symbol, new GotoEntry(n));
    }
}

/** @abstract */
export class TableEntry {
    static EntryType = {SHIFT: 'SHIFT', REDUCE: 'REDUCE', ACCEPT: 'ACCEPT', GOTO: 'GOTO'}

    /** @type {'SHIFT' | 'REDUCE' | 'ACCEPT' | 'GOTO'} */
    get actionType() {
    }
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