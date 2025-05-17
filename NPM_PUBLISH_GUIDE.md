# npm包发布操作手册

本文档详细说明了如何发布软件规划工具到npm仓库，便于用户通过npx命令直接使用。

## 发布步骤

1. **注册npm账号**
   
   访问 https://www.npmjs.com/ 注册一个账号，用于发布和管理你的包。

2. **登录npm**
   
   在终端中登录你的npm账号：
   ```bash
   npm login
   ```
   根据提示输入用户名、密码和邮箱。

3. **检查package.json**
   
   确保package.json中的配置正确：
   - `name`：包名必须唯一，如有冲突需要修改
   - `version`：每次发布必须递增版本号
   - `bin`：确保指向正确的入口文件，通常是`build/index.js`
   - `private`：发布前必须将此字段设为`false`或删除

4. **构建项目**
   
   确保代码已编译为最新版本：
   ```bash
   pnpm run build
   ```

5. **发布到npm**
   
   执行发布命令：
   ```bash
   npm publish --access public
   ```

6. **验证发布结果**
   
   使用npx命令验证包是否可以正常安装和运行：
   ```bash
   npx -y software-planning-tool
   ```

## 更新包版本

当你需要发布新版本时，请按照以下步骤操作：

1. 更新`package.json`中的版本号。可以手动修改，也可以使用npm命令：
   ```bash
   npm version patch  # 小版本更新，如1.0.0 -> 1.0.1
   npm version minor  # 次版本更新，如1.0.0 -> 1.1.0
   npm version major  # 主版本更新，如1.0.0 -> 2.0.0
   ```

2. 构建项目
   ```bash
   pnpm run build
   ```

3. 发布更新版本
   ```bash
   npm publish --access public
   ```

## 常见问题

- **包名冲突**：如果提示包名已存在，请在`package.json`中修改`name`字段，可以使用作用域名称，如`@yourusername/software-planning-tool`

- **权限问题**：首次发布包时可能需要添加`--access public`参数，特别是使用作用域名称的包

- **版本未变无法发布**：npm要求每次发布必须使用新的版本号，请确保更新了`package.json`中的`version`字段

- **本地测试**：发布前可以使用以下命令在本地测试：
  ```bash
  npm link
  npx -y software-planning-tool
  ```

- **撤回发布的版本**：如果发现问题需要撤回，可以使用：
  ```bash
  npm unpublish software-planning-tool@版本号 --force
  ```
  注意：npm限制只能在发布后24小时内撤回

## 其他资源

- [npm官方文档](https://docs.npmjs.com/)
- [语义化版本规范](https://semver.org/) 