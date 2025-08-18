import * as React from "react"

import { cn } from "../lib/utils"

const Input = React.forwardRef(({ className, type, but, ...props }, ref) => {
  return (
    <div className="flex justify-between items-center border border-input rounded-xl">
    <input
      type={type}
      className={cn(
        "flex h-9 w-full rounded-md decoration-none bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      ref={ref}
      {...props} 
      />
      {but}
      </div>
      
  );
})
Input.displayName = "Input"

export { Input }
