"use client";

import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Environment, Lightformer, PerformanceMonitor, useGLTF, useProgress, useTexture } from "@react-three/drei";
import { Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { deskItems } from "./items";
import { DeskWorld, type ViewName } from "./world";
import { CAMERA_HIDE, FitModel, MODEL_URLS } from "./FitModel";
import { ProjectShelf, Room } from "./room";
import { Lighting } from "./lighting";
import { Foliage } from "./foliage";
import { Wall } from "./wall";
import { Flashlight, SceneLink } from "./flashlight";
import { Aquarium } from "./aquarium";
import { ExperienceFolder, PaperLink, type SheetOrigin } from "./experience";
import type { Skill } from "@/lib/skills";
import type { BookProject } from "./textures";
import { buildTextures, type DeskTextures } from "./textures";
import * as Model from "./models";

const OAK_MAPS = ["/textures/oak_veneer_01/diffuse.jpg", "/textures/oak_veneer_01/rough.jpg", "/textures/oak_veneer_01/nor_gl.jpg"] as const;
Object.values(MODEL_URLS).forEach((url) => useGLTF.preload(url));
OAK_MAPS.forEach((url) => useTexture.preload(url));

export type DeskCommand = { type: "tidy" | "scatter"; n: number };

/* lets the HTML page find the folder's sheet on screen, and hide it while the page is out */
export type PaperBridge = { origin: () => SheetOrigin | null; setOut: (out: boolean) => void };

/* the loader's Instax print lands on this polaroid; it stays hidden until then */
const PRINT_ID = "polaroid-me";
export type PrintBridge = { origin: () => SheetOrigin | null; release: () => void };

type Props = {
  active: boolean;
  reduced: boolean;
  command: DeskCommand | null;
  view: ViewName;
  night: boolean;
  onToggleNight: () => void;
  flashOn: boolean;
  onToggleFlash: () => void;
  projects: readonly BookProject[];
  openProject: number | null;
  onOpenProject: (index: number | null) => void;
  experienceOpen: boolean;
  onOpenExperience: () => void;
  onCloseExperience: () => void;
  onPaperBridge: (bridge: PaperBridge | null) => void;
  onPrintBridge: (bridge: PrintBridge | null) => void;
  onHoverProject: (index: number | null) => void;
  skills: readonly Skill[];
  activeSkill: number | null;
  /* fish that swim to the front glass: the skills of the book in hand */
  featuredSkills: readonly number[];
  labelledSkill: number | null;
  onSelectSkill: (index: number | null) => void;
  onHoverSkill: (index: number | null) => void;
  onFocusItem: (id: string | null) => void;
  onReady: () => void;
  onProgress?: (p: number) => void;
  printing: boolean;
  onOpenBooth: () => void;
};

function renderModel(
  id: string,
  t: DeskTextures,
  night: boolean,
  paper: PaperLink,
  folder: { open: boolean; reduced: boolean; onOpen: () => void },
): ReactNode {
  switch (id) {
    case "mat":
      return <Model.CuttingMat w={7.6} d={5.2} map={t.mat} edge="#26422f" />;
    case "tablet":
      return <Model.Tablet map={night ? t.tabletNight : t.tablet} />;
    case "note":
      return <Model.StickyNote map={t.note} />;
    case "phone":
      return <Model.NothingPhone map={t.nothing} glow={night ? 0.55 : 0} />;
    case "pencil":
      return <Model.ApplePencil />;
    case "polaroid-me":
      return <Model.Polaroid map={t.polaroidMe} />;
    case "polaroid-sunset":
      return <Model.Polaroid map={t.polaroidSunset} />;
    case "pen":
      return <Model.Pen />;
    case "camera":
      return (
        <Suspense fallback={null}>
          <FitModel url={MODEL_URLS.camera} size={2.4} rotY={Math.PI} hide={CAMERA_HIDE} />
        </Suspense>
      );
    case "mouse":
      return <Model.Mouse />;
    case "ruler":
      return <Model.Ruler map={t.ruler} />;
    case "card":
      return <Model.Card map={t.card} />;
    case "experience":
      return (
        <ExperienceFolder cover={t.folderCover} paper={t.paper} link={paper} open={folder.open} reduced={folder.reduced} onOpen={folder.onOpen} />
      );
    case "clip-a":
      return <Model.PaperClip />;
    case "clip-b":
      return <Model.PaperClip color="#d8b45a" />;
    default:
      return null;
  }
}

function Warmup({ onDone, onProgress }: { onDone: () => void; onProgress?: (p: number) => void }) {
  const { gl, scene, camera } = useThree();
  const { active, progress } = useProgress();
  const fired = useRef(false);

  useEffect(() => {
    onProgress?.(Math.min(92, 18 + progress * 0.7));
  }, [progress, onProgress]);

  useEffect(() => {
    if (fired.current || active) return;
    let cancelled = false;
    const failSafe = window.setTimeout(() => {
      if (fired.current || cancelled) return;
      fired.current = true;
      onDone();
    }, 8000);

    const run = async () => {
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      if (cancelled) return;
      const renderer = gl as THREE.WebGLRenderer;
      try {
        if (typeof renderer.compileAsync === "function") await renderer.compileAsync(scene, camera);
        else renderer.compile(scene, camera);
      } catch {
        /* compile is a hitch-avoidance; a failure still reveals the desk */
      }
      if (cancelled || fired.current) return;
      fired.current = true;
      onProgress?.(100);
      onDone();
    };
    void run();
    return () => {
      cancelled = true;
      window.clearTimeout(failSafe);
    };
  }, [active, gl, scene, camera, onDone, onProgress]);

  return null;
}

function Desk({ reduced, command, view, night, onToggleNight, flashOn, onToggleFlash, projects, openProject, onOpenProject, experienceOpen, onOpenExperience, onCloseExperience, onPaperBridge, onPrintBridge, onHoverProject, skills, activeSkill, featuredSkills, labelledSkill, onSelectSkill, onHoverSkill, onFocusItem, onReady, onProgress, printing, onOpenBooth }: Omit<Props, "active">) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const gl = useThree((s) => s.gl);
  const size = useThree((s) => s.size);
  const [world] = useState(() => {
    const w = new DeskWorld(reduced);
    w.hold(PRINT_ID);
    return w;
  });
  const [link] = useState(() => new SceneLink());
  const [paper] = useState(() => new PaperLink());

  useEffect(() => {
    onPaperBridge({
      origin: () => paper.origin(camera, size.width, size.height),
      setOut: (out) => paper.setOut(out),
    });
    return () => onPaperBridge(null);
  }, [onPaperBridge, paper, camera, size]);

  useEffect(() => {
    onPrintBridge({
      origin: () => world.heldOrigin(camera, size.width, size.height),
      release: () => world.release(),
    });
    return () => onPrintBridge(null);
  }, [onPrintBridge, world, camera, size]);
  const [tex, setTex] = useState<DeskTextures | null>(null);
  const [booksReady, setBooksReady] = useState(false);
  const onBooksLoaded = useCallback(() => setBooksReady(true), []);
  const onWarm = useCallback(() => {
    world.start();
    onReady();
  }, [world, onReady]);

  useEffect(() => {
    const t = window.setTimeout(() => setBooksReady(true), 5000);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    world.frame(camera, size.width, size.height);
  }, [world, camera, size]);

  useEffect(() => {
    let alive = true;
    let built: DeskTextures | null = null;
    buildTextures().then((t) => {
      built = t;
      if (!alive) return;
      setTex(t);
      onProgress?.(16);
    });
    return () => {
      alive = false;
      if (built) Object.values(built).forEach((t) => t.dispose());
    };
  }, [onProgress]);

  useEffect(() => {
    if (!command) return;
    if (command.type === "tidy") world.tidy();
    else world.scatter();
  }, [world, command]);

  /* Two-finger pinch zooms on touch screens, like the wheel on desktop */
  useEffect(() => {
    const el = gl.domElement;
    let last = 0;
    const spread = (e: TouchEvent) => Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
    const onStart = (e: TouchEvent) => {
      if (e.touches.length === 2) last = spread(e);
    };
    const onMove = (e: TouchEvent) => {
      if (e.touches.length !== 2 || world.grabbing) return;
      e.preventDefault();
      const d = spread(e);
      if (last) world.zoomBy((last - d) * 2.2);
      last = d;
    };
    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: false });
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
    };
  }, [gl, world]);

  useEffect(() => {
    world.setView(view);
  }, [world, view]);

  /*
   * The wheel zooms the camera while the desk fills the window. Capture on
   * window runs before Lenis, so the page itself stays put; the other
   * chapters are reached from the nav instead.
   */
  useEffect(() => {
    const hero = gl.domElement.closest("section");
    const onWheel = (e: WheelEvent) => {
      if (world.grabbing || openProject !== null || experienceOpen || view === "tank" || view === "shelf") return;
      if (!hero || window.scrollY > 4 || !hero.contains(e.target as Node)) return;
      e.preventDefault();
      e.stopPropagation();
      world.zoomBy(e.deltaY);
    };
    window.addEventListener("wheel", onWheel, { capture: true, passive: false });
    return () => window.removeEventListener("wheel", onWheel, { capture: true });
  }, [gl, world, openProject, experienceOpen, view]);

  useFrame((_, delta) => {
    world.stepCamera(camera, delta);
    world.step(delta);
  });

  const setCursor = (c: string) => world.setCursor(gl.domElement, c);

  return (
    <>
      {tex && booksReady ? <Warmup onProgress={onProgress} onDone={onWarm} /> : null}
      <Room
        onLamp={onToggleNight}
        onLampHover={(on) => {
          onFocusItem(on ? "lamp" : null);
          setCursor(on ? "pointer" : "");
        }}
      />
      <Wall
        night={night}
        printing={printing}
        reduced={reduced}
        onOpenBooth={onOpenBooth}
        onFocusItem={(id) => {
          onFocusItem(id);
          setCursor(id ? "pointer" : "");
        }}
      />
      <ProjectShelf
        projects={projects}
        open={openProject}
        quiet={experienceOpen || view === "tank" || view === "shelf"}
        reduced={reduced}
        night={night}
        link={link}
        onOpen={(index) => {
          onCloseExperience();
          onOpenProject(index);
        }}
        onHover={onHoverProject}
        onLoaded={onBooksLoaded}
      />
      <Aquarium
        skills={skills}
        active={activeSkill}
        featured={featuredSkills}
        labelled={labelledSkill}
        reduced={reduced}
        night={night}
        onSelect={onSelectSkill}
        onHover={(i) => {
          onHoverSkill(i);
          setCursor(i === null ? "" : "pointer");
        }}
      />
      <Flashlight
        link={link}
        held={flashOn}
        reduced={reduced}
        home={world.flashHome}
        onToggle={onToggleFlash}
        onHover={(on) => {
          onFocusItem(on ? "flashlight" : null);
          setCursor(on ? "pointer" : "");
        }}
      />
      {tex
        ? deskItems.map((item, i) => (
            <group
              key={item.id}
              ref={(g) => world.attach(i, g)}
              onPointerDown={(e: ThreeEvent<PointerEvent>) => {
                if (e.pointerType === "mouse" && e.button !== 0) return;
                if (world.grabbing) return;
                e.stopPropagation();
                onFocusItem(item.id);
                setCursor("grabbing");
                world.grab(i, e.point, e.pointerId, gl.domElement, camera, () => setCursor(""));
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                world.turn(i);
              }}
              onPointerMove={(e) => {
                world.hoverMove(i, e.point);
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                world.hover(i, true);
                if (!world.grabbing) {
                  setCursor("grab");
                  onFocusItem(item.id);
                }
              }}
              onPointerOut={() => {
                world.hover(i, false);
                if (!world.grabbing) setCursor("");
              }}
            >
              {renderModel(item.id, tex, night, paper, { open: experienceOpen, reduced, onOpen: onOpenExperience })}
            </group>
          ))
        : null}
    </>
  );
}

