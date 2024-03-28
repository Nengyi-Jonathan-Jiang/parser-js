import {Token, Symbol} from "../common/common.js";

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