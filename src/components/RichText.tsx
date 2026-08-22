import katex from 'katex';
import 'katex/dist/katex.min.css';

function renderMath(tex: string, displayMode = false): string {
  try {
    return katex.renderToString(tex, {
      throwOnError: false,
      displayMode,
      output: 'html',
    });
  } catch {
    return tex;
  }
}

export default function RichText({ text }: { text: string }) {
  const parts = text.split(/(\$\$[^$]+\$\$|\$[^$\n]+?\$)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (/^\$\$.+\$\$$/.test(part)) {
          return (
            <span
              key={`d-${i}`}
              className="my-1 block overflow-x-auto text-[#E9C468]"
              dangerouslySetInnerHTML={{
                __html: renderMath(part.slice(2, -2), true),
              }}
            />
          );
        }
        if (/^\$.+\$$/.test(part)) {
          return (
            <span
              key={`m-${i}`}
              className="text-[#E9C468]"
              dangerouslySetInnerHTML={{
                __html: renderMath(part.slice(1, -1)),
              }}
            />
          );
        }
        return <span key={`t-${i}`}>{part}</span>;
      })}
    </>
  );
}
