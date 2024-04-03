WHITESPACE := \s+
register := r[12345678]|sp|sb
text := "([^"\\]|\\.)*"
iconst := (0|-?[123456789][\d]*)i
fconst := ((0|-?[123456789]\d*)(\.\d+)?|\.\d+)f

label_name := [A-Z][A-Za-z0-9_]*
COMMENT := % [^\n]*

data
dump

label
@
i
f
:
;

add
fadd
sub
fsub
mul
fmul
div
fdiv
mod
fmod
or
and
xor
shl
shr
dspc
dspi
dspf
mov
inpc
inpi
inpf
new
del
inc
dec
neg
fneg
not
lod

jmp

==0
>0
>=0
<0
<=0
!=0