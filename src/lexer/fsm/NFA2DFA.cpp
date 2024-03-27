module;

export module language.tokenizer:nfa2dfa;

import :fsm;
import :nfa;
import :dfa;
import :lexer;
import :regexparser;
import :nfa_builder;
import utility;

import language;

export std::unique_ptr<DFA> compileRulesToDFA (const std::vector<LexRule>& rules);

using FSMState = FSMState;
using table_t = NFA::table_t;
using entry_t = NFA::entry_t;

struct DFA_state_info {
	std::set<FSM::FSMState> nfa_states;
	const Symbol* accepted_symbol;

	DFA_state_info (const std::set<FSM::FSMState>& states, const Symbol* accepts)
		: nfa_states(states), accepted_symbol(accepts) {}

	std::strong_ordering operator<=> (const DFA_state_info& other) const {
		return nfa_states <=> other.nfa_states;
	}
};

struct multi_accept_NFA : public NFA {

	std::map<FSMState, const Symbol*> accepting_states;

	multi_accept_NFA (table_t transitions, std::map<FSMState, const Symbol*> acceptingStates)
		: NFA(std::move(transitions)), accepting_states(std::move(acceptingStates)) {}
};

class nfa2dfa {
	multi_accept_NFA merged;
	FSMState next_dfa_state{ 1 };
	std::map<FSMState, DFA_state_info> state_info;
	std::map<DFA_state_info, FSMState> corresponding_state;
	std::set<DFA_state_info> seen_state_info;

	explicit nfa2dfa (multi_accept_NFA merged) : merged(std::move(merged)) {}

	auto NFA_epsilon_closure (const std::set<FSMState>& states) {
		std::set<FSMState> closure{ states.begin(), states.end() };
		const Symbol* accepted_symbol;
		compute_closure(closure, [ & ] (FSMState s) -> std::set<FSMState> {
			const Symbol* accepting_state = merged.accepting_states[s];
			if (accepting_state && (!accepted_symbol || accepted_symbol->id > accepting_state->id)) {
				accepted_symbol = accepting_state;
			}
			std::map<char, std::set<FSMState>>& transitions = merged.table.at(s);
			return transitions.contains('\0') ? transitions.at('\0') : std::set<FSMState>{};
		});
		return DFA_state_info(closure, accepted_symbol);
	}

	std::unique_ptr<DFA> convert () {
		std::unique_ptr<DFA> result = std::make_unique<DFA>();

		// Find the state corresponding to state 0 and push to edge
		auto initial_state = NFA_epsilon_closure({ 0 });
		state_info.emplace(0, initial_state);
		corresponding_state.emplace(initial_state, 0);
		std::set<FSMState> states{ 0 };

		compute_closure(states, [ & ] (const FSMState dfa_state) -> std::set<FSMState> {

			std::map<char, std::set<FSMState>> merged_transitions;
			for (const FSMState nfa_state: state_info.at(dfa_state).nfa_states) {
				for (auto& [ c, targets ]: merged.table.at(nfa_state)) {
					if (c != '\0') {
						merged_transitions[c].insert(targets.begin(), targets.end());
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

public:
	static std::unique_ptr<DFA> convert (const multi_accept_NFA& merged) {
		nfa2dfa convertor{ merged };
		return std::move(convertor.convert());
	}
};

std::tuple<table_t, FSMState, FSMState> remap_states (const table_t& table, FSMState& state_counter) {
	const FSMState mapped_start = state_counter++;
	const FSMState mapped_end = state_counter++;
	std::map<FSMState, FSMState> mapped_states{{ 0, mapped_start },
											 { 1, mapped_end }};

	for (auto [ state, transitions ]: table) {
		if (!mapped_states.contains(state)) {
			mapped_states[state] = state_counter++;
		}
		for (auto [ c, targets ]: transitions) {
			for (const FSMState target: targets) {
				if (!mapped_states.contains(target)) {
					mapped_states[target] = state_counter++;
				}
			}
		}
	}

	NFA::table_t new_table{{ mapped_end, {}}};
	for (auto [ state, transitions ]: table) {
		NFA::entry_t new_transitions;
		for (auto [ c, targets ]: transitions) {
			std::set<FSM::FSMState> new_targets;
			for (const FSM::FSMState target: targets) {
				new_targets.emplace(mapped_states[target]);
			}

			new_transitions.emplace(c, new_targets);
		}
		new_table.emplace(mapped_states[state], new_transitions);
	}

	return { new_table, mapped_start, mapped_end };
}

std::unique_ptr<DFA> compileRulesToDFA (const std::vector<LexRule>& rules) {
	multi_accept_NFA merged{{},
							{}};
	FSMState new_state_counter = 1;

	for (const auto& rule: rules) {
		auto parsed = RegexParser::parse(rule.regex);
		const NFA nfa = NFABuilder::NFAFromRegexParse(parsed);

		auto [ table, mapped_start, mapped_end ] = remap_states(nfa.table, new_state_counter);

		merged.table.insert(table.begin(), table.end());
		merged.table[0]['\0'].emplace(mapped_start);
		merged.accepting_states.emplace(mapped_end, rule.sym);
	}

	return std::move(nfa2dfa::convert(merged));
}