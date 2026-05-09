@echo off
echo ========================================
echo   FoodMoment 项目推送到 GitHub
echo ========================================
echo.

echo [1/3] 检查 Git 状态...
git status
echo.

echo [2/3] 添加所有更改...
git add .
echo.

echo [3/3] 推送到 GitHub...
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ✅ 推送成功！
    echo 📦 查看仓库: https://github.com/xueran-Breeze/FoodMent
) else (
    echo.
    echo ❌ 推送失败，请检查网络连接
    echo 💡 提示: 可以尝试使用代理或稍后重试
)

echo.
pause
