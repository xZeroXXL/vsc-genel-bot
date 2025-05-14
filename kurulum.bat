@echo off
color 0a
title Oxy Presents - Setup

:secim
cls
echo config dosyasini doldurdugunuzu onayliyor musunuz? (E/H)
set /p onay=E/H: 
if /I "%onay%"=="E" goto bilgilendirme
if /I "%onay%"=="H" goto son
cls
echo Lutfen E veya H giriniz.
echo.
goto secim

:bilgilendirme
cls
echo Kurulum suresi uzun surebilir. Lutfen sabirli bir sekilde bekleyin.
echo.
echo Kurulum tamamlandiginda pencere kendiliginden kapanacaktir.
echo.
echo baslat.bat uzerinden botu baslatabilirsiniz.
echo.
echo Bunlari anladiginizi onaylamak icin bir tusa basin.
pause>nul
goto kurulum 

:kurulum
cls
echo Kurulum basladi, lutfen bekleyin...
npm install
exit

:son
cls
echo Kurulum iptal edildi. Pencereyi kapatmak icin bir tusa basin.
echo.
pause>nul
exit
