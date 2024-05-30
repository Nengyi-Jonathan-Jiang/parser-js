export class JSymbol {
    /** @type {Map<string, JSymbol>} */
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
        this.#id = JSymbol.#nextID++;
    }

    /**
     * The name of the {@link JSymbol}
     * @type {string}
     */
    get name() {
        return this.#name
    }

    /**
     * A unique integer corresponding to the {@link JSymbol}
     * @type {number}
     */
    get id() {
        return this.#id;
    }

    /**
     * Get the {@link JSymbol} with the given name, or creates a new one if it does not exist
     * @param {string} name
     * @returns {JSymbol}
     */
    static get(name) {
        const map = this.#map;

        if(!map.has(name)) {
            map.set(name, new JSymbol(name));
        }
        return map.get(name);
    }

    /** @returns {string} */
    toString() {
        return this.#name;
    }

    static __EPSILON__ = JSymbol.get('\x01EPSILON\x01');
    static __START__ = JSymbol.get('\x01START\x01');
    static __EOF__ = JSymbol.get('\x01END\x01');
}