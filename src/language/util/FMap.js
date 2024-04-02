// noinspection SpellCheckingInspection

/**
 * @implements {Map<K, V>}
 * @template T, K, V
 */
export class FMap {
    /** @type {Map<T, [K, V]>} */
    #map;

    /** @type {function(K):T} */
    #f;

    /**
     * @param {function(K): T} func
     * @param {Iterable<[K, V]>} [entries]
     */
    constructor(func, entries = []) {
        this.#f = func;
        this.#map = new Map(
            [...entries].map(([k, v]) => [func(k), [k, v]])
        );
    }

    [Symbol.toStringTag] = 'FMap'

    /** @type {number} */
    get size() {
        return this.#map.size;
    }

    /** @returns {IterableIterator<[K, V]>} */
    [Symbol.iterator]() {
        return this.#map.values()[Symbol.iterator]();
    }

    clear() {
        this.#map.clear();
    }

    /**
     * @param {K} key
     * @returns {boolean}
     */
    delete(key) {
        return this.#map.delete(this.#f(key));
    }

    /** @returns {IterableIterator<[K, V]>} */
    entries() {
        return this.#map.values();
    }

    /**
     * @param {function(key: K, value: V, map: FMap<T, K, V>) : void} callbackfn
     * @param {any} [thisArg]
     */
    forEach(callbackfn, thisArg) {
        [...this.#map.entries()].forEach(([k, v]) => {
            callbackfn.call(thisArg, k, v, this);
        });
    }

    /**
     * @param {K} key
     * @returns {V}
     */
    get(key) {
        return this.#map.get(this.#f(key))?.[1];
    }

    /** @param {K} key */
    has(key) {
        return this.#map.has(this.#f(key));
    }
    
    /** @returns {IterableIterator<K>} */
    keys() {
        return [...this.#map.values()].map(i => i[0])[Symbol.iterator]();
    }

    /**
     * @param {K} key
     * @param {V} value
     * @returns {this}
     */
    set(key, value) {
        this.#map.set(this.#f(key), [key, value]);
        return this;
    }

    /** @returns {IterableIterator<V>} */
    values() {
        return [...this.#map.values()].map(i => i[1])[Symbol.iterator]();
    }
}

/**
 * @implements {Set<V>}
 * @template T, V
 */
export class FSet {

    /** @type {Map<T, V>} */
    #map;

    /** @type {function(V):T} */
    #f;

    /**
     * @param {function(V): T} func
     * @param {Iterable<V>} [entries]
     */
    constructor(func, entries = []) {
        this.#f = func;
        this.#map = new Map(
            [...entries].map((V) => [func(V), V])
        );
    }

    [Symbol.toStringTag] = 'FSet'

    /** @type {number} */
    get size() {
        return this.#map.size;
    }

    /** @returns {IterableIterator<V>} */
    [Symbol.iterator]() {
        return this.#map.values()[Symbol.iterator]();
    }

    clear() {
        this.#map.clear();
    }

    add(value) {
        this.#map.set(this.#f(value), value);
    }
    
    /**
     * @param {V} value
     * @returns {boolean}
     */
    delete(value) {
        return this.#map.delete(this.#f(value));
    }

    /** @returns {IterableIterator<[V, V]>} */
    entries() {
        return this.#map.values();
    }

    /**
     * @param {function(value: V, value: V, set: FSet<T, V, V>) : void} callbackfn
     * @param {any} [thisArg]
     */
    forEach(callbackfn, thisArg) {
        [...this.#map.values()].forEach((v) => {
            callbackfn.call(thisArg, v, v, this);
        });
    }
    
    /** @param {V} value */
    has(value) {
        return this.#map.has(this.#f(value));
    }

    /** @returns {IterableIterator<V>} */
    keys() {
        return [...this.#map.values()].map(i => i[0])[Symbol.iterator]();
    }

    /** @returns {IterableIterator<V>} */
    values() {
        return [...this.#map.values()].map(i => i[1])[Symbol.iterator]();
    }
}

/**
 * @extends {FMap<string, K, V>}
 * @template K, V
 */
export class SMap extends FMap {
    /** @param {Iterable<[K,V]>} [entries] */
    constructor(entries=[]) {
        super(i => i.toString(), entries);
    }
}

/**
 * @extends {FSet<string, V>}
 * @template V
 */
export class SSet extends FSet {
    /** @param {Iterable<V>} [entries] */
    constructor(entries=[]) {
        super(i => i.toString(), entries);
    }
}