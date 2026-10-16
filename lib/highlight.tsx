/** Minimal Python / TypeScript syntax colouring for teaching snippets (no '#' or '//' inside strings). */
export function highlight(code: string) {
  const kw = /^(from|import|as|def|return|class|with|for|in|await|async|if|else|elif|True|False|None|const|let|new|export|function|type|lambda|yield|pass|raise|try|except)$/;
  return code.split("\n").map((line, i) => {
    let cut = line.indexOf("#");
    const slash = line.indexOf("//");
    if (slash >= 0 && !line.slice(0, slash).endsWith(":") && (cut < 0 || slash < cut)) cut = slash;
    const codePart = cut >= 0 ? line.slice(0, cut) : line;
    const comment = line.slice(codePart.length);
    const tokens = codePart.split(/("[^"]*"|'[^']*'|`[^`]*`|\b\w+\b)/g);
    return (
      <div key={i}>
        {tokens.map((t, j) => {
          if (!t) return null;
          if (/^["'`]/.test(t)) return <span key={j} className="text-amber-300">{t}</span>;
          if (kw.test(t)) return <span key={j} className="text-fuchsia-400">{t}</span>;
          if (/^[A-Z]\w+$/.test(t)) return <span key={j} className="text-sky-300">{t}</span>;
          if (/^\d/.test(t)) return <span key={j} className="text-orange-300">{t}</span>;
          if (/^@?\w+$/.test(t) && codePart.includes(t + "(")) return <span key={j} className="text-emerald-300">{t}</span>;
          return <span key={j} className="text-slate-200">{t}</span>;
        })}
        {comment && <span className="italic text-slate-500">{comment}</span>}
        {line === "" && " "}
      </div>
    );
  });
}
