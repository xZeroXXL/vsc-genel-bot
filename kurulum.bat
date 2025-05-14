@echo off
color 0a
title Oxy Presents
chcp 65001 >nul
SETLOCAL EnableDelayedExpansion
for /F "tokens=1,2 delims=#" %%a in ('"prompt #$H#$E# & echo on & for %%b in (1) do rem"') do (
  set "DEL=%%a"
)

:secim
cls
echo  ▄▄▄  ▄   ▄ ▄   ▄ 
echo █   █  ▀▄▀  █   █ 
echo ▀▄▄▄▀ ▄▀ ▀▄  ▀▀▀█ 
echo             ▄   █ 
echo              ▀▀▀  
echo config dosyasini doldurdugunuzu onayliyor musunuz? (E/H)
set /p onay=E/H: 
if /I "%onay%"=="E" goto bilgilendirme
if /I "%onay%"=="H" goto son
cls
call :ColorText 0C "Lutfen E veya H giriniz."
echo.
goto secim

:bilgilendirme
cls
call :ColorText 05 "Kurulum suresi uzun surebilir. Lutfen sabirli bir sekilde bekleyin."
echo.
call :ColorText 05 "Kurulum tamamlandiginda pencere kendiliginden kapanacaktir." 
echo.
call :ColorText 05 "baslat.bat uzerinden botu baslatabilirsiniz." 
echo.
call :ColorText 0E "Bunlari anladiginizi onaylamak icin bir tusa basin."
pause>nul
goto kurulum 

:kurulum
cls
echo Kurulum basladi, lutfen bekleyin...
npm install
exit

:son
cls
call :ColorText 0C "Kurulum iptal edildi. Pencereyi kapatmak icin bir tusa basin."
echo.
pause>nul
exit

:ColorText
echo off
<nul set /p ".=%DEL%" > "%~2"
findstr /v /a:%1 /R "^$" "%~2" nul
del "%~2" > nul 2>&1
goto :eof