import {NFA} from "../fsm/FiniteStateMachine";
import {parseRegex} from "./RegexParser";

/**
 * A class representing the parse tree of a regular expression.
 * Can be compiled into an {@link NFA}
 * @abstract
 */
export class Regex {
    /**
     * Compiles the regex into an {@link NFA}
     * @abstract
     * @returns {NFA}
     */
    compile();

    static parse = parseRegex;
}

class LeafNode extends Regex {
    /** @type {Set<string>} */
    #acceptedCharacters;

    constructor(acceptedCharacters) {
        super();
        this.#acceptedCharacters = acceptedCharacters;
    }

    compile() {
        const result = new NFA;

    }
}

class ParentNode extends Regex {

}

class AlternationNode extends Regex {

}
class ConcatenationNode extends Regex {

}
class OptionalNode extends Regex {

}
class KleeneStarNode extends Regex {

}