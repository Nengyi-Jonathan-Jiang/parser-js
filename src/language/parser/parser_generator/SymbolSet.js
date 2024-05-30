import {JSymbol} from "../../common/JSymbol.js";

/**
 * @implements {Iterable<JSymbol>}
 * @extends {Set<JSymbol>}
 */
export class SymbolSet extends Set {
    dirty = true;
    #repr = '';

    /** @param {Iterable<JSymbol>|null} [values] */
    constructor(values=null) {
        super(values);
    }

    #recomputeRepr() {
        this.#repr = [...this].map(i => i.id).toSorted().join(' ');
    }

    add(value) {
        this.dirty ||= this.has(value);
        return super.add(value);
    }

    delete(value) {
        return this.dirty ||= super.delete(value);
    }

    clear() {
        this.dirty ||= (this.size > 0)
        super.clear();
    }

    toString() {
        if(this.dirty) {
            this.#recomputeRepr();
            this.dirty = false;
        }
        return this.#repr;
    }
}