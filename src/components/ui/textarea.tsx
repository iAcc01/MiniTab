import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-xl border border-border-strong bg-background px-4 py-2 text-sm text-foreground placeholder:text-placeholder outline-none hover:border-placeholder focus:border-placeholder disabled:cursor-not-allowed disabled:bg-muted disabled:text-placeholder transition-colors",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
