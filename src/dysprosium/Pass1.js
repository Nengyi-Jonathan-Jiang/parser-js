import {createLexerFromFile, createParserFromFile, fetchTextContents} from "../language/util/FileLoader.js";
import {Symbol} from "../language/common/Symbol.js";

export const dysprosiumLexer = createLexerFromFile(
    await fetchTextContents('../../res/lang/dysprosium/dysprosium.lex'),
    [
        Symbol.get('COMMENT'),
        Symbol.get('WHITESPACE')
    ]
);

export const dysprosiumParser = createParserFromFile(
    Symbol.get('program'),
    await fetchTextContents('../../res/lang/dysprosium/main.bnf'),
    await fetchTextContents('../../res/lang/dysprosium/module.bnf'),
    await fetchTextContents('../../res/lang/dysprosium/types.bnf'),
    await fetchTextContents('../../res/lang/dysprosium/statements.bnf'),
    await fetchTextContents('../../res/lang/dysprosium/expressions.bnf'),
);