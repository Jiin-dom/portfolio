type Props = {
  mode?: "hero" | "features";
  className?: string;
};

export function DeskScene({ mode = "hero", className = "" }: Props) {
  return (
    <div className={`desk-wood absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      {/* wood left edge props — Oryzo desk clutter */}
      <div className="absolute left-[4%] top-[22%] hidden h-1.5 w-36 rotate-[-32deg] rounded-full bg-cream/95 shadow-sm md:block" />
      <div className="absolute left-[7%] top-[28%] hidden h-3 w-10 rotate-[-8deg] rounded-sm bg-cream shadow md:block" />
      <div className="absolute bottom-[22%] left-[8%] hidden h-2.5 w-2.5 rounded-full bg-[#c8c8c8] shadow-sm md:block" />
      <div className="absolute bottom-[20%] left-[11%] hidden h-2 w-2 rounded-full bg-[#b0b0b0] md:block" />
      <div className="absolute bottom-[19%] left-[13.5%] hidden h-2.5 w-2.5 rounded-full bg-[#d0d0d0] md:block" />

      <div
        className={`cutting-mat absolute ${
          mode === "hero"
            ? "left-[18%] right-[2%] top-[6%] bottom-[8%] rotate-[-1.5deg] md:left-[32%] md:right-[4%] md:top-[5%] md:bottom-[9%]"
            : "left-[28%] right-[4%] top-[8%] bottom-[8%] rotate-[-1deg] md:left-[36%]"
        }`}
      >
        {/* mat scale ticks */}
        <div className="absolute inset-x-3 top-2 flex justify-between opacity-40">
          {Array.from({ length: 12 }).map((_, i) => (
            <span key={i} className="h-2 w-px bg-cream/80" />
          ))}
        </div>
        <div className="absolute inset-y-3 left-2 flex flex-col justify-between opacity-40">
          {Array.from({ length: 10 }).map((_, i) => (
            <span key={i} className="h-px w-2 bg-cream/80" />
          ))}
        </div>
      </div>

      {/* cork coaster — product object, no portrait */}
      <div
        className={`absolute rounded-full bg-cork shadow-[0_18px_50px_var(--shadow)] ${
          mode === "hero"
            ? "left-[58%] top-[48%] h-[min(34vw,220px)] w-[min(34vw,220px)] -translate-x-1/2 -translate-y-1/2 md:left-[62%] md:h-[250px] md:w-[250px]"
            : "right-[18%] top-[42%] h-[200px] w-[200px] -translate-y-1/2"
        }`}
      >
        <div className="absolute inset-[14%] rounded-full border border-ink/10 bg-[radial-gradient(circle_at_35%_30%,#c9a67a,transparent_55%),#a87d52]" />
        <div className="absolute inset-[28%] rounded-full border border-ink/15 bg-cork/40" />
      </div>

      {/* utility knife */}
      <div
        className={`absolute h-3 w-28 rotate-[18deg] rounded-sm bg-[#ef8a2a] shadow-md ${
          mode === "hero" ? "bottom-[18%] right-[14%] md:right-[18%]" : "bottom-[22%] right-[8%]"
        }`}
      >
        <span className="absolute right-0 top-1/2 h-2 w-8 -translate-y-1/2 rounded-r-sm bg-[#e8e8e8]" />
      </div>

      {/* pencil on mat */}
      <div
        className={`absolute h-1.5 w-32 rotate-[-24deg] rounded-full bg-[#2a2a2a] shadow-sm ${
          mode === "hero" ? "left-[40%] top-[28%] md:left-[46%]" : "left-[48%] top-[24%]"
        }`}
      >
        <span className="absolute right-0 top-1/2 h-1.5 w-3 -translate-y-1/2 rounded-r-full bg-[#f0c57a]" />
      </div>
    </div>
  );
}
