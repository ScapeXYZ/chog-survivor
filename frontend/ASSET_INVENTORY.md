# Local Development Asset Inventory

This inventory covers the Task 9A.3 Home-screen art pipeline. These assets are
for local development and screenshot review only. They are not evidence of
Chog Genesis branding permission, collection-art provenance, or release
approval.

| Asset | Purpose | Source / creator | Rights status | Resolution | Status |
|---|---|---|---|---:|---|
| `src/assets/ruined-wild-environment-provisional.webp` | Background, distant ruins, moonlight, midground terrain, foreground rocks | Original Codex image-generation output, Task 9A.3 | Provisional local-development artwork; rights/IP review required before release | 1672×941 | Provisional; not release-approved |
| `src/assets/survivor-creature-provisional.webp` | Earlier right-side survivor draft; retained as a non-runtime source | Original Codex image-generation output, Task 9A.3 | Provisional; it is not official Chog Genesis art and needs Chog branding/IP permission before release | 1024×1536, alpha | Superseded by refined local draft; not release-approved |
| `src/assets/survivor-creature-refined-provisional.webp` | Runtime right-side compact creature survivor and rocky outcrop layer | Original Codex image-generation output, Task 9A.6 | Provisional; it is not official Chog Genesis art and needs Chog branding/IP permission before release | 1024×1536, alpha | Provisional; not release-approved |
| `src/assets/moonlit-fog-overlay-provisional.webp` | Foreground and midground drifting fog overlay | Original Codex image-generation output, Task 9A.3 | Provisional local-development artwork; rights/IP review required before release | 1672×941, alpha | Provisional; not release-approved |

Lossless PNG source files sit beside the WebP runtime derivatives to preserve
alpha and permit later production processing. No third-party stock image,
collection screenshot, or PDF concept art is bundled. No audio file is present.

## Task 10.1 Adventure assets

Adventure reuses the existing environment and fog without modifying them.
Outlined foreground stones and lanterns are CSS shapes; no new bitmap art,
character replacement, external stock, or generation service was used.

| Asset | Purpose | Source / creator | License | Status |
|---|---|---|---|---|
| `src/assets/fonts/LilitaOne-Regular.ttf` | Adventure display headings and game labels only | Lilita One, Juan Montoreano; existing local font inspected with `fc-scan` | SIL Open Font License 1.1, bundled in `src/assets/fonts/OFL.txt`; reserved name Lilita | Unmodified, locally hosted; Home fonts untouched |

Future refinement needs approved layered 2D encounter illustrations (bridge,
stranger, storm shelter, gate, lost Chog, beast) and an authorized clean-alpha
survivor consistent with `docs/CHOG_CHARACTER_ART_BRIEF.md`. The existing
environment is a cinematic provisional illustration; CSS foreground props do
not replace a fully hand-illustrated encounter set. No new character is shown
in Adventure while that artwork remains unavailable.
