Option Explicit
Dim args, cmdLine
Set args = WScript.Arguments
If args.Count = 0 Then
    WScript.Echo "Usage: cscript //nologo run_hidden.vbs \"<command>\""
    WScript.Quit 1
End If
cmdLine = args(0)
Dim sh
Set sh = CreateObject("WScript.Shell")
sh.Run cmdLine, 0, False ' 0 = hidden, False = do not wait for completion
