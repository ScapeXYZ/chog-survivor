# Task 5A — Three-minute recording storyboard

Target: **180 seconds maximum**, 1920×1080 landscape, 30 fps; leave the final 1–2 seconds within the three-minute total rather than adding an outro. Recording/editing may proceed locally; publication requires separate approval. Preserve existing game fonts, typography, artwork and UI. Do not invent a live game deployment or execute another transaction for footage.

## Shot list and narration

Read warmly at approximately 125–140 words/minute, pausing for visual proof. The script deliberately leaves space for interaction and receipts. Trim pauses to fit each time slot; do not accelerate evidence until it becomes unreadable.

| Time / frame range at 30 fps | Precise screen sequence | Narration |
| --- | --- | --- |
| **0:00–0:20 / 0–599** | Open Home in a fresh walletless context; hold forest/survivor composition. Show the demo disclosure and Enter the Wild. Brief title caption: “CHOG SURVIVOR — public simulation + recorded local-chain evidence.” | “The Chog NFT is not a key that unlocks Chog Survivor. The Chog NFT is the survivor itself. Its wallet is only today's controller. This public demo is a simulation; the confirmed blockchain evidence you'll see later comes from our isolated local chain.” |
| **0:20–1:00 / 600–1799** | 0:20 Home environment and fog; 0:30 show optional wallet button without clicking; 0:38 Character unavailable-state/identity explanation; 0:49 Home then Enter the Wild; 0:55 hold labeled demo HUD and three cards. Use one short mobile inset if legible. | “Anyone can enter the wild without a wallet, funds or an NFT. The environment sets the mood; XP, Trust and Scars describe the survivor we're building. These displayed demo stats are fixtures and aren't saved. Optional wallet connection verifies genuine NFT ownership, but production game transactions are disabled. The Character screen keeps verified identity separate from unavailable progression. Our design makes the token ID the permanent protagonist.” |
| **1:00–1:45 / 1800–3149** | 1:00 cautiously tagged card → Survivor's Trial, Easy, three safe row moves; 1:15 Continue → simulation disclosure → Escape; 1:20 reckless card → Timing Start/Stop near center (or clearly label untimed reduced-motion mode); 1:30 Continue/Escape; 1:33 compassionate card → Story response → Continue; 1:41 hold base-delta preview and disabled onchain button. Card positions vary; follow category labels. | “Every day presents a choice with a trade-off. Cautious choices offer Survivor's Trial: choose a safe route. Reckless choices use Timing; compassionate choices offer a Story response. Each interaction is optional. Difficulty, performance and Skip never change the original contract choice or its rewards. Completing an interaction opens a clearly labeled rulebook preview. This is exploration, not an onchain action, and it earns no persistent XP or achievements.” |
| **1:45–2:25 / 3150–4349** | Hard cut to caption **“RECORDED LOCAL ANVIL EVIDENCE · chain 31338 · fixture NFT #2006 · captured 15 Oct 2026”**, retained throughout this segment. 1:48 receipt excerpt/hash/block/status; 1:58 confirmed-reaction still; 2:07 transfer receipt B → A; 2:17 before/after state comparison. Use original data, not a newly animated wallet confirmation. | “Now we switch to recorded real local-chain evidence. This is fixture NFT two thousand and six on Anvil chain thirty-one thousand three hundred and thirty-eight, not genuine Chog Genesis on Monad. Wallet B confirmed the Ancient Gate action: eighteen XP, four Trust, no Scars, and First Light. The receipt backs those results. B then transferred the fixture to Wallet A. The confirmed transfer changed its controller while the survivor's stored state stayed the same.” |
| **2:25–2:50 / 4350–5099** | Keep local-evidence label. 2:25 inherited-journal.png showing historical actor B/current owner A; 2:36 wallet-a-daily-lock.png; 2:44 receipt/state excerpt lastActionDay 20741, hasActed true, same achievement mask. Caption: “Historical lock on the action's UTC day; not a claim about today.” | “The journal still attributes the original action to B. A inherited the same progression, First Light and that day's lock. One action belongs to the NFT per UTC day; transferring it cannot reset that limit. The old owner loses authority, but the Chog keeps its history. These are recorded local results, not current mainnet state.” |
| **2:50–3:00 / 5100–5399** | Return to Home, final links visible as captions. “Built for Monad · mainnet launch pending separate approval.” End at/before frame 5399. | “On Monad, each Chog can carry a living, transferable story. Try the walletless simulation. Mainnet gameplay awaits separate review and approval.” |

## Exact evidence to use

All four retained evidence files match their recorded SHA-256 manifest. Use [the curated package](evidence/task4h-2006/README.md) and [verification.json](evidence/task4h-2006/verification.json), not fabricated fixtures from browser tests.

