import {Symbol} from "../../common/Symbol.js";
import {Grammar} from "../grammar/Grammar.js";
import {ParsingTable} from "../lr_parser/ParsingTable.js";

import {Item} from "./item/Item.js";
import {ItemSet} from "./item/ItemSet.js";
import {SymbolSet} from "./SymbolSet.js";
import {FMap, SMap, SSet} from "../../util/FMap.js";

export class LRParseTableBuilderBase {
    /** @type {ParsingTable} */
    table;
    /** @type {Grammar} */
    grammar;
    /** @type {SMap<ItemSet, number>} */
    configuratingSets;
    /** @type {Map<number, ItemSet>} */
    states;

    /** @type {Map<number, Map<Symbol, number>>} */
    successors;

    /**
     * Generates an LR parse table given a {@link Grammar}
     * @param {Grammar} grammar the grammar to use
     */
    constructor(grammar){
        this.grammar = grammar;
        this.generateConfiguratingSets();
        this.generateParsingTable();

        const conflicts = this.table.conflicts;

        console.log(`${conflicts.length} conflicts`, conflicts);
        {
            /** @type {Set<Rule>} */
            let problematicRules = new Set();
            for(let x of conflicts){
                // Rules from reducing
                x.rule && problematicRules.add(x.rule);
                x.rule1 && problematicRules.add(x.rule1);
                x.rule2 && problematicRules.add(x.rule2);
                // Rules from shifting
                if(x.state) {
                    for(const item of this.states.get(x.state)) {
                        problematicRules.add(item.rule);
                    }
                }
            }
            if(problematicRules.size){
                console.log(`Problematic rules:\n    ${[...problematicRules].join('\n    ')}`);
            }

            let reduceReduceConflicts = new Set();
            for(let x of conflicts.filter(i => i.type === 'RR')){
                let rules = [x.rule1.toString(), x.rule2.toString()].sort();
                reduceReduceConflicts.add(`${rules[0]}\n    with\n    ${rules[1]}\n    `);
            }
            if(reduceReduceConflicts.size){
                console.log(`Reduce-reduce conflicts:\n    ${[...reduceReduceConflicts].join('\n    ')}`);
            }

            let shiftReduceConflicts = new Set();
            for(let x of conflicts.filter(i => i.type === 'SR')){
                const {state, rule} = x;
                shiftReduceConflicts.add(`${rule}\n    on ${this.states.get(state).toString().split('\n').join('\n    ')}\n    `);
            }
            if(shiftReduceConflicts.size){
                console.log(`Shift-reduce conflicts:\n    ${[...shiftReduceConflicts].join('\n    ')}`);
            }
        }
    }

    /** Generates the parsing table */
    generateParsingTable(){
        console.log("Generating parsing table entries...");

        this.table = new ParsingTable(this.configuratingSets.size);

        let i = 0;
        for(const [itemSet, state] of this.configuratingSets.entries()){
            // Generate Action table
            this.generateActionSetEntries(state, itemSet);

            // Generate Goto table
            this.generateGotoSetEntries(state);
        }
    }

    get startItem(){
        return new Item(this.grammar.startRule, 0, new SymbolSet(this.grammar.follow(Symbol.__START__)));
    }

    /** Compute all configurating sets */
    generateConfiguratingSets(){
        console.log("Generating configurating sets...");

        this.configuratingSets = new SMap;
        this.successors = new Map;
        this.states = new Map;

        const initialState = this.itemClosure(this.startItem);

        this.configuratingSets.set(initialState, 0);
        this.successors.set(0, new Map);
        this.states.set(0, initialState);

        /** @type {SSet<ItemSet>} */
        let edge = new SSet([initialState]);

        let updated = true;
        while(updated){
            updated = false;

            /** @type {SSet<ItemSet>} */
            const newEdge = new SSet;

            for(const configuratingSet of edge){
                const state1 = this.configuratingSets.get(configuratingSet);
                for(const symbol of this.grammar.allSymbols){
                    const successor = this.successor(configuratingSet, symbol);
                    if(successor.size === 0) continue;

                    if(this.addConfiguratingState(state1, symbol, successor)){
                        updated = true;
                        newEdge.add(successor);
                    }
                }
            }

            edge = newEdge;
        }
    }

