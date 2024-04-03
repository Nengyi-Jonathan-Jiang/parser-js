WHITESPACE := \s+
register := r[12345678]|sp|sb|ip
text := "([^"\\]|\\.)*"
iconst := (0|-?[123456789][\d]*)i
fconst := ((0|-?[123456789]\d*)(\.\d+)?|\.\d+)f
label_name := [A-Z][A-Za-z0-9_]*
COMMENT := % [^\n]*

data

@
:
;

// Print memory contents
dump

// Mov is special
mov

// f2i and i2f are special
f2i
i2f

// lod is special
lod

// dsp and inp are special
dsp
inp

// new and del are special
new
del

// Normal operations (15 of them)
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