/*
 * Invisible window mullions between the sun and the desk. They only write to
 * the shadow map, so the table gets that studio-window light pattern.
 */
function WindowShadow() {
  const bars: [number, number, number, number][] = [
    [0, 0, 0.28, 26],
    [0, 3.4, 26, 0.28],
  ];
  return (
    <group position={[-6.2, 10.5, 1.4]} rotation={[0, 0.42, 0]}>
      {bars.map(([x, z, w, d], i) => (
        <mesh key={i} position={[x, 0, z]} castShadow>
          <boxGeometry args={[w, 0.1, d]} />
          <meshBasicMaterial colorWrite={false} depthWrite={false} />
        </mesh>
      ))}
      {/* window edge: everything beyond the frame is wall */}
      <mesh position={[0, 0, -16]} castShadow>
        <boxGeometry args={[40, 0.1, 13]} />
        <meshBasicMaterial colorWrite={false} depthWrite={false} />
      </mesh>
    </group>
  );
}

const MAX_DPR = 2;

export function DeskCanvas({ active, ...props }: Props) {
  /* full sharpness by default; only steps down if the device can't hold the frame rate */
  const [ceiling] = useState(() => Math.min(window.devicePixelRatio || 1, MAX_DPR));
  const [dpr, setDpr] = useState(ceiling);

  return (
    <Canvas
      shadows="percentage"
      dpr={dpr}
      frameloop={active ? "always" : "never"}
      camera={{ fov: 28, near: 0.5, far: 120, position: [0, 20, 9] }}
      gl={{ antialias: true, alpha: true }}
      style={{ touchAction: "none" }}
    >
      <PerformanceMonitor
        factor={1}
        flipflops={3}
        onChange={({ factor }) => setDpr(Math.max(1, Math.round((1 + (ceiling - 1) * factor) * 4) / 4))}
        onFallback={() => setDpr(1)}
      />
      <Lighting night={props.night} reduced={props.reduced} />
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={2.2} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[12, 6, 1]} />
        <Lightformer form="rect" intensity={1.2} position={[-8, 3, 4]} rotation-y={Math.PI / 2.5} scale={[6, 3, 1]} color="#ffe2c4" />
        <Lightformer form="ring" intensity={0.8} position={[7, 4, -5]} scale={3} />
      </Environment>

      <WindowShadow />
      <Foliage reduced={props.reduced} />

      <Desk {...props} />
    </Canvas>
  );
}
