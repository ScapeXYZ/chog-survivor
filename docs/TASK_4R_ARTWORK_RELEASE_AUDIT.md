# Task 4R — Artwork release and licensing audit

Date: 2026-10-15. Task 4Q report reviewed. Audit only: this report is the sole new change. Existing assets, code, fonts and settings were not modified. No generation, replacement, deployment, commit or push.

**Decision:** The three runtime bitmap illustrations are not cleared for public release by the available records. Generated origin, private backup, filenames and Git authorship are not evidence of ownership or a license grant. The smallest safe release path is to document existing rights and obtain release approval for these exact assets; no replacement is needed if that evidence can be established.

## Runtime assets — complete first-party image inventory

Paths below are relative to `frontend/src` unless specified. Reuse of the same file does not create a separate licensed asset.

| Asset | Actual runtime uses | Source/history evidence | Release status and required action |
|---|---|---|---|
| `assets/ruined-wild-environment-provisional.webp` | Home background; demo and local Adventure scenery; Survivor’s Trial CSS map background | Inventory attributes it to original Codex image generation, Task 9A.3; PNG/WebP first committed in `43c275d` on October 12 | **Hold.** Inventory says local-development only, not release-approved. Retain generation/source records, establish applicable service/account rights and reference-image permissions, obtain project rights/IP and public-use approval. |
| `assets/moonlit-fog-overlay-provisional.webp` | Home front/back fog; demo and local Adventure mist layers | Same Task 9A.3 inventory attribution; first committed in `43c275d` | **Hold.** Same provenance and release evidence required. Animation/CSS reuse does not change underlying rights. |
| `assets/survivor-creature-refined-provisional.webp` | Home survivor; Survivor’s Trial portrait and moving player; confirmed survivor reaction illustration | Inventory attributes it to original Codex generation, Task 9A.6; first committed in baseline `43c275d` | **Hold.** Obtain generation/reference-rights evidence plus Chog likeness/branding clearance from the appropriate rights holder and explicit project release approval. Not verified official Chog Genesis art or selected-token artwork. |
| Character `Ornament` and `SurvivorSeal` inline SVG | Sheet corners, geometric seal/portrait placeholder | Paths are written directly in `Character.tsx`; component introduced in `c98ccde` | **Code-native; no separate third-party image license found.** Project maintainer must confirm contributor authority/no copied source and approve release under the project’s intended terms. No claim of exclusive originality from path inspection alone. |
| Character paper-noise data SVG | Parchment texture in `character.css` | Inline `feTurbulence` filter and rectangle; no external texture file | Same code-native status; no external image attribution identified. |
| Trial `TerrainIcon` SVGs | Safe/mountain, hazard warning, shelter, destination gate, Chog outline, tree and rune; some paths are conditional/unused | Seven path definitions in `SurvivorTrial.tsx`, introduced in backup `2f3e9cb`; no icon-library import or source attribution found | Same code-native status. Confirm contributor provenance; do not infer an external icon-pack license or ownership from simple geometric shapes. |
| Trial route SVG | Connecting path strokes between map nodes | Computed directly from board positions in `SurvivorTrial.tsx` | Same code-native status. No external map image. |
| CSS-rendered scenery and UI | Gradients, grain, fog/vignette treatment, mountains, stones/lanterns, encounter seals, card/category marks, borders, buttons, parchment shading; CSS portrait parts where retained | `styles.css`, `adventure.css`, `character.css`, `survivor-trial.css`, `mini-game.css`; CSS shape/gradient definitions rather than stock images | Same code-native status. Inventory documents stones/lanterns as CSS. No separate purchased texture or stock-art license was found. CSS rules that reuse the above WebP files inherit their holds. |
| Text symbols and UI glyphs | Arrows, status/category/achievement and control symbols rendered as text | Component/game-data strings and existing system/web fonts; no standalone icon files or runtime icon pack imported | Preserve existing font terms; no separate illustration license identified. Chog/Monad names are branding, not automatically licensed by using text. |

Import/URL review covered all frontend source TSX/CSS, `index.html`, `frontend/public` and asset directories. No standalone runtime SVG/PNG/JPEG/GIF/favicon file, external stock image service or additional icon-image asset was found. Three WebP files are the complete runtime raster set; the other public static asset is the font license. Character parses optional NFT metadata but explicitly withholds artwork; metadata ownership/availability would not establish redistribution permission.

## Non-runtime/source assets — do not conflate with hosting output

