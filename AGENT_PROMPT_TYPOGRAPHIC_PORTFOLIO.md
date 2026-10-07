# Agent Brief: Typography-Led Portfolio Rebuild (JD Paloma)

Branch: `design/typographic-portfolio`

Paste this whole file into a new agent chat, or tell the agent: "Read and execute `AGENT_PROMPT_TYPOGRAPHIC_PORTFOLIO.md`."

---

## 1. Mission

Rebuild Jeanne Dominique Paloma's portfolio from zero as a **typography-led, interactive, animated experience** with 3D where it earns its place. Type is the interface: letterforms carry the identity, the motion, and the navigation. Imagery and 3D support the type, never the other way around.

The bar is Awwwards Site of the Day / Codrops-feature quality. A recruiter should remember the site an hour later, and still be able to find experience, education, and projects in under ten seconds.

Run every command (installs, scaffolds, builds, dev server, screenshots) without asking for permission. Do not commit or push unless the user asks.

## 2. Scrap rule

Throw away the current design and its elements. Nothing visual from the existing site survives.

- Delete the current section components, hero, 3D ribbon scene, nav, footer, and styles in `src/` (`Hero.tsx`, `RibbonScene.tsx`, `WhatIDo.tsx`, `Quote.tsx`, `TechStack.tsx`, `About.tsx`, `Timeline.tsx`, `Projects.tsx`, `Contact.tsx`, `Nav.tsx`, `MobileNav.tsx`, `Footer.tsx`, `globals.css` tokens). Rebuild fresh.
- Do **not** reuse either previous visual world. Both are anti-references:
  - "Signal Film": ink ground with acid-lime accent.
  - "Atelier Cobalt": pale paper ground, cobalt `#0b3dff` accent, Manrope, portrait-led hero, horizontal project film.
- Drop these old sections entirely: "What I Do" word list (Visual / Design / Develop / Implement / Optimize), the quote block, the tech-stack logo grid and its PNG icons, the portrait-as-hero.
- The current `DESIGN.md` describes Atelier Cobalt. Replace it with the new world once the direction is chosen.

**Keep only the facts.** Source of truth is `src/lib/content.ts` (and `_legacy/index.html` if anything is missing). Never invent employers, degrees, dates, metrics, clients, or awards. Fixing typos and tightening wording is fine; adding claims is not.

## 3. Key sections (the only content that matters)

Everything else is optional garnish. These three must be the strongest parts of the site.

### Experience
- Software Developer, Efunity Pte Ltd, 2023 to 2024.
- Only one entry, so make it a set piece: role and company set at display scale, years as typographic objects. Do not pad it with filler entries.

### Education
- Software Engineering, Lithan Academy (current)
- Information Technology, University of Cebu - Banilad (current)
- Google Cloud Skills Boost, Google Cloud PH, 2022
- Science, Technology, Engineering, and Mathematics, University of Cebu - Banilad, 2020
- Treat as a typographic index or timeline where scroll or hover drives the type (weight, width, position, reveal), not a list of cards.

### Projects
ABC Cars Portal, Know Your Neighborhood, ABC Jobs, Jumpstart E-commerce, Meals On Wheels. Descriptions, tools, screenshots, and GitHub links are in `content.ts`; screenshots are in `public/images/`.
- Project titles are the primary visual element (huge, interactive type). Screenshots appear on hover, focus, or in an expanded view, treated with intent (masks, WebGL distortion, clipped reveals), never as a uniform card grid.
- Each project needs a reachable detail state: an expanded panel or a `/work/[slug]` route with a page transition. Include tools and the source-code link.

### Minimal supporting pieces
- An opening that says who she is: name, "Full-stack developer with a strong focus on UI and UX" (or a tightened version), and a way in.
- Contact: email `jeanne.d.paloma@gmail.com`, GitHub, LinkedIn, resume link. Facebook and YouTube are optional.
- No separate "About" essay, skills bars, stat counters, or testimonials.

## 4. Skills to load (read each SKILL.md fully before coding)

Priority when they conflict: Impeccable, then Taste, then Emil.

