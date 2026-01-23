# 🚀 Vercel 部署指南

## 步骤 1: 推送代码到 GitHub

### 1.1 创建 GitHub 仓库
1. 访问 [GitHub](https://github.com) 并登录
2. 点击右上角 `+` → `New repository`
3. 仓库名称：`ah-dashboard`（或您喜欢的名称）
4. 设置为 **Public**（公开仓库）
5. **不要**勾选 "Add a README file"
6. 点击 "Create repository"

### 1.2 推送本地代码

在项目目录执行以下命令：

```bash
# 添加远程仓库（替换 YOUR_USERNAME）
git remote add origin https://github.com/YOUR_USERNAME/ah-dashboard.git

# 推送代码到 GitHub
git branch -M main
git push -u origin main
```

---

## 步骤 2: 部署到 Vercel

### 2.1 连接 Vercel 和 GitHub

1. 访问 [Vercel](https://vercel.com) 并登录
2. 点击 **"Add New..."** → **"Project"**
3. 选择 **"Import Git Repository"**
4. 选择您的 `ah-dashboard` 仓库
5. Vercel 会自动检测到这是 Vite 项目

### 2.2 配置项目

**环境变量**（无需配置，因为项目是纯静态的）

**构建设置**：
- Framework Preset: **Vite**
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`
- Root Directory: `./`

### 2.3 部署

1. 点击 **"Deploy"** 按钮
2. 等待约 1-2 分钟，Vercel 会自动构建和部署
3. 部署成功后会显示：✅ **"Congratulations!"**
4. 您会获得一个类似这样的链接：
   ```
   https://ah-dashboard-xxx.vercel.app
   ```

---

## 步骤 3: 自定义域名（可选）

### 3.1 在 Vercel 设置域名

1. 在 Vercel 项目页面，点击 **"Settings"** → **"Domains"**
2. 输入您的域名（例如：`analytics.yourdomain.com`）
3. 按照提示在您的域名服务商处添加 CNAME 记录

### 3.2 CNAME 记录

```
Type: CNAME
Name: analytics
Value: cname.vercel-dns.com
```

---

## 🎉 完成！

现在您可以：

1. **分享链接**：将 Vercel 链接分享给任何人使用
2. **离线使用**：用户访问链接后，应用会缓存在浏览器中
3. **数据安全**：所有用户上传的 Excel 数据仅在本地处理

---

## 📱 使用说明

分享给用户时，告诉他们：

1. 访问链接：[您的 Vercel 链接]
2. 点击"选择文件"上传承保数据和理赔数据
3. 系统会自动进行分析
4. 数据仅在浏览器中处理，不会上传

---

## 🔧 常见问题

### Q: 如何更新应用？

```bash
# 修改代码后
git add .
git commit -m "Update description"
git push
```

Vercel 会自动检测到推送并重新部署。

### Q: 构建失败怎么办？

检查：
1. `package.json` 中的依赖是否正确
2. 是否有语法错误
3. 查看 Vercel 的构建日志

### Q: 如何删除项目？

在 Vercel 项目页面点击 **Settings** → **"Delete"**

---

## 📊 部署后测试清单

- [ ] 访问部署链接，确认页面正常加载
- [ ] 上传测试 Excel 文件，确认解析正常
- [ ] 检查各个图表是否正常显示
- [ ] 测试展开/收起按钮功能
- [ ] 在不同浏览器中测试（Chrome、Firefox、Edge）
- [ ] 在移动设备上测试响应式布局

---

**提示**：部署是免费的，Vercel 免费套餐包括：
- 无限带宽
- 100GB 月流量
- 自动 HTTPS
- 全球 CDN

足够个人和小团队使用！
