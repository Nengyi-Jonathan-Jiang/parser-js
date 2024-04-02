import {AbstractSyntaxTree} from "../language/common/AbstractSyntaxTree.js";
import {Symbol, Token} from "../language/common/common.js";

class FirstPassModuleInfo {
    /** @type {string} */
    #name;

    constructor(module_name) {
        this.#name = module_name;
    }
}

/** @param {AbstractSyntaxTree} parseTree */
export function dysprosiumAnalyzer(parseTree) {
    // Top level MUST be "program"
    console.assert(parseTree.type === Symbol.get('program'));

    /** @type {Map<string, Map<string, "var"|"func"|"class">>} */
    const first_pass_info = new Map;

    // Resolve exports (functions, variables, classes)
    for(let module of parseTree.children) {
        const [[,[...name_parts]],, [...statements]] = module.children;

        const module_name = name_parts.map(i => i.value).join('');
        const exports = statements.filter(i => i.type === Symbol.get('export-statement'));

        console.log(module_name, exports);
    }

    // Resolve types
}