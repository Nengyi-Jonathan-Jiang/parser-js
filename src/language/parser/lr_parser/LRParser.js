import {Token, AbstractSyntaxTree} from "../../common/common.js";

import {ParsingTable, ShiftEntry, ReduceEntry, AcceptEntry} from "./ParsingTable.js";

/** A table-driven parser implementing the LR parsing algorithm. Parses input in O(N) time */
export class LRParser {
    /** @type {ParsingTable} */
    #table;

    /**
     * Makes a parser given a {@link ParsingTable}
     * @param {ParsingTable} table the parsing table to use
     */
    constructor(table) {
        this.#table = table;
    }

    /** @type {ParsingTable} */
    get table() {
        return this.#table;
    }

    /**
     * Parses a string of tokens
     * @param {Iterable<Token>} tokens A string of tokens to be parsed
     * @return {AbstractSyntaxTree} The parse tree if the tokens were parsed successfully, otherwise null
     */
    parseTokens(tokens) {
        /** @type {LRParse}*/
        const p = this.startParse();
        for (const token of tokens) {
            p.process(token);
        }
        if(!p.isFinished) {
            throw new Error('Invalid parse');
        }
        return p.result;
    }

    startParse() {
        return new LRParse(this.#table);
    }
}


export class LRParse {
    #stateStack = [0];

    /** @type {(Token | AbstractSyntaxTree)[]} */
    #parseTreeNodeStack = [];

    /** @type {ParsingTable} */
    #table;

    #finished = false;

    /** @param {ParsingTable} table */
    constructor(table) {
        this.#table = table;
    }

    /** @type {Token | AbstractSyntaxTree} */
    get result() {
        return this.#parseTreeNodeStack[0];
    }
    
    /** @type {boolean} */
    get isFinished() {
        return this.#finished;
    }

    /** @param {Token} token */
    process(token) {
        while (true) {
            //noinspection DataFlowIssue
            const state = this.#stateStack[this.#stateStack.length - 1];

            const entry = this.#table.getAction(state, token.type);

            // LRParse failed
            if (entry == null) {
                throw new Error(`Parse failed: expected one of ${[...this.#table.acceptableSymbolsAtState(state)].join(', ')}, instead got ${token}`);
            }

            if (entry instanceof ShiftEntry) {
                this.#stateStack.push(entry.nextState);
                this.#parseTreeNodeStack.push(token);
                return;
            } else if (entry instanceof AcceptEntry) {
                this.#finished = true;
                return;
            } else if (entry instanceof ReduceEntry) {
                const reduceRule = entry.rule;
                const lhs = reduceRule.lhs;
                // Update state stack
                for (let j = 0; j < reduceRule.rhs.size; j++) {
                    this.#stateStack.pop();
                }

                const gotoEntry = this.#table.getGoto(this.#stateStack[this.#stateStack.length - 1], lhs);
                this.#stateStack.push(gotoEntry.nextState);

                // Unwrap node if allowed to simplify the parse tree
                if (reduceRule.rhs.size === 1 && reduceRule.unwrap) continue;

                // Handle chained nodes
                /** @type {AbstractSyntaxTree[]} */
                const children = new Array(reduceRule.rhs.size);
                for (let j = reduceRule.rhs.size - 1; j >= 0; j--)
                    children[j] = this.#parseTreeNodeStack.pop();

                if (reduceRule.chained) {
                    const reducer = children[0];
                    if (reducer.type === lhs) {
                        const joinedChildren = [...reducer.children, ...children.toSpliced(0, 1)];
                        this.#parseTreeNodeStack.push(new AbstractSyntaxTree(lhs, ...joinedChildren));
                        continue;
                    }
                }

                this.#parseTreeNodeStack.push(new AbstractSyntaxTree(lhs, ...children));
            } else {
                throw new Error('Something went wrong :(');
            }
        }
    }
}