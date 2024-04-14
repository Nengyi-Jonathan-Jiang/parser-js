import {SymbolSet} from "./SymbolSet.js";
import {Symbol} from "../../common/Symbol.js";
import {Grammar} from "../grammar/Grammar.js";
import {Item} from "./item/Item.js";
import {ItemSet} from "./item/ItemSet.js";
import {LRParseTableBuilderBase} from "./LRParseTableBuilderBase.js";
import {SMap} from "../../util/FMap.js";

export class LR1ParseTableBuilder extends LRParseTableBuilderBase {
    /** @type {SMap<Item, ItemSet>} */
    memoization = new SMap;

    /** @param {Grammar} grammar */
    constructor(grammar){
        super(grammar);
    }

    /**
     * @param {Item} item
     * @returns {ItemSet}
     */
    itemClosure(item){
        {
            if(!this.memoization) this.memoization = new SMap;
            const cachedRes = this.memoization.get(item);
            if(cachedRes != null) return cachedRes;
        }

        const res = new ItemSet(item);

        if(item.isFinished) return res;
        
        let edge = res.copy();
        
        let updated = true;
        while(updated){
            updated = false;

            const newEdge = new ItemSet;
            
            for(/** @type {Item} */ const itm of edge){

                if (itm.isFinished) continue;

                const symbol = itm.next;

                if (!this.grammar.nonTerminals.has(symbol)) continue;

                // Expand nonterminal production

                const rest = itm.rule.rhs.substring(itm.pos + 1);

                /** @type {SymbolSet<Symbol>} */
                let newLookahead = new SymbolSet(this.grammar.first(rest));
                if(newLookahead.has(Symbol.__EPSILON__)) {
                    newLookahead.delete(Symbol.__EPSILON__);
                    for(/** @type {Symbol} */ const lookahead of itm.lookahead) {
                        newLookahead.add(lookahead);
                    }
                }

                for(const r of this.grammar.getRules(symbol)){
                    const newItem = new Item(r, 0, newLookahead);

                    updated ||= !res.has(newItem);

                    res.add(newItem);
                    newEdge.add(newItem);
                }
            }

            edge = newEdge;
        }

        res.lock();

        this.memoization.set(item, res);

        return res;
    }
}