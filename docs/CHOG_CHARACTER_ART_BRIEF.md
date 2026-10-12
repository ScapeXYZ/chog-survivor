# Chog Survivor character art brief

## Purpose and status

This is a production brief for one original, full-body survivor character for
the local Chog Survivor MVP. It is an art-direction document, not a license,
brand approval, or a produced asset.

`design/chog-identity-reference.png` and the character imagery embedded in
`design/chog-landing-reference.pdf` were inspected as visual direction only.
The PNG is an opaque promotional-style render containing costume, rubble, and
background; it is not a source asset to crop or redistribute. Nothing in this
brief establishes permission to use Chog Genesis likenesses commercially.

## Art direction

Create an original, clean 2D illustrated creature with a compact, readable
silhouette. It should feel alert and capable in a hostile world, not like a
human warrior or a realistic animal.

- The rounded head is **50–60%** of the complete standing height.
- The pale, desaturated blue-grey head carries several broad, overlapping,
  swept-back leaf-shaped spikes. Their staggered roots and tapered tips must
  read clearly as one deliberate crown rather than as hair, feathers, or
  random horns.
- Use large, circular eyes with crisp dark outlines, restrained icy-blue
  highlights, a small simple nose, and a compact expressive mouth. The
  intended expression is confident, alert, and slightly fierce.
- Keep the torso rounded and small, with short arms, short legs, and rounded
  paws. Anatomy should be balanced and symmetrical where the pose permits.
- Use confident exterior and feature linework, controlled cel shading, and a
  subtle painterly surface texture. Avoid photorealism, fur simulation,
  plastic specular surfaces, and busy micro-detail.

### Explicit exclusions

Do not include armour, weapons, clothing, capes, scarves, jewellery, bags,
plinths, rubble, environmental props, text, logos, drop shadows, long hair,
or humanoid warrior anatomy. Reject extra limbs, mismatched eyes, melted
features, arbitrary spikes, and generic fantasy-monster detailing.

## Pose, framing, and lighting

- Full body; three-quarter standing pose facing slightly left, toward the
  Home screen's distant gateway.
- Stable, naturally balanced feet; no cropped paws or implied support from a
  missing platform. Raise the head slightly to convey determination.
- Leave a transparent margin around the silhouette: at least 4% of canvas
  width left/right and 3% top/bottom. Do not bake a ground contact shadow.
- Match the existing moonlit scene: cold light from upper-left, soft blue rim
  on the head spikes and shoulders, restrained crimson bounce from lower-right.
  Keep the left-lit/right-warm logic coherent on the face, limbs, and spikes.
- The right-side composition must not cover the gateway, moon, or left text.
  The character should occupy roughly 25–30% of a desktop Home-scene width.

## Deliverable specification

| Item | Requirement |
|---|---|
| Working master | Layered source file retained by the artist (PSD, Krita, or equivalent) |
| Lossless delivery | `chog-survivor-character-provisional.png`, RGBA, minimum 2048 px high, 16-bit preferred where workflow supports it |
| Runtime delivery | `chog-survivor-character-provisional.webp`, RGBA/lossy-alpha only after edge review; preserve PNG source |
| Canvas | Portrait, recommended 2048 × 3072 px; no environment, logo, text, or shadow baked in |
| Alpha | Clean, anti-aliased alpha; no dark/bright matte fringe at 1×, 0.5×, or against the moonlit background |
| Home integration target | Initial CSS box approximately 28vw desktop, constrained to about 260–520 CSS px wide; mobile placement must retain face and spike silhouette |
| Small-size check | Inspect at 256 px tall and at the anticipated 25–30% desktop scene width; eyes, mouth, paws, and primary spikes must remain legible |

The `provisional` filename is intentional. Rename only after separate brand,
rights, and human visual approvals. Do not overwrite the current provisional
asset until the candidate passes the acceptance checklist.

## Asset-production workflow

1. Confirm the commissioned artist or authorised generation service has an
   explicit written right to create and grant the intended local/release use.
   Provide this brief and reference images as style direction only.
2. Produce silhouette thumbnails first: at least three readable variants with
   the specified large head, leaf-spike crown, compact body, and no equipment.
   Select one before rendering.
3. Draw a clean turn-neutral three-quarter full-body line pass. Check paired
   eyes, paw count, head-to-body ratio, spike layering, stance, and negative
   space at this stage.
4. Apply flat colours, cel-shaded forms, then only restrained texture and the
   prescribed cold/warm lighting. Keep the source background transparent.
5. Perform the acceptance checklist on dark, light, and the actual Home
   environment at desktop and mobile sizes. Correct alpha edges and lighting
   before export.
6. Export PNG master derivative and optimized WebP. Record creator, source
   files, license/grant, dimensions, and approval status in
   `frontend/ASSET_INVENTORY.md` before integration.
7. Obtain explicit human screenshot approval and separate Chog branding/IP
   permission before calling an asset release-ready or official.

## Current gaps and constraints

The repository has no authorised Chog character source art. Its current
runtime `frontend/src/assets/survivor-creature-refined-provisional.webp` is a
1024 × 1536 generated local draft and is not an official Chog asset, a rights
grant, or a satisfactory substitute for the illustrated target. The identity
reference is opaque and contains armour, scarf, cape, rubble, and background;
extracting it would require masking and could not produce the requested
unarmoured character without new illustration work. The environment and fog
assets are also provisional local-development material.

No final character has been produced or approved by this task.
