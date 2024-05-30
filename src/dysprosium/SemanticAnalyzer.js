import {AbstractSyntaxTree} from "../language/common/AbstractSyntaxTree.js";
import {JSymbol, Token} from "../language/common/common.js";

class FirstPassModuleInfo {
    /** @type {string} */
    #name;

    constructor(module_name) {
        this.#name = module_name;
    }
}

export class Entity {
    /** @type {string} */
    #fullName;
    /** @type {string} */
    #name;

    #id = 0;
    get nextID() { return Entity.#id; }

    constructor(fullName) {
        this.#fullName = fullName;
        this.#name = this.#fullName.split('.').pop();
    }
}

export class Type extends Entity {

}

/** @param {AbstractSyntaxTree} parseTree */
export function dysprosiumAnalyzer(parseTree) {
    // Top level MUST be "program"
    console.assert(parseTree.type === JSymbol.get('program'));

    /** @type {Map<string, Map<string, "var"|"func"|"class">>} */
    const first_pass_info = new Map;

    // Resolve exports (values, classes)
    for(let module of parseTree.children) {
        const [[,[...module_name_parts]],, [...statements]] = module.children;

        const module_name = module_name_parts.map(i => i.value).join('');
        const exports = statements.filter(i => i.type === JSymbol.get('export-statement')).map(i => i.children[1]).map(i => {
            let exportType, exportName;
            switch (i.type.name) {
                case "variable-declaration":
                case "variable-initialization":
                    break;
                case "basic-function-declaration":
                    break;
                case "class-declaration":
                case "interface-declaration":
                    break;
                case "abstract-class-declaration":
                    break;
            }
            return i;
        });

        console.log(module_name, exports);
    }

    // Resolve types
}