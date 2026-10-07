# Design System — JD Paloma Portfolio (Oryzo Light Desk)

<!-- impeccable:design-schema 1 -->

## Direction

**Oryzo Light Desk** — Experience-mode portfolio that copies oryzo.ai’s chapter chrome, desk-scene hero, glass feature panels, product-tier work selector, and punchline contact — on a light warm desk palette. Replaces Atelier Cobalt and the prior Light Studio Bench pass.

## Mode

Experience

## Dials

- DESIGN_VARIANCE: 9
- MOTION_INTENSITY: 8
- VISUAL_DENSITY: 4

## Color

| Token | Value | Role |
| --- | --- | --- |
| `--cream` | `#fff6e8` | UI text on dark overlays / light surfaces |
| `--cream-soft` | `#f7ecd8` | Product chapter ground |
| `--desk` | `#e8d5b8` | Wood scene ground |
| `--desk-deep` | `#d4bc94` | Wood depth |
| `--mat` | `#4a6b52` | Cutting mat |
| `--cork` | `#b8956a` | Circular product frame |
| `--ink` | `#1c1612` | Dark text |
| `--signal` | `#e85d2c` | Accent / hover |
| `--glass` | `rgb(28 22 18 / 0.42)` | Frosted dark panels |

## Typography

- **Display / UI:** Bricolage Grotesque
- **Mono labels:** JetBrains Mono (chapter labels, metadata, side tab)

## Layout

- Chapters: Intro → Features → Product → Contact (Oryzo map)
- Fixed chapter nav with dotted active underline
- Intro: full-bleed desk + mat + circular portrait “product”, credit glass, side tab, PiP play, scroll hint
- Features: sticky desk scene + scrolling glass panels
- Product: circular media, JD / JD Pro / JD Pro Max project tiers, full work list
- Contact: punchline + email + channels

## Motion

- Feature panels: GSAP pin + scrub fade
- Intro: Motion entrance
- Lenis + ScrollTrigger sync

## Anti-patterns avoided

- Cool cobalt paper atelier
- Generic card-grid portfolio hero
- Invented commercial claims (product truth from PRODUCT.md only)
