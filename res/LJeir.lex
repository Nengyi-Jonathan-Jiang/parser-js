WHITESPACE := \s+
COMMENT := %[^\n]*

uint := [123456789][\d]*u
constant := (0|-?[123456789][\d]*)i|((0|-?[123456789]\d*)(\.\d+)?|\.\d+)f|[\dABCDEF][\dABCDEF][\dABCDEF][\dABCDEF][\dABCDEF][\dABCDEF][\dABCDEF][\dABCDEF]h

func
param
const
call
push
write
(
)
{
}
,
;

operator := f?(add|sub|mul|div|mod|neg)|and|or|xor|not|sh[lr]|cpy|ret|dsp[cif]|inp[cif]|deref|new|del
name := \l\w*
