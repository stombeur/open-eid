/'
 * Memory DLL loading code
 * Version 0.0.2
 *
 * Copyright (c) 2004-2005 by Joachim Bauch / mail@joachim-bauch.de
 * http://www.joachim-bauch.de
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is MemoryModule.h
 *
 * The Initial Developer of the Original Code is Joachim Bauch.
 *
 * Portions created by Joachim Bauch are Copyright (C) 2004-2005
 * Joachim Bauch. All Rights Reserved.
 *
 '/

#ifndef __MEMORY_MODULE_HEADER
#define __MEMORY_MODULE_HEADER

#inclib "MemoryModule"

#include once "windows.bi"

type HMEMORYMODULE as any ptr

extern "C"

declare function MemoryLoadLibrary(byval as const any ptr) as HMEMORYMODULE

declare function MemoryGetProcAddress(byval as HMEMORYMODULE, byval as const zstring ptr) as any ptr

declare sub MemoryFreeLibrary(byval as HMEMORYMODULE)

end extern

#endif  ' __MEMORY_MODULE_HEADER
