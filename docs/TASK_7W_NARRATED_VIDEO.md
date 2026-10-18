# Task 7W — Narrated Chogathon walkthrough

New, distinct video: https://chog-survivor.vercel.app/chog-survivor-narrated-60s.mp4

English subtitles are burned into the picture; a separate [SRT](https://chog-survivor.vercel.app/chog-survivor-narrated-60s.srt) is also available. Website: https://chog-survivor.vercel.app/ · [Guest Mode](https://chog-survivor.vercel.app/#guest).

This is a **narrated product walkthrough, not proof of a completed mainnet gameplay transaction**. Guest Mode is an off-chain preview. The retained on-screen mainnet-proof recording slot and permanent disclosure make that distinction explicit. No wallet signature, receipt, NFT ownership or successful mainnet progression is fabricated. The supplied script describes available product behavior; it does not assert that this recording completed a holder action.

## Preserved material

The entire picture track comes from the existing 60-second Remotion walkthrough. Its public-site screenshot, actual guest footage, guest outcome screenshot, scene transitions, artwork and end card remain in their original order and timing. New subtitles are overlaid; the original soundtrack is replaced by a narration-led mix of the same original procedural music. The closing card displays the live website and `/#guest` route.

- [Original 60-second video](https://chog-survivor.vercel.app/chog-survivor-walkthrough-60s.mp4), retained unchanged. SHA-256: `816c4fd4affb9470d107da1d073bc3fdd17b2adea4b600ecf00e7a9322b6c9ff`.
- [Historical submitted YouTube video](https://youtu.be/qV-c7AP0VAg), unchanged. Its local original MP4 hashes `150db0959a5bd7c7d3a6af34525875713a657182a39268fe9e52c2935d8fb804`.
- [Original shot-by-shot provenance](TASK_7V_VIDEO_PROVENANCE.md). No organizer submission was edited.

## Narration and rights

Licensed synthetic English narration: Kokoro v1.0, stock `af_heart` voice, through `kokoro-onnx` 0.6.1. No person’s voice was cloned, and no wallet/browser data or private footage was provided to a speech service. Generation runs locally. The Apache-2.0 model and MIT runtime license texts are retained in [tools/video/licenses](../tools/video/licenses/). Sources: [official model card](https://huggingface.co/hexgrad/Kokoro-82M), [ONNX release](https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0).

The [owner-supplied script](../tools/video/task7w-script.txt) is unchanged. Pronunciation input spells NFT/XP, uses “Chawg” for Chog and speaks the website as words. Captions retain the original spelling. Speech runs at native engine speed 1.02 with natural paragraph pauses, without time stretching. Music is the existing original procedural ambience, without external samples.

## Reproduction

Use Python 3.12 in an isolated environment with `kokoro-onnx==0.6.1`, `faster-whisper==1.2.1`, `soundfile==0.14.0`, NumPy and ONNX Runtime; FFmpeg with libass/libx264 is required. The existing ignored `demo-video/` workspace contains the Remotion 4.0.535 source and original media; do not publish it wholesale.

Download the following official ONNX release assets to `/tmp` and verify SHA-256 before generation:

| Asset | SHA-256 |
| --- | --- |
| `kokoro-v1.0.onnx` | `7d5df8ecf7d4b1878015a32686053fd0eebe2bc377234608764cc0ef3636a6c5` |
| `voices-v1.0.bin` | `bca610b8308e8d99f32e6fe4197e7ec01679264efed0cac9140fe9c29f1fbf7d` |

Store them as `/tmp/chog-kokoro-v1.0.onnx` and `/tmp/chog-voices-v1.0.bin`. The narration script enforces both hashes. Subtitle alignment uses local Faster Whisper `base.en` word timestamps against the actual generated paragraph WAVs, with a recorded recognizer transcript; no caption is placed solely by proportional text timing. Proper nouns/initialisms are normalized for matching, and the spoken URL uses its paragraph’s recognized start/end. Recognition is a timing/coverage check, not a claim of human listening or installed-wallet acceptance.

```bash
/tmp/chog-task7w-venv/bin/python tools/video/task7w-narrate.py
/tmp/chog-task7w-venv/bin/python tools/video/task7w-align.py
/tmp/chog-task7w-venv/bin/python tools/video/task7w-render.py
```

`demo-video/output/task7w/` retains speech stems, alignment JSON, ASS/SRT, normalization measurements and render logs locally. FFmpeg finishes the existing Remotion picture with subtitles and a two-pass loudness-normalized mix. Narration target: −16 LUFS; music: −34 LUFS before additional narration sidechain ducking. No original video audio is mixed twice. Encoding: H.264, YUV420p, AAC stereo, 1080p/30 fps, front-loaded MP4 metadata for streaming.

## Release checks and scope

The reviewed export is **60.000 seconds**, 1920×1080/30 fps, 5,211,285 bytes. SHA-256: `52d9fdb9e51741eea2d6d07c8de4834b9f5198e8f7e9a112170eb581d0c0a620`.

| Check | Result |
| --- | --- |
| Complete video/audio decode, H.264/YUV420p + AAC stereo | Passed; front-loaded streaming metadata |
| Final loudness / true peak | −16.16 LUFS / −4.91 dBTP; no clipping |
| Narration / music before ducking | −16.10 / −33.98 LUFS; music 17.88 LU quieter, then additionally ducked |
| Subtitle coverage | 17 captions; exact supplied script; ordered, non-overlapping, within duration; short closing slogan held together for readability |
| Subtitle visual inspection | Guest scene, mainnet-proof disclosure, closing slogan and URL frames checked; high-contrast text and retained provenance labels |
| Final audio recognition | Complete narrative recovered from exported mixed AAC; proper-name ASR spellings are imperfect, so no claim of perfect recognition or human listening approval |
| Local Chromium playback | Passed with sound unmuted, decoded audio bytes and non-zero Web Audio amplitude; 60-second metadata |
| Production build | Passed with existing production overrides; existing chunk-size advisory only |
| Gameplay preservation | JS `be2861641eeb27a0774e055147c7ac4ab796f72791cdc55c492778ce4ed565c0` and CSS `d1633e0cb72595455bb9db7034713d1be7ba0ecf322258f397096fd012cb2460` match the previous public release |
| Backups | Both prior MP4 hashes unchanged; previous public filename and YouTube link preserved |

Verification commands:

```bash
/tmp/chog-task7w-venv/bin/python tools/video/task7w-review.py
node tools/video/task7w-browser.mjs http://127.0.0.1:4189/chog-survivor-narrated-60s.mp4 docs/evidence/task7w/local-browser.json
node tools/video/task7w-browser.mjs https://chog-survivor.vercel.app/chog-survivor-narrated-60s.mp4 docs/evidence/task7w/public-browser.json
```

Final export measurements and public deployment evidence are recorded in the local `docs/evidence/task7w/` checks and `TASK_7W_RELEASE_HANDOFF.local.md`. Publish only the reviewed final MP4/SRT, this report, script/tooling/license texts and the two video-link documentation edits. Raw captures, model binaries, environment files, prior private reports and unrelated working-tree changes remain excluded.

The production frontend build is checked with the established production environment overrides. This task changes no gameplay code, spending limits, contract, wallet integration, artwork or mainnet activation setting, so successful prior gameplay suites are not rerun without a relevant code change. No transaction is initiated or signed.

Rollback: restore README/judge links to the original walkthrough and remove only the new MP4/SRT in a separate approved commit/deployment. The original public video remains available throughout. A real-transaction proof version still requires a consenting holder’s genuine publishable native wallet confirmation, successful receipt/event and matching progression evidence; none is supplied by this task.
