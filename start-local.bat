@echo off
echo ========================================
echo 意健险分析系统 - 本地服务器
echo ========================================
echo.
echo 正在启动服务器...
echo.
cd dist
echo 服务器地址：http://localhost:8000
echo.
echo 请在浏览器中打开上面的地址
echo.
echo 按 Ctrl + C 停止服务器
echo ========================================
echo.

python -m http.server 8000

pause
