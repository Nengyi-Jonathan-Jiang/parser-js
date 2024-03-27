import {Symbol} from "../../common/Symbol.js";

export const FSM_ERROR_STATE = -1;
export const DFA_INITIAL_STATE = 0;

// noinspection SpellCheckingInspection
export const ALL_CHARS = new Set("\n\t !\"#$ % & '()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~");
// noinspection SpellCheckingInspection
export const WORD_CHARS = new Set("ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz0123456789")
// noinspection SpellCheckingInspection
export const LETTER_CHARS = new Set("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ");
// noinspection SpellCheckingInspection
export const DIGIT_CHARS = new Set("0123456789");
// noinspection SpellCheckingInspection
export const SPACE_CHARS = new Set("\n\t ");

export class DFA {
    /** @typedef {Map<string, number>} DFATableEntry */

    /** @type {Map<number, DFATableEntry>} */
    #transitionTable = new Map;

    /** @type {Map<number, Symbol>}*/
    #accepting_states = new Map;

    get transitionTable() {
        return this.#transitionTable;
    }

    get acceptingStates() {
        return this.#accepting_states;
    }

    clone() {
        const res = new DFA;

        for(const [key, value] of this.#transitionTable.entries()){
            res.#transitionTable.set(key, new Map(value));
        }

        res.#accepting_states = new Map(this.#accepting_states);

        return res;
    }
}

/**
 * Represents a nondeterministic finite automaton.
 *
 * By convention, an NFA may not have a transition away from the final state. In addition, only epsilon
 * transitions may be nondeterministic.
 */
export class NFA {
    static get INITIAL_STATE() { return 0 }
    static get FINAL_STATE() { return 1 }
    
    /** @typedef {Map<string, Set<number>>} NFATableEntry */

    /** @type {Map<number, NFATableEntry>} */
    #transitionTable = new Map;

    static EPSILON = 'ε';

    /**
     * @param {number} state
     * @type {NFATableEntry}
     */
    getEntryForState(state) {
        if(!this.#transitionTable.has(state)) {
            this.#transitionTable.set(state, new Map);
        }
        return this.#transitionTable.get(state);
    }

    /**
     * @param {number} state
     * @param {string} char
     */
    getTransitionsOnChar(state, char) {
        const entryForState = this.getEntryForState(state);
        if(!entryForState.has(char)) {
            entryForState.set(char, new Set);
        }
        return entryForState.get(char);
    }

    addTransition(startState, char, endState) {
        if(startState === NFA.FINAL_STATE) {
            throw new Error('Cannot have transition from final state in NFA');
        }
        if(char.length !== 1) {
            throw new Error('NFA can only transition on single characters, not strings');
        }

        const transitions = this.getTransitionsOnChar(startState, char);
        if(transitions.size) {
            throw new Error('Cannot have multiple non-epsilon transition in NFA');
        }
        transitions.add(endState);

        return this;
    }
    addEpsilonTransition(startState, ...endStates) {
        if(startState === NFA.FINAL_STATE) {
            throw new Error('Cannot have transition from final state in NFA');
        }

        const transitions = this.getTransitionsOnChar(startState, NFA.EPSILON);
        endStates.forEach(i => transitions.add(i));

        return this;
    }

    /**
     * @param {NFA} other
     */
    mergeWith(other) {
        this.#transitionTable = new Map([...this.#transitionTable, ...other.#transitionTable]);

        return this;
    }

    /**
     * Replaces transitions to and from {@link NFA.INITIAL_STATE} and {@link NFA.FINAL_STATE} with transitions
     * to and from {@link newInitialState} and {@link newFinalState} in preparation for merging with another NFA.
     * After remapping, there will be no transitions to and from {@link NFA.INITIAL_STATE} and {@link NFA.FINAL_STATE}.
     *
     * @param {number} newInitialState
     * @param {number} newFinalState
     *
     * @returns {NFA}
     */
    remap(newInitialState, newFinalState) {
        if(!this.#transitionTable.size) return this;

        const table = this.#transitionTable;

        // Remap transitions to NFA.INITIAL_STATE and NFA.FINAL_STATE
        for (const entry of table.values()) {
            for (const transitions of entry.values()) {
                if (transitions.has(NFA.INITIAL_STATE)) {
                    transitions.delete(NFA.INITIAL_STATE);
                    transitions.add(newInitialState);
                }
                if (transitions.has(NFA.FINAL_STATE)) {
                    transitions.delete(NFA.FINAL_STATE);
                    transitions.add(newFinalState);
                }
            }
        }

        // Remap transitions from NFA.INITIAL_STATE
        const initialTransitions = table.get(NFA.INITIAL_STATE);
        table.delete(NFA.INITIAL_STATE);
        table.set(newInitialState, initialTransitions);

        return this;
    }

    /**
     * Creates a new NFA based on this NFA in which transitions to and from {@link NFA.INITIAL_STATE} and
     * {@link NFA.FINAL_STATE} are replaced with transitions to and from {@link newInitialState} and
     * {@link newFinalState}. In the remapped NFA, there will be no transitions to and from {@link NFA.INITIAL_STATE}
     * and {@link NFA.FINAL_STATE}
     *
     * @param {number} newInitialState
     * @param {number} newFinalState
     * @returns {NFA}
     */
    remapped(newInitialState, newFinalState) {
        return this.clone().remap(newInitialState, newFinalState);
    }

    static #nextUnusedState = 2;
    static getNextUnusedState() {
        return this.#nextUnusedState++;
    }

    clone() {
        const res = new NFA;

        for(const [key, value] of this.#transitionTable.entries()){
            res.#transitionTable.set(key, new Map(value));
        }

        return res;
    }

    /**
     * The trivial NFA, where the initial state has an epsilon transition to the final state.
     *
     * @type {NFA}
     */
    static get trivialNFA() {
        const res = new NFA;
        res.addTransition(NFA.INITIAL_STATE, NFA.FINAL_STATE);
        return res;
    }
}