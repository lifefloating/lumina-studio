import { type SlateElementProps, SlateElement } from "platejs/static";

import { cn } from "@/lib/utils";

export function PresentationParagraphElementStatic(props: SlateElementProps) {
  const element = props.element as { listStyleType?: unknown } | undefined;
  const asTag = element?.listStyleType ? "div" : "p";

  return (
    <SlateElement
      as={asTag}
      {...props}
      className={cn(
        "m-0 px-0 py-1 text-[1em]",
        "leading-[1.6]",
        "text-(--presentation-text)",
        "[font-family:var(--presentation-body-font)]",
        "caret-primary",
        props.className,
      )}
    >
      {props.children}
    </SlateElement>
  );
}

