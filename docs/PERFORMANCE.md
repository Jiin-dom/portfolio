# Local performance comparison

## Optimizations

- Full preserves visible animation cadence, materials, geometry, antialiasing, and the original 2048px sun shadow. Off-camera aquarium simulation pauses; parked flashlight aiming and repeated vector allocations are skipped.
- Auto targets a 45–58 FPS adaptation band. Under sustained pressure it lowers DPR and selects Balanced: 1024px sun shadows updated at most 30Hz, DPR capped at 1.5, and distant aquarium updates at 30Hz. Close-up aquarium motion stays at full rate. One recovery is allowed before a repeated decline holds the lighter shadow budget for the visit.
- Rendering pauses when the document is hidden, in addition to the existing offscreen/photobooth pause.
- The lamp fade snaps to zero below 0.0001, allowing its invisible shadow pass to stop after returning to daylight.
- Seven self-contained, decoder-free GLBs replace 44 source requests. Geometry, texture bytes, node names, and material values are validated unchanged. Raw model bytes decrease only 0.184%; see `public/models-optimized/README.md` and `report.json`. Original assets remain available for the baseline.

Production builds, focused ESLint, and TypeScript checks passed. Browser checks covered the opening desk, aquarium, desktop/mobile viewports, day/night lighting, quality controls, and independent playback without console errors. Full opening-scene samples matched at 646 draw calls and 340,924 triangles at DPR 1. These counters confirm matching rendered workload in that scene, not pixel identity or a device-wide speedup. Target-device performance still needs checking with the live controls below.

Open [the comparison](http://localhost:3002/performance-comparison.html) after both production servers are ready. The page is a static, dependency-free harness served from the optimized project's `public` directory.

The original local source snapshot is **`C:\Users\Jeanne\.codex\tmp\portfolio-performance-before-20261103`**. It includes the existing `items.ts` edit made before this optimization work. Subsequent baseline source changes are limited to comparison instrumentation and a quality override solely for comparison. Auto retains the saved baseline's adaptive behavior; Full locks its original quality ceiling. Its `src` is a saved copy; `node_modules` and `public` are junctions to `C:\Portfolio`, so dependencies and public assets are shared rather than independently archived. Keep the original assets available. This is not a pristine Git revision or a fully independent asset snapshot.

## Start or reuse the servers

From PowerShell:

```powershell
Set-Location C:\Portfolio
.\scripts\compare-performance.ps1
```

The launcher resolves the baseline from `$env:USERPROFILE\.codex\tmp\portfolio-performance-before-20261103`, validates its source/configuration and shared junctions, builds each available target with **`next build --webpack`**, and starts production servers on ports **3001 (before)** and **3002 (after)**. Webpack is intentional for both builds: the baseline's junctions point outside its project root and broke Turbopack's root handling. Use the same bundler for the comparison.

If both webpack production builds already exist:

```powershell
.\scripts\compare-performance.ps1 -SkipBuild
```

`-SkipBuild` requires a `.next\BUILD_ID` for each server being started; it does not establish build freshness or which bundler produced it. Run it only after the intended builds complete. The script uses hidden `Start-Process node.exe` processes with the full Next CLI path, `next start --hostname 0.0.0.0`, and the specified port. Output/error logs are saved per run in `$env:USERPROFILE\.codex\tmp\portfolio-performance-logs`. Started processes remain running after the launcher exits; PID and log paths are printed.

Rerunning is supported: an occupied port skips that target's build and start, with a warning to verify the listener. The script never terminates arbitrary listeners or rebuilds underneath a server it finds running. It cannot certify that an existing listener serves the right version. To rebuild a running target, stop only the process you have independently identified as that comparison server, then rerun. Other work may also have created logs such as `before.log` in this directory; launcher logs have timestamped names.

## Review the scene

- Desktop uses a **1280 × 800** logical iframe viewport; mobile uses **390 × 844**. Both frames always use the same selected dimensions. `ResizeObserver` scales previews down to fit their panes without changing their logical viewports. This is viewport emulation, not emulation of a phone's GPU, browser, or native DPR.
- Camera **Top / Front / Angle**, spots **home / about / skills / projects / contact**, and **day / night** are synchronized through the shared controls. Both embedded portfolios also accept direct mouse, touch, and keyboard interaction. Clicking or tabbing into a preview resumes that version and pauses the other; navigation inside a portfolio acts independently. Each pane also offers full screen where supported.
- Optimized quality defaults to **Full** for fidelity review. Full locks **both** versions to their full quality ceilings. **Auto** selects each version's adaptive behavior. Optimized **Balanced** is compared against baseline **Full**. The baseline label shows Full or Adaptive accordingly. The parent sends quality on load and repeatedly until both scenes report ready, using the baseline comparison-only quality override.
- Both scenes run until both report `ready: true`, followed by **five seconds of warmup**, then freeze by default. If instrumentation never reports ready, the harness continues waiting and does not invent readiness. A playback button explicitly overrides automatic warmup/freeze.
- **Freeze both**, **Live before only**, **Live after only**, and **Live both** select playback. Changing scene controls, quality, or viewport temporarily resumes both for **three seconds**, then reapplies the selected playback. Repeated changes restart this settling interval. Initial warmup still takes precedence until it completes.

## Read the measurements

The harness displays only received `portfolio:stats` values: FPS, frame interval in milliseconds, renderer draw calls, triangles, and DPR. Missing or invalid numbers appear as a dash. Samples retain their last received values with an age and explicit **paused** or **stale** label; they are not presented as fresh timing while frozen. A live sample becomes stale after three seconds without an update.

The probe reads the **previous completed** `gl.info` renderer sample. These are renderer draw-call and triangle counters, not a GPU profiler. The installed Three.js `WebGLRenderer.js` resets `info` before `shadowMap.render` with `info.autoReset` enabled, so the counters should not be described as main-render-only. `frameMs` is the render-loop frame interval; **GPU time is unmeasured**. The probe skips the first resumed frame using a paused-state effect, excluding the pause/resume gap while retaining actual slow frames in its sampling window. These counters and FPS are observations, not a measured speedup claim.

**Both-live shares GPU resources.** Use one live version at a time for fair timing and allow fresh samples to settle after each switch. Close other GPU-heavy tabs, keep browser zoom and display settings consistent, and compare the same camera, spot, lighting, logical viewport, and intended quality. Auto can react to contention when both scenes run; Full is the default for visual review. For isolated profiling, open a standalone version and close the harness and other version. Standalone links intentionally omit comparison mode, so the embedded stats protocol is not active there.

## Message contract

Iframe URLs use the comparison page's current protocol and hostname with ports 3001 and 3002, respectively: `/?comparison=before` and `/?comparison=after`. The launcher serves HTTP; when accessing through HTTPS, both iframe ports must also support that protocol via your own proxy.

Commands are `{ type: 'portfolio:compare', command, value }`, where `command` is `pause`, `quality`, `view`, `spot`, or `night`. Pause and night values are booleans; view values are case-sensitive `Top`, `Front`, or `Angle`; spot and quality values are lowercase. Optimized quality values are `full`, `auto`, and `balanced`. Baseline quality is `auto` when optimized Auto is selected and `full` for optimized Full or Balanced.

Incoming samples are `{ type: 'portfolio:stats', fps, frameMs, calls, triangles, dpr, ready }`. The parent accepts messages only when **both** `event.source` matches the expected iframe window and `event.origin` matches that iframe's exact origin. Outgoing messages use that exact target origin. A missing or uninstrumented server leaves its pane waiting; there are no fabricated measurements.
