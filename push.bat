@echo off
echo ========================================
echo 意健险分析系统 - GitHub 推送工具
echo ========================================
echo.
echo 第一步：创建 GitHub Personal Access Token
echo ----------------------------------------
echo 1. 访问：https://github.com/settings/tokens
echo 2. 点击 "Generate new token" (classic)
echo 3. 勾选 "repo" 权限
echo 4. 点击 "Generate token"
echo 5. 复制生成的 token (以 ghp_ 开头)
echo.
echo ========================================
pause

echo.
echo 第二步：输入您的 GitHub Token
echo ----------------------------------------
set /p token=请粘贴您的 GitHub Token:

echo.
echo 第三步：推送代码到 GitHub
echo ---------------------------------------
git remote set-url origin https://%token%@github.com/jeason007007/ah-dashboard.git
git push -u origin main

echo.
echo ========================================
echo 推送完成！
echo ========================================
echo.
echo 您的仓库地址：
echo https://github.com/jeason007007/ah-dashboard
echo.
pause
