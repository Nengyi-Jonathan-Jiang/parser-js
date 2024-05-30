import {JSymbol} from './JSymbol.js';

export class Token {
    /** @type {JSymbol} */
    #type;
    
    /** @type {number} */
    #startIndex;
    /** @type {number} */
    #endIndex;
    
    /** @type {string} */
    #value;

    /** @type { Object }*/
    data = {};

    /**
     * @param {JSymbol} type The type of the token
     * @param {string} value The string contents of the token
     * @param {number} startIndex The start index of the token in the source string
     * @param {number} endIndex The end index of the token in the source string
     */
    constructor(type, value, startIndex, endIndex) {
        this.#type = type;
        this.#value = value;
        this.#startIndex = startIndex;
        this.#endIndex = endIndex;
    }

    /**
     * The type of the token
     * @type {JSymbol}
     */
    get type() {
        return this.#type;
    }
    
    /**
     * The start index of the token in the source string
     * @type {number}
     */
    get startIndex() {
        return this.#startIndex;
    }

    /**
     * The end index of the token in the source string
     * @type {number}
     */
    get endIndex() {
        return this.#endIndex;
    }
    
    /**
     * The string contents of the token
     * @type {string}
     */
    get value() {
        return this.#value;
    }
    
    toString() {
        const {type, value} = this;
        return (
            type === JSymbol.__START__ ? '__START__' :
            type === JSymbol.__EOF__ ? '__EOF___' :
            type === JSymbol.__EPSILON__ ? '__EPSILON__' :
            type.name === value
                ? type.name
                : `${type}<${value}>`
        );
    }
}