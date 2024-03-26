import {Symbol} from "../../common/Symbol";

export const FSM_ERROR_STATE = -1;
export const DFA_INITIAL_STATE = 0;

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

export class NFA {
    static get INITIAL_STATE() { return 0 }
    static get FINAL_STATE() { return 1 }
    
    /** @typedef {Map<string, Set<number>>} NFATableEntry */

    /** @type {Map<number, NFATableEntry>} */
    #transitionTable = new Map;

    static EPSILON = 'ε';

    /** @param {number} state */
    #getEntryForState(state) {
        if(!this.#transitionTable.has(state)) {
            this.#transitionTable.set(state, new Map);
        }
        return this.#transitionTable.get(state);
    }

    /**
     * @param {number} state
     * @param {string} char
     */
    #getTransitionsOnChar(state, char) {
        const entryForState = this.#getEntryForState(state);
        if(!entryForState.has(char)) {
            entryForState.set(char, new Set);
        }
        return entryForState.get(char);
    }

    addTransition(startState, char, endState) {
        if(startState === NFA.FINAL_STATE) {
            throw new Error('Cannot have transition from final state in NFA');
        }

        const transitions = this.#getTransitionsOnChar(startState, char);
        if(transitions.size) {
            throw new Error('Cannot have multiple non-epsilon transition in NFA');
        }
        transitions.add(endState);
    }
    addEpsilonTransition(startState, ...endState) {
        if(startState === NFA.FINAL_STATE) {
            throw new Error('Cannot have transition from final state in NFA');
        }

        const transitions = this.#getTransitionsOnChar(startState, NFA.EPSILON);
        endState.forEach(i => transitions.add(i));
    }

    /**
     * @param {NFA} a
     * @param {NFA} b
     */
    static merge(a, b) {
        const result = new NFA;
        result.#transitionTable = new Map([...a.#transitionTable, ...b.#transitionTable]);
        return result;
    }


    /**
     * Creates a new NFA based on this NFA in which {@link NFA.INITIAL_STATE} and {@link NFA.FINAL_STATE}
     * are remapped to {@link newInitialState} and {@link newFinalState}. After remapping, there
     * will be no transitions to and from {@link NFA.INITIAL_STATE} and {@link NFA.FINAL_STATE}
     * @param {number} newInitialState
     * @param {number} newFinalState
     * @returns {NFA}
     */
    remappedTo(newInitialState, newFinalState) {
        if(!this.#transitionTable.size) return new NFA; // Nothing to do

        const remappedNFA = this.clone();
        const newTable = remappedNFA.#transitionTable;

        // Remap transitions to NFA.INITIAL_STATE and NFA.FINAL_STATE
        for (const entry of newTable.values()) {
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
        const initialTransitions = newTable.get(NFA.INITIAL_STATE);
        newTable.delete(NFA.INITIAL_STATE);
        newTable.set(newInitialState, initialTransitions);

        return remappedNFA;
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
}