import {Symbol} from "../../common/Symbol.js";

/**
 * @implements {Iterable<Symbol>}
 * @extends {Set<Symbol>}
 */
export class SymbolSet extends Set {
    #dirty = true;
    #repr = '';

    #recomputeRepr() {
        this.#repr = [...this].map(i => i.id).join(' ');
    }

    toString() {
        if(this.#dirty) {
            this.#recomputeRepr();
        }
        return this.#repr;
    }
}