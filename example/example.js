import {Token, Symbol} from '../src/common/common.js';
import dysprosiumLexer from "../src/lexer/lexer.js";


/** @type {HTMLTextAreaElement} */
const code_input = document.getElementById('code-input');
/** @type {HTMLDivElement} */
const tokens_output = document.getElementById('tokens-output');
/** @type {HTMLDivElement} */
const parse_output = document.getElementById('parse-output');

/**
 * @param {string} string
 * @param {Token[]} tokens
 */
function update_tokens(string, tokens) {
    while(tokens_output.firstChild) tokens_output.firstChild.remove();

    let lastEndIndex = 0;
    for(const token of tokens) {
        const {startIndex, endIndex} = token;
        if(startIndex !== lastEndIndex) {
            const s = document.createElement('span');
            s.innerText = string.substring(lastEndIndex, startIndex);
            tokens_output.appendChild(s);
        }
        lastEndIndex = endIndex;

        const s = document.createElement('span');
        s.classList.add('token', `hl-${token.type}`)
        const n = document.createElement('span');
        n.innerText = token.type.name;
        const v = document.createElement('span');
        if(token.value !== token.type.name) v.innerText = token.value;

        s.append(n, v);
        tokens_output.appendChild(s);
    }

    if(lastEndIndex !== string.length) {
        const s = document.createElement('span');
        s.innerText = string.substring(lastEndIndex, string.length);
        tokens_output.appendChild(s);
    }
}

function update_parse_tree(parseTree) {

}

code_input.oninput = _ => {
    const input = code_input.value;
    const tokens = dysprosiumLexer.lex(input);

    update_tokens(input, tokens);


}