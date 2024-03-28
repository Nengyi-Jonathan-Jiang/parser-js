import Regex from "../regex/Regex.js";
import {Symbol} from "../../common/Symbol.js";
import {DFA, NFA} from "./FiniteStateMachine.js";

// export std::unique_ptr<DFA> compileRulesToDFA (const std::vector<LexRule>& rules);
//
// using FSMState = FSMState;
// using table_t = NFA::table_t;
// using entry_t = NFA::entry_t;

/**
 * @param {number[]} states
 * @param {Symbol} symbol
 */
function createDFAStateInfo (states, symbol) {
    return `${states.toSorted().join(',')}|${symbol.name}`;
}
/**
 * @param {string} info
 * @returns {{states: number[], symbol: Symbol}}
 */
function getDFAStateInfo(info) {
    const [states, symbol] = info.split(/\|/);
    return {
        states: states.split(',').map(i => +i),
        symbol: Symbol.get(symbol)
    };
}

class MultiAcceptNFA extends NFA {
    /** @type {Map<number, Symbol>} */
    acceptingStates;

// 	multi_accept_NFA (table_t transitions, std::map<FSMState, const Symbol*> acceptingStates)
// 		: NFA(std::move(transitions)), accepting_states(std::move(acceptingStates)) {}
// };

    constructor(transitions, acceptingStates) {
        // TODO
        super();
    }
}


/**
 * @param {Set<T>} s
 * @param {function(T):Set<T>} f
 * @param {boolean} [has_manual_check]
 * @template T
 */
function compute_closure (s, f, has_manual_check=false) {
    const edge = new Set(s);
    while (edge.size) {
        const element = edge.entries().next();
        edge.delete(element);

        for (const x of f(element)) {
            if (has_manual_check) {
                edge.add(x);
            }
            else {
                if(!s.has(x)) {
                    s.add(x)
                    edge.add(x)
                }
            }
        }
    }
}

class NFA2DFA {
    /** @type {MultiAcceptNFA} */
    #merged;
    /** @type {number} */
    #nextState = 1;
    /** @type {Map<number, string>} */
    #stateInfo = new Map;
    /** @type {Map<string, number>} */
    #correspondingState = new Map;
    /** @type {Set<string>} */
    #seenStateInfo = new Set;

    /** @param {MultiAcceptNFA} merged */
    constructor(merged) {
        this.#merged = merged;
    }

    /** @param {Set<number>} states */
    epsilonClosure(states) {
        const closure = new Set(states);
        /** @type {Symbol} */
        let accepted_symbol;
        compute_closure(closure, s => {
            let accepting_state = this.#merged.acceptingStates.get(s);
            if (accepting_state && (!accepted_symbol || accepted_symbol.id > accepting_state.id)) {
				accepted_symbol = accepting_state;
			}

			const transitions = this.#merged.getEntryForState(s);

            return transitions.get(NFA.EPSILON) ?? new Set;
        })

        return createDFAStateInfo([...closure], accepted_symbol);
    }

    convert() {
        const result = new DFA;

		// Find the state corresponding to state 0 and push to edge
		let initial_state = this.epsilonClosure(new Set([0]));
		this.#stateInfo.set(0, initial_state);
		this.#correspondingState.set(initial_state, 0);

        let states = new Set([0]);

		compute_closure(states, dfa_state => {
            /** @type {Map<string, Set<number>>} */
			const merged_transitions = new Map;

            for (const nfa_state of getDFAStateInfo(this.#stateInfo.get(dfa_state)).states) {
				for (const [c, targets] of this.#merged.getEntryForState(nfa_state)) {
					if (c !== NFA.EPSILON) {
                        targets.forEach(i => merged_transitions.get(c).add(i))
					}
				}
			}

            /** @type {Set<number>} */
			const created_states = new Set;
			for (const [ c, targets ] of merged_transitions) {
				const newStateInfo = this.epsilonClosure(targets);

				if (this.#seenStateInfo.has(newStateInfo)) {
					result.addTransition(dfa_state, c, this.#correspondingState.get(newStateInfo));
					continue;
				}

				this.#seenStateInfo.add(newStateInfo);
				const newState = this.#nextState++;

				created_states.add(newState);
				this.#stateInfo.set(newState, newStateInfo);
				this.#correspondingState.set(newStateInfo, newState);
				result.addTransition(dfa_state, c, newState);
				result.acceptingStates.put(newState, getDFAStateInfo(newStateInfo).symbol);
			}
			return created_states;
		}, true);

		return result;
    }
}

/**
 * @param {Map<number, Map<string, Set<number>>>} table
 * @param {[number]} state_counter
 * @returns {{
 *      mapped_end: number,
 *      mapped_start: number,
 *      new_table: Map<number, Map<string, Set<number>>>
 * }}
 */
function remap_states (table, state_counter) {
	const mapped_start = state_counter[0]++;
	const mapped_end = state_counter[0]++;
	const mapped_states = new Map([[0, mapped_start], [1, mapped_end]]);

	for (const [ state, transitions ] of table) {
		if (!mapped_states.has(state))
			mapped_states.set(state, state_counter++);

		for (const [, targets ] of transitions)
			for (const target of targets)
				if (!mapped_states.has(target))
					mapped_states.set(target, state_counter++);
	}

    /** @type {Map<number, Map<string, Set<number>>>} */
	const new_table = new Map([[mapped_end, new Map]]);
	for (const [ state, transitions ] of table) {
        /** @type {Map<string, Set<number>>} */
		const new_transitions = new Map;

		for (const [ c, targets ] of transitions) {
            /** @type {Set<number>} */
			const new_targets = new Set;
			for (const target of targets)
				new_targets.add(mapped_states.get(target));

			new_transitions.set(c, new_targets);
		}
		new_table.set(mapped_states.get(state), new_transitions);
	}

	return { new_table, mapped_start, mapped_end };
}

/**
 * @param {{symbol: Symbol, nfa: NFA}} rules
 * @returns
 */
export function compileToDFA (...rules) {
    const merged = new MultiAcceptNFA();
	const new_state_counter = [1];

	for (const {nfa, symbol} of rules) {

		const {new_table, mapped_start, mapped_end} = remap_states(nfa.transitionTable, new_state_counter);

        const a = {transitionTable: new_table};

		merged.mergeWith(a);
		merged.addEpsilonTransition(0, mapped_start);
		merged.acceptingStates.set(mapped_end, symbol);
	}

    return new NFA2DFA(merged).convert();
}
