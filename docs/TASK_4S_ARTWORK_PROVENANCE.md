# Task 4S — Artwork provenance investigation

Date: 2026-10-15. Scope: the three provisional runtime images. **Provenance recovered; public-release clearance remains conditional, and the survivor needs Chog permission.** This report is the only project file created by this investigation. No artwork, fonts, gameplay or contracts were changed; no generation, deployment, commit or push was performed.

## Evidence recovered and limits

The original local Codex session was recovered at:

`/home/temitope/.codex/sessions/2026/10/12/rollout-2026-10-12T09-45-28-01a12f49-ce89-7611-afcc-0af4d11b659b.jsonl`

Line numbers below refer to that JSONL file. The relevant original PNG outputs still exist under `/home/temitope/.codex/generated_images/01a12f49-ce89-7611-afcc-0af4d11b659b/`. Each is byte-identical to its corresponding project PNG. Re-encoding those PNGs **in memory only** with the recorded Pillow WebP settings reproduces every current runtime WebP byte for byte. This establishes the generation-output → source-PNG → runtime-WebP chain beyond the inventory's prior attribution.

Generation service: **OpenAI's built-in Codex `image_gen__imagegen` tool**, called by the Codex assistant at the project user's direction. No human illustrator or stock supplier is identified. The defensible production credit is AI-generated with OpenAI image generation, prompted/integrated through Codex. A named human legal author, account/customer identity, account plan, exact model version and project ownership chain are **not established** by the tool name or local username. No credentials, billing records or unrelated private conversations were copied into this report.

Reviewed Task 4Q, Task 4R, `frontend/ASSET_INVENTORY.md`, character art brief/checklist, relevant session prompts/tool results and Git asset history. Original records improve the earlier audits' missing-prompt finding; earlier reports remain unchanged. This is an evidence assessment, not a finding of copyrightability, exclusive originality or non-infringement.

## Asset-by-asset findings

All creation times below are UTC on 2026-10-12. Project paths are under `frontend/src/assets/`.

| Runtime asset | Recovered creation and processing history | References and rights finding | Recommendation |
|---|---|---|---|
| `ruined-wild-environment-provisional.webp` | Task 9A.3 pipeline. Call 11:52:31, line 988; successful output line 991: `exec-55a650f2-7a66-4d53-abd6-da85280c7513.png`. Copy/conversion line 1004, WebP quality 88, method 6. 1672×941 RGB. | Text prompt requests original moonlit forest, ruined gateway, dark left space, no characters/text/logos or recognizable copyrighted game locations. Agent had inspected user PDF before generation. No explicit reference-image parameter in successful call; no evidence of pixel cropping/compositing from PDF. Prompt wording alone does not establish reference rights. | **Can be considered for clearance; not cleared here.** Confirm account/customer-to-project rights, PDF reference basis and human similarity/release review for the exact file. No evidence currently requires replacement. |
| `moonlit-fog-overlay-provisional.webp` | Task 9A.3 pipeline. Call 11:55:06, line 1011; successful output line 1014: `exec-25e79b85-94ca-4644-8431-dacf3b4809b0.png`. Copy/conversion line 1018, quality 86, method 6. 1672×941 RGBA. | Text prompt requests only sparse blue-grey transparent fog, no objects, characters, logos or text. No explicit image attachment or third-party texture source found. Same earlier conversational reference context. | **Strongest clearance candidate; not cleared here.** Document account/project entitlement, applicable terms, human review and intended distribution approval. No identified Chog imagery in fog itself; no evidence currently requires replacement. |
| `survivor-creature-refined-provisional.webp` | Task 9A.6 request line 1083. Call 12:09:47, line 1096; successful output line 1099: `exec-f06247dc-5806-46e4-b80c-3cde77067954.png`. Copy/conversion line 1105, quality 90, method 6. 1024×1536 RGBA. | Text prompt requests compact blue-grey creature, large head, five swept-back spikes, icy eyes, four paws and rock base; excludes clothing, logos and official Chog claims. User explicitly requested Chog resemblance and kept artwork provisional pending branding/IP permission. No explicit image attachment in successful call. | **Needs permission.** Establish account/project rights and obtain authorization from the appropriate Chog artwork/character/brand rights holder for this likeness and intended uses. If permission is refused or cannot be established, replace/remove in a separately authorized task. |