    /**
     * Tries to add a configurating set to the family of configurating sets and returns true if something was updated
     * @param {number} state
     * @param {Symbol} symbol
     * @param {ItemSet} successor
     */
    addConfiguratingState(state, symbol, successor){
        if(!this.configuratingSets.has(successor)){
            const newState = this.configuratingSets.size;
            this.successors.set(newState, new Map);
            this.configuratingSets.set(successor, newState);
            this.states.set(newState, successor);
            this.successors.get(state).set(symbol, newState);
            console.log(`Found ${this.configuratingSets.size}th configurating set (${successor.size} items)`);
            return true;
        }
        else{
            this.successors.get(state).set(symbol, this.configuratingSets.get(successor));

            return false;
        }
    }

    /**
     * Generates the action table entries for a state
     * @param {number} state
     * @param {ItemSet} itemSet
     */
    generateActionSetEntries(state, itemSet){
        for(/** @type {Item} */ const item of itemSet){
            if(item.isFinished && item.rule.toString() === this.grammar.startRule.toString()){
                this.table.setActionAccept(state, Symbol.__EOF__);
            }
            else if(item.isFinished){
                this.generateReductions(state, item);
            }
            else{
                this.generateShifts(state, item);
            }
        }
    }

    /**
     * Generate reduction entries given a state and an item
     * @param {number} state
     * @param {Item} item
     */
    generateReductions(state, item){
        const reduce = item.rule;
        for(const symbol of item.lookahead){
            this.table.setActionReduce(state, symbol, reduce);
        }
    }

    /**
     * Generate shift entries given a state and an item
     * @param {number} state
     * @param {Item} item
     */
    generateShifts(state, item){
        const nextState = this.successors.get(state).get(item.next);
        if(nextState !== undefined){
            this.table.setActionShift(state, item.next, nextState);
        }
    }

    /**
     * Generates the goto table entries for a state
     * @param {number} state
     */
    generateGotoSetEntries(state){
        for(const symbol of this.grammar.nonTerminals){
            const nextState = this.successors.get(state).get(symbol);
            if(nextState !== undefined){
                this.table.setGoto(state, symbol, nextState);
            }
        }
    }

    /**
     * Computes the closure of an item
     * @abstract
     * @param {Item} item
     * @returns {ItemSet}
     */
    itemClosure(item){}

    /**
     * Computes the closure of an itemset
     * @param {ItemSet} itemSet
     * @returns {ItemSet}
     */
    closure(itemSet){
        const merged = itemSet.copy();
        for(/** @type {Item} */ const item of itemSet)
            for(/** @type {Item} */ const i of this.itemClosure(item))
                merged.add(i);

        // Collapse itemSet to merge similar items

        /** @type {SMap<ItemCore, SymbolSet>} */
        const lookaheads = new SMap();
        for(/** @type {Item} */ const item of merged) {
            if (!lookaheads.has(item.core)) {
                lookaheads.set(item.core, new SymbolSet);
            }

            for (/** @type {Symbol} */ const s of item.lookahead) {
                lookaheads.get(item.core).add(s);
            }
        }

        const res = new ItemSet();
        for(const [/** @type {ItemCore} */ core, /** @type {SymbolSet} */ lookahead] of lookaheads) {
            res.add(new Item(core.rule, core.pos, lookahead));
        }

        res.lock();

        return res;
    }

    /**
     * Computes the successor set of an itemset
     */
    successor(itemSet, symbol){
        const res = new ItemSet;
        for(/** @type {Item} */ const item of itemSet)
            if(!item.isFinished && item.next === symbol)
                res.add(item.shift);
        return this.closure(res);
    }
}