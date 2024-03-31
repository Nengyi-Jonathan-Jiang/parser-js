import {Symbol} from "../../common/Symbol.js";

/**
 * @implements {Iterable<Symbol>}
 * @extends {Set<Symbol>}
 */
export class SymbolSet extends Set {
    #dirty = true;
    #repr = '';

    #recomputeRepr() {
        this.#repr = [...this].map(i => i.id).toSorted().join(' ');
    }

    add(value) {
        this.#dirty ||= this.has(value);
        return super.add(value);
    }

    delete(value) {
        return this.#dirty ||= super.delete(value);
    }

    clear() {
        this.#dirty ||= (this.size > 0)
        super.clear();
    }

    toString() {
        if(this.#dirty) {
            this.#recomputeRepr();
            this.#dirty = false;
        }
        return this.#repr;
    }
}