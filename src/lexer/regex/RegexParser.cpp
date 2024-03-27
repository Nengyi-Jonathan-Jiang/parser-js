module;

export module language.tokenizer:regexparser;

import <iostream>;
import <map>;
import <set>;
import <stack>;

import language;

import :dfa;
import :fsm;

import utility;

export enum class regexNodeType { CHARS, ALTERNATION, STAR, OPTION, STRING };
export enum class regexOperatorType { STRING, ALTERNATION, PAREN };

using tree_t = AbstractSyntaxTree<regexNodeType>;
using node_t = tree_t::Node;
using internal_node_t = tree_t::InternalNode;
using leaf_node_t = tree_t::LeafNode;

export class RegexParser {
	RegexParser () = default;

	std::stack<node_t::pointer_t> stack {};
	std::stack<regexOperatorType> operator_stack;

	bool hasOperatorsLeft ();

	node_t::pointer_t stackPop ();

	regexOperatorType operatorStackPop ();

	regexOperatorType operatorStackPeek ();

	static node_t::pointer_t& append_element (node_t::pointer_t& x, node_t::pointer_t y);

	void chars (const std::set<char>& chars);

	void concat ();

	void alternation ();

	void begin_group ();

	void end_group ();

	void apply (regexNodeType op);

	tree_t result ();

public:
	static tree_t parse (const std::string& regex);
};

std::ostream& operator<< (std::ostream& os, regexNodeType t);

std::ostream& operator<< (std::ostream& os, const node_t::pointer_t& node);

bool RegexParser::hasOperatorsLeft () {
	return !operator_stack.empty();
}

node_t::pointer_t RegexParser::stackPop () {
	node_t::pointer_t res = std::move(stack.top());
	stack.pop();
	return res;
}

regexOperatorType RegexParser::operatorStackPeek () {
	return operator_stack.top();
}

node_t::pointer_t& RegexParser::append_element (node_t::pointer_t& x, node_t::pointer_t y) {
	x->asInternalNode()->add_child(std::move(y));
	return x;
}

void RegexParser::chars (const std::set<char>& chars) {
	stack.push(tree_t::createLeafNode(regexNodeType::CHARS, chars));
}

void RegexParser::concat () {
	while (hasOperatorsLeft() && operatorStackPeek() == regexOperatorType::STRING) {
		node_t::pointer_t x2 = stackPop();
		node_t::pointer_t x1 = stackPop();
		operatorStackPop();
		stack.push(std::move(append_element(x1, std::move(x2))));
	}
	operator_stack.push(regexOperatorType::STRING);
}

void RegexParser::alternation () {
	while (hasOperatorsLeft() && operatorStackPeek() != regexOperatorType::PAREN) {
		node_t::pointer_t x2 = stackPop();
		node_t::pointer_t x1 = stackPop();
		switch (operatorStackPop()) {
			case regexOperatorType::ALTERNATION:
				if (x1->nodeType != regexNodeType::ALTERNATION)
					stack.push(tree_t::createInternalNode(regexNodeType::ALTERNATION, std::move(x1), std::move(x2)));
				else {
					x1->asInternalNode()->add_child(std::move(x2));
					stack.push(std::move(x1));
				}
				break;
			case regexOperatorType::STRING:
				x1->asInternalNode()->add_child(std::move(x2));
				stack.push(std::move(x1));
				break;
			default:
				throw std::runtime_error("Error parsing regex: unknown operator on operator stack");
		}
	}
	operator_stack.push(regexOperatorType::ALTERNATION);
	stack.push(tree_t::createInternalNode(regexNodeType::STRING, {}));
}

void RegexParser::begin_group () {
	operator_stack.push(regexOperatorType::PAREN);
	stack.push(tree_t::createInternalNode(regexNodeType::STRING, {}));
}

void RegexParser::end_group () {
	for (regexOperatorType t; (t = operatorStackPop()) != regexOperatorType::PAREN;) {
		node_t::pointer_t x2 = stackPop();
		node_t::pointer_t x1 = stackPop();
		switch (t) {
			case regexOperatorType::ALTERNATION:
				if (x1->nodeType != regexNodeType::ALTERNATION) {
					stack.push(tree_t::createInternalNode(regexNodeType::ALTERNATION, std::move(x1), std::move(x2)));
				} else {
					x1->asInternalNode()->add_child(std::move(x2));
					stack.push(std::move(x1));
				}
				break;
			case regexOperatorType::STRING:
				x1->asInternalNode()->add_child(std::move(x2));
				stack.push(std::move(x1));
				break;
			default:
				throw std::runtime_error("Error parsing regex: unknown operator on operator stack");
		}
	}
}

void RegexParser::apply (regexNodeType op) {
	stack.push(tree_t::createInternalNode(op, stackPop()));
}

tree_t RegexParser::result () {
	return tree_t { std::move(stack.top()) };
}

