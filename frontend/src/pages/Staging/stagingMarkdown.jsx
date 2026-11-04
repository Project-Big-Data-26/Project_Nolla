// Salinan verbatim helper render Markdown/LaTeX dari Student/QuestionPage.jsx dan
// Student/QuestionReviewPage.jsx (identik per 4 November 2026). Halaman cek soal staging
// harus merender soal persis seperti halaman siswa: bila helper di halaman siswa berubah,
// salin ulang perubahan itu ke file ini.
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import katex from "katex-v016";

import "katex-v016/dist/katex.min.css";

const remarkPlugins = [remarkMath, remarkGfm];
const rehypePlugins = [rehypeKatex];
const inlineMarkdownComponents = {
  p: ({ children }) => <span>{children}</span>,
};
const markdownComponents = {
  p: ({ children }) => <p className="my-1 first:mt-0 last:mb-0 sm:my-2">{children}</p>,
  h1: ({ children }) => <h1 className="my-2 text-lg font-bold">{children}</h1>,
  h2: ({ children }) => <h2 className="my-2 text-base font-bold">{children}</h2>,
  h3: ({ children }) => <h3 className="my-2 text-sm font-bold">{children}</h3>,
  ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>,
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto">
      <table className="w-full border-collapse text-left">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-slate-300 bg-slate-50 px-2 py-1 font-bold">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-slate-300 px-2 py-1">{children}</td>
  ),
};
const normalizeMarkdown = (content) =>
  String(content ?? "")
    .replace(/\r\n|\n|\r/g, "\n")
    .replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => `$${math}$`)
    .replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => `$$\n${math}\n$$`);

const hasKatexError = (content) => {
  const formulas = content.matchAll(/(\${1,2})([\s\S]*?)\1/g);

  for (const [, delimiter, formula] of formulas) {
    try {
      katex.renderToString(formula, {
        displayMode: delimiter === "$$",
        throwOnError: true,
      });
    } catch {
      return true;
    }
  }

  return false;
};

const normalizeAiLatex = (content) =>
  content.replace(
    /\\\\(?=(?:left|right|frac|dfrac|tfrac|sqrt|text|mathrm|mathbf|overline|underline|cdot|times|div|sum|prod|int|alpha|beta|gamma|theta|pi|log|ln|sin|cos|tan)\b)/g,
    "\\",
  );

const getRenderableMarkdown = (content) => {
  const normalized = normalizeMarkdown(content);
  if (!hasKatexError(normalized)) return normalized;

  const aiNormalized = normalizeAiLatex(normalized);
  return aiNormalized !== normalized && !hasKatexError(aiNormalized)
    ? aiNormalized
    : normalized;
};

// Blok (teks soal) dan inline (teks opsi), sama seperti pemakaian di halaman siswa.
export const MarkdownBlock = ({ content }) => (
  <ReactMarkdown
    remarkPlugins={remarkPlugins}
    rehypePlugins={rehypePlugins}
    components={markdownComponents}
  >
    {getRenderableMarkdown(content)}
  </ReactMarkdown>
);

export const MarkdownInline = ({ content }) => (
  <ReactMarkdown
    remarkPlugins={remarkPlugins}
    rehypePlugins={rehypePlugins}
    components={inlineMarkdownComponents}
  >
    {getRenderableMarkdown(content)}
  </ReactMarkdown>
);
