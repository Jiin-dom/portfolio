# Design System — JD Paloma Portfolio (Glyphfield)

<!-- impeccable:design-schema 1 -->

## Direction

**Glyphfield** — Experience-mode portfolio where letterforms are the interface. Display type carries identity, motion, and navigation. Imagery and one WebGL letterfield support the type; they never lead. Replaces Signal Film (ink + acid lime) and Atelier Cobalt (paper + cobalt, Manrope, portrait hero) entirely.

## Branch

`cursor/glyphfield-typographic-portfolio-bc72`

## Mode

Experience

## Dials

- DESIGN_VARIANCE: 9
- MOTION_INTENSITY: 8
- VISUAL_DENSITY: 3

## Color

| Token | Value | Role |
| --- | --- | --- |
| `--void` | `#0c0e12` | Page ground |
| `--panel` | `#14171e` | Elevated surface / media bed |
| `--bone` | `#ece7df` | Primary type |
| `--bone-soft` | `#a8a29a` | Secondary type |
| `--ember` | `#e85d04` | Arrested accent (one pour) |
| `--ember-ink` | `#0c0e12` | Text on accent |
| `--line` | `rgb(236 231 223 / 0.12)` | Hairlines |

Theme lock: dark void + bone type. No lime, no cobalt, no purple AI gradients, no cream editorial luxury.

## Typography

- **Display / UI:** Bricolage Grotesque (`next/font/google`), variable axes `opsz` / `wdth` / `wght`
- **Mono (data only):** JetBrains Mono — years, indices, meta labels
- Fluid sizes via `clamp()` (`--text-display` ≈ 10:1 vs body)
- Display tracking ≈ `-0.045em`, optical sizing on
- Banned voices: Inter, Manrope, Roboto, system-ui, Satoshi-as-hero, editorial cream+serif

## Shape

- No cards in hero or project index
- Hairline rules for section and row separation
- Soft radius only where media needs a clip edge (none on type)

## Motion

| Token | Value |
| --- | --- |
| `--ease-out` | `cubic-bezier(0.23, 1, 0.32, 1)` |
| `--ease-in-out` | `cubic-bezier(0.77, 0, 0.175, 1)` |

Animate only: `transform`, `opacity`, `clip-path`, `font-variation-settings`.

Signature systems:

1. **Jeanne → Jeff land shark** — scroll pin warps the six letters of “Jeanne” (no repeats) into a chonky Jeff-style silhouette (big head, grin, dorsal, stubby legs, tail), then the flock waddles toward the cursor
2. **Scroll-choreographed chapters** — GSAP RevealLine masks + Education weight/width scrub
3. **Title → preview reveal** — hover/focus clipped wipe of project screenshots
4. **WebGL letterfield** — R3F spatial years on Experience with static fallback

Plus: year scramble on Experience, magnetic text links, shared `view-transition-name` morph from work index to `/work/[slug]`.

Reduced motion: Lenis off, pressure static, Letterfield CSS fallback, GSAP snaps to end state.

## Layout

- Opening: typographic first viewport — name at display scale, role, CTA trio
- Experience: single Efunity set piece + Letterfield
- Education: typographic shelf index
- Work: huge title list → detail route
- Contact: giant email + outbound links

## Interaction inventory

| Element | Trigger | Behavior |
| --- | --- | --- |
| Opening name | pointer / scroll | per-char `wdth`/`wght` |
| Experience years | enter viewport | scramble → settle |
| Education titles | scroll scrub | opsz/wdth/wght |
| Project titles | hover/focus | preview clip wipe |
| Project titles | navigate | view-transition morph |
| Letterfield | in view + WebGL | slow orbit; pause offscreen/hidden |

## Anti-patterns avoided

- Portrait-as-hero, What I Do word list, quote block, tech PNG grid
- Bootstrap / equal card grids
- Signal Film ink+lime; Atelier Cobalt paper+cobalt+Manrope
- Purple AI gradients; cream + terracotta luxury; broadsheet hairline editorial
