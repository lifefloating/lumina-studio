import { cn } from "@/lib/utils";
import LocalFont from "next/font/local";
import type React from "react";

const americanTypewriter = LocalFont({
  src: "../../fonts/American_Typewriter.woff",
});

export default function LuminaLogo(
  props: React.ButtonHTMLAttributes<HTMLDivElement> & { className?: string },
) {
  return (
    <div className={cn("h-7 w-24", props.className)} {...props}>
      <svg viewBox="0 0 84 15" className="h-full w-full">
        <text
          x="1"
          y="12"
          className={cn(
            "fill-dbi tracking-wide",
            americanTypewriter.className,
          )}
          fontSize="11.5"
        >
          LUMINA
        </text>
      </svg>
    </div>
  );
}
