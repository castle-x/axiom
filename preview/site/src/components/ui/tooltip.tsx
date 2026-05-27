import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface TooltipProps {
  children: ReactNode
  side?: "top" | "bottom" | "left" | "right"
  className?: string
}

export function Tooltip({ children, side = "top", className }: TooltipProps) {
  return (
    <span className={cn("tooltip-root", className)} data-side={side}>
      {children}
    </span>
  )
}

export function TooltipContent({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span role="tooltip" className={cn("tooltip-content", className)}>
      {children}
    </span>
  )
}
