import Regex from "../lexer/regex/Regex.js";
import {compileToDFA} from "../lexer/fsm/NFAtoDFAConverter.js";
import {Symbol} from "../common/Symbol.js";
import {Rule} from "../parser/ParseRule.js";
import {SymbolString} from "../parser/SymbolString.js";
import {Grammar} from "../parser/grammar/Grammar.js";
import {LR1ParseTableBuilder} from "../parser/parser_generator/LR1ParseTableBuilder.js";
import {LRParser} from "../parser/lr_parser/LRParser.js";
import {Lexer} from "../lexer/lexer.js";

export function createLexerFromFile(file_contents, ignored_symbols) {
    const lex_rules = file_contents
        .trim()
        .split(/\s*\n\s*/g)
        .filter(i => !i.startsWith('//'))
        .map(i => i.split(':='))
        .map(([a, b]) => ({
            nfa: Regex.parse(
                b?.trim() ?? a.trim().replaceAll(/[()[+*?.\]]/g, '\\$&')
            ).compile(), symbol: Symbol.get(a.trim())
        }));

    const dfa = compileToDFA(...lex_rules);

    return new Lexer(dfa, [
        Symbol.get('COMMENT'),
        Symbol.get('WHITESPACE')
    ]);
}

/**
 * @param {Symbol} start_symbol
 * @param {string} file_contents
 */
export function createParserFromFile(start_symbol, ...file_contents) {
    let lines = [].concat(
        ...file_contents.map(
            file => file
                .trim()
                .split(/\s*\n\s*/g)
                .filter(i => !i.startsWith('//'))
        )
    );
    const rules = lines
        .map(i => i.split(/\s+/))
        .map(x => {
            let unwrap = true, chained = false;
            /** @type {Symbol} */
            let lhs;

            let n = x.shift();
            while(true) {
                if(n === "__WRAP__")  unwrap = false;
                else if(n === "__CHAIN__") chained = true;
                else break;

                n = x.shift();
            }

            lhs = Symbol.get(n);

            if(x.shift() === "__EPSILON__"){
                return new Rule(lhs, new SymbolString(), false, true);
            }
            const rhs = x.map(i => Symbol.get(i));

            return new Rule(lhs, new SymbolString(...rhs), chained, unwrap);
        });

    const grammar = new Grammar(rules, start_symbol);

    const generator = new LR1ParseTableBuilder(grammar);

    const table = generator.table;

    return new LRParser(table);
}

export async function fetchTextContents(url) {
    return (await fetch(url)).text();
}