All eight artwork PNG/WebP files first entered repository history in baseline `43c275d` (2026-10-12). That commit alone does not prove generation or rights; recovered session records and byte comparisons now substantiate production history. Runtime reuse includes Home, Adventure, Trial and confirmed-reaction components as listed in Task 4R.

## Third-party references and later generation attempt

- **`design/chog-landing-reference.pdf`:** user supplied five-page reference, originally described as `/mnt/data/new pdf.pdf`, then placed in the project (session lines 681 and 702). The agent extracted and viewed its scene image and collection screenshot (lines 750–787), and inspected page-content streams (line 794). Reinspection here confirms a moonlit ruined-forest scene containing a spiky creature and a photographed OpenSea Chog Genesis banner. The screenshot visibly names **ChogLabs** and includes OpenSea/Chrome branding and UI. This establishes third-party visual material in the reference; neither a screenshot nor a creator label establishes a grant. Original scene creator, photographer, embedded-art licenses and authority to upload/use those inputs remain unknown.
- **`design/chog-identity-reference.png`:** opaque armored/scarf-wearing Chog-like promotional render; source/creator/license unresolved. Inspected during later Task 9A.9 (lines 1246–1251), after all three successful runtime generations. It was explicitly passed via `num_last_images_to_include: 1` in a later attempt (line 1260), which failed with HTTP 400/output moderation rejection (line 1263). No output path or replacement followed; current survivor bytes match the earlier Task 9A.6 output. The failure is not evidence of infringement or clearance.
- **User target/current screenshots:** Task 9A.6 describes two supplied images and permits fallback to the existing PDF. The stored user message at line 1083 contains text only; no separately recoverable attachment for those two screenshots was found there. Do not invent their original filenames, creators or licenses.
- **`design/chog-parchment-reference.png`:** later non-runtime layout reference, added in `3a65935` on October 15. No evidence it fed the October 12 successful generations. Unknown rights remain separate.

The three successful runtime calls contain only `prompt` and `transparent_background`; neither `referenced_image_paths` nor `num_last_images_to_include` is present. This proves absence of explicit image attachments in the recorded requests, **not** independence from earlier visual inspection, textual descriptions, possible service context or model training. No third-party logo is apparent in the inspected runtime images; reference screenshots do contain third-party branding. No evidence of direct extraction of collection pixels into runtime files was found.

## Available terms and publication scope

Official pages checked 2026-10-15; these are current retrieved texts, not evidence of the account's accepted contract or a saved October 12 terms snapshot.