tree_t RegexParser::parse (const std::string& regex) {
	RegexParser reParser;

	reParser.begin_group();
	for (int i = 0; i < regex.size(); i++) {
		char c = regex[i];
		switch (c) {
			case '|':
				reParser.alternation();
				break;
			case '(':
				reParser.concat();
				reParser.begin_group();
				break;
			case ')':
				reParser.end_group();
				break;
			case '*':
				reParser.apply(regexNodeType::STAR);
				break;
			case '?':
				reParser.apply(regexNodeType::OPTION);
				break;
			case '.':
				reParser.chars(DFA::all_chars());
				break;
			case '[':
				reParser.concat();
				{
					bool conjugate = false;
					std::set<char> chars;
					if (regex[i + 1] == '^') {
						conjugate = true;
						chars = FSM::all_chars();
						i++;
					}
					while ((c = regex[++i]) != ']') {
						if (c == '\\') {
							switch (regex[++i]) {
								case 'w':
									for (const char ch: FSM::word_chars()) {
										if (conjugate) {
											chars.erase(ch);
										} else {
											chars.emplace(ch);
										}
									}
									break;
								case 'l':
									for (const char ch: FSM::letters()) {
										if (conjugate) {
											chars.erase(ch);
										} else {
											chars.emplace(ch);
										}
									}
									break;
								case 'd':
									for (const char ch: FSM::digits()) {
										if (conjugate) {
											chars.erase(ch);
										} else {
											chars.emplace(ch);
										}
									}
									break;
								case 'n':
									if (conjugate) {
										chars.erase('\n');
									} else {
										chars.emplace('\n');
									}
									break;
								case 't':
									if (conjugate) {
										chars.erase('\t');
									} else {
										chars.emplace('\t');
									}
									break;
								default:
									if (conjugate) {
										chars.erase(regex[i]);
									} else {
										chars.emplace(regex[i]);
									}
							}
						} else if (conjugate) {
							chars.erase(c);
						} else {
							chars.emplace(c);
						}
					}
					if (chars.empty()) throw std::runtime_error("Error parsing regex: empty character class");
					reParser.chars(chars);
				}
				break;
			case ']':
				throw std::runtime_error("Error parsing regex: mismatched brackets []");
			case '\\':
				c = regex[++i];
				switch (c) {
					case 'w':
						reParser.concat();
						reParser.chars(FSM::word_chars());
						break;
					case 'l':
						reParser.concat();
						reParser.chars(FSM::letters());
						break;
					case 'd':
						reParser.concat();
						reParser.chars(FSM::digits());
						break;
					case 'n':
						reParser.concat();
						reParser.chars({ '\n' });
						break;
					case 't':
						reParser.concat();
						reParser.chars({ '\t' });
						break;
					default:
						reParser.concat();
						reParser.chars({ c });
				}
				break;
			default:
				reParser.concat();
				reParser.chars({ c });
				break;
		}
	}
	reParser.end_group();
	return reParser.result();
}

regexOperatorType RegexParser::operatorStackPop () {
	auto res = operator_stack.top();
	operator_stack.pop();
	return res;
}

std::ostream& operator<< (std::ostream& os, regexNodeType t) {
	switch (t) {
		case regexNodeType::CHARS:
			return os << "chars";
		case regexNodeType::ALTERNATION:
			return os << "<|>";
		case regexNodeType::STAR:
			return os << "<*>";
		case regexNodeType::OPTION:
			return os << "<?>";
		case regexNodeType::STRING:
			return os << "<#>";
	}
	return os;
}

// TODO: generify to apply to any parse tree and move to AbstractSyntaxTree.ixx

std::ostream& operator<< (std::ostream& os, const node_t::pointer_t& node) {
	int indent_level = 0;
	std::stack<const node_t::pointer_t*> stk;
	stk.push(&node);

	while (!stk.empty()) {
		const node_t::pointer_t& currentNode = *stk.top();
		stk.pop();

		if (!currentNode) {
			indent_level--;
			for (int i = 0; i < indent_level; i++) os << "    ";
			os << "}\n";
			continue;
		}

		for (int i = 0; i < indent_level; i++) os << "    ";
		os << currentNode->nodeType;

		if (currentNode->isLeaf()) {
			const leaf_node_t* leaf = currentNode->asLeafNode();

			const auto& s = leaf->get_value<std::set<char>>();

			os << "[" << std::string { s.begin(), s.end() } << "]" << "\n";
		} else {
			const internal_node_t* as_internal = currentNode->asInternalNode();
			os << " {\n";
			stk.push({});
			typeof(stk) reverse;
			for (const node_t::pointer_t& child: *as_internal) {
				reverse.push(&child);
			}
			while (!reverse.empty()) {
				stk.push(reverse.top());
				reverse.pop();
			}
			indent_level++;
		}
	}
	return os;
}