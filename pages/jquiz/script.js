import {Token, JSymbol} from '../../src/language/common/common.js';

import {createLexerFromFile, createParserFromFile, fetchTextContents} from "../../src/language/util/FileLoader.js";
import {ParsingTable} from "../../src/language/parser/lr_parser/ParsingTable.js";
import {LRParser} from "../../src/language/parser/lr_parser/LRParser.js";

const dysprosiumLexer = createLexerFromFile(`
string := "([^"\\n\\\\]|\\\\[^\\n])*"?
type := quiz|questions|question|code|block|inline-frq|frq|msq|mcq|choice|correct-choice|explanation
(
)
[
]
=
name := [abcdefghijklmnopqrstuvwxyz]+(-[abcdefghijklmnopqrstuvwxyz]+)*

WHITESPACE := \\s+
`);

const combined_parse_file = `
program := item

item := object
item := string
item := array

array := [ items ]

items __EPSILON__
__CHAIN__ items := items item

object := type ( object-params )

object-params __EPSILON__
__CHAIN__ object-params := object-params object-param

object-param := item
object-param := name = item
`;

/** @type {LRParser} */
let parser;
if(window.localStorage.getItem('parse-file') !== combined_parse_file || !(window.localStorage.getItem('parse-table') ?? '').trim()) {
    window.localStorage.setItem('parse-file', combined_parse_file);
    parser = createParserFromFile(
        JSymbol.get('program'),
        combined_parse_file
    );
    const pTable = parser.table;

    window.localStorage.setItem('parse-table', pTable.toString());
}
else {
    const savedParsingTable = window.localStorage.getItem('parse-table');

    const pTable = ParsingTable.fromString(savedParsingTable);

    parser = new LRParser(pTable);
}

export const dysprosiumParser = parser;
window.dysprosiumParser = parser;
window.getSymbol = i => JSymbol.get(i);

window.clearSavedParser = function() {
    window.localStorage.setItem('parse-file', null);
}

/** @type {HTMLTextAreaElement} */
const code_input = document.getElementById('code-input');
/** @type {HTMLDivElement} */
const tokens_output = document.getElementById('tokens-output');
/** @type {HTMLDivElement} */
const parse_output = document.getElementById('parse-output');

code_input.value = window.localStorage.getItem('t') || '';

/**
 * @param {Token} token
 * @returns {HTMLElement}
 */
function create_token_el(token) {
    const s = document.createElement('span');
    s.classList.add('token', `hl-${token.type}`)
    const n = document.createElement('span');
    n.innerText = token.type.name;
    const v = document.createElement('span');
    if(token.value !== token.type.name) v.innerText = token.value;

    s.append(n, v);
    return s;
}

/**
 * @param {string} string
 * @param {Token[]} tokens
 */
function update_tokens(string, tokens) {

    tokens = [...tokens];
    tokens.pop()

    let lastEndIndex = 0;
    for(const token of tokens) {
        const {startIndex, endIndex} = token;
        if(startIndex !== lastEndIndex) {
            const s = document.createElement('span');
            s.innerText = string.substring(lastEndIndex, startIndex);
            tokens_output.appendChild(s);
        }
        lastEndIndex = endIndex;

        tokens_output.appendChild(create_token_el(token));
    }

    if(lastEndIndex !== string.length) {
        const s = document.createElement('span');
        s.innerText = string.substring(lastEndIndex, string.length);
        tokens_output.appendChild(s);
    }
}

/** @param {AbstractSyntaxTree} parseTree */
function update_parse_tree(parseTree) {
    /** @param {AbstractSyntaxTree} treeNode */
    function generate_element(treeNode) {
        if(treeNode instanceof Token) {
            return create_token_el(treeNode);
        }

        const el = document.createElement('div');
        el.classList.add('parse-tree-node', `hl-${treeNode.type}`);

        const top = document.createElement('span');
        const button = document.createElement('input');
        button.setAttribute('type', 'checkbox');
        button.setAttribute('checked', '');

        top.append(button);
        top.append(new Text(treeNode.type.name));

        el.appendChild(top);

        const children_container = document.createElement('div');
        children_container.append(...treeNode.children.map(generate_element));

        el.appendChild(children_container);

        return el;
    }

    const el = generate_element(parseTree);
    parse_output.appendChild(el);
}

code_input.oninput = _ => {
    while(tokens_output.firstChild) tokens_output.firstChild.remove();
    while(parse_output.firstChild) parse_output.firstChild.remove();

    const input = code_input.value;
    const tokens = dysprosiumLexer.lex(input);

    window.localStorage.setItem('t', input);

    update_tokens(input, tokens);

    let parseTree;

    try {
        parseTree = dysprosiumParser.parseTokens(tokens);
        update_parse_tree(parseTree);
    }
    catch (e) {
        parse_output.innerText = e.message;
    }
}

code_input.oninput(null);