1. **`impeccable`** (pbakaus). Run its setup (`scripts/impeccable context`, or `impeccable.cmd` on Windows without `sh`). Mode is **Experience**. This is a redesign that replaces the visual world, so follow `reference/new-work.md`, read `reference/craft-floor.md` before every UI edit, and write new `PRODUCT.md` / `DESIGN.md`. After the build, run `critique`, `typeset`, `animate`, `overdrive`, `polish`, `audit`, `adapt`, `optimize` as needed.
2. **`design-taste-frontend`** (Leonxlnx taste-skill). State the one-line Design Read before code. Dials: `DESIGN_VARIANCE: 9`, `MOTION_INTENSITY: 8`, `VISUAL_DENSITY: 3`. Run its pre-flight anti-slop check before calling anything done. Also use `redesign-existing-projects` and `high-end-visual-design` from the same pack.
3. **`emil-design-eng`** plus **`animate`**, **`animation-vocabulary`**, **`review-animations`**, **`improve-animations`**, **`find-animation-opportunities`** (emilkowalski). Every animation passes the gate: frequency, purpose, easing, properties, duration, interruption, reduced motion.
4. Supporting: `frontend-design`, `vercel-react-best-practices`, `vercel-react-view-transitions`, `web-design-guidelines`, `threejs-animation`, `full-output-enforcement`.

**Cloud / background agents:** skills are already committed under `.agents/skills/` (mirrored in `.claude/skills/`). Read each skill from those paths. Do **not** rely on global `~/.agents` installs.

If a skill folder is missing in the clone, install into the **project** (no `-g`) without asking:

```bash
npx skills add pbakaus/impeccable@impeccable -y
npx skills add leonxlnx/taste-skill@design-taste-frontend -y
npx skills add leonxlnx/taste-skill@redesign-existing-projects -y
npx skills add leonxlnx/taste-skill@high-end-visual-design -y
npx skills add emilkowalski/skills@emil-design-eng -y
npx skills add emilkowalski/skills@animate -y
npx skills add emilkowalski/skills@animation-vocabulary -y
npx skills add emilkowalski/skills@review-animations -y
npx skills add emilkowalski/skills@improve-animations -y
npx skills add emilkowalski/skills@find-animation-opportunities -y
npx skills add vercel-labs/agent-skills@vercel-react-view-transitions -y
npx skills add cloudai-x/threejs-skills@threejs-animation -y
```

## 5. Inspiration (researched October 2026)

Study these for *mechanisms*, not looks. Do not clone any of them; combine ideas into something that belongs to JD Paloma.

