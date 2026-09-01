# read-aloud（文字朗读）

[English](README.md) | 简体中文

**把文字变成自然语音，并直接播放生成的 MP3。**

`read-aloud` 是一个面向 Agent 的文字朗读 Skill。它通过 AudioFlow TTS
合成语音，自动为中文和英文选择合适音色，并把生成的 MP3 作为本地音频交给
Agent 播放。

## 能做什么

- 朗读用户提供的中文、英文或中英混合文字；
- 支持 `0.5–2.0` 倍语速，默认 `1.0`；
- 自动选择语言和音色，不接受客户端自定义模型或音色；
- 下载并验证签名音频地址返回的 MP3；
- 不在输出中暴露 Token、输入文字或签名 URL。

单次最多输入 4,096 个 Unicode 字符。AudioFlow 按 TTS API 返回的计费字符数
收费，用户价格为 `$0.70 / 10,000` 字符。

## 前提条件

安装并使用本 Skill 前，需要：

1. 在 [AudioFlow 注册页面](https://audioflow123.com/signup)创建账号；
2. 登录后前往 [AudioFlow 账单页面](https://audioflow123.com/dashboard/billing)
   充值预付余额；
3. 本机已安装 Node.js 20 或更高版本。

没有完成注册和充值时，无法调用文字朗读服务。

## 安装为 Codex Skill

```bash
git clone https://github.com/niuzb/read-aloud.git \
  "${CODEX_HOME:-$HOME/.codex}/skills/read-aloud"
```

如果没有立即发现 Skill，请重启 Codex。

## 使用

```text
使用 $read-aloud 朗读：今天是个适合出发的好日子。
```

每次合成前，Skill 都会说明文字将发送到 AudioFlow TTS 服务，并询问
是否同意远程处理和计费。只有用户明确同意后才会发送文字。

首次使用需要连接 AudioFlow：

```bash
node scripts/auth.mjs status
node scripts/auth.mjs begin
node scripts/auth.mjs wait
```

直接调用合成脚本时，通过标准输入提供文字：

```bash
printf 'Hello, world.' | node scripts/read-aloud.mjs --speed 1
```

成功后输出本地 MP3 路径、语言、音色和计费字符数，不输出签名音频地址。

## 安全与隐私

- 文字只发送到固定的 AudioFlow TTS API；
- AudioFlow Token 不会发送到音频下载地址；
- 合成请求不自动重试，避免不确定响应造成重复费用；
- 音频只允许从 TTS API 返回的受信任签名地址下载，并拒绝重定向；
- 临时 MP3 使用私有权限保存，指定输出文件时不会覆盖已有文件；
- 完整 Token 保存在用户配置目录，不进入仓库、命令参数或日志。

如需充值、查看余额或吊销 API Key，请访问
[AudioFlow 控制台](https://audioflow123.com/dashboard)。

## 测试

```bash
node --test scripts/*.test.mjs
python3 /path/to/skill-creator/scripts/quick_validate.py .
```

## License

Apache-2.0
