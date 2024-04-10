export class Symbol {
    /** @type {Map<string, Symbol>} */
    static #map = new Map;
    /** @type {number} */
    static #nextID = 0;

    /** @type {string} */
    #name;
    /** @type {number} */
    #id;

    /** @private */
    constructor(name) {
        this.#name = name;
        this.#id = Symbol.#nextID++;
    }

    /**
     * The name of the {@link Symbol}
     * @type {string}
     */
    get name() {
        return this.#name
    }

    /**
     * A unique integer corresponding to the {@link Symbol}
     * @type {number}
     */
    get id() {
        return this.#id;
    }

    /**
     * Get the {@link Symbol} with the given name, or creates a new one if it does not exist
     * @param {string} name
     * @returns {Symbol}
     */
    static get(name) {
        const map = this.#map;

        if(!map.has(name)) {
            map.set(name, new Symbol(name));
        }
        return map.get(name);
    }

    toString() {
        switch(this) {
            case Symbol.__EPSILON__: return '__EPSILON__';
            case Symbol.__START__: return '__START__';
            case Symbol.__EOF__: return '__EOF__';
            default: return this.#name;
        }
    }

    static __EPSILON__ = Symbol.get('\x00');
    static __START__ = Symbol.get('\x01');
    static __EOF__ = Symbol.get('\x02');
}