#include "windows.bi"
'#inclib "Swelio32"
#include "MemoryModule.bi"


'Declare Function Swelio_IsEngineActive Lib "Swelio32" Alias "IsEngineActive" () As Boolean
'Declare Function Swelio_StartEngine Lib "Swelio32" Alias "StartEngine" () As Boolean
'Declare Sub Swelio_StopEngine Lib "Swelio32" Alias "StopEngine" ()
'Declare Function Swelio_IsCardPresent Lib "Swelio32" Alias "IsCardPresent" () As Boolean
'Declare Function Swelio_SaveCardToXml Lib "Swelio32" Alias "SaveCardToXmlA" (ByVal filename As ZString Ptr) As Boolean
'Declare Function Swelio_SavePhotoAsJpeg Lib "Swelio32" Alias "SavePhotoAsJpegA" (ByVal filename As ZString Ptr) As Boolean
'Declare Sub Swelio_FileDelete Lib "Swelio32" Alias "FileDeleteA" (ByVal filename As ZString Ptr)
'Declare Sub Swelio_SetMWCompatibility Lib "Swelio32" Alias "SetMWCompatibility" ()

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
    print "Error reading executable file to memory."
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
  print "Error reading library file to memory."
  end
End If
dllpos = dllpos + len(swelio32dll_sign)
'Print "DLL is @ " & dllpos

open command(0) for binary as #1
fl = LOF(fl) - dllpos + fl
'Print "DLL size is " & fl
DLLDATA = allocate(fl)
if get (#1, dllpos, *DLLDATA, fl) then
    print "Error reading executable file to memory."
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

'TODO native messaging 4bytes len + JSON

On Error Goto OnError

Dim args As String
Dim As Integer i = 1
Do
    Dim As String arg = Command(i)
    If Len(arg) = 0 Then
        Exit Do
    End If

    args = Trim(args) & Trim(arg)
    i += 1
Loop

If Mid(args, 15) = "" Then End

If MessageBox(0, Mid(args, 15) & " wants to access your eID card content. Do you agree?", "eID", MB_YESNO OR MB_ICONQUESTION OR MB_DEFBUTTON2 OR MB_SYSTEMMODAL) <> IDYES Then End

tmp = Environ("USERPROFILE") & "\eID.xml"
Swelio_FileDelete(StrPtr(tmp))

photo = Environ("USERPROFILE") & "\eID.jpg"
Swelio_FileDelete(StrPtr(photo))

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
      'Print "{" & XmlToJSON(xml) & "}"
      Shell "start " & Mid(args, 15) & "#" & URLEncode("{" & XmlToJSON(xml) & "}")
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
If Err = 9992 Then errmsg = "Could not extract card data. Please verify that the card is valid and propertly inserted into the smartcard reader and (homedir)/eID.xml is writable."
If Err = 9991 Then errmsg = "No card detected. Please verify that the card is valid and propertly inserted into the smartcard reader."
If Err = 9990 Then errmsg = "No engine detected. Please verify that the middleware and drivers are installed."
msg = "{""err"":""Error #" & Err & " - " & errmsg & """}"
Shell "start " & Mid(args, 15) & "#" & URLEncode(msg)
End

