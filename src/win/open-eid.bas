#include "windows.bi"
#include "MemoryModule.bi"
#include "registry.bas"

Dim Shared isnative As Boolean
Dim Shared args As String
Dim Shared Browser As String
Dim Shared BrowserName As String
Dim Shared url As String

'Get browser path
Dim hWnd As HWND
Dim WindowTextLength As Integer
Dim WindowText As String
Dim PID As Long
Dim BrowserLen As Long
Dim hProcess As Long

Declare Function GetModuleFileNameEx Lib "PSAPI.DLL" Alias "GetModuleFileNameExA" (ByVal hProcess As Long, ByVal hModule As Long, ByVal ModuleName As ZString Ptr, ByVal nSize As Long) As Long

hWnd = GetForegroundWindow
WindowTextLength = GetWindowTextLength(hWnd)
WindowText = Space(WindowTextLength)
GetWindowText hWnd, StrPtr(WindowText), WindowTextLength + 1
GetWindowThreadProcessId(hWnd, @PID)
Browser = Space(4096)
hProcess = OpenProcess(1040, 0, PID)
BrowserLen = GetModuleFileNameEx(hProcess, 0, StrPtr(Browser), 4096)
CloseHandle(@hProcess)
Browser = Left(Browser, BrowserLen)
BrowserName = WindowText

'Load Swelio32 dll from executable
dim Swelio_IsEngineActive as function cdecl () As Boolean
dim Swelio_StartEngine as function cdecl () As Boolean
dim Swelio_StopEngine as function cdecl () As Boolean
dim Swelio_IsCardPresent as function cdecl () As Boolean
dim Swelio_SaveCardToXml as function cdecl (ByVal filename As ZString Ptr) As Boolean
dim Swelio_SavePhotoAsJpeg as function cdecl (ByVal filename As ZString Ptr) As Boolean
dim Swelio_FileDelete as function cdecl (ByVal filename As ZString Ptr) As Boolean
dim Swelio_SetMWCompatibility as function cdecl () As Boolean

const swelio32dll_sign = "__swelio32dll__"

dim as byte ptr         EXEDATA
dim as byte ptr         DLLDATA 
dim as HMEMORYMODULE    swelio32dll
 
Dim fl As Integer

