import {NFA} from "../fsm/FiniteStateMachine";
import {parseRegex} from "./RegexParser";

/**
 * A class representing the parse tree of a regular expression.
 * Can be compiled into an {@link NFA}
 * @abstract
 */
export default class Regex {
    /** @type {Regex[]} */
    #children;

    /** @param {Regex} children */
    constructor(...children) {
        this.#children = children;
    }

    get childNodes() {
        return this.#children;
    }

    /**
     * @param {Regex} child
     * @returns {Regex}
     */
    addChild(child) {
        this.#children.push(child);
        return this;
    }

    /** @type {NFA[]} */
    compileChildren() {
        return this.childNodes.map(i => i.compile());
    }

    /**
     * Compiles the regex into an {@link NFA}
     * @abstract
     * @returns {NFA}
     */
    compile() {}

    static parse = parseRegex;
}

export class LeafNode extends Regex {
    /** @type {Set<string>} */
    #acceptedCharacters;

    /** @param {Set<string>} acceptedCharacters */
    constructor(acceptedCharacters) {
        super();
        this.#acceptedCharacters = acceptedCharacters;
    }

    compile() {
        // Should return {0 ==[abc]=> 1}

        const result = new NFA;
        for(const char of this.#acceptedCharacters) {
            result.addTransition(NFA.INITIAL_STATE, char, NFA.FINAL_STATE);
        }
        return result;
    }
}

export class AlternationNode extends Regex {
    compile() {

        // {0 ==a=> 1} | {0 ==b=> 1} | {0 ==c=> 1} ... =
        // {0 ==ε=> [x ==a=> 1, y ==b=> 1, z ==c=> 1, ...]}

        const result = new NFA;
        for (let compiledChild of this.compileChildren()) {
            const newState = NFA.getNextUnusedState();

            result.mergeWith(compiledChild.remap(newState, NFA.FINAL_STATE))
                  .addTransition(NFA.INITIAL_STATE, NFA.EPSILON, newState);
        }
        return result;
    }
}

export class ConcatenationNode extends Regex {
    compile() {
        if(this.children.length === 0) {
            return NFA.trivialNFA;
        }

        // {0 ==a=> 1} & {0 ==b=> 1} & {0 ==c=> 1} ... =
        // {0 ==a=> x ==b=> y ==c=> ... 1}

        const [firstCompiledChild, ...otherCompiledChildren] = this.compileChildren();
        const result = firstCompiledChild;

        for(const childNFA of otherCompiledChildren) {
            const newState = NFA.getNextUnusedState();

            result.remap(NFA.INITIAL_STATE, newState)
                  .mergeWith(childNFA.remapped(newState, NFA.FINAL_STATE));
        }

        return result;
    }
}

export class OptionalNode extends Regex {
    /** @param {Regex} child */
    constructor(child) {
        super(child);
    }

    compile() {
        // {0 ==a=> 1}? =
        // {[0 ==a=> 1, 0 ==ε=> 1]}

        const [result] = this.compileChildren();

        return result.addEpsilonTransition(NFA.INITIAL_STATE, NFA.FINAL_STATE);
    }

    addChild(child) {
        throw new Error('Optional regex node can only have one child');
    }
}

export class KleeneStarNode extends Regex {
    /** @param {Regex} child */
    constructor(child) {
        super(child);
    }

    compile() {
        // {0 ==a=> 1}+ =
        // {[0 ==ε=> x ==ε=> [0, 1], 0 ==a=> x]}

        const [result] = this.compileChildren();
        const nextState = NFA.getNextUnusedState();

        return result.remap(NFA.INITIAL_STATE, nextState)
                     .addEpsilonTransition(NFA.INITIAL_STATE, nextState)
                     .addEpsilonTransition(nextState, NFA.INITIAL_STATE, NFA.FINAL_STATE);
    }

    addChild(child) {
        throw new Error('Kleene star regex node can only have one child');
    }
}