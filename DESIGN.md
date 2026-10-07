# Design System — JD Paloma Portfolio (Atelier Cobalt)

<!-- impeccable:design-schema 1 -->

## Direction

**Atelier Cobalt** — Experience-mode portfolio on a daylight paper ground. Portrait-led first viewport, sticky practice chapters, horizontal project film, singular cobalt signal. Replaces the prior Signal Film (ink + acid lime) world entirely.

## Branch

`design/atelier-cobalt`

## Mode

Experience

## Dials

- DESIGN_VARIANCE: 9
- MOTION_INTENSITY: 8
- VISUAL_DENSITY: 3

## Color

| Token | Value | Role |
| --- | --- | --- |
| `--mist` | `#f7f9fc` | Elevated surface |
| `--paper` | `#e9eef5` | Page ground |
| `--paper-deep` | `#d7e0ec` | Depth / media bed |
| `--ink` | `#10141c` | Primary text |
| `--ink-soft` | `#3a4454` | Secondary text |
| `--accent` | `#0b3dff` | Cobalt signal |
| `--accent-ink` | `#f7f9fc` | Text on accent |
| `--line` | `rgb(16 20 28 / 0.12)` | Hairlines |

Theme lock: light only. Projects chapter inverts once to ink for the horizontal film (intentional color-block story).

## Typography

- **UI / Display:** Manrope (`next/font`)
- **Mono labels:** IBM Plex Mono (data / category only)
- Display tracking ≈ `-0.04em`
- No Satoshi-as-hero, no Inter, no acid-lime kinetic all-caps stack

## Shape

- Controls: pill
- Media / panels: `1.25rem` soft radius
- Soft tinted shadows (no hard offset blocks)

## Motion

| Token | Value |
| --- | --- |
| `--ease-out` | `cubic-bezier(0.23, 1, 0.32, 1)` |
| `--ease-in-out` | `cubic-bezier(0.77, 0, 0.175, 1)` |

Signature systems:

1. Hero clip-path media reveal + type entrance
2. Sticky practice stack (What I Do)
3. Horizontal project pan (desktop ScrollTrigger)
4. Cobalt torus-knot R3F island in About

## Layout

- Split hero: name/CTA left, full-height portrait right
- About + R3F side panel
- Tech as soft grid (not marquee)
- Projects as ink horizontal film
- Contact led by giant email

## Anti-patterns avoided

- Dark void + acid lime Signal Film language
- Purple AI gradients, cream + terracotta luxury default
- Bootstrap card grids, equal feature cards in hero
