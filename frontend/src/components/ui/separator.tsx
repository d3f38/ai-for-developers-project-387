import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function Separator({
  className,
  orientation = "horizontal",
  ...props
}: HTMLAttributes<HTMLHRElement> & { orientation?: "horizontal" | "vertical" }) {
  return (
    <hr
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className,
      )}
      {...props}
    />
  );
}
