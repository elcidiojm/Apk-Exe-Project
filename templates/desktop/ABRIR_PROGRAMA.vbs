' ====================================================================
' GESTAO DE CLIENTES E VENDAS - MOCAMBIQUE
' INICIALIZADOR SILENCIOSO (SEM TELA DE CMD E SEM CONTA GOOGLE)
' ====================================================================
Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

currentDir = fso.GetParentFolderName(WScript.ScriptFullName)
serverScript = currentDir & "\server.ps1"
port = "8992"

' Inicia servidor local em segundo plano 100% oculto (0 = janela invisivel)
psCmd = "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File """ & serverScript & """ -Port " & port
WshShell.Run psCmd, 0, False

WScript.Sleep 600

' Deteta Microsoft Edge ou Google Chrome
edgePath = WshShell.ExpandEnvironmentStrings("%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe")
If Not fso.FileExists(edgePath) Then
    edgePath = WshShell.ExpandEnvironmentStrings("%ProgramFiles%\Microsoft\Edge\Application\msedge.exe")
End If

chromePath = WshShell.ExpandEnvironmentStrings("%ProgramFiles%\Google\Chrome\Application\chrome.exe")
If Not fso.FileExists(chromePath) Then
    chromePath = WshShell.ExpandEnvironmentStrings("%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe")
End If

appUrl = "http://127.0.0.1:" & port

' Abre em janela dedicada de aplicativo (sem barra de URL, sem tela preta e sem conta Google!)
If fso.FileExists(edgePath) Then
    WshShell.Run """" & edgePath & """ --app=""" & appUrl & """", 1, False
ElseIf fso.FileExists(chromePath) Then
    WshShell.Run """" & chromePath & """ --app=""" & appUrl & """", 1, False
Else
    WshShell.Run """" & appUrl & """", 1, False
End If
