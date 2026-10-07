"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  style?: HTMLMotionProps<"div">["style"];
  drag?: boolean;
};

export function CanvasItem({ children, className = "", style, drag = true }: Props) {
  const reduce = useReducedMotion();
  const canDrag = drag && !reduce;

  return (
    <motion.div
      className={`absolute touch-none select-none ${canDrag ? "cursor-grab active:cursor-grabbing" : ""} ${className}`}
      style={style}
      drag={canDrag}
      dragMomentum={false}
      dragElastic={0.12}
      whileDrag={canDrag ? { scale: 1.03, zIndex: 40 } : undefined}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {children}
    </motion.div>
  );
}
