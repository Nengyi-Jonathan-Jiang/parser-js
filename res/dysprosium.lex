// Ignored

WHITESPACE := \s+
COMMENT := (//[^\n]*|/\*([^*]|\*[^/])*?\*?\*/)

// Literals

STRING-LITERAL := "([^"\\]|\\.)*"|'([^'\\]|\\.)*'
INT-LITERAL := (0|-?[123456789][\d]*)
FLOAT-LITERAL := ((0|-?[123456789]\d*)(\.\d*)?|\.\d+)
BOOL-LITERAL := (true|false)

// Module keywords

module
using
from
as
export

// Special types

void
null
int
float
char
bool

// Declarations

class
func
var
enum
mut
:
static
constructor

// Inheritance

interface
abstract
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

// Allocation

new
new*
new#

// Error handling
throw
try
catch

// Other

type
typedef
enum
implicit
export
for
friend
if
new
new#
new*
operator
public
protected
private
return
static
this
try
throw

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

<:
:>

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

#

IDENTIFIER := [\l_]\w*