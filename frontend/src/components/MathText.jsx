import { Fragment } from "react";
import { InlineMath } from "react-katex";

export default function MathText({ children }) {
  const text = String(children ?? "");
  const segments = text.split(/(\$[^$]+\$)/g);

  return segments.map((segment, index) => {
    if (segment.startsWith("$") && segment.endsWith("$")) {
      return <InlineMath key={`${segment}-${index}`} math={segment.slice(1, -1)} />;
    }
    return <Fragment key={`${segment}-${index}`}>{segment}</Fragment>;
  });
}
