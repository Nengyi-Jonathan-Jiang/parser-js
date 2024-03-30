package frontend.parser.parser_generator;

import frontend.parser.Rule;
import frontend.Symbol;
import frontend.parser.SymbolString;
import frontend.grammar.Grammar;
import frontend.parser.parser_generator.item.Item;
import frontend.parser.parser_generator.item.ItemSet;
import frontend.util.Cache;
import frontend.util.CompareCache;

public class LR1ParseTableBuilder extends LRParseTableBuilderBase {
    protected Cache<Item, ItemSet> memoization;

    public LR1ParseTableBuilder(Grammar grammar){
        super(grammar);
    }

    protected ItemSet closure(Item item){
        if(memoization == null) memoization = new CompareCache<>();

        {
            var cachedRes = memoization.get(item);
            if(cachedRes != null) return cachedRes;
        }

        ItemSet res = new ItemSet(item);

        if(item.isFinished()) return res;
        
        ItemSet edge = res.copy();
        
        boolean updated = true;
        while(updated){
            updated = false;

            ItemSet newEdge = new ItemSet();
            
            for(Item itm : edge){

                Symbol symbol = itm.next();

                if(itm.isFinished() || !grammar.isNonTerminal(symbol)) continue;

                SymbolString rest = itm.getRule().getRhs().substring(itm.getPos() + 1);

                for(Rule r : grammar.getRules(symbol)){
                    for(Symbol lookahead : itm.getLookahead()){
                        Item newItem = new Item(r, 0, grammar.first(rest.concat(lookahead)));

                        updated |= res.add(newItem);
                        newEdge.add(newItem);
                    }
                }
            }

            edge = newEdge;
        }

        memoization.cache(item, res);

        return res;
    }
}