| Reference | What to learn from it |
| --- | --- |
| [Mat Voyce](https://matvoyce.tv) ([Awwwards case study](https://www.awwwards.com/case-study-mat-voyce-designing-a-digital-home-for-a-kinetic-creative.html), [build notes](https://www.hontran.dev/blog/mat-voyce-case-study-award-winning-portfolio)) | Kinetic type as the whole interface. Per-character transforms, headlines that feel thrown into place, one consistent ease and duration scale, R3F used to offload heavy type transitions to the GPU, a fluid scaling system so huge type holds proportion on every screen. |
| [Corentin Bernadou](https://tympanus.net/codrops/2026/03/05/inside-corentin-bernadous-portfolio-swiss-inspired-layouts-webgl-geometry-and-thoughtful-motion/) (Codrops) | Swiss poster typography plus subtle WebGL geometry holding project previews. The layout grid itself is interactive: a toggleable grid overlay and Figma-style rulers visitors can place. |
| [Run Rob Run](https://www.awwwards.com/sites/run-rob-run) (Awwwards HM) | GSAP-driven scroll typography, pixel reveals, and section pacing paired with a reactive Three.js scene that morphs with scroll. |
| [Joseph Santamaria](https://www.webgpu.com/showcase/joseph-santamaria-3d-webgl-portfolio/) ([Codrops write-up](https://tympanus.net/codrops/2026/04/28/more-than-a-portfolio-building-a-scroll-driven-3d-world-with-something-to-say/)) | Spatial typography placed inside a 3D scene, scroll-driven camera choreography, a shader menu transition ("ink bleed") because a plain dropdown would betray the rest. |
| [Dennis Snellenberg](https://dennissnellenberg.com) | A single display-size name that bleeds off the canvas, a single type family carrying everything, and obsessive micro-interactions and page transitions. |
| [Magnet Type](https://magnettype.com/) | Variable-font axes (weight, width) driven per character by cursor proximity. Includes a legibility mode and a touch fallback. |
| [CrazyGL hero-text-pressure](https://github.com/CrazyGL-com/hero-text-pressure), [CrazyGL](https://crazygl.com/) | Pressure-style variable type, SDF lens blur on letters, type built from particles. Notable rule: plain CSS when it suffices, WebGL only when it pays, pause offscreen. |
| [Markus Agency variable type](https://www.awwwards.com/inspiration/animated-typography-variable-font-markus-agency) | Animated variable fonts as transitions between states. |
| Doug Alves, Odin's Crow, Grafik ([Refero Styles](https://styles.refero.design/)) | Extreme scale contrast (about 10:1 display to body), fine-print specification grids next to poster-size type. Use the scale lesson, not the broadsheet look. |

Also browse the Awwwards "typography" and "portfolio" collections and Codrops "Case Studies" for 2025 to 2026 before committing to a direction.

## 6. Direction

Choose the world yourself, following Impeccable new-work and the taste Design Read. Before writing code, sketch **three typographic concepts** in one or two sentences each (the type system, the signature interaction, the 3D moment), pick the strongest, and record why in `DESIGN.md`. Commit to it fully.

Requirements for whatever you pick:

- **Type is the hero.** The first viewport is typographic: the name or a statement at display scale, set and animated with care. No portrait hero, no stock imagery, no mesh-gradient backdrop.
- **A real type system.** One expressive display face (ideally variable, with weight and/or width axes to animate) plus at most one companion for text or small UI and an optional mono for data. Fluid sizes with `clamp()`, deliberate tracking and leading per size, optical sizing where available, `font-display` and preload for the display face, `next/font` or self-hosting. Check web licensing before shipping a font.
- **Font sources to explore:** Google Fonts variable families, Fontshare (free commercial use), Velvetyne and other open-source foundries. The repo has Satoshi under `_legacy/fonts`, but it is a safe default; only use it if the concept truly calls for it.
- **Avoid as the brand voice:** Inter, Roboto, Arial, system-ui, Manrope (used by the last world), and the reflexive "editorial serif on cream" luxury look.
- **Color is secondary.** A restrained palette that makes the type sing. Not ink plus lime, not paper plus cobalt, not purple AI gradients.
- **Scale contrast.** Poster-scale display type next to small, precise detail text. Let display type crop and bleed on purpose, while keeping every word of content readable somewhere.

## 7. Interaction, motion, and 3D

Aim for two to four signature systems that repeat across the site, not dozens of unrelated effects. Pick from these or invent better ones:

- **Variable-axis interaction:** cursor proximity or scroll velocity drives weight, width, or slant per character (Magnet Type style). Touch devices get a drag or scroll equivalent.
- **Scroll-choreographed type:** split-text reveals, line masks, pinned chapters where words reflow, scrub between typographic states. GSAP plugins including SplitText are free now; use `@gsap/react` `useGSAP` for cleanup.
- **Type in 3D:** headings or project titles rendered in WebGL with MSDF text (`troika-three-text` / drei `<Text>`) or `<Text3D>`, so they can bend, extrude, refract, or distort with shaders. Keep HTML text as the accessible source and align canvas text to it.
- **Project previews:** hovering a title reveals its screenshot through a type-shaped mask, displacement shader, or clipped wipe; focus does the same for keyboard users.
- **Transitions:** View Transitions or shared-element morphs between the index and project detail, so the clicked title becomes the detail page heading.
- **Small craft:** magnetic links, a custom cursor that adapts to context (hidden on touch), press feedback, a scramble or counter effect on years, a grid-overlay easter egg. Every one must pass Emil's frequency and purpose gate.

3D rules:
- At least one memorable WebGL moment, preferably one where type is the object.
- Lazy-load the canvas (`next/dynamic`, `ssr: false`), cap device pixel ratio, pause when offscreen or the tab is hidden, and provide a static fallback for `prefers-reduced-motion`, no WebGL, and low-power devices.
- Hold 60 fps on a mid-range laptop and stay usable on a phone.

Motion rules (Emil):
- Custom curves only, defined once as tokens (for example `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)`, `--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1)`).
- Animate `transform`, `opacity`, `clip-path`, and font-variation settings. No `transition: all`, no `ease-in` on entrances, no `scale(0)`.
- Interruptible interactions, correct transform origins, hover effects gated behind `@media (hover: hover)`.
- Reduced motion ships with each animation, not as a later pass.

## 8. Stack

The repo already has Next.js 16 (App Router), React 19, TypeScript, Tailwind v4, GSAP with `@gsap/react`, Lenis, Motion, Three.js, `@react-three/fiber`, and `@react-three/drei`. Keep that stack; add `troika-three-text` or similar only if a concept needs it.

This Next.js version has breaking changes. Per `AGENTS.md`, read the relevant guides in `node_modules/next/dist/docs/` before writing routing, font, image, or view-transition code, and heed deprecation notices.

Keep `content.ts` as the single data source. Server components by default; client components only for interactive and 3D pieces.

## 9. Accessibility and performance (non-negotiable)

- Semantic headings in order, real links and buttons, visible focus styles, skip link, and alt text on every screenshot.
- Split-text effects must not break screen readers: keep the full string accessible (`aria-label` on the parent, `aria-hidden` on character spans).
- Body text contrast at least 4.5:1, large text at least 3:1.
- Responsive from 360px to ultrawide. Display type reflows, it does not overflow unreadably.
- `next/image` for screenshots, no layout shift from fonts or images, Lighthouse performance and accessibility of 90 or higher on desktop.

## 10. Execution plan

1. **Context.** Read `content.ts`, `_legacy/index.html`, `AGENTS.md`, the current `PRODUCT.md` and `DESIGN.md`. Run Impeccable setup. Write the Design Read and dials.
2. **Research pass.** Open the references above, note the mechanisms worth borrowing, then write the three concepts and pick one.
3. **Scrap.** Delete the old components and styles listed in section 2. Keep `content.ts`, `public/images`, and config.
4. **Foundations.** Type tokens, fluid scale, palette, easing and duration tokens, Lenis plus GSAP ScrollTrigger wiring, reduced-motion plumbing.
5. **Build.** Opening, Experience, Education, Projects (index and detail), Contact. Then the signature type interactions and the 3D moment.
6. **Refine.** Impeccable `critique`, `typeset`, `animate`, `overdrive`, `polish`; Emil `find-animation-opportunities`, then `review-animations`; taste pre-flight.
7. **Verify.** `npm run lint` and `npm run build` must pass. Run the dev server, screenshot desktop (1440px) and mobile (390px) in one batch, fix everything found in one batch, confirm once more, then stop.
8. **Document.** Update `DESIGN.md` (new world, type system, motion tokens, interaction inventory) and `PRODUCT.md`, plus a short README section on running locally.

## 11. Definition of done

- [ ] None of the previous design, components, or sections remain
- [ ] Experience, Education, and Projects are the strongest, clearest parts of the site, with accurate facts only
- [ ] The first viewport is typographic and unmistakably branded
- [ ] Two to four signature type-driven interaction or motion systems, consistent across sections
- [ ] At least one WebGL or 3D moment, with fallbacks
- [ ] Project detail is reachable, with a meaningful transition
- [ ] Keyboard, screen reader, touch, and reduced-motion paths all work
- [ ] Lint and production build pass; desktop and mobile verified with screenshots
- [ ] `DESIGN.md` and `PRODUCT.md` describe the new world
- [ ] The Impeccable craft floor, taste pre-flight, and Emil motion review all pass

Start now.
