WHITESPACE := \s+
COMMENT := (//[^\n]*|/\*([^*]|\*[^/])*?\*?\*/)
STRING-LITERAL := "([^"\\]|\\.)*"|'([^'\\]|\\.)*'
INT-LITERAL := (0|-?[123456789][\d]*)
FLOAT-LITERAL := (0|-?[123456789][\d]*)(\.[\d]+)?
BOOL-LITERAL := (true|false)

module
using
from
as

constructor

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

var
const

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