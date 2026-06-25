# HTTPS 配置建议

为了提高系统的安全性，建议在生产环境中使用 HTTPS。以下是配置 HTTPS 的步骤和建议：

## 1. 获取 SSL 证书

### 方法一：使用 Let's Encrypt（免费）

1. 安装 Certbot：
   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install certbot python3-certbot-nginx
   
   # CentOS/RHEL
   sudo yum install epel-release
   sudo yum install certbot python2-certbot-nginx
   ```

2. 获取证书：
   ```bash
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```

3. 自动续期：
   ```bash
   sudo certbot renew --dry-run
   ```

### 方法二：使用商业 SSL 证书

从阿里云、腾讯云等服务商购买 SSL 证书，然后按照服务商的指导进行配置。

## 2. 配置 Express 应用

### 方法一：使用 Nginx 作为反向代理

1. 安装 Nginx：
   ```bash
   sudo apt install nginx
   ```

2. 配置 Nginx：
   ```nginx
   # /etc/nginx/sites-available/yourdomain.com
   server {
       listen 80;
       server_name yourdomain.com www.yourdomain.com;
       return 301 https://$host$request_uri;
   }

   server {
       listen 443 ssl;
       server_name yourdomain.com www.yourdomain.com;

       ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
       ssl_protocols TLSv1.2 TLSv1.3;
       ssl_prefer_server_ciphers on;
       ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384';

       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

3. 启用配置：
   ```bash
   sudo ln -s /etc/nginx/sites-available/yourdomain.com /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

### 方法二：直接在 Express 中配置 HTTPS

1. 安装依赖：
   ```bash
   npm install https
   ```

2. 修改 `src/index.js`：
   ```javascript
   const https = require('https');
   const fs = require('fs');
   
   // 读取证书文件
   const options = {
     key: fs.readFileSync('/path/to/privkey.pem'),
     cert: fs.readFileSync('/path/to/fullchain.pem')
   };
   
   // 创建 HTTPS 服务器
   const server = https.createServer(options, app);
   server.listen(process.env.PORT || 5000, () => {
     console.log(`服务器运行在端口 ${process.env.PORT || 5000}`);
   });
   ```

## 3. 前端配置

1. 修改 `package.json` 中的 proxy 配置：
   ```json
   "proxy": "https://yourdomain.com"
   ```

2. 在生产环境中，确保前端应用通过 HTTPS 访问。

## 4. 安全建议

1. **强制 HTTPS**：在后端设置 HTTP 到 HTTPS 的重定向。

2. **HTTP 严格传输安全 (HSTS)**：在响应头中添加 HSTS 头。
   ```javascript
   app.use((req, res, next) => {
     res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
     next();
   });
   ```

3. **内容安全策略 (CSP)**：设置适当的 CSP 头，防止 XSS 攻击。

4. **定期更新 SSL 证书**：确保证书不会过期。

5. **使用强密码套件**：配置服务器使用安全的密码套件。

## 5. 测试 HTTPS 配置

使用以下工具测试 HTTPS 配置的安全性：

- [SSL Labs](https://www.ssllabs.com/ssltest/)
- [Mozilla Observatory](https://observatory.mozilla.org/)

## 6. 注意事项

- 在开发环境中，可以使用自签名证书进行测试，但在生产环境中必须使用受信任的证书。
- 确保所有 API 调用都使用 HTTPS，避免混合内容问题。
- 定期检查 SSL 证书的过期时间，确保及时续期。

通过以上配置，可以大大提高系统的安全性，保护用户数据和通信安全。