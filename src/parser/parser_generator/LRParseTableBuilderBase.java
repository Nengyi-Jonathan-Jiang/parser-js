package frontend.parser.parser_generator;

import frontend.parser.Rule;
import frontend.Symbol;
import frontend.grammar.Grammar;
import frontend.parser.lr_parser.parsing_table.*;
import frontend.parser.parser_generator.item.*;

import java.util.*;

public abstract class LRParseTableBuilderBase {
    protected ParsingTable table;
    protected final Grammar grammar;
    Map<ItemSet, Integer> configuratingSets;

    protected Map<Integer, Map<Symbol, Integer>> successors;

    /**
     * Generates an LR parse table given a {@link Grammar}
     * @param grammar the grammar to use
     */
    protected LRParseTableBuilderBase(Grammar grammar){
        this.grammar = grammar;
        generateConfiguratingSets();
        generateParsingTable();
    }

    /** Generates the parsing table */
    protected void generateParsingTable(){
        System.out.println("Generating parsing table entries...");

        table = new ParsingTable(configuratingSets.size());

        int i = 0;
        for(Map.Entry<ItemSet, Integer> entry : configuratingSets.entrySet()){
            ItemSet itemSet = entry.getKey();
            int state = entry.getValue();

            // Generate Action table
            generateActionSetEntries(state, itemSet);

            // Generate Goto table

            generateGotoSetEntries(state, itemSet);
            
            // Debug

            System.out.println("Generated parsing table entries for " + (++i) + " states (currently on state " + state + ")");
        }
    }

    protected Item getStartItem(){
        return new Item(grammar.getStartRule(), 0, grammar.follow(grammar.symbolTable.__START__));
    }

    /** Compute all configurating sets */
    protected void generateConfiguratingSets(){
        System.out.println("Generating configurating sets...");

        configuratingSets = new TreeMap<>();

        successors = new TreeMap<>();
        
        ItemSet initialState = closure(getStartItem());
        configuratingSets.put(initialState, 0);
        successors.put(0, new TreeMap<>());

        Set<ItemSet> edge = new TreeSet<>(Collections.singletonList(initialState));

        boolean updated = true;
        while(updated){
            updated = false;

            Set<ItemSet> newEdge = new TreeSet<>();

            for(ItemSet configuratingSet : edge){
                int state1 = configuratingSets.get(configuratingSet);
                for(Symbol symbol : grammar.getAllSymbols()){
                    ItemSet successor = successor(configuratingSet, symbol);
                    if(successor.isEmpty()) continue;

                    if(addConfiguratingState(state1, symbol, successor)){
                        updated = true;
                        newEdge.add(successor);
                    }
                }
            }

            edge = newEdge;
        }
    }

    /** Tries to add a configurating set to the family of configurating sets and returns true if something was updated */
    protected boolean addConfiguratingState(int state, Symbol symbol, ItemSet successor){
        if(!configuratingSets.containsKey(successor)){
            int newState = configuratingSets.size();
            successors.put(newState, new TreeMap<>());
            configuratingSets.put(successor, newState);
            successors.get(state).put(symbol, newState);
            System.out.println("Found " + configuratingSets.size() + "th configurating set (" + successor.size() + " items)");
            return true;
        }
        else{
            successors.get(state).put(symbol, configuratingSets.get(successor));
            return false;
        }
    }

    /** Generates the action table entries for a state */
    protected void generateActionSetEntries(int state, ItemSet itemSet){
        for(Item item : itemSet){
            if(item.isFinished() && item.getRule().equals(grammar.getStartRule())){
                table.setActionAccept(state, grammar.symbolTable.__END__);
            }
            else if(item.isFinished()){
                generateReductions(state, item);
            }
            else{
                generateShifts(state, item);
            }
        }
    }

    /** Generate reduction entries given a state and an item */
    protected void generateReductions(int state, Item item){
        Rule reduce = item.getRule();
        for(Symbol symbol : item.getLookahead()){
            table.setActionReduce(state, symbol, reduce);
        }
    }

    /** Generate shift entries given a state and an item */
    protected void generateShifts(int state, Item item){
        Integer nextState = successors.get(state).get(item.next());
        if(nextState != null){
            table.setActionShift(state, item.next(), nextState);
        }
    }

    /** Generates the goto table entries for a state */
    protected void generateGotoSetEntries(int state, ItemSet itemSet){
        for(Symbol symbol : grammar.getNonTerminals()){
            Integer nextState = successors.get(state).get(symbol);
            if(nextState != null){
                table.setGoto(state, symbol, nextState);
            }
        }
    }

    /** Computes the closure of an item */
    protected abstract ItemSet closure(Item item);

    /** Computes the closure of an itemset */
    protected ItemSet closure(ItemSet itemSet){
        ItemSet res = itemSet.copy();
        for(Item item : itemSet) res.addAll(closure(item));
        return res;
    }

    /** Computes the successor set of an itemset */
    protected ItemSet successor(ItemSet itemSet, Symbol symbol){
        ItemSet res = new ItemSet();
        for(Item item : itemSet)
            if(!item.isFinished() && item.next().equals(symbol))
                res.add(item.shift());
        return closure(res);
    }

    /** Get the parsing table */
    public ParsingTable getTable(){
        return table;
    }
}