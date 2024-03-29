import {Token, Symbol} from "../common/common.js";

import Regex from "./regex/Regex.js";
import {compileToDFA} from "./fsm/NFAtoDFAConverter.js";

const lex_rules = `
COMMENT := (//[^\\n]*|/\\*([^*]|\\*[^/])*?\\*?\\*/)
STRING-LITERAL := "[^"\\\\]*(\\\\.[^"\\\\]*)*"
INT-LITERAL := (0|-?[123456789][\\d]*)
FLOAT-LITERAL := (0|-?[123456789][\\d]*)(.[\\d]+)?
BOOL-LITERAL := (true|false)
`.trim().split(/\s*\n\s*/g).map(i => i.split(':=')).map(([a, b]) => {
    return {nfa: Regex.parse(
        b?.trim() ?? a.trim().replaceAll(/[[+.\]]/g, '\\$1')
    ).compile(), symbol: Symbol.get(a.trim())}
});

const dfa = compileToDFA(...lex_rules);
window.dfa = dfa;

class Lexer {
    /**
     * @param {string} string
     * @returns {Token[]}
     */
    lex(string) {
        return [...string.matchAll(
            /([a-zA-Z_@#][\w-]*|-?\d+(?:\.\d*)?|-?\.\d+|\S)/g
        )].map(
            ({0:{length}, 1:value, index}) => {
                const type =
                    value.match(/^[a-zA-Z_@#][\w-]*$/) ?
                    'identifier' :
                    value.match(/^-?\d+(\.\d*)?|-?\.\d+$/) ?
                    'number-literal' :
                    value;

                return new Token(
                    Symbol.get(type),
                    value,
                    index,
                    index + length
                );
            }
        )
    }
}


const dysprosiumLexer = new Lexer();
export default dysprosiumLexer;