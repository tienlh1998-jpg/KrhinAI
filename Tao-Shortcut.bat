@echo off
powershell -NoProfile -ExecutionPolicy Bypass -Command "$WshShell = New-Object -ComObject WScript.Shell; $DesktopDir = [System.Environment]::GetFolderPath('Desktop'); $Shortcut = $WshShell.CreateShortcut((Join-Path $DesktopDir 'Krhin AI.lnk')); $Shortcut.TargetPath = '%~dp0Krhin-AI.exe'; $Shortcut.WorkingDirectory = '%~dp0'; $Shortcut.IconLocation = '%~dp0app.ico, 0'; $Shortcut.Description = 'Krhin AI - Xoa Watermark Gemini & Veo Local'; $Shortcut.Save(); Write-Host 'Da tao icon Krhin AI tren man hinh Desktop!' -ForegroundColor Green"
pause
