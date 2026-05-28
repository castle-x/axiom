import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex h-6 items-center rounded border px-2 text-[10px] font-semibold uppercase transition-colors",
  {
    variants: {
      variant: {
        default: "border-accent/30 bg-accent/10 text-accent",
        secondary: "border-border-subtle bg-elevated text-text-secondary",
        outline: "text-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
      },
    },
    defaultVariants: {
      variant: "secondary",
    },
  },
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}
