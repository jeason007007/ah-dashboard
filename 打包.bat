@echo off
chcp 65001 >nul
echo.
echo ╔════════════════════════════════════════╗
echo ║      意健险分析系统 - 打包工具        ║
echo ╚════════════════════════════════════════╝
echo.

set "PACKAGE_NAME=意健险分析系统-便携版"
set "SOURCE_DIR=%~dp0"

echo [1/4] 清理旧文件...
if exist "%PACKAGE_NAME%" rmdir /s /q "%PACKAGE_NAME%"

echo [2/4] 创建文件夹结构...
mkdir "%PACKAGE_NAME%"
mkdir "%PACKAGE_NAME%\dist"

echo [3/4] 复制文件...
xcopy "%SOURCE_DIR%dist\*" "%PACKAGE_NAME%\dist\" /E /I /Y >nul
copy "%SOURCE_DIR%一键启动.bat" "%PACKAGE_NAME%\" >nul

echo.
echo ╔════════════════════════════════════════╗
echo ║        📋 创建使用说明文件...          ║
echo ╚════════════════════════════════════════╝
echo.

(
echo # 意健险分析系统 - 使用说明
echo.
echo ## 🚀 快速开始（仅需 3 步）
echo.
echo ### 1. 双击运行 "一键启动.bat"
echo.
echo ### 2. 浏览器会自动打开系统
echo.
echo ### 3. 上传您的 Excel 文件开始分析
echo.
echo ---
echo.
echo ## 📋 系统要求
echo.
echo - Windows 7/8/10/11
echo - Python 3.x （大多数电脑已安装）
echo - 现代浏览器（Chrome/Edge/Firefox）
echo.
echo ---
echo.
echo ## ⚠️ 重要提示
echo.
echo ### 数据安全
echo - ✅ 所有数据仅在本地浏览器处理
echo - ✅ 不会上传到任何服务器
echo - ✅ 关闭系统后数据自动清除
echo.
echo ### 使用说明
echo - 准备两个 Excel 文件：
echo   • 承保数据表
echo   • 理赔数据表
echo.
echo - 数据格式要求：
echo   • 必须包含 "个人保单号" 字段
echo   • 承保数据需包含：保费、生效日、满期日
echo   • 理赔数据需包含：出险日期、赔款金额
echo.
echo ---
echo.
echo ## 🔧 常见问题
echo.
echo ### Q: 双击后没有反应？
echo A: 请确保已安装 Python。打开命令行输入 python --version 检查。
echo.
echo ### Q: 浏览器没有自动打开？
echo A: 手动打开浏览器，访问 http://localhost:8000
echo.
echo ### Q: 如何关闭系统？
echo A: 在黑色窗口按任意键即可关闭。
echo.
echo ### Q: 没有 Python 怎么办？
echo A: 访问 https://www.python.org/downloads/ 下载安装。
echo.
echo ---
echo.
echo ## 📞 技术支持
echo.
echo 如有问题，请联系技术支持。
echo.
echo **注意**：本工具仅用于数据分析参考，不构成保险精算建议。
) > "%PACKAGE_NAME%\使用说明.txt"

echo [4/4] 打包完成！
echo.
echo ╔════════════════════════════════════════╗
echo ║       ✅ 打包完成！                    ║
echo ╠════════════════════════════════════════╣
echo ║                                        ║
echo ║  文件夹位置：                          ║
echo ║  %PACKAGE_NAME%                    ║
echo ║                                        ║
echo ║  您可以将整个文件夹发送给其他人        ║
echo ║                                        ║
echo ╚════════════════════════════════════════╝
echo.

explorer "%SOURCE_DIR%%PACKAGE_NAME%"

pause
