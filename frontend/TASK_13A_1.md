# Milestone 13A.1 — Professional game audio and Settings polish

Baseline: `cf809d6fe416279d3685b279f63b093cffa067e3` on 2026-10-13. The pre-existing untracked parchment reference was preserved. `src/ChogSurvivor.sol` was not modified; its SHA-256 remains `5a996b04ee91f99c9da5bbe04ccaed69b2d0f887d3fef640be10e205123638c7`.

## Architecture and provenance

The former Settings control referenced an undefined `soundtrackSource`, so no `<audio>` element existed and its test button could only repeat the licensing placeholder. The replacement is a single application-lifetime `GameAudioEngine` in `src/audio.ts`. It creates a Web Audio graph only after a user click, routes music and effects through independent gain nodes into a master gain, and closes its context when the application unmounts. Route changes do not recreate the engine or restart the score.

The soundtrack and effects are original procedural synthesis written for this repository. No recording, sample, remote asset, copyrighted song, Chog artwork, or third-party music is included. The score uses a quiet D-minor motif (D3, F3, A3, G3, C4, A3, F3, E3), two low sine drones, and a restrained triangle pulse. Browser oscillators synthesize every tone locally. The short interface cues use separate original frequency, timing, and envelope patterns.

Audio cues cover general buttons, entering Adventure, choosing a path, opening the result/confirmation dialog, confirmed receipts, rejected or failed transactions, newly earned achievements, and transition into the daily-lock state. The confirmed cue is emitted only after a successful receipt. Achievement cues require a decoded receipt event for the selected token, rather than preview predictions. Failed/rejected requests use the failure cue. Refresh rejection after confirmation is disclosed separately and does not produce a transaction-failure cue. Rendering alone does not replay cues; the daily-lock cue is transition guarded.

## Settings behavior

Settings now exposes Background Music, Sound Effects, Mute All, Master Volume, Music Volume, Effects Volume, Test Sound, and live Game Information. Values are stored under `chog-survivor.audio-preferences`; the Milestone 12 three-field format is migrated safely. Mute immediately sets the master channel to zero and stops the background oscillators while preserving saved channel levels. Unmute recreates one music loop. Disabling effects prevents cue node creation. The Test Sound reports muted, disabled, playing, or browser-blocked state through an accessible live region.

All controls are native buttons/ranges with labels and existing focus treatment. Capture-phase click activation supports mouse, touch, and keyboard-generated clicks. The responsive Game Information grid collapses on narrow screens. Motion behavior remains subject to the existing `prefers-reduced-motion` rules; audio has no motion dependency.

## Browser restrictions and performance

The engine never creates or resumes `AudioContext` during render or page load. The first user click attempts `resume()` and queues the requested cue within that gesture. If the browser rejects activation, the UI reports the block and Test Sound provides another explicit attempt. One interval advances the motif every 2.4 seconds, only two continuous drones exist, notes stop after their envelopes, and mute/music-off/unmount clear the interval and stop drones. Mobile browsers may suspend audio when backgrounded; the next explicit interaction can resume it.

## Testing evidence

Automated audio instrumentation uses a fake Web Audio graph rather than testing button labels alone. It verifies preference persistence and legacy migration, gain changes, mute, independent toggles, autoplay rejection, a single music instance across repeated unlocks, effects suppression, transaction/achievement cue ordering, timer/drone cleanup, and context close. App coverage verifies settings survive an unmount/remount. Existing Adventure and contract behavior tests remain intact.

Validation commands:

```bash
cd ~/chog-survivor/frontend
# Production-mode suite (temporarily keep the ignored local runtime env aside)
mv .env.local /tmp/chog-audio.env.local
npm test -- --reporter=dot
npm run typecheck
npm run build
mv /tmp/chog-audio.env.local .env.local

# Local build and browser journey with the documented Anvil environment
npm run build
npm run test:audio-browser

cd ~/chog-survivor
git diff --check
sha256sum src/ChogSurvivor.sol
```

Chromium instrumentation captures actual nonzero PCM waveform samples through a native `AnalyserNode` after interaction, silent samples after mute/channel-off, and restored samples on unmute. It also verifies one context across routes, persisted mute after reload, no browser errors, and Settings overflow at 360, 390, 430, 768, 1024, 1280, 1440, and 1920px. Evidence and screenshots are generated in `frontend/reports/audio/`. Physical-speaker loudness and device-specific mobile playback still require listening during demo rehearsal.

Final validation: **132 frontend tests passed across 11 files**, typecheck passed, production build passed, local build passed, browser audio smoke passed (16 checks), and `git diff --check` passed. Existing non-fatal Rollup annotation/chunk-size warnings remain. The full local gameplay harness was attempted and completed its two browser-signed actions, fixture transfer, journal, daily lock, and responsive journey, then failed its first experimental audio assertion. That exposed a Strict Mode lifecycle defect, which was corrected and verified by the dedicated audio smoke. The full gameplay harness was not rerun after the fix, to preserve the now-running chain and its test history. Its tracked Milestone 12 evidence was preserved rather than replacing it with a failed report.

## Safety and limitations

Audio is frontend presentation only. It does not alter ownership, authorization, gameplay, contract state, ABI, wallet configuration, or history. Local transaction cues cannot authorize or redirect writes. Monad production gameplay remains disabled. A cue is supporting feedback; the visible receipt and refreshed contract reads remain authoritative.
