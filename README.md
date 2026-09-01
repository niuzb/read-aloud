# read-aloud

English | [简体中文](README.zh-CN.md)

**Turn text into natural speech and play the generated MP3.**

`read-aloud` is an Agent Skill that synthesizes text through AudioFlow TTS,
automatically chooses an appropriate Chinese or English voice, and gives the
resulting local MP3 to the agent for playback.

## Features

- Reads Chinese, English, and mixed Chinese-English text aloud.
- Supports speeds from `0.5` to `2.0`, defaulting to `1.0`.
- Selects the language and voice on the server; client model and voice
  overrides are not accepted.
- Downloads and validates the MP3 from the signed audio URL.
- Keeps tokens, input text, and signed URLs out of command output.

Each request accepts up to 4,096 Unicode characters. AudioFlow charges
`$0.70 per 10,000` API-reported billable characters.

## Prerequisites

Before installing and using this Skill:

1. Create an account on the
   [AudioFlow sign-up page](https://audioflow123.com/signup).
2. Sign in and add prepaid credit on the
   [AudioFlow billing page](https://audioflow123.com/dashboard/billing).
3. Install Node.js 20 or newer on the local machine.

Text-to-speech requests cannot be used until registration and prepaid funding
are complete.

## Install as a Codex Skill

```bash
git clone https://github.com/niuzb/read-aloud.git \
  "${CODEX_HOME:-$HOME/.codex}/skills/read-aloud"
```

Restart Codex if the Skill is not discovered immediately.

## Use

```text
Use $read-aloud to read: It is a beautiful day to begin.
```

Before every synthesis, the Skill discloses that the text will be sent to
the AudioFlow TTS service and asks for approval for remote
processing and billing. No text is sent until the user explicitly agrees.

Connect to AudioFlow on first use:

```bash
node scripts/auth.mjs status
node scripts/auth.mjs begin
node scripts/auth.mjs wait
```

For direct CLI use, provide text on standard input:

```bash
printf 'Hello, world.' | node scripts/read-aloud.mjs --speed 1
```

Successful output includes the local MP3 path, language, locally inferred
voice, and billed characters. The AudioFlow response does not expose the voice,
and command output never includes the signed audio URL.

## Security and privacy

- Text is sent only to the fixed AudioFlow TTS API.
- The AudioFlow token is never sent to the signed audio download URL.
- Synthesis is not retried automatically, preventing duplicate cost after an
  uncertain response.
- Audio downloads are limited to trusted signed URLs returned by the TTS API,
  with redirects rejected.
- Temporary MP3 files use private permissions, and explicit output paths never
  overwrite existing files.
- Full tokens stay in the user configuration directory and out of repository
  files, process arguments, and logs.

Use the [AudioFlow dashboard](https://audioflow123.com/dashboard) to add prepaid
credit, check balances, or revoke an API key.

## Test

```bash
node --test scripts/*.test.mjs
python3 /path/to/skill-creator/scripts/quick_validate.py .
```

## License

Apache-2.0
