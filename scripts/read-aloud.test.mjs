import assert from "node:assert/strict";
import { lstat, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { parseArguments, synthesizeAndDownload } from "./read-aloud.mjs";

const TOKEN = `vf_stt_${"a".repeat(43)}`;
const AUDIO_URL =
  "https://dashscope-result-bj.oss-cn-beijing.aliyuncs.com/result/test.mp3?signature=secret";

function credentialOptions(root) {
  return {
    environment: {
      AUDIOFLOW_CONFIG_DIR: root,
      AUDIOFLOW_TOKEN: TOKEN,
    },
    platform: process.platform,
    homeDirectory: root,
  };
}

function speechBody(overrides = {}) {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    object: "audio.speech",
    created_at: Math.floor(Date.now() / 1000),
    expires_at: Math.floor(Date.now() / 1000) + 86_400,
    url: AUDIO_URL,
    format: "mp3",
    language: "en",
    usage: { characters: 8 },
    ...overrides,
  };
}

test("parses speed and an absolute MP3 output path", () => {
  assert.deepEqual(parseArguments([]), { speed: 1, outputPath: undefined });
  assert.deepEqual(
    parseArguments(["--speed", "0.5", "--output", "/tmp/voice.mp3"]),
    { speed: 0.5, outputPath: "/tmp/voice.mp3" },
  );
  assert.deepEqual(parseArguments(["--speed", "2"]), {
    speed: 2,
    outputPath: undefined,
  });
  assert.throws(() => parseArguments(["--speed", "2.1"]), /between/u);
  assert.throws(() => parseArguments(["--output", "voice.mp3"]), /absolute/u);
  assert.throws(() => parseArguments(["--voice", "custom"]), /Unknown/u);
});

test("synthesizes once, validates the signed URL, and writes a private MP3", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "read-aloud-test-"));
  const outputPath = path.join(root, "speech.mp3");
  const calls = [];
  try {
    const result = await synthesizeAndDownload(
      { text: "Hello world", speed: 1.25, outputPath },
      {
        credentialOptions: credentialOptions(root),
        fetchImpl: async (url, init) => {
          calls.push({ url: String(url), init });
          if (calls.length === 1) {
            return new Response(JSON.stringify(speechBody()), {
              status: 200,
              headers: { "content-type": "application/json" },
            });
          }
          return new Response(Buffer.from([0x49, 0x44, 0x33, 1, 2, 3]), {
            status: 200,
            headers: {
              "content-type": "audio/mpeg",
              "content-length": "6",
            },
          });
        },
      },
    );

    assert.equal(calls.length, 2);
    assert.equal(calls[0].url, "https://asr.audioflow123.com/v1/audio/speech");
    assert.equal(calls[0].init.method, "POST");
    assert.equal(calls[0].init.redirect, "error");
    assert.equal(calls[0].init.headers.authorization, `Bearer ${TOKEN}`);
    assert.deepEqual(JSON.parse(calls[0].init.body), {
      input: "Hello world",
      speed: 1.25,
    });
    assert.equal(calls[1].url, AUDIO_URL);
    assert.equal(calls[1].init.redirect, "error");
    assert.equal(Object.hasOwn(calls[1].init.headers, "authorization"), false);
    assert.deepEqual(result, {
      path: outputPath,
      format: "mp3",
      language: "en",
      voice: "longanlingxin",
      characters: 8,
      expires_at: speechBody().expires_at,
    });
    assert.equal(JSON.stringify(result).includes("signature"), false);
    assert.deepEqual(
      [...(await readFile(outputPath))],
      [0x49, 0x44, 0x33, 1, 2, 3],
    );
    if (process.platform !== "win32") {
      assert.equal((await lstat(outputPath)).mode & 0o777, 0o600);
    }
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test("rejects an untrusted audio host without downloading it", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "read-aloud-test-"));
  let calls = 0;
  try {
    await assert.rejects(
      synthesizeAndDownload(
        { text: "Hello", outputPath: path.join(root, "speech.mp3") },
        {
          credentialOptions: credentialOptions(root),
          fetchImpl: async () => {
            calls += 1;
            return new Response(
              JSON.stringify(
                speechBody({ url: "https://evil.example/audio.mp3" }),
              ),
              { status: 200 },
            );
          },
        },
      ),
      /response was invalid/u,
    );
    assert.equal(calls, 1);
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test("does not retry failed synthesis or expose input and credentials", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "read-aloud-test-"));
  let calls = 0;
  const privateText = "private text that must not be echoed";
  try {
    await assert.rejects(
      synthesizeAndDownload(
        { text: privateText, outputPath: path.join(root, "speech.mp3") },
        {
          credentialOptions: credentialOptions(root),
          fetchImpl: async () => {
            calls += 1;
            return new Response(
              JSON.stringify({ error: { code: "insufficient_balance" } }),
              { status: 402 },
            );
          },
        },
      ),
      (error) => {
        assert.match(error.message, /HTTP 402, insufficient_balance/u);
        assert.equal(error.message.includes(privateText), false);
        assert.equal(error.message.includes(TOKEN), false);
        return true;
      },
    );
    assert.equal(calls, 1);
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test("rejects empty, oversized, invalid-speed, and existing outputs", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "read-aloud-test-"));
  const outputPath = path.join(root, "speech.mp3");
  const successFetch = async (url) =>
    String(url).includes("/v1/audio/speech")
      ? new Response(JSON.stringify(speechBody()), { status: 200 })
      : new Response(Buffer.from([0x49, 0x44, 0x33, 1]), { status: 200 });
  try {
    await assert.rejects(
      synthesizeAndDownload(
        { text: "   ", outputPath },
        { credentialOptions: credentialOptions(root), fetchImpl: successFetch },
      ),
      /must not be empty/u,
    );
    await assert.rejects(
      synthesizeAndDownload(
        { text: "a".repeat(4097), outputPath },
        { credentialOptions: credentialOptions(root), fetchImpl: successFetch },
      ),
      /4096/u,
    );
    await assert.rejects(
      synthesizeAndDownload(
        { text: "Hello", speed: 3, outputPath },
        { credentialOptions: credentialOptions(root), fetchImpl: successFetch },
      ),
      /between/u,
    );
    await writeFile(outputPath, "existing", { mode: 0o600 });
    await assert.rejects(
      synthesizeAndDownload(
        { text: "Hello", outputPath },
        { credentialOptions: credentialOptions(root), fetchImpl: successFetch },
      ),
      { code: "EEXIST" },
    );
    assert.equal(await readFile(outputPath, "utf8"), "existing");
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});
