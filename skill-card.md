## Description:

Turns user-provided text into a playable MP3 through AudioFlow TTS, with automatic Chinese and English voice selection.

This skill is ready for use.

## Publisher:

[niuzb](https://clawhub.ai/niuzb)

### License/Terms of Use:

MIT-0

### ClawHub Catalog:

**Categories:** Creative, Productivity

**Topics:** text-to-speech, tts, audio, speech, narration

## Use Case:

Creators, developers, and general users can turn approved text into natural speech and play the generated MP3 in their agent application.

An AudioFlow account with prepaid credit is required. Users register at the AudioFlow website and add credit before synthesis.

### Deployment Geography for Use:

Global

## Known Risks and Mitigations:

Risk: User-provided text is sent to AudioFlow for remote synthesis and the generated audio is downloaded from a signed HTTPS URL.

Mitigation: The skill requires explicit per-request approval before remote processing, sends the token only to the fixed AudioFlow API, validates the signed audio URL, and never prints the URL or input text in diagnostics.

Risk: TTS requests consume prepaid balance and an uncertain response may already have incurred a charge.

Mitigation: The skill discloses the character price before each synthesis and never retries a TTS POST automatically.

Risk: Generated MP3 files may contain sensitive spoken content.

Mitigation: Temporary audio uses private file permissions and is not copied, uploaded, or retained elsewhere unless the user asks.

## Reference(s):

- [AudioFlow sign-up](https://audioflow123.com/signup)
- [AudioFlow billing](https://audioflow123.com/dashboard/billing)
- [AudioFlow dashboard](https://audioflow123.com/dashboard)

## Skill Output:

**Output Type(s):** [Audio, JSON, Shell commands, Configuration guidance]

**Output Format:** [Playable local MP3 with a JSON summary containing path, language, voice, and billed characters.]

**Output Parameters:** [1D]

**Other Properties Related to Output:** [Does not expose the input text, API token, or signed audio URL in command output.]

## Skill Version(s):

1.0.1 (ClawHub release)

## Ethical Considerations:

Users should avoid submitting text they are not authorized to process and should review privacy, compliance, and billing requirements before synthesis.
