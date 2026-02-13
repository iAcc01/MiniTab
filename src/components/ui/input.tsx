import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-xl border border-border-strong bg-background px-4 py-2 text-sm text-foreground placeholder:text-placeholder outline-none hover:border-placeholder focus:border-placeholder disabled:cursor-not-allowed disabled:bg-muted disabled:text-placeholder transition-colors",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
