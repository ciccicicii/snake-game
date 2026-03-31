@echo off
chcp 65001 >nul
set GH_TOKEN=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
cd /d E:\snake

echo 配置Git...
git config --global user.email "cici@github.com"
git config --global user.name "ciccicicii"

echo 初始化仓库...
git init
git add .
git commit -m "feat: 添加贪吃蛇游戏"

echo 创建GitHub仓库...
curl -s -X POST https://api.github.com/user/repos -H "Authorization: token %GH_TOKEN%" -d "{\"name\":\"snake-game\",\"private\":false}" > nul

echo 添加远程仓库...
git remote add origin https://ciccicicii:%GH_TOKEN%@github.com/ciccicicii/snake-game.git

echo 推送代码...
git branch -M main
git push -u origin main

echo.
echo 完成！现在去 Vercel 部署...
pause