- Action: `0xfcd6afa0d8d95283c407631dcd30685725be229e40826ff62f9346c6c44c1a9f`, local block 15, status success, UTC **2026-10-15 12:20:52**. `act(2006, 1)` resolved event 4 / outcome 10. The short `confirmed-reaction.png` still is historical pre-Task-4I UI; its background exposed the subsequently fixed stale-lock issue. Crop to the reaction only or explicitly caption the provenance. Never use that background as evidence of the fixed lock.
- Transfer: `0x8b3a59458ec349146bcf86c45141c14043561b8ee33779d91daacdf537516933`, local block 16. `Transfer` for token 2006, B (`0x7099…79C8`) → A (`0xf39F…2266`). No public Monad explorer can attest these local hashes.
- Before/after values: XP 18, Trust 4, Scars 0, streak 1, unmarked streak 1, achievement mask 1, last action day 20741, hasActed true. Show the equality directly from `afterAction` and `afterTransfer`.
- `inherited-journal.png` preserves historical actor; `wallet-a-daily-lock.png` demonstrates the inherited lock at capture time. Do not connect to today's Anvil and imply the historical same-day lock must still be active.

Do not run `task4h-real-anvil-e2e.mjs`, `npm run test:e2e`, deployment/install scripts, mint/transfer/act commands, or time-travel RPC for filming. Mocked Chromium confirmations are test fixtures and must not appear in the real-evidence section.

## Playwright capture

Playwright is already installed; no dependency installation is needed. The new [final-demo-browser script](../frontend/scripts/final-demo-browser.mjs) checks Home/Adventure/Character/Settings, actual font loading, artwork, all three interactions, moving and reduced-motion behavior, and walletless safety at 1440×1000 and 375×812. `--record` saves raw WebM interaction clips and screenshots. It installs a rejecting mock wallet, blocks RPC/non-GET requests and never clicks Connect. Those clips are **simulation footage**, not NFT ownership evidence.

First build the reviewed local candidate, from `frontend`:

```sh
VITE_CHOG_ENV=production VITE_MONAD_RPC_URL= VITE_LOCAL_RPC_URL= VITE_LOCAL_CHOG_SURVIVOR_ADDRESS= VITE_LOCAL_CHOG_SURVIVOR_DEPLOYMENT_BLOCK= npm run build
CHOG_CAPTURE_DIR=/tmp/chog-5a-recording node scripts/final-demo-browser.mjs --record
```

For separate footage of the currently published site:

```sh
CHOG_CAPTURE_DIR=/tmp/chog-5a-live-recording node scripts/final-demo-browser.mjs --live --record
```

Do not mix up the local candidate and live site: Task 5A's new disclosure/title is not deployed. Raw automation clips include navigation/checks and are not a finished three-minute edit. Preserve source disclosure text in crops. Current raw dimensions are intentionally suitable for UI verification; for a 1080p master use a capture-only copy of the script with viewport and recordVideo size both 1920×1080, retaining all request guards, or frame the existing clip without enlarging small text. Keep source clips and their origin manifest.

For a manual continuous take, use the same guarded Playwright context with `headless: false`, `recordVideo: {dir, size: {width:1920,height:1080}}` and viewport 1920×1080. Navigate without connecting; follow the time-coded sequence. Close the context before collecting `await page.video().path()` so video is finalized. If the browser displays a security warning, stop that capture; do not bypass or disable it. Use the already reviewed local simulation for UI footage while official domain review is pending, and identify it as a local frontend build.

Playwright WebM capture does **not** capture the browser's audio output. Record narration separately and capture procedural game audio via an approved system loopback recorder if wanted. The tested audio controls work after a user gesture; keep effects quiet beneath narration and verify mute/reload behavior. Do not claim a silent automated clip proves audio recording. Existing image/font assets are not changed by capture.

## Editing, Remotion and export

FFmpeg is installed. Remotion is **not** installed or declared in this project; no package was installed and no render is claimed. Do not run `npx` to fetch an undeclared renderer as part of this task.

If an already approved Remotion workspace becomes available, compose six non-overlapping `Sequence` blocks at frames 0, 600, 1800, 3150, 4350 and 5100 with durations 600, 1200, 1350, 1200, 750 and 300. Use the captured WebM/video and original PNG evidence as media; captions must distinguish simulation from recorded Anvil evidence. Set the composition to 1920×1080, 30 fps, 5,400 frames maximum, add the separately recorded voiceover, and render H.264 MP4 using that workspace's pinned CLI. Keep the existing licensed font files and established font families for any UI-faithful captions; do not edit game typography. The outline is an editing specification, not a tested Remotion project.

An installed FFmpeg editor can normalize reviewed clips, e.g.:

```sh
ffmpeg -i /tmp/chog-5a-recording/REVIEWED_CLIP.webm -vf "fps=30,scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2" -c:v libx264 -pix_fmt yuv420p -an /tmp/chog-5a-normalized.mp4
```

Replace the placeholder with the selected local filename; this command is not a final edit and adds no narration/disclosures. Use an editor for legible evidence captions, straight cuts and narration alignment. Verify final duration with `ffprobe`, play the actual MP4 on desktop/mobile, check audio/caption readability, and review every blockchain claim before publication approval. Leave the video URL pending until a real export and approved upload exist.

## Recording decision

**GO for private preparation/capture of truthful simulation plus historical local evidence.** No fresh blockchain footage is required. **NO-GO for a claim of live Monad gameplay, fresh #2006 transactions, or an unqualified security clearance.** Public video/submission release still needs asset/branding clearance, provider-warning follow-up, organizer eligibility confirmation, final team/contact fields and explicit publication approval.
