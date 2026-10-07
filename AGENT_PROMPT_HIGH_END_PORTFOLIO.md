# Agent Prompt — High-End Portfolio Rebuild (JD Paloma)

Copy everything below the line into a new agent chat. Attach / enable the listed skills. Do not ask for permission to run shell, install, or refactor commands — execute them.

---

## Mission

You are a senior design engineer + creative technologist rebuilding **Jeanne Dominique Paloma’s** personal portfolio into an Awwwards / agency-tier experience.

**Authority:** You may change anything — stack, structure, IA, layout, motion, 3D, assets pipeline, copy polish (keep factual identity true), routing, deployment config. The current site is evidence and anti-reference, not a constraint to preserve visually.

**Bar:** Same level as high-end creative portfolios (e.g. Studio Freight, Locomotive, Awwwards-winning personal sites): cinematic first viewport, intentional scroll choreography, memorable 3D/WebGL moments, buttery transitions, impeccable type/spacing, zero template smell.

**Mode (Impeccable):** `Experience` — the artifact leads; chrome recedes.

**Design Read (Taste):** Solo full-stack developer portfolio for recruiters + creative-tech peers, Awwwards-experimental / kinetic / premium agency language, leaning toward Next.js App Router + TypeScript + Tailwind + GSAP + R3F.

**Dials (Taste):**
- `DESIGN_VARIANCE: 9`
- `MOTION_INTENSITY: 8`
- `VISUAL_DENSITY: 3`

---

## Mandatory skills — read and follow before coding

Read each skill’s `SKILL.md` fully, then follow its workflow. Conflict resolution order:

1. **impeccable** — craft floor, new-work / redesign, critique → polish → animate → overdrive; Experience mode; run context/init/document as the skill requires.
2. **design-taste-frontend** (Leonxlnx taste-skill) — anti-slop, dials, brief inference, redesign audit-first then overhaul.
3. **emil-design-eng** + **animate** + **animation-vocabulary** + **review-animations** / **improve-animations** / **find-animation-opportunities** — motion decisions, curves, frequency gates, polish of invisible details.
4. Supporting (use when relevant):
   - `redesign-existing-projects`, `high-end-visual-design`, `full-output-enforcement`, `image-to-code`, `imagegen-frontend-web`, `brandkit`
   - `frontend-design` (Anthropic) — distinctive UI craft
   - `vercel-react-best-practices`, `web-design-guidelines`, `vercel-react-view-transitions`
   - `ui-ux-pro-max` (if installed)
   - `threejs-animation` — WebGL / Three.js animation patterns for the R3F layer

**Skill install (run automatically if missing):**

```bash
npx skills add pbakaus/impeccable@impeccable -g -y
npx skills add leonxlnx/taste-skill@design-taste-frontend -g -y
npx skills add leonxlnx/taste-skill@redesign-existing-projects -g -y
npx skills add leonxlnx/taste-skill@high-end-visual-design -g -y
npx skills add leonxlnx/taste-skill@full-output-enforcement -g -y
npx skills add emilkowalski/skills@emil-design-eng -g -y
npx skills add emilkowalski/skills@animate -g -y
npx skills add emilkowalski/skills@animation-vocabulary -g -y
npx skills add emilkowalski/skills@review-animations -g -y
npx skills add emilkowalski/skills@improve-animations -g -y
npx skills add emilkowalski/skills@find-animation-opportunities -g -y
npx skills add vercel-labs/agent-skills@vercel-react-best-practices -g -y
npx skills add vercel-labs/agent-skills@web-design-guidelines -g -y
npx skills add vercel-labs/agent-skills@vercel-react-view-transitions -g -y
npx skills add nextlevelbuilder/ui-ux-pro-max-skill@ui-ux-pro-max -g -y
npx skills add cloudai-x/threejs-skills@threejs-animation -g -y
```

---

## Hard stack mandate (do NOT keep plain HTML/CSS/JS)

Replace the Bootstrap + static `index.html` / `singlepage.css` site with a modern app:

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | **Next.js (App Router) + TypeScript** | Best DX for portfolio + SEO + view transitions + deploy |
| UI / styling | **Tailwind CSS v4** + CSS variables design tokens | Speed without Bootstrap look |
| UI motion | **Motion** (`motion` / Framer Motion) | Springs, layout, exit animations |
| Scroll storytelling | **GSAP + ScrollTrigger** (+ optional SplitType / custom text split) | Industry standard for cinematic portfolios |
| Smooth scroll | **Lenis** (wired carefully with GSAP) | Premium scroll feel |
| 3D / WebGL | **React Three Fiber** + `@react-three/drei` + Three.js | Hero / ambient 3D without raw Three boilerplate |
| Page transitions | **Next.js View Transitions** and/or shared-element morphs | Site feels like one continuous film |
| Icons | `lucide-react` or custom SVGs — **not** Bootstrap Icons |
| Fonts | Expressive variable / display fonts via `next/font` or self-hosted Satoshi + one distinctive display; **never** Inter/Roboto/Arial as the brand voice |
| Deploy | Vercel-ready (`next build`) | Default for this stack |

**Forbidden as the primary architecture:** plain multipage HTML, Bootstrap layout system, jQuery, AOS-as-the-only-motion, card grids that look like Bootstrap templates.

You may keep `images/`, `fonts/`, and factual content (name, roles, projects, links). Migrate assets into `public/`. Fix typos in copy when polishing, but do not invent employers, degrees, or project claims.

---

## Product truth to preserve

