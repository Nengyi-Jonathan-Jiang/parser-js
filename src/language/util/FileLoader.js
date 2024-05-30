import Regex from "../lexer/regex/Regex.js";
import {compileToDFA} from "../lexer/fsm/NFAtoDFAConverter.js";
import {JSymbol} from "../common/JSymbol.js";
import {Rule} from "../parser/ParseRule.js";
import {SymbolString} from "../parser/SymbolString.js";
import {Grammar} from "../parser/grammar/Grammar.js";
import {LR1ParseTableBuilder} from "../parser/parser_generator/LR1ParseTableBuilder.js";
import {LRParser} from "../parser/lr_parser/LRParser.js";
import {AbstractSyntaxTree} from "../common/AbstractSyntaxTree.js";
import {Lexer} from "../lexer/lexer.js";
import {Token} from "../common/Token.js";

/** @type {(s: string) => JSymbol} */
const S = s => JSymbol.get(s);
/** @type {(...s: string) => SymbolString} */
const SS = (...s) => new SymbolString(...s.map(S));

export function createLexerFromFile(file_contents) {
    const ignored = [];
    const lex_rules = file_contents
        .trim()
        .split(/\s*\n\s*/g)
        .filter(i => !i.startsWith('//'))
        .map(i => i.split(':='))
        .map(([a, b]) => {
            if (a.startsWith('__IGNORED__ ')) {
                a = a.replace('__IGNORED__', '').trim();
                ignored.push(a);
            }

            return ({
                nfa: Regex.parse(
                    b?.trim() ?? a.trim().replaceAll(/[(|)[\\\]+*?.]/g, '\\$&')
                ).compile(),
                symbol: S(a.trim())
            });
        });

    const dfa = compileToDFA(...lex_rules);

    return new Lexer(dfa, ignored.map(i => S(i)));
}

window.parserLexer = createLexerFromFile(`
    __IGNORED__ comment := //[^\\n]*
    __IGNORED__ space := \\s
    
    wrap := __WRAP__
    unwrap := __UNWRAP__
    epsilon := __EPSILON__
    accepts := __ACCEPTS__
    discard := __DISCARD__
    
    name := \\l+(-\\l+)*|"([^"\\\\]|\\\\.)+"
    sep := \\:\\=
    ?
    or := \\|
    )
    (
    >
    
    UNKNOWN := .
`);
window.parserParser = (
    (...rules) => new LRParser(new LR1ParseTableBuilder(new Grammar(rules, S('grammar'))).table)
)(
    new Rule(S('grammar'), SS('start-symbol-declaration', 'rule-declarations'), [{behavior: 'wrap'}, {behavior: 'wrap'}]),

    new Rule(S('start-symbol-declaration'), SS('accepts', 'name'), [{behavior: "discard"}, null]),

    new Rule(S('rule-declarations'), SS()),
    new Rule(S('rule-declarations'), SS('rule-declarations', 'rule-declaration'), [{behavior: "unwrap"}, null]),

    new Rule(S('rule-declaration'), SS('>', 'lhs', 'sep', 'rhs'), [null, {behavior: 'wrap'}, null, {behavior: 'wrap'}]),

    new Rule(S('lhs'), SS('name')),

    new Rule(S('rhs'), SS('options')),

    new Rule(S('options'), SS('list')),
    new Rule(S('options'), SS('options', 'or', 'list'), [{behavior: 'unwrap'}, {behavior: 'discard'}, null]),

    new Rule(S('list'), SS('item')),
    new Rule(S('list'), SS('list', 'item'), [{behavior: 'unwrap'}, null]),

    new Rule(S('item'), SS('(', 'options', ')'), [{behavior: 'discard'}, null, {behavior: 'discard'}]),
    new Rule(S('item'), SS('name')),
    new Rule(S('item'), SS('unwrapped-item'), [{behavior: "wrap"}]),
    new Rule(S('item'), SS('wrapped-item'), [{behavior: "wrap"}]),
    new Rule(S('item'), SS('discarded-item'), [{behavior: "wrap"}]),
    new Rule(S('item'), SS('optional-item'), [{behavior: "wrap"}]),
    new Rule(S('item'), SS('epsilon')),

    new Rule(S('optional-item'), SS('item', '?'), [null, {behavior: "discard"}]),
    new Rule(S('discarded-item'), SS('discard', 'name'), [{behavior: "discard"}, null]),
    new Rule(S('unwrapped-item'), SS('unwrap', 'name'), [{behavior: "discard"}, null]),
    new Rule(S('wrapped-item'), SS('wrap', 'name'), [{behavior: "discard"}, null]),
);

/**
 * @param {string} file_contents
 */
export function createParserFromFile(...file_contents) {
    const t = parserParser.parseTokens(parserLexer.lex(file_contents.join('\n')));
    const startSymbol = S(t.children[0].children[0].value);

    const rulesNodes = t.children[1].children;

    /** @type {Rule[]} */
    const rules = [];

    function unquote(str) {
        return str.match(/^".*"$/) ? str.substring(1, str.length - 1) : str;
    }

    /** @typedef {{symbols: JSymbol[], options: RuleOptionsList}} PartialRHS*/

    /**
     * @param {AbstractSyntaxTree|Token} node
     * @returns {PartialRHS[]}
     */
    function process(node) {
        switch (node.type.name) {
            case 'options':
                return [].concat(...node.children.map(process));
            case 'list':
                /** @type {PartialRHS[]} */
                const res = [{symbols: [], options: []}];
                for (const item of node.children.map(process)) {
                    for (const {symbols: ySymbols, options: yOptions} of res.splice(0, Number.POSITIVE_INFINITY)) {
                        for (const {symbols: zSymbols, options: zOptions} of item) {
                            res.push({symbols: [...ySymbols, ...zSymbols], options: [...yOptions, ...zOptions]});
                        }
                    }
                }
                return res;
            case 'item':
                return process(node.children[0]);
            case 'optional-item':
                return [...process(node.children[0]), {symbols: [], options: []}];
            case 'unwrapped-item':
                return [{symbols: [S(unquote(node.children[0].value))], options: [{behavior: 'unwrap'}]}];
            case 'wrapped-item':
                return [{symbols: [S(unquote(node.children[0].value))], options: [{behavior: 'wrap'}]}];
            case 'discarded-item':
                return [{symbols: [S(unquote(node.children[0].value))], options: [{behavior: 'discard'}]}];
            case 'epsilon':
                return [{symbols: [], options: []}];
            case 'name':
                return [{symbols: [S(unquote(node.value))], options: [null]}];
            default:
                throw new Error(`Unknown node or token of type ${node.type.name}`);
        }
    }

    for (let node of rulesNodes) {
        const [, {children: [{value: lhsName}]}, , rhsNode] = node.children;

        const lhs = S(lhsName);
        for (const rhs of process(rhsNode.children[0])) {
            rules.push(new Rule(lhs, new SymbolString(...rhs.symbols), rhs.options))
        }
    }

    const grammar = new Grammar(rules, startSymbol);
    const generator = new LR1ParseTableBuilder(grammar);
    const table = generator.table;
    return new LRParser(table);
}

export async function fetchTextContents(url) {
    return (await fetch(url)).text();
}
