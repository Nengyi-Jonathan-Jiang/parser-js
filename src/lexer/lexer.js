import {Token, Symbol} from "../common/common.js";

import Regex from "./regex/Regex.js";
import {compileToDFA} from "./fsm/NFAtoDFAConverter.js";
import {FSM_ERROR_STATE} from "./fsm/FiniteStateMachine.js";

const lex_rules = `
COMMENT := (//[^\\n]*|/\\*([^*]|\\*[^/])*?\\*?\\*/)
STRING-LITERAL := "([^"\\\\]|\\\\.)*"|'([^'\\\\]|\\\\.)*'
INT-LITERAL := (0|-?[123456789][\\d]*)
FLOAT-LITERAL := (0|-?[123456789][\\d]*)(.[\\d]+)?
BOOL-LITERAL := (true|false)

module
using
from
as

void

const

decl
impl
class
func
var

if
else
do
while
until
for
foreach
break
continue
nothing

return

goto

public
private
protected

static

println
print

input
inputln

read

new
dealloc
alloc
sizeof

as

inline

ref
mut

import 
export

[
]
(
)
{
}

;
,

.

...

~
~~
!
!!
++
--

=

@
+
+=
-
-=
%
%=
*
*=
/
/=
^
^=
^^
^^=
&
&=
&&
&&=
|
|=
||
||=

>
>=
<
<=
!=
==
<=>

>>
>>=
<<
<<=

::

?
:

->

IDENTIFIER := #?[\\l_]\\w*
`.trim().split(/\s*\n\s*/g).filter(i => !i.startsWith('//')).map(i => i.split(':=')).map(([a, b]) => {
    return {nfa: Regex.parse(
        b?.trim() ?? a.trim().replaceAll(/[()[+*?.\]]/g, '\\$&')
    ).compile(), symbol: Symbol.get(a.trim())}
});

const dfa = compileToDFA(...lex_rules);
window.dfa = dfa;

class Lexer {

    /**
     * @param {string} string
     * @returns {Token[]}
     */
    lex(string) {
        const lex = new Lex(dfa, string);

        /** @type {Token[]} */
        const res = [];

        while(true) {
            let next = lex.next();
            if(next.type === Symbol.__END__) break;
            res.push(next);
        }

        return res;
    }
}

window.Lexer = Lexer;

export class Lex {
    /** @type {DFA} */
    #dfa;

    /** @type {string} */
    #src;

    #position = 0;

    #done = false;

    /**
     * @param {DFA} dfa
     * @param {string} src
     */
    constructor (dfa, src) {
        this.#dfa = dfa;
        this.#src = src;
    }

    get done() {
        return this.#position === this.#src.length;
    }

    /** @returns {Token | null} */
    try_get_next() {
        if (this.done) {
            return new Token(Symbol.__END__, '', this.#position, this.#position);
        }

        /** @type {Symbol | null} */
        let accepted_symbol = null;
        let token_start = this.#position
        let token_end = this.#position;

        let curr_state = 0;

        while(curr_state !== FSM_ERROR_STATE && this.#position < this.#src.length) {
            const next_state = dfa.on(curr_state, this.#src[this.#position++]);

            if(dfa.acceptingStates.has(next_state)) {
                accepted_symbol = dfa.acceptingStates.get(next_state);
                token_end = this.#position;
            }

            curr_state = next_state;
        }

        if(accepted_symbol === null) {
            this.#position = token_start + 1;
            return null;
        }

        this.#position = token_end;

        return new Token(accepted_symbol, this.#src.substring(token_start, token_end), token_start, token_end);
    }

    /** @returns {Token} */
    next () {
        while (true) {
            const t = this.try_get_next();
            if (t !== null) return t;
        }
    }
}

const dysprosiumLexer = new Lexer();
export default dysprosiumLexer;