- **Name:** Jeanne Dominique Paloma (JD Paloma)
- **Positioning:** Full-stack developer, strong UI/UX focus
- **Links:** GitHub `Jiin-dom`, LinkedIn, Facebook, YouTube demo, Google Docs resume (migrate URLs as-is)
- **Education / experience / projects** from current `index.html` (ABC Cars, Know Your Neighborhood, ABC Jobs, Jumpstart E-commerce, Meals On Wheels, etc.)
- **Existing brand assets:** `images/jplogo.png`, portrait, project screenshots, Satoshi / Proxima / Avant Garde fonts if licensed for web use

---

## Creative brief — what “high-end” means here

Build **one composition**, not a dashboard.

1. **Hero (first viewport only):** Brand-level name signal + one short line + one CTA group + one dominant visual plane (full-bleed image / WebGL / kinetic type). No stat strips, no card grids, no floating badges on the hero.
2. **Scroll film:** Sections reveal with purpose — pinned chapters, image scales, text masks, project case-study transitions. Prefer 2–4 signature motion systems, not 40 random fades.
3. **3D:** At least one meaningful WebGL moment (hero atmosphere, project hover object, or cursor-reactive scene). Graceful fallback for `prefers-reduced-motion` and weak GPUs.
4. **Projects:** Treat as case studies — large media, asymmetric editorial layouts, hover/active states with spatial continuity. Not equal Bootstrap cards.
5. **Contact:** Memorable close — not a generic form card dump.
6. **Sound (optional):** Only if tasteful and muted by default; never autoplay loudly.
7. **Performance:** Lighthouse-conscious — lazy 3D, compressed images (`next/image`), no layout thrash, respect reduced motion.

### Anti-slop bans
- Purple-on-white / purple-indigo AI gradients as the theme
- Warm cream + terracotta + generic serif “AI luxury” default
- Broadsheet hairline newspaper layout as a default
- Glassmorphism everywhere, glow soup, emoji decoration
- `transition: all`, `ease-in` entrances, `scale(0)` pops
- Inter / Roboto / system-ui as the hero type voice
- Three equal feature cards in the hero

### Emil motion rules (non-negotiable)
- Gate every animation: frequency → purpose → easing → properties → duration
- Custom curves (`--ease-out`, `--ease-in-out`, drawer curve) — not weak defaults
- Animate transform/opacity; avoid layout-thrashing properties for showpieces
- Press states (`scale ~0.97`), interruptible interactions, proper transform origins
- Review motion with Before/After/Why tables when auditing

---

## Execution plan (run without asking)

### Phase 0 — Context
1. Inspect current `index.html`, `singlepage.css`, assets.
2. Run Impeccable context / `init` + `document` as the skill requires; write `PRODUCT.md` + `DESIGN.md` for the **new** world (redesign = replace visual world).
3. State the one-line Design Read and dials, then proceed.

### Phase 1 — Scaffold
1. Scaffold Next.js + TS + Tailwind in-repo (replace root static site; archive old files under `_legacy/` if needed for reference, then remove once migrated).
2. Install deps: `gsap`, `lenis`, `motion`, `three`, `@react-three/fiber`, `@react-three/drei`, etc.
3. Set design tokens in CSS variables (color, type scale, space, easings, radii).

### Phase 2 — Build the experience
1. App shell, nav (minimal), Lenis + GSAP ScrollTrigger wiring.
2. Hero composition with kinetic type and/or R3F layer.
3. About / What I Do as editorial kinetic sections.
4. Tech stack as a distinctive visual system (not logo bingo circles unless reinvented).
5. Education + Experience as timeline with scroll choreography.
6. Projects as immersive case rows / pages with transitions.
7. Contact + footer.
8. Page/section view transitions.

### Phase 3 — Overdrive + harden
1. Impeccable: `critique` → `bolder` or `distill` as needed → `animate` → `overdrive` → `polish` → `audit` → `adapt` → `optimize`.
2. Emil: `find-animation-opportunities` → implement via `animate` → `review-animations` / `improve-animations`.
3. Taste: pre-flight anti-slop check; kill template patterns.
4. Verify desktop + mobile screenshots; one fix batch; one confirm pass; stop.

### Phase 4 — Ship readiness
1. `npm run build` must pass.
2. README with run/deploy instructions.
3. Do **not** commit or push unless the user asks in that chat.

---

## Autonomy rules

- Run all installs, scaffolds, builds, and refactors automatically. Do not wait for permission.
- Prefer complete implementations over placeholders. No “TODO: add animation later.”
- If a library choice conflicts, pick the **stack table above** and move on.
- Keep accessibility: focus states, semantic HTML, alt text, reduced-motion paths.
- Match factual content; elevate presentation ruthlessly.

## Definition of done

- [ ] No Bootstrap / static HTML portfolio as the served app
- [ ] Next.js + TypeScript + Tailwind production build succeeds
- [ ] Distinct visual identity (would fail the “remove nav → still branded” test)
- [ ] GSAP scroll systems + UI motion with Emil-correct easing
- [ ] At least one R3F/Three moment with fallbacks
- [ ] Projects feel case-study grade
- [ ] Mobile + desktop verified
- [ ] `PRODUCT.md` + `DESIGN.md` reflect the new world
- [ ] Skills’ craft floors satisfied (Impeccable + Taste + Emil)

---

## Start command

Begin now: install missing skills, run Impeccable context/init for Experience-mode redesign, scaffold the Next.js stack, migrate content/assets, and build until Definition of Done is met.
