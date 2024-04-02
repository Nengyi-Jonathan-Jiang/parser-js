import {Item} from "./Item.js";
import {SSet} from "../../../util/FMap.js";

/**
 * @extends SSet<Item>
 */
export class ItemSet extends SSet {
    #repr = '';

    constructor(...items) {
        super(items);
    }

    lock() {
        this.#repr += '{';

        for(const it of this){
            this.#repr += `\n\t${it}`;
        }
        this.#repr += "\n}";
    }

    toString(){
        return this.#repr;
    }

    copy(){
        return new ItemSet(...this);
    }
}