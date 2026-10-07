Option Explicit
Dim args, cmdLine, i
Set args = WScript.Arguments
cmdLine = ""
If args.Count = 0 Then
    WScript.Echo "Usage: cscript //nologo run_hidden.vbs <command>"
    WScript.Quit 1
End If
Dim sh
Set sh = CreateObject("WScript.Shell")
If args.Count = 3 Then
    If args(0) = "--batch" Then
        cmdLine = """" & sh.ExpandEnvironmentStrings("%ComSpec%") & """ /c """"" & args(1) & """ --background >> """ & args(2) & """ 2>&1"""
    End If
End If
If cmdLine = "" Then
    cmdLine = args(0)
    For i = 1 To args.Count - 1
        cmdLine = cmdLine & " " & args(i)
    Next
End If
sh.Run cmdLine, 0, False ' 0 = hidden, False = do not wait for completion
