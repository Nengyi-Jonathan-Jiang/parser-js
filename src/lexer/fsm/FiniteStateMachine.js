import {Symbol} from "../../common/Symbol";

export const FSM_ERROR_STATE = -1;

export class DFA {
    /** @typedef {Map<string, number>} tableEntry */

    /** @type {Map<number, tableEntry>} */
    #transitionTable = new Map;

    /** @type {Map<number, Symbol>}*/
    #accepting_states = new Map;

    get transitionTable() {
        return this.#transitionTable;
    }

    get acceptingStates() {
        return this.#accepting_states;
    }

    duplicate() {
        const res = new DFA;

        for(const [key, value] of this.#transitionTable.entries()){
            res.#transitionTable.set(key, new Map(value));
        }

        res.#accepting_states = new Map(this.#accepting_states);

        return res;
    }
}

export class NFA {

}