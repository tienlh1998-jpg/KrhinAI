#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
# Pass a relocated MinGW toolchain via MINGW_ROOT, or use an installed one.
if [[ -n "${MINGW_ROOT:-}" ]]; then
  export PATH="$MINGW_ROOT/bin:$PATH"
fi
mkdir -p build
(cd src && x86_64-w64-mingw32-windres launcher.rc ../build/launcher.res.o)
x86_64-w64-mingw32-gcc-posix -std=c11 -O2 -Wall -Wextra -Werror -municode -static src/launcher.c build/launcher.res.o -o Krhin-AI.exe
