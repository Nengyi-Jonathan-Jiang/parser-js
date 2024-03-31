import Regex, {
	AlternationNode,
	ConcatenationNode,
	KleeneStarNode,
	OptionalNode,
	LeafNode, KleenePlusNode
} from "./Regex.js";
import {ALL_CHARS, DIGIT_CHARS, LETTER_CHARS, SPACE_CHARS, WORD_CHARS} from "../fsm/FiniteStateMachine.js";

/**
 * @typedef {"STRING" | "ALTERNATION" | "PAREN"} RegexOperatorType
 */

class RegexParser {
	/** @type {Regex[]} */
    #stack = [];
    /** @type {RegexOperatorType[]} */
    #operatorStack = [];

    get hasOperatorsLeft() {
        return !!this.#stack.length;
    }

    /** @param {Set<string>} chars */
	chars (chars){
        this.#stack.push(new LeafNode(chars))
    }

	concat () {
        while (this.hasOperatorsLeft && this.#operatorStack[this.#operatorStack.length - 1] === "STRING") {
            const x2 = this.#stack.pop();
            const x1 = this.#stack.pop();
            this.#operatorStack.pop();

            this.#stack.push(x1.addChild(x2));
        }
        this.#operatorStack.push("STRING");
    }

	alternation () {
        while (this.hasOperatorsLeft && this.#operatorStack[this.#operatorStack.length - 1] !== "PAREN") {
            const x2 = this.#stack.pop();
            const x1 = this.#stack.pop();

            switch(this.#operatorStack.pop()){
                case "ALTERNATION":
                    if (!(x1 instanceof AlternationNode)) {
                        this.#stack.push(new AlternationNode(x1, x2));
                        break;
                    }
                case "STRING":
                    this.#stack.push(x1.addChild(x2));
                    break;

                default: throw new Error('Something went wrong :(');
            }
        }

        this.#operatorStack.push("ALTERNATION");
        this.#stack.push(new ConcatenationNode);
    }

	begin_group () {
        this.#operatorStack.push("PAREN");
        this.#stack.push(new ConcatenationNode);
    }

	end_group () {
        for (/** @type {RegexOperatorType} */ let t; (t = this.#operatorStack.pop()) !== "PAREN";) {
            const x2 = this.#stack.pop();
            const x1 = this.#stack.pop();

            switch (t) {
                case "ALTERNATION":
                    if (!(x1 instanceof AlternationNode)) {
                        this.#stack.push(new AlternationNode(x1, x2));
                        break;
                    }
                case "STRING":
                    this.#stack.push(x1.addChild(x2));
                    break;

                default:
                    throw new Error('Something went wrong :(');
            }
        }
    }

    /**
     * @param {function(Regex):Regex} op
     */
	apply (op){
        this.#stack.push(new op(this.#stack.pop()));
    }

    get result() {
        return this.#stack[0];
    }
}

/**
 * @param {string} escapedCharacter
 * @returns {string[]}
 */
function charsForEscape(escapedCharacter) {
	switch (escapedCharacter) {
		case 'w':
			return [...WORD_CHARS];
		case 'l':
			return [...LETTER_CHARS];
		case 'd':
			return [...DIGIT_CHARS];
		case 's':
			return [...SPACE_CHARS];
		case 'n':
			return ['\n']
		case 't':
			return ['\t'];
		default:
			return [escapedCharacter];
	}
}

/**
 * Parses a string into a {@link src}, which can be compiled into an {@link NFA}
 * @param {string} src
 * @returns {Regex}
 */
export function parseRegex(src) {
	const reParser = new RegexParser();

	reParser.begin_group();
	for (let i = 0; i < src.length; i++) {
		let c = src[i];
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
			case '+':
				reParser.apply(KleenePlusNode);
				break;
			case '*':
				reParser.apply(KleeneStarNode);
				break;
			case '?':
				reParser.apply(OptionalNode);
				break;
			case '.':
				reParser.concat();
				reParser.chars(ALL_CHARS);
				break;
			case '[':
				let conjugate = false;
				/** @type {Set<string>} */
				let chars = new Set;
				if (src[i + 1] === '^') {
					conjugate = true;
					chars = new Set(ALL_CHARS);
					i++;
				}

				while ((c = src[++i]) !== ']') {
					const addedLetters = c === '\\' ?
						charsForEscape(src[++i]) :
						[c];

					for (const ch of addedLetters) {
						if (conjugate) chars.delete(ch);
						else chars.add(ch);
					}
				}

				if (chars.size === 0) throw new Error("Error parsing regex: empty character class");

				reParser.concat();
				reParser.chars(chars);
				break;
			case ']':
				throw new Error("Error parsing regex: mismatched brackets []");
			case '\\':
				reParser.concat();
				reParser.chars(new Set(charsForEscape(src[++i])));
				break;

			default:
				reParser.concat();
				reParser.chars(new Set(c));
				break;
		}
	}
	reParser.end_group();
	return reParser.result;
}