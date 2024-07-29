@echo off

set "start=stash-"

setlocal enabledelayedexpansion
for %%A in (*.ts) do (
    set "file=%%~nA"
        for /f "tokens=2 delims=-" %%I in ("!file!") do (
            set "version=%%I"
                echo !version!
        )
    if exist "!file!.ts" 7z a gehntris-!version!.zip index.html script-!version!.js style-!version!.css
)

:: pause