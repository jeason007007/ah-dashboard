@echo off
chcp 65001 >nul
color 0B
title 意健险分析系统 - 零依赖启动版

echo.
echo ╔════════════════════════════════════════╗
echo ║     意健险业务分析系统 - 零依赖版       ║
echo ╚════════════════════════════════════════╝
echo.
echo 正在准备启动环境...
echo.

:: 设置端口
set PORT=8000
set ROOT_DIR=%~dp0dist

:: 检查目录是否存在
if not exist "%ROOT_DIR%" (
    echo [错误] 找不到 dist 目录，请确保已解压完整。
    pause
    exit
)

echo [1/2] 正在启动本地服务器...
echo      端口: %PORT%
echo.

:: 使用 PowerShell 启动一个简单的 HttpListener
:: 并自动打开浏览器
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$port = %PORT%; $root = '%ROOT_DIR%'; ^
    $listener = New-Object System.Net.HttpListener; ^
    $listener.Prefixes.Add('http://localhost:' + $port + '/'); ^
    $listener.Prefixes.Add('http://127.0.0.1:' + $port + '/'); ^
    try { $listener.Start() } catch { ^
        Write-Host '❌ 启动失败：端口 ' $port ' 可能被占用。' -ForegroundColor Red; ^
        Write-Host '请尝试关闭其他正在运行的分析系统窗口。'; ^
        pause; exit ^
    }; ^
    Write-Host '✅ 服务器已就绪'; ^
    Start-Process 'http://localhost:' + $port; ^
    while ($listener.IsListening) { ^
        $context = $listener.GetContext(); ^
        $request = $context.Request; ^
        $response = $context.Response; ^
        $path = $request.Url.LocalPath; ^
        if ($path -eq '/') { $path = '/index.html' }; ^
        $localPath = Join-Path $root $path; ^
        if (Test-Path $localPath) { ^
            $bytes = [System.IO.File]::ReadAllBytes($localPath); ^
            $extension = [System.IO.Path]::GetExtension($localPath); ^
            $contentType = switch ($extension) { ^
                '.html' { 'text/html; charset=utf-8' } ^
                '.js'   { 'application/javascript' } ^
                '.css'  { 'text/css' } ^
                '.png'  { 'image/png' } ^
                '.jpg'  { 'image/jpeg' } ^
                '.svg'  { 'image/svg+xml' } ^
                '.json' { 'application/json' } ^
                default { 'application/octet-stream' } ^
            }; ^
            $response.ContentType = $contentType; ^
            $response.ContentLength64 = $bytes.Length; ^
            $response.OutputStream.Write($bytes, 0, $bytes.Length); ^
        } else { ^
            $response.StatusCode = 404; ^
        } ^
        $response.Close(); ^
    }"

echo.
echo 💡 提示：
echo    • 浏览器已自动打开，请开始使用。
echo    • **不要**关闭此黑色窗口，否则系统将停止。
echo    • 所有数据均在本地处理，绝对隐私安全。
echo.
echo ════════════════════════════════════════
echo 请勿关闭窗口，直接关闭本窗口以退出...
pause >nul