| Evidence | What it supports | What it does not establish |
|---|---|---|
| [OpenAI Terms of Use](https://openai.com/policies/terms-of-use/), effective January 1, 2026, Content and Using our Services | Assigns OpenAI's output rights, if any, to the user to the extent allowed by law. Requires input rights, lawful use and human evaluation; forbids presenting generated output as human-generated. | User/account identity, authority to act for the project, third-party Chog rights, exclusivity or copyright protection. Consumer terms may not be the applicable agreement. |
| [OpenAI Services Agreement](https://openai.com/policies/services-agreement/), effective January 1, 2026, §§3.3 and 4.1–4.4 | Business/customer alternative: output rights assigned to customer, subject to law; customer responsible for inputs and use; output may be similar to others'. | Which agreement, order form or organizational ownership applied to this session. Internal Media Service metadata is not proof the user purchased API access. |
| [OpenAI Sharing & Publication Policy](https://openai.com/policies/sharing-publication-policy/), updated November 14, 2022 | For demonstrations/social sharing: review generations, attribute to the responsible person/company and clearly disclose AI generation. | Chog authorization, a required OpenAI logo, or permission to claim a human illustrator made these files. |
| [Chog website](https://www.chog.xyz/) and [builder program](https://build.chog.xyz/), reached through [chognft links](https://linktr.ee/chognft) | Main site reserves rights. Builder program offers the brand to builders through application/review and includes gaming. | Blanket license for these reference images, these generated likenesses, repository redistribution or this project's acceptance. No applicable grant was found on inspected pages. |
| [Chog Genesis collection](https://opensea.io/collection/chog-genesis) | Lists ChogLabs as creator, consistent with reference screenshot. | The named natural-person illustrator, full rights-holder chain, or a commercial/artwork redistribution license. |

**Inference from these terms:** ordinary website display, promotional-video use and repository distribution are not inherently excluded by OpenAI's output-rights provisions. A bespoke OpenAI permission letter is not shown to be necessary if the applicable agreement and entitled project party are established. Those provisions cannot grant rights held by Chog or the unknown reference creators. No asset-specific CC/stock license or signed transfer was located.

| Intended publication | Evidence still needed |
|---|---|
| Public website | Identify the service user/customer and project authority; document applicable terms and reference-use basis; review exact files; obtain product release approval. Survivor additionally needs Chog permission. |
| Promotional video/screenshots | Same underlying rights plus promotional/audiovisual scope; clear AI-origin disclosure and responsible project/person attribution. Local-development or visual-layout approval does not supply this scope. |
| Public repository | Permission covering downloadable source PNGs and runtime derivatives, forks/reuse as intended, and an explicit project asset-license decision. Do not apply a permissive code license to uncleared images/references. Unknown design references require separate permission or exclusion from a future public distribution, including relevant history. |

Suggested future credit after entitlement is confirmed: “Illustrations generated with OpenAI image generation; prompted and integrated through Codex for Chog Survivor.” Add the responsible owner/company and any Chog-required credit only when verified. No credit text by itself cures missing permission. No notices or UI were changed here.

## Exact-file register (SHA-256)

These are file-byte hashes, not perceptual hashes. PNG rows for the three runtime stems also identify the byte-identical original generated files mapped above.

| Project file | Bytes | SHA-256 |
|---|---:|---|
| `frontend/src/assets/ruined-wild-environment-provisional.webp` | 256592 | `0945a6b8824501d44af463e520c72ca98bd55b5cd6df55c1a89b01ce20894ef0` |
| `frontend/src/assets/ruined-wild-environment-provisional.png` | 2509315 | `88adc89e2a8b0afef4e3370dd6380fad7037a495d73cf898bf01379a5ca15b95` |
| `frontend/src/assets/moonlit-fog-overlay-provisional.webp` | 228108 | `c5f90681c66899c851683478173f3d36bab007002b1d1ece06a21ce30a445d82` |
| `frontend/src/assets/moonlit-fog-overlay-provisional.png` | 1309913 | `11dc8a9450a1a6155d46b90cd214d04a5a9c4e97c56442902f6e10d795645490` |
| `frontend/src/assets/survivor-creature-refined-provisional.webp` | 360132 | `51865d1166bcb1bd003f969b8199bdcbc35a41eae1692a902731933dd8949db0` |
| `frontend/src/assets/survivor-creature-refined-provisional.png` | 2535094 | `18563139a30022ffaea49fe0a6f99a66fe599354657c5a6e5af9f9433a0aac8e` |
| `frontend/src/assets/survivor-creature-provisional.webp` | 396764 | `91436fa23f343cf36e3c82867d275657f5dc88a4df1dcac8f3e9b0a4d83b93c4` |
| `frontend/src/assets/survivor-creature-provisional.png` | 2692779 | `42645b06d30a1b2d6e01f5a0599191db0e282f4c221ac1bc5f6d99ca3833edc8` |
| `design/chog-landing-reference.pdf` | 3759539 | `e7e4066b59edf2d764e4e0928d0631e288b05a541983dfa14f95e57f84587adc` |
| `design/chog-identity-reference.png` | 2522965 | `eadeb2ceb43b3b1016c76007827a40aa5ebc8129eaec27cb75b05bfef971e427` |
| `design/chog-parchment-reference.png` | 249404 | `93089bf31e85a09a1cdfa8d3bc4ebce011b39e3d692328e004cb13be08b69c4d` |

The earlier survivor draft maps to `exec-ecd6684f-ab14-402b-ba44-3897d6ee4c46.png`: successful call line 995/result 998, copied at line 1004 with quality 88/method 6. It is not a current runtime dependency. Existing `dist` contains only the three runtime WebPs; design references and source PNGs are absent.

## Verified, missing and release decision

**Verified:** generation tool/service, original requests, successful tool-result paths, PNG identity, exact WebP derivation, dimensions, creation sequence, earlier PDF inspection, failed later identity-reference generation, and published general terms.

**Missing:** legal service user/customer and project entitlement, applicable accepted agreement/addenda, reference creators and permissions, Chog character/branding license, any project-specific builder acceptance/grant, human release approval covering all three media scopes and exact hashes. Later user approval describing Home as final is visual/product direction, not an identified third-party rights grant.

**Decision:** environment and fog can be cleared through documented entitlement/reference review and release sign-off; no mandatory replacement is established. Survivor requires Chog permission in addition. Until these gaps are resolved, none is marked publicly cleared. If needed rights cannot be established, affected assets must be excluded or replaced before public release under a separate authorized task. Do not regenerate solely because a prompt receipt was previously missing: that receipt has now been recovered.

Preserve the recovered local records privately; do not publish the full session, which contains unrelated project conversations. No communications to rights holders or service providers were sent. No tests/build were necessary for this documentation-only investigation.

## Recovered successful prompts (verbatim)

The prompts below are retained for review without copying unrelated session contents. All three calls omitted explicit image-reference parameters.

### Environment — Task 9A.3

`transparent_background`: false. Session line 988.

```text
Use case: stylized-concept
Asset type: wide cinematic background for a local React game landing page
Primary request: original premium dark-fantasy horror-adventure environment, with NO characters and NO text. A deep abandoned forest at midnight: ancient blackened trees and twisted branches frame both edges, wet uneven stone path with rocks, roots, puddles and rubble in the foreground, a monumental ruined medieval stone gateway centered in the distance with fractured pillars and broken towers, cold blue-white full moon and clouded sky behind the arch, moonlight through the arch illuminating blue-grey ground fog. Restrained crimson ember light among lower-right rocks. Strong depth layers and clear dark negative space across the left 45 percent for white interface text.
Style/medium: polished painterly game key art, high-end dark fantasy environment illustration, detailed natural stone and wet ground textures.
Composition/framing: 16:9 wide landscape, dark readable left third, arch centered, no subject on the right because a character layer will be composited separately.
Lighting/mood: cinematic cold moonlight, controlled ember-red bounce light, beautiful but dangerous, mysterious and abandoned.
Color palette: charcoal #080D14, midnight blue #101D2C, steel blue #29415B, moonlight #A8C5E4, pale mist #8198AD, muted crimson #812C32, ember orange #C65A3C.
Constraints: original artwork only, no logos, no words, no watermark, no recognizable copyrighted game locations or characters, no UI, no border, no collage.
```

### Fog — Task 9A.3

`transparent_background`: true. Session line 1011.

```text
Use case: stylized-concept
Asset type: transparent atmospheric fog overlay for a dark-fantasy game hero
Primary request: original sparse blue-grey moonlit ground fog only, drifting horizontally in several soft translucent layers across the lower half of a wide 16:9 frame; wispy volumetric mist, no objects, no landscape, no characters, no text, no particles, no border.
Style/medium: high-quality painterly game VFX texture, extremely soft feathered edges, suitable for compositing over a dark environment.
Constraints: genuinely transparent background, preserve transparent empty space around fog, no logos or watermarks.
```

### Refined survivor — Task 9A.6

`transparent_background`: true. Session line 1096.

```text
Use case: stylized-concept
Asset type: separate transparent character layer for a local dark-fantasy game hero
Primary request: an ORIGINAL compact creature survivor, full body, standing on a small believable dark rock base. It is small and non-humanoid: large round expressive head about 60 percent of total height, compact rounded torso, short rounded arms and short legs ending in four small soft paws. Pale desaturated blue-grey skin/fur. Exactly five broad swept-back pointed head spines/tufts, arranged symmetrically from crown toward the back. Two large symmetric icy-blue luminous eyes, a small nose and mouth, determined slightly fierce expression. One coherent creature silhouette.
Style/medium: professionally painted 2D game key art, stylized fantasy creature with simple clean anatomy and controlled texture, no photorealistic human detail.
Composition/framing: vertical transparent cutout, full body with rock base, facing slightly left, designed to occupy about 25–30 percent of a 16:9 hero width when composited lower-right.
Lighting/mood: cold blue-white moon rim lighting from upper left and restrained crimson reflection from lower right, matching a moonlit ruined forest.
Constraints: genuinely transparent background; no clothing; no armor; no weapon; no jewelry; no wraps; no cape; no long hair; no humanoid warrior anatomy; no extra limbs; no malformed paws; no asymmetrical eyes; no visible scenery except its small rock base; no text; no logo; no watermark. This must be an original unbranded creature, not official Chog Genesis art and not any existing IP character.
```
