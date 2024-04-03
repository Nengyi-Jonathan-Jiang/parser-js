import {createLexerFromFile, createParserFromFile, fetchTextContents} from "../language/util/FileLoader.js";
import {Symbol} from "../language/common/Symbol.js";

export const dysprosiumLexer = createLexerFromFile(
    await fetchTextContents('../res/dysprosium.lex'),
    [
        Symbol.get('COMMENT'),
        Symbol.get('WHITESPACE')
    ]
);

export const dysprosiumParser = createParserFromFile(
    await fetchTextContents('../res/dysprosium.bnf'),
    Symbol.get('program')
);