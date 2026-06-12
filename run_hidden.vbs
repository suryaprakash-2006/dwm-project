Option Explicit
Dim args, cmdLine, i
Set args = WScript.Arguments
If args.Count = 0 Then
    WScript.Echo "Usage: cscript //nologo run_hidden.vbs <command>"
    WScript.Quit 1
End If
cmdLine = args(0)
For i = 1 To args.Count - 1
    cmdLine = cmdLine & " " & args(i)
Next
Dim sh
Set sh = CreateObject("WScript.Shell")
sh.Run cmdLine, 0, False ' 0 = hidden, False = do not wait for completion
