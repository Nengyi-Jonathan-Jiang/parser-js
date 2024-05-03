// Ignored

WHITESPACE := \s+
COMMENT := (//[^\n]*|/\*([^*]|\*[^/])*?\*?\*/)

// Literals

STRING-LITERAL := "([^"\\]|\\.)*"
CHAR-LITERAL := '[^'\\]|\\.'
INT-LITERAL := (0|-?[123456789][\d]*)
FLOAT-LITERAL := ((0|-?[123456789]\d*)(\.\d*)?|\.\d+)
BOOL-LITERAL := (true|false)

// Module keywords

module
using
from
export

// Types

typedef
void
null
builtin-type := int|float|char|bool
as

// Declarations

class
func
let
enum
mut
expression
:
static
operator
constructor
this

// Inheritance

interface
abstract
virtual
override
extends
implement

// Access level

public
private
protected

// Control

if
else
do
while
for
foreach
break
continue
return

// I/O

print
input

// New

new
new*
new$

// Error handling

throw
try
catch

// Symbols

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

$
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

::

?
:

->

#

IDENTIFIER := [\l_]\w*