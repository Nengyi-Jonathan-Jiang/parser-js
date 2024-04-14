import {Token, Symbol} from "../common/common.js";

import {DFA_INITIAL_STATE, FSM_ERROR_STATE} from "./fsm/FiniteStateMachine.js";

// One might think it overkill to write a regex algorithm from scratch
// for lexing. However, I find that this algorithm performs demonstrably
// faster than naive regex searching, simply because this algorithm is
// more tuned to the needs of lexing as opposed to general regex search

export class Lexer {
    /** @type {DFA} */
    #dfa;

    /** @type {Set<Symbol>} */
    #ignored_symbols;

    /**
     * @param {DFA} dfa
     * @param {Iterable<Symbol>} ignored_symbols
     */
    constructor(dfa, ignored_symbols) {
        this.#dfa = dfa;
        this.#ignored_symbols = new Set(ignored_symbols);
    }


    /**
     * @param {string} string
     * @returns {Token[]}
     */
    lex(string) {
        const lex = new Lex(this.#dfa, string, this.#ignored_symbols);

        /** @type {Token[]} */
        const res = [];

        while(true) {
            let next = lex.next();
            res.push(next);

            if(next.type === Symbol.__EOF__) break;
        }

        return res;
    }
}

window.Lexer = Lexer;

export class Lex {
    /** @type {DFA} */
    #dfa;

    /** @type {string} */
    #src;

    /** @type {Set<Symbol>} */
    #ignored_symbols;

    #position = 0;

    #done = false;

    /**
     * @param {DFA} dfa
     * @param {string} src
     * @param {Set<Symbol>} ignored_symbols
     */
    constructor(dfa, src, ignored_symbols) {
        this.#ignored_symbols = ignored_symbols;
        this.#dfa = dfa;
        this.#src = src;
    }

    get done() {
        return this.#position === this.#src.length;
    }

    /** @returns {Token | null} */
    try_get_next() {
        if (this.done) {
            return new Token(Symbol.__EOF__, '', this.#position, this.#position);
        }

        /** @type {Symbol | null} */
        let accepted_symbol = null;
        let token_start = this.#position
        let token_end = this.#position;

        let curr_state = DFA_INITIAL_STATE;

        while(curr_state !== FSM_ERROR_STATE && this.#position < this.#src.length) {
            const next_state = this.#dfa.on(curr_state, this.#src[this.#position++]);

            if(this.#dfa.acceptingStates.has(next_state)) {
                accepted_symbol = this.#dfa.acceptingStates.get(next_state);
                token_end = this.#position;
            }

            curr_state = next_state;
        }

        if(accepted_symbol === null) {
            this.#position = token_start + 1;
            return null;
        }

        this.#position = token_end;

        if(this.#ignored_symbols.has(accepted_symbol)) return null;

        return new Token(accepted_symbol, this.#src.substring(token_start, token_end), token_start, token_end);
    }

    /** @returns {Token} */
    next () {
        while (true) {
            const t = this.try_get_next();
            if (t !== null) return t;
        }
    }
}