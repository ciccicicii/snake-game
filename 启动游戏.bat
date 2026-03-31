@echo off
chcp 65001 >nul
echo ========================================
echo    贪吃蛇游戏 - 本地服务器启动器
echo ========================================
echo.

:: 获取本机IP地址
for /f "tokens=14 delims=|" %%a in ('ipconfig ^| findstr /i "IPv4"') do set IP=%%a

echo 启动游戏服务器...
echo.
echo 游戏访问地址:
echo   电脑: http://localhost:8080
echo   手机: http://%IP%:8080
echo.
echo 手机和电脑需要在同一个WiFi网络下
echo.
echo 按 Ctrl+C 停止服务器
echo.

cd /d "%~dp0"
python -m http.server 8080