| Asset | Trace/classification | Required approval |
|---|---|---|
| `assets/ruined-wild-environment-provisional.png` | Source counterpart; baseline `43c275d`, absent from artifact | Same rights and release hold as environment WebP. |
| `assets/moonlit-fog-overlay-provisional.png` | Source counterpart; baseline `43c275d`, absent from artifact | Same hold as fog WebP. |
| `assets/survivor-creature-refined-provisional.png` | Source counterpart; baseline `43c275d`, absent from artifact | Same hold as refined survivor WebP, including branding. |
| `assets/survivor-creature-provisional.png` and `.webp` | Superseded draft; inventory attributes Task 9A.3 generation; baseline `43c275d`; no runtime import | Generation/reference evidence and branding clearance before public source/media distribution. |
| `design/chog-identity-reference.png` | Baseline `43c275d`; art brief calls it visual direction, not a crop/redistribution source | **Unknown grant.** Obtain creator/source and collection-art/likeness permission. |
| `design/chog-landing-reference.pdf` | Baseline `43c275d`; visual direction with embedded character imagery | **Unknown grant.** Obtain document and embedded-art redistribution permissions. |
| `design/chog-parchment-reference.png` | Added `3a65935`, October 15; non-runtime layout reference, JPEG data despite suffix | **Unknown provenance/license.** Obtain source/creator and written permission before public repository/video inclusion. |
| Documentation screenshots and video frames containing provisional images | Derivative evidence/media, not runtime image imports | Underlying asset clearance still applies; approval for a private screenshot is not public redistribution approval. |

Git establishes when files entered the repository, not when they were generated or who legally owns them. The baseline imports both original and refined drafts at once, so it cannot independently prove the Task 9A.3/9A.6 creation sequence. That sequence is an inventory claim. Prompts, generation receipts/account entitlement, complete reference inputs and a signed rights grant were not located in the reviewed asset documentation/history. No author/source license was found for the three design references. They should be treated as potentially third-party material with unknown rights, not asserted original project art.

## Licenses and attribution

- Bitmap assets: no asset-specific license/grant or required attribution text was found. This means **unresolved**, not attribution-free or prohibited by a proven third-party license. Crediting a creator alone would not resolve missing permission.
- Code-native drawings: no third-party attribution requirement was identified in the inspected definitions. Project/contributor authority remains distinct from licensing third-party artwork. Do not apply an assumed repository license to unknown design references.
- Local `LilitaOne-Regular.ttf`: third-party font, Juan Montoreano copyright and SIL OFL 1.1 documented in `assets/fonts/OFL.txt`; introduced in `22571ad`. Existing public `/licenses/LilitaOne-OFL.txt` preserves the license/copyright text. Keep these notices. OFL font distribution requires copyright/license information; see the [official OFL FAQ](https://openfontlicense.org/ofl-faq/). No font change is proposed.
- Existing Cinzel, IM Fell English and Uncial Antiqua imports remain Google-hosted, not additional illustration files. No modification or self-hosting is proposed. This artwork audit does not certify separate font binaries that are not bundled.

## Safest release path

1. Keep current public deployment on hold. Obtain a small written clearance record for each of the three runtime WebPs, naming the exact file/hash, creator/service, reference inputs, applicable usage rights, rights holder/approver, permitted public web and promotional use, attribution and date.
2. Resolve survivor branding/likeness permission separately; project-owner approval alone cannot substitute for a third-party rights-holder grant. The same review should address use of Chog/Monad names without implying endorsement.
3. Confirm code-contributor provenance for inline/CSS art. Preserve existing font notices. Update release records only after evidence is supplied; no clearance was inferred in this audit.
4. Keep source PNGs, superseded drafts and unknown design references out of static hosting. Public repository, screenshots and video need their own scope of clearance; publishing only `dist` avoids distributing references but still includes the three uncleared runtime WebPs.
5. If permissions cannot be established, request a separate, explicitly approved removal/replacement task for only the affected artwork with documented rights. No replacement or visual redesign is authorized or performed here.
6. Once rights are documented, approve the exact artifact and Vercel destination, then rerun preflight before deployment. Current technical test results remain those recorded in Task 4Q; no tests/build were rerun for this documentation-only audit.

Evidence: `frontend/ASSET_INVENTORY.md`, `docs/CHOG_CHARACTER_ART_BRIEF.md`, Task 4K staging plan, Task 4M audit, Task 4Q report, source import/URL/inline-drawing inspection and Git addition history. This is an evidence-based release assessment, not a legal ownership determination.
