# 自动更新与自动重建部署说明

本文档说明如何在当前仓库基础上启用轻量级自动部署，而不引入额外的 CI/CD 平台。

## 适用前提

- 服务器已经存在本仓库工作目录
- 服务器可以非交互访问仓库远端
- 部署用户拥有仓库目录读写权限，并且属于 `docker` 用户组
- 首次安装、Nginx 初始化仍建议手动走 `scripts/deploy/install.sh`

## 设计原则

- 保留现有 `scripts/deploy/update.sh` 作为人工更新/回滚入口
- 自动部署不直接运行 `install.sh`
- 自动部署只在检测到 `origin/main` 更新时执行
- 自动部署只做：
  - `git pull --ff-only`
  - `docker compose up -d --build`
  - `scripts/deploy/init-db.sh`
  - `scripts/deploy/healthcheck.sh`

## 仓库内文件

- `scripts/deploy/auto-redeploy.sh`
- `scripts/deploy/auto-redeploy.test.sh`
- `scripts/deploy/systemd/cryptoquiz-auto-redeploy.service`
- `scripts/deploy/systemd/cryptoquiz-auto-redeploy.timer`

## 本地验证

在提交前先跑 contract test：

```bash
bash scripts/deploy/auto-redeploy.test.sh
```

## 服务器安装步骤

假设仓库路径为 `/opt/crypto-display/app`，部署用户为 `deploy`，用户组为 `docker`：

```bash
cd /opt/crypto-display/app
bash scripts/deploy/auto-redeploy.test.sh
```

把模板复制到 systemd 目录，并替换占位符：

```bash
sudo cp scripts/deploy/systemd/cryptoquiz-auto-redeploy.service /etc/systemd/system/
sudo cp scripts/deploy/systemd/cryptoquiz-auto-redeploy.timer /etc/systemd/system/

sudo sed -i 's#__DEPLOY_USER__#deploy#g' /etc/systemd/system/cryptoquiz-auto-redeploy.service
sudo sed -i 's#__DEPLOY_GROUP__#docker#g' /etc/systemd/system/cryptoquiz-auto-redeploy.service
sudo sed -i 's#__REPO_ROOT__#/opt/crypto-display/app#g' /etc/systemd/system/cryptoquiz-auto-redeploy.service
```

重新加载 systemd：

```bash
sudo systemctl daemon-reload
```

## 上线顺序

1. 先手动验证只读检查：

```bash
cd /opt/crypto-display/app
bash scripts/deploy/auto-redeploy.sh --check-only
```

2. 再手动执行一次 service：

```bash
sudo systemctl start cryptoquiz-auto-redeploy.service
sudo journalctl -u cryptoquiz-auto-redeploy.service -n 100 --no-pager
```

3. 成功后再启用 timer：

```bash
sudo systemctl enable --now cryptoquiz-auto-redeploy.timer
sudo systemctl list-timers cryptoquiz-auto-redeploy.timer
```

## 建议的首次自动验证方式

首次验证建议推送一个 **docs-only** 提交，例如修改本文档中的时间戳说明。这样可以验证：

- 仓库自动拉取
- wrapper 判定逻辑
- systemd service / timer 触发链路

同时不会对用户服务产生行为变化。

## 日志查看

```bash
sudo journalctl -u cryptoquiz-auto-redeploy.service -f
sudo journalctl -u cryptoquiz-auto-redeploy.timer -n 50 --no-pager
```

## 回滚方式

如果自动部署行为异常：

```bash
sudo systemctl disable --now cryptoquiz-auto-redeploy.timer
```

然后回到人工更新方式：

```bash
cd /opt/crypto-display/app
bash scripts/deploy/update.sh
```

## 注意事项

- 自动部署前提是 `main` 分支受保护，避免坏提交直接进入生产
- 如果工作区不干净，wrapper 会主动退出，避免覆盖本地修改
- 如果后续需要秒级触发，再考虑 webhook / GitHub Actions SSH 触发
- 如果后续出现多台服务器或本地构建过慢，再考虑镜像仓库方案

## 自动部署验证记录

- 2026-05-15 01:10 CST：首次启用 `cryptoquiz-auto-redeploy.timer` 并进行 docs-only 链路验证。
