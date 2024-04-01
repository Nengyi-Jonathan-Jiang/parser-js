import {LR1ParseTableBuilder} from "./parser_generator/LR1ParseTableBuilder.js";
import {LRParser} from "./lr_parser/LRParser.js";
import {Grammar} from "./grammar/Grammar.js";
import {Symbol} from "../common/Symbol.js";
import {Rule} from "./ParseRule.js";
import {SymbolString} from "./SymbolString.js";

const start_symbol = Symbol.get('program');

const f = await (await fetch('../res/dysprosium.bnf')).text();

const rules = f.trim().split(/\s*\n\s*/g).filter(i => !i.startsWith('//')).map(i => i.split(/\s+/)).map(x => {
    let unwrap = true, chained = false;
    /** @type {Symbol} */
    let lhs;
    {
        let n = x.shift();
        while(true) {
            if(n === "__WRAP__")  unwrap = false;
            else if(n === "__CHAIN__") chained = true;
            else break;

            n = x.shift();
        }

        lhs = Symbol.get(n);
    }
    if(x.shift() === "__EPSILON__"){
        return new Rule(lhs, new SymbolString(), false, true);
    }
    const rhs = x.map(i => Symbol.get(i));

    return new Rule(lhs, new SymbolString(...rhs), chained, unwrap);
});

const grammar = new Grammar(rules, start_symbol);

const generator = new LR1ParseTableBuilder(grammar);

const table = generator.table;

export const dysprosiumParser = new LRParser(table);

window.rules = rules;
window.grammar = grammar;
window.generator = generator;
window.table = table;
window.dysprosiumParser = dysprosiumParser;