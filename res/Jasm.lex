WHITESPACE := \s+
register := r[12345678]|sp|sb
text := "([^"\\]|\\.)*"
iconst := (0|-?[123456789][\d]*)i
fconst := ((0|-?[123456789]\d*)(\.\d+)?|\.\d+)f
label_name := [A-Z][A-Za-z0-9_]*
COMMENT := % [^\n]*

data

mov
f2i
i2f
lod
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

jmp
ucd
eqz
nez
gtz
ltz
gez
lez

dsp
inp
new
del
label
[
]
@
i
f
:
;

dump