open command(0) for binary as #1
fl = LOF(1)
EXEDATA = allocate(fl)
if get (#1,, *EXEDATA, fl) then
    Error 9999
    end
end if
close #1

Type tStrDescr
  txtPtr As UByte Ptr
  txtLen As UInteger
  txtMem As UInteger
End Type

Dim As String dummyString
Dim As tStrDescr Ptr dummyStringPtr = Cast(tStrDescr Ptr,@dummyString) 'make the string descriptor of 'dummyString' accessable
dummyStringPtr -> txtPtr = Cast(UByte Ptr,EXEDATA) 'set the text pointer of 'dummyString' to the array
dummyStringPtr -> txtLen = Cast(UInteger, fl) + 1

Dim dllpos As Integer
dllpos = instr(dummyString, UCase(swelio32dll_sign)) 'Trick to ignore this line
'Print "DLL signature is @" & dllpos
If dllpos = 0 Then
  Error 9999
  end
End If
dllpos = dllpos + len(swelio32dll_sign)
'Print "DLL is @ " & dllpos

open command(0) for binary as #1
fl = LOF(fl) - dllpos + fl
'Print "DLL size is " & fl
DLLDATA = allocate(fl)
if get (#1, dllpos, *DLLDATA, fl) then
    Error 9999
    end
end if
close #1    

swelio32dll = MemoryLoadLibrary(DLLDATA)

if swelio32dll then
    'print "Library load successful.."
    Swelio_IsEngineActive = MemoryGetProcAddress(swelio32dll, "IsEngineActive")
    Swelio_StartEngine = MemoryGetProcAddress(swelio32dll, "StartEngine")
    Swelio_StopEngine = MemoryGetProcAddress(swelio32dll, "StopEngine")
    Swelio_IsCardPresent = MemoryGetProcAddress(swelio32dll, "IsCardPresent")
    Swelio_SaveCardToXml = MemoryGetProcAddress(swelio32dll, "SaveCardToXmlA")
    Swelio_SavePhotoAsJpeg = MemoryGetProcAddress(swelio32dll, "SavePhotoAsJpegA")
    Swelio_FileDelete = MemoryGetProcAddress(swelio32dll, "FileDeleteA")
    Swelio_SetMWCompatibility = MemoryGetProcAddress(swelio32dll, "SetMWCompatibility")      
End If

'Read card
Dim engine As Boolean
Dim tmp As String
Dim photo As String
Dim errmsg As String
Dim msg As String
Dim f As Integer
Dim l As String
Dim xml As String

FUNCTION URLEncode(sStringToEncode AS STRING, bUsePlus AS BYTE = 0) AS STRING
    DIM sNewString AS STRING, bChar AS UBYTE
    FOR i AS INTEGER = 1 TO LEN(sStringToEncode)
        bChar = sStringToEncode[i - 1]
        SELECT CASE bChar
            CASE 48 TO 57, 65 TO 90, 97 TO 122
                sNewString &= CHR(bChar)
            CASE 32
                sNewString &= *IIF(bUsePlus, @"+", @"%20")
            CASE ELSE
                sNewString &= "%" & *IIF(bChar < 16, @"0", @"") & HEX(bChar)
        END SELECT
    NEXT

    RETURN sNewString
END FUNCTION

Function XmlToJSON(xml As String) As String
  Dim oldxml As String
  Dim tagopen As Integer
  Dim tagclose As Integer
  Dim tag As String
  Dim opt As String
  Dim optname As String
  Dim optval As String
  Dim sp As Integer 'Space
  Dim eq As Integer 'Equal
  Dim qopen As Integer 'Quote open
  Dim qclose As Integer 'Quote close
  Dim elemclose As Integer
  Dim value As String
  Dim json As String
  Dim json2 As String
  
  json = ""
  tagopen = InStr(xml, "<")
  While tagopen > 0
    tagclose = InStr(tagopen + 1, xml, ">")
    If tagclose > tagopen Then
      tag = Trim(Mid(xml, tagopen + 1, tagclose - tagopen - 1))
      sp = InStr(tag, " ")
      eq = 0
      If sp > 0 Then 
        opt = Trim(Mid(tag, sp + 1))
        eq = InStr(opt, "=")
        tag = Mid(tag, 1, sp - 1)
      End If
      While eq > 0
        optname = Left(opt, eq - 1)
        qopen = InStr(eq + 1, opt, Chr(34))
        If qopen > eq Then
          qclose = InStr(qopen + 1, opt, Chr(34))
          If qclose > qopen Then
            optval = Mid(opt, qopen + 1, qclose - qopen - 1)
            If optname <> "" And InStr(optname, Chr(34)) = 0 And InStr(optval, Chr(34)) = 0 And InStr(optname, "<") = 0 And InStr(optval, "<") = 0 Then 'Bug?
              If json <> "" Then json = json & ", "
              json = json & Chr(34) & optname & Chr(34) & ": " & Chr(34) & URLEncode(optval) & Chr(34)
            End If
            opt = Trim(Mid(opt, qclose + 1))
          Else
            opt = Trim(Mid(opt, qopen + 1))
          End If
        Else
          opt = Trim(Mid(opt, eq + 1))
        End If
        eq = InStr(opt, "=")          
      Wend
      'todo get arguments
      elemclose = InStr(tagclose, xml, "</" & tag & ">")
      value = ""
      oldxml = xml
      If elemclose > 0 Then
        value = Mid(oldxml, tagclose + 1, elemclose - tagclose - 1)
        If InStr(value, "<") = 0 Then
          xml = Mid(oldxml, 1, tagopen - 1) & Mid(oldxml, elemclose + len(tag) + 3)            
          'Print "--- Value tag --- " & tag & " = " & value
          'Print xml
        Else
          xml = Mid(oldxml, 1, tagopen - 1) & Mid(oldxml, tagclose + 1, elemclose - 1) & Mid(oldxml, elemclose + len(tag) + 3)
          'Print "--- Not a value tag --- " & tag
          'Print xml
          tag = ""
          value = ""
        End If
      Else
        xml = Mid(oldxml, 1, tagopen - 1) & Mid(oldxml, tagclose + 1)            
        'Print "--- Not element closing --- " & tag
        'Print xml
        If Left(tag, 1) = "/" Then 'Ignore
          tag = ""
          value = ""
        End If
      End If
      If tag <> "" And InStr(json, Chr(34) & tag & Chr(34) & ": ") = 0 And Len(value) <= 255 Then
        If json <> "" Then json = json & ", "
        json = json & Chr(34) & tag & Chr(34) & ": " & Chr(34) & URLEncode(value) & Chr(34)
      End If
    Else
      Goto ReturnJSON:
    End If
    tagopen = InStr(xml, "<")
  Wend  
ReturnJSON:
  XmlToJSON = json
End Function

function Replace(byref txt as string, byref fnd as string, byref rep as string) as string
    
    dim as string txt2 = txt
    dim as integer fndlen = len(fnd), replen = len(rep)
    
    dim as integer i = instr(txt2, fnd)
    
    while i
        
        txt2 = left(txt2, i - 1) & rep & mid(txt2, i + fndlen)
        i = instr(i + replen, txt2, fnd)
        
    wend
    
    return txt2
    
end function

Sub Native(json As String) 
  If isnative Then
    Dim stdout As Integer
    Dim jsonlen As Long
    Dim data0 As Integer
    Dim data1 As Integer
    Dim data2 As Integer
    Dim data3 As Integer
    jsonlen = Len(json)
    data0 = jsonlen And &hff
    data1 = (jsonlen shr 8) And &hff
    data2 = (jsonlen shr 16) And &hff
    data3 = (jsonlen shr 24) And &hff
    stdout = FreeFile
    Open Cons For Output As #stdout
    Print #stdout, Chr(data0) & Chr(data1) & Chr(data2) & Chr(data3) & json,
    Close stdout
    'stdout = FreeFile
    'Open "C:\Temp\Test.log" For Output As #stdout
    'Print #stdout, Chr(data0) & Chr(data1) & Chr(data2) & Chr(data3) & json,
    'Close stdout    
  Else   
    'Dim stdout As Integer
    'stdout = FreeFile
    'Open "C:\Temp\Test.log" For Output As #stdout
    'Print #stdout, BrowserName,
    'Close stdout  
    url = Chr(34) & url
    If Browser = "" Then
      Browser = "cmd.exe"
      url = "/c start " & url
    End If
    If BrowserName = "Google%20Chrome%20App" Then url = "--args --app=" & url
    If InStr(UCase(Browser), "APPLICATIONFRAMEHOST.EXE") And InStr(UCase(BrowserName), "MICROSOFT EDGE") Then 'Edge ?
      Browser = "cmd.exe"
      url = "/c start microsoft-edge:" & url
    End If
    Exec(Browser, url & "#" & URLEncode(json) & Chr(34))
  End If
End Sub

On Error Goto OnError

'Write registry (protocol)

WriteRegistry (HKEY_CURRENT_USER, "Software\Classes\open-eid", "", ValString, "URL:open-eid")
WriteRegistry (HKEY_CURRENT_USER, "Software\Classes\open-eid", "URL Protocol", ValString, "")
WriteRegistry (HKEY_CURRENT_USER, "Software\Classes\open-eid\DefaultIcon", "", ValString, Chr(34) & command(0) & Chr(34))
WriteRegistry (HKEY_CURRENT_USER, "Software\Classes\open-eid\shell", "", ValString, "open")
WriteRegistry (HKEY_CURRENT_USER, "Software\Classes\open-eid\shell\open\command", "", ValString, Chr(34) & command(0) & Chr(34) & " ""%1"" ""%2"" ""%3"" ""%4"" ""%5"" ""%6"" ""%7"" ""%8"" ""%9""")

'TODO write json file + extension association
Dim nativehost As String
Dim hf As Integer

nativehost = Environ("USERPROFILE") & "\io.github.michael79bxl.open_eid.json"
hf = FreeFile
Open nativehost For Output As #hf
Print #hf, "{"
Print #hf, """name"": ""io.github.michael79bxl.open_eid"","
Print #hf, """description"": ""Open-eID"","
Print #hf, """path"": """ & Replace(command(0), "\", "\\") & ""","
Print #hf, """type"": ""stdio"","
Print #hf, """allowed_origins"": ["
Print #hf, """chrome-extension://elkdefnldphjoeafcphbiknjfdhjnngm/"","
Print #hf, """chrome-extension://ceojkhlgadejfjbmikopnodckmhcbnke/"","
Print #hf, """chrome-extension://cgdhcnihnfegipidedmkijjkbphakcjo/"""
Print #hf, "],"
Print #hf, """allowed_extensions"": ["
Print #hf, """firefox@open-eid.eu.org"""
Print #hf, "]"
Print #hf, "}"
Close hf
WriteRegistry (HKEY_CURRENT_USER, "Software\Google\Chrome\NativeMessagingHosts\io.github.michael79bxl.open_eid", "", ValString, nativehost)
WriteRegistry (HKEY_CURRENT_USER, "Software\Mozilla\NativeMessagingHosts\io.github.michael79bxl.open_eid", "", ValString, nativehost)

'Read arguments
Dim As Integer i = 1
Do
    Dim As String arg = Command(i)
    If Len(arg) = 0 Then
        Exit Do
    End If

    args = Trim(args) & Trim(arg)
    i += 1
Loop

'TODO read stdin => native messaging 4bytes len + JSON
#include "crt.bi"
const BLOCKSIZE = 1024 * 1024 'max 1 Mo

dim block as string = space(BLOCKSIZE)
dim content as string
dim readlen as integer

_setmode(_fileno(stdin), _O_BINARY)

do
  readlen = fread(@block[0], 1, 4, stdin)
  if readlen = 0 then exit do
  readlen = asc(mid(block, 1, 1))
  readlen = readlen + (asc(mid(block, 2, 1)) * 256)
  readlen = readlen + (asc(mid(block, 3, 1)) * 256 * 256)
  readlen = readlen + (asc(mid(block, 4, 1)) * 256 * 256 * 256)
  readlen = fread(@block[0], 1, readlen, stdin)
  content &= left(block, readlen)
  exit do
loop

isnative = False
content = Replace(Replace(content, "{""url"":""", ""), """}", "")
If content <> "" Then
  args = content
  isnative = True
End If

'TODO check the url scheme
If Left(args, InStr(args, ":") + 1) = "" Then
  MessageBox(0, "Open-eID is properly installed and can be used in apps and websites.", "Open-eID", MB_OK OR MB_ICONINFORMATION OR MB_DEFBUTTON1 OR MB_SYSTEMMODAL)
  End
End If

url = Mid(args, InStr(args, ":") + 1)
If InStr(url, "#") Then 
  BrowserName = Mid(url, InStr(url, "#") + 1)
  url = Left(url, InStr(url, "#") - 1)
End If
If MessageBox(0, url & " wants to access your eID card content. Do you agree?", "eID", MB_YESNO OR MB_ICONQUESTION OR MB_DEFBUTTON2 OR MB_SYSTEMMODAL) <> IDYES Then End

tmp = Environ("USERPROFILE") & "\eID.xml"
Swelio_FileDelete(StrPtr(tmp))

'photo = Environ("USERPROFILE") & "\eID.jpg"
'Swelio_FileDelete(StrPtr(photo))

engine = Swelio_IsEngineActive()
If engine = False Then engine = Swelio_StartEngine()
If engine = False Then
  Swelio_SetMWCompatibility()
  engine = Swelio_IsEngineActive()
  If engine = False Then engine = Swelio_StartEngine()
End If
If engine Then
  If Swelio_IsCardPresent() Then
    tmp = Environ("USERPROFILE") & "\eID.xml"
    If Swelio_SaveCardToXml(StrPtr(tmp)) Then
      f = FreeFile
      Open tmp For Input As #f
      While Not Eof(f)
        Line Input #f, l
        xml = xml & Trim(l)
      Wend
      Close f
      Swelio_FileDelete(StrPtr(tmp))
      'Swelio_FileDelete(StrPtr(photo))
      'Print "{" & XmlToJSON(xml) & "}"
      Native("{" & XmlToJSON(xml) & "}")
      'Call swelio_SavePhotoAsJpeg(StrPtr(photo))
      Goto Done:
    Else
      Error 9992
      Goto Done:
    End If
  Else
    Error 9991
    Goto Done:
  End If
  Error 9991
Done:  
  Swelio_StopEngine()
	engine = False
TheEnd:
  End
Else
  Error 9990
  End
End If
End

OnError:
errmsg = "Unknow error"
If Err = 9999 Then errmsg = "Error loading library(" & Erl & ")"
If Err = 9992 Then errmsg = "Could not extract card data. Please verify that the card is valid and propertly inserted into the smartcard reader and (homedir)/eID.xml is writable."
If Err = 9991 Then errmsg = "No card detected. Please verify that the card is valid and propertly inserted into the smartcard reader."
If Err = 9990 Then errmsg = "No engine detected. Please verify that the middleware and drivers are installed."
msg = "{""err"":""" & errmsg & """, ""code"": """ & Err & """}"
Native(msg)
End

