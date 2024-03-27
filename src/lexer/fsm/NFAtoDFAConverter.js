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

// 	explicit nfa2dfa (multi_accept_NFA merged) : merged(std::move(merged)) {}
    constructor() {
        // TODO
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

            return transitions.contains(NFA.EPSILON) ?
                transitions.get(NFA.EPSILON) :
                new Set;
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

		compute_closure(states, (dfa_state) => {
            /** @type {Map<string, Set<number>>} */
			const merged_transitions = new Map;

            for (const nfa_state of getDFAStateInfo(this.#stateInfo.get(dfa_state)).states) {
				for (const [c, targets] of this.#merged.getEntryForState(nfa_state)) {
					if (c !== NFA.EPSILON) {
                        targets.forEach(i => merged_transitions.get(c).add(i))
					}
				}
			}

			std::set<FSMState> created_states;
			for (auto& [ c, targets ]: merged_transitions) {
				auto new_state_info = NFA_epsilon_closure(targets);

				if (seen_state_info.contains(new_state_info)) {
					result->table[dfa_state][c] = corresponding_state[new_state_info];
					continue;
				}

				seen_state_info.emplace(new_state_info);
				FSMState new_state = next_dfa_state++;

				created_states.emplace(new_state);
				state_info.emplace(new_state, new_state_info);
				corresponding_state.emplace(new_state_info, new_state);
				result->table[dfa_state][c] = new_state;
				result->accepting_states.emplace(new_state, new_state_info.accepted_symbol);
				if (!result->table.contains(new_state)) {
					result->table.emplace(new_state, std::map<char, FSMState>{});
				}
			}
			return created_states;
		}, true);

		return std::move(result);
    }
}

// 	std::unique_ptr<DFA> convert () {
// 		std::unique_ptr<DFA> result = std::make_unique<DFA>();
//
// 		// Find the state corresponding to state 0 and push to edge
// 		auto initial_state = NFA_epsilon_closure({ 0 });
// 		state_info.emplace(0, initial_state);
// 		corresponding_state.emplace(initial_state, 0);
// 		std::set<FSMState> states{ 0 };
//
// 		compute_closure(states, [ & ] (const FSMState dfa_state) -> std::set<FSMState> {
//
// 			std::map<char, std::set<FSMState>> merged_transitions;
// 			for (const FSMState nfa_state: state_info.at(dfa_state).nfa_states) {
// 				for (auto& [ c, targets ]: merged.table.at(nfa_state)) {
// 					if (c != '\0') {
// 						merged_transitions[c].insert(targets.begin(), targets.end());
// 					}
// 				}
// 			}
//
// 			std::set<FSMState> created_states;
// 			for (auto& [ c, targets ]: merged_transitions) {
// 				auto new_state_info = NFA_epsilon_closure(targets);
//
// 				if (seen_state_info.contains(new_state_info)) {
// 					result->table[dfa_state][c] = corresponding_state[new_state_info];
// 					continue;
// 				}
//
// 				seen_state_info.emplace(new_state_info);
// 				FSMState new_state = next_dfa_state++;
//
// 				created_states.emplace(new_state);
// 				state_info.emplace(new_state, new_state_info);
// 				corresponding_state.emplace(new_state_info, new_state);
// 				result->table[dfa_state][c] = new_state;
// 				result->accepting_states.emplace(new_state, new_state_info.accepted_symbol);
// 				if (!result->table.contains(new_state)) {
// 					result->table.emplace(new_state, std::map<char, FSMState>{});
// 				}
// 			}
// 			return created_states;
// 		}, true);
//
// 		return std::move(result);
// 	}
//
// public:
// 	static std::unique_ptr<DFA> convert (const multi_accept_NFA& merged) {
// 		nfa2dfa convertor{ merged };
// 		return std::move(convertor.convert());
// 	}
// };
//
// std::tuple<table_t, FSMState, FSMState> remap_states (const table_t& table, FSMState& state_counter) {
// 	const FSMState mapped_start = state_counter++;
// 	const FSMState mapped_end = state_counter++;
// 	std::map<FSMState, FSMState> mapped_states{{ 0, mapped_start },
// 											 { 1, mapped_end }};
//
// 	for (auto [ state, transitions ]: table) {
// 		if (!mapped_states.contains(state)) {
// 			mapped_states[state] = state_counter++;
// 		}
// 		for (auto [ c, targets ]: transitions) {
// 			for (const FSMState target: targets) {
// 				if (!mapped_states.contains(target)) {
// 					mapped_states[target] = state_counter++;
// 				}
// 			}
// 		}
// 	}
//
// 	NFA::table_t new_table{{ mapped_end, {}}};
// 	for (auto [ state, transitions ]: table) {
// 		NFA::entry_t new_transitions;
// 		for (auto [ c, targets ]: transitions) {
// 			std::set<FSM::FSMState> new_targets;
// 			for (const FSM::FSMState target: targets) {
// 				new_targets.emplace(mapped_states[target]);
// 			}
//
// 			new_transitions.emplace(c, new_targets);
// 		}
// 		new_table.emplace(mapped_states[state], new_transitions);
// 	}
//
// 	return { new_table, mapped_start, mapped_end };
// }
//
// std::unique_ptr<DFA> compileRulesToDFA (const std::vector<LexRule>& rules) {
// 	multi_accept_NFA merged{{},
// 							{}};
// 	FSMState new_state_counter = 1;
//
// 	for (const auto& rule: rules) {
// 		auto parsed = RegexParser::parse(rule.regex);
// 		const NFA nfa = NFABuilder::NFAFromRegexParse(parsed);
//
// 		auto [ table, mapped_start, mapped_end ] = remap_states(nfa.table, new_state_counter);
//
// 		merged.table.insert(table.begin(), table.end());
// 		merged.table[0]['\0'].emplace(mapped_start);
// 		merged.accepting_states.emplace(mapped_end, rule.sym);
// 	}
//
// 	return std::move(nfa2dfa::convert(merged));
// }


export function convertNFAtoDFA () {

}
