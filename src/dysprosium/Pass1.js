import {createLexerFromFile, createParserFromFile, fetchTextContents} from "../language/util/FileLoader.js";
import {JSymbol} from "../language/common/JSymbol.js";
import {ParsingTable} from "../language/parser/lr_parser/ParsingTable.js";
import {LRParser} from "../language/parser/lr_parser/LRParser.js";

export const dysprosiumLexer = createLexerFromFile(
    await fetchTextContents('../../res/lang/dysprosium/dysprosium.lex'),
    [
        JSymbol.get('COMMENT'),
        JSymbol.get('WHITESPACE')
    ]
);

const combined_parse_file = [
    await fetchTextContents('../../res/lang/dysprosium/main.bnf'),
    await fetchTextContents('../../res/lang/dysprosium/module.bnf'),
    await fetchTextContents('../../res/lang/dysprosium/types.bnf'),
    await fetchTextContents('../../res/lang/dysprosium/statements.bnf'),
    await fetchTextContents('../../res/lang/dysprosium/declarations.bnf'),
    await fetchTextContents('../../res/lang/dysprosium/expressions.bnf'),
].join('\n');

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