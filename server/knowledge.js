// Baza wiedzy: pliki .md w knowledge/<dział>/. Cięte na fragmenty, wyszukiwanie leksykalne (BM25-podobne).
// W produkcji: embeddingi + pgvector/Qdrant; tu celowo bez zależności, żeby działało offline.
import fs from "fs";
import path from "path";

const STOP = new Set("i w z na do o a że to jest się nie jak dla od po przez czy co ile kto gdzie są być ma mam jaki jaka jakie ze za przy lub albo oraz".split(" "));
const norm = s => s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(w => w.length > 2 && !STOP.has(w)).map(stem);
function stem(w) { return w.replace(/(ami|ach|owie|ów|om|em|ie|ia|iu|ą|ę|y|i|a|e|u|o)$/u, "").slice(0, 7) || w; }

export function loadKnowledge(dir) {
  const chunks = [];
  for (const dept of fs.readdirSync(dir)) {
    const d = path.join(dir, dept);
    if (!fs.statSync(d).isDirectory()) continue;
    for (const file of fs.readdirSync(d).filter(f => f.endsWith(".md"))) {
      const text = fs.readFileSync(path.join(d, file), "utf8");
      // fragment = sekcja po nagłówku "## " (lub cały plik)
      const parts = text.split(/\n(?=## )/).map(p => p.trim()).filter(Boolean);
      parts.forEach((p, idx) => chunks.push({ dept, file, idx, text: p, tokens: norm(p) }));
    }
  }
  return chunks;
}

export function search(KB, query, depts, k = 4) {
  const q = norm(query);
  if (!q.length) return [];
  const docs = KB.filter(c => depts.includes(c.dept));
  const N = docs.length, avg = docs.reduce((s, c) => s + c.tokens.length, 0) / Math.max(N, 1);
  const df = {};
  for (const t of new Set(q)) df[t] = docs.filter(c => c.tokens.includes(t)).length;
  const scored = docs.map(c => {
    let s = 0;
    for (const t of q) {
      const tf = c.tokens.filter(x => x === t).length; if (!tf) continue;
      const idf = Math.log(1 + (N - df[t] + 0.5) / (df[t] + 0.5));
      s += idf * (tf * 2.2) / (tf + 1.2 * (0.25 + 0.75 * c.tokens.length / avg));
    }
    return { c, s };
  }).filter(x => x.s > 0).sort((a, b) => b.s - a.s);
  if (!scored.length) return [];
  // próg trafności: odrzucamy fragmenty wyraźnie słabsze od najlepszego i bardzo słabe absolutnie
  // (MIN_SCORE ~ jedno trafienie słowa charakterystycznego dla fragmentu; samo pospolite słowo,
  //  np. "wysyłamy", daje ok. 1.5–1.9 i nie jest odpowiedzią)
  const MIN_SCORE = 2.0;
  const best = scored[0].s;
  const matched = c => new Set(q).size ? [...new Set(q)].filter(t => c.tokens.includes(t)).length : 0;
  const need = Math.max(1, Math.floor(new Set(q).size * 0.3));
  return scored.filter(x => x.s >= MIN_SCORE && x.s >= best * 0.45 && matched(x.c) >= need).slice(0, k).map(x => x.c);
}
