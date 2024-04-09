import {Token, Symbol} from '../../src/language/common/common.js';

import {dysprosiumAnalyzer} from "../../src/dysprosium/SemanticAnalyzer.js";
import {dysprosiumLexer, dysprosiumParser} from "../../src/dysprosium/Pass1.js";

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

        dysprosiumAnalyzer(parseTree);
    }
    catch (e) {
        parse_output.innerText = e.message;
    }
}

function analyze() {
    const input = code_input.value;
    const tokens = dysprosiumLexer.lex(input);
    const parseTree = dysprosiumParser.parseTokens(tokens);
    dysprosiumAnalyzer(parseTree);
}

window.onkeydown = e => {
    if(e.ctrlKey && e.key === 's') {
        e.preventDefault();
        try {
            analyze();
        }
        catch (e) {
            alert(e.message);
        }
    }
}

code_input.oninput(null);