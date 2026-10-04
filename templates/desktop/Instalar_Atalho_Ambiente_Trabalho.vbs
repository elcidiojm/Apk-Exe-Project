' ====================================================================
' INSTALADOR DE ATALHO NO AMBIENTE DE TRABALHO
' 100% SILENCIOSO (SEM TELA PRETA DE CMD)
' ====================================================================
Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

currentDir = fso.GetParentFolderName(WScript.ScriptFullName)
targetDir = WshShell.ExpandEnvironmentStrings("%APPDATA%\GestaoClientesVendas")

If Not fso.FolderExists(targetDir) Then
    fso.CreateFolder(targetDir)
End If

If LCase(currentDir) <> LCase(targetDir) Then
    fso.CopyFolder currentDir & "\*", targetDir & "\", True
End If

desktopPath = WshShell.SpecialFolders("Desktop")
Set shortcut = WshShell.CreateShortcut(desktopPath & "\Gestão de Clientes e Vendas.lnk")
shortcut.TargetPath = "wscript.exe"
shortcut.Arguments = """" & targetDir & "\ABRIR_PROGRAMA.vbs"""
shortcut.WorkingDirectory = targetDir
shortcut.IconLocation = targetDir & "\app_icon.ico,0"
shortcut.Description = "Sistema de Gestão de Clientes e Vendas"
shortcut.Save

programsPath = WshShell.SpecialFolders("Programs")
Set shortcut2 = WshShell.CreateShortcut(programsPath & "\Gestão de Clientes e Vendas.lnk")
shortcut2.TargetPath = "wscript.exe"
shortcut2.Arguments = """" & targetDir & "\ABRIR_PROGRAMA.vbs"""
shortcut2.WorkingDirectory = targetDir
shortcut2.IconLocation = targetDir & "\app_icon.ico,0"
shortcut2.Description = "Sistema de Gestão de Clientes e Vendas"
shortcut2.Save

WshShell.Run "wscript.exe """ & targetDir & "\ABRIR_PROGRAMA.vbs""", 0, False

WshShell.Popup "Instalação concluída com sucesso!" & vbCrLf & vbCrLf & "O atalho com ícone oficial foi criado no seu Ambiente de Trabalho." & vbCrLf & "O sistema já está a iniciar sem conta Google e sem tela preta de CMD!", 5, "Gestão de Clientes e Vendas", 64
