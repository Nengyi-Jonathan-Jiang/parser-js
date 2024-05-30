import {Lexer} from "../src/language/lexer/lexer.js";
import {LRParser} from "../src/language/parser/lr_parser/LRParser.js";
import {Token} from "../src/language/common/Token.js";
import {JSymbol} from "../src/language/common/JSymbol.js";
import {createLexerFromFile} from "../src/language/util/FileLoader.js";
import {createParserFromFile} from "../src/language/util/FileLoader.js";

let __NEXTINPUTNAME = 0;

/** @type {Lexer} */
let lexer;
/** @type {LRParser} */
let parser;

let shouldReverseTokens = () => {
    return grammar_input.value.includes("__REVERSED__");
};

/** @type {HTMLTextAreaElement} */
const code_input = document.getElementById('code-input');
/** @type {HTMLTextAreaElement} */
const lexer_input = document.getElementById('lexer-input');
/** @type {HTMLTextAreaElement} */
const grammar_input = document.getElementById('grammar-input');
/** @type {HTMLDivElement} */
const parse_output = document.getElementById('parse-output');

code_input.value = window.localStorage.getItem('c') || `
(1 + a * (2 + 3) + 5) + 2
`.trim();
lexer_input.value = window.localStorage.getItem('l') || `
IDENTIFIER := [\\l_]\\w*
NUMBER := 0|-?[123456789]\d*

(
)
+
-
*
/
`.trim();
grammar_input.value = window.localStorage.getItem('g') || `
program := expr

expr := a-expr

a-expr := m-expr
a-expr := a-expr a-op m-expr

a-op := +
a-op := -

m-expr := p-expr
m-expr := m-expr m-op p-expr

m-op := *
m-op := /

p-expr := NUMBER
p-expr := IDENTIFIER
p-expr := ( expr )
`.trim();

updateLexer();

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
        button.setAttribute('name', '_' + ++__NEXTINPUTNAME);

        top.append(button);
        top.append(new Text(treeNode.type.name));

        el.appendChild(top);

        const children_container = document.createElement('div');
        let children_elements = treeNode.children.map(generate_element);

        if(shouldReverseTokens()) children_elements.reverse();

        children_container.append(...children_elements);

        el.appendChild(children_container);

        return el;
    }

    const el = generate_element(parseTree);
    parse_output.appendChild(el);
}

function update_all(){
    const input = code_input.value;
    while(parse_output.firstChild) parse_output.firstChild.remove();

    if(!lexer || !parser) return;

    if(typeof lexer === 'string') {
        parse_output.innerText = lexer;
        return;
    }

    let tokens = lexer.lex(input);
    if(shouldReverseTokens()) tokens = [... tokens.slice(0, tokens.length - 1).toReversed(), tokens[tokens.length - 1]];

    let parseTree;

    try {
        parseTree = parser.parseTokens(tokens);
        update_parse_tree(parseTree);
    }
    catch (e) {
        parse_output.innerText = e.message;
    }
}

code_input.oninput = _ => {
    window.localStorage.setItem('c', code_input.value);
    update_all();
}

function updateLexer() {
    try {
        lexer = createLexerFromFile(lexer_input.value);
    }
    catch (e) {
        console.error(e);
        console.log(e.toString());
        lexer = e.toString();
    }
}

lexer_input.oninput = _ => {
    window.localStorage.setItem('l', lexer_input.value);
    updateLexer();
    update_all();
}

grammar_input.oninput = _ => {
    window.localStorage.setItem('g', grammar_input.value);
}

window.onkeydown = e => {
    if(e.ctrlKey && e.key === 's') {
        e.preventDefault();

        try {
            parser = createParserFromFile(grammar_input.value)
            update_all();
        }
        catch (e) {
            parse_output.innerText = "INVALID GRAMMAR: " + e.message;
            console.warn(e);
        }
    }
}

code_input.oninput(null);
