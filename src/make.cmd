@echo off
cd win
..\..\tools\bin\win32\gorc open-eid.rc
..\..\tools\fbc -s gui open-eid.bas open-eid.res
del open-eid.res

copy /b open-eid.exe+Swelio32.sign+..\..\tools\Swelio32.dll ..\..\release\Open-eID.exe

del open-eid.exe 
pause