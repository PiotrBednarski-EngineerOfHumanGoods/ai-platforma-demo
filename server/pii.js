// Maskowanie danych osobowych przed wysłaniem do modelu i odmaskowanie odpowiedzi.
// Reguły dla danych o stałym formacie + heurystyka imię+nazwisko (lista popularnych imion).
// W produkcji: Microsoft Presidio + model NER dla języka polskiego.

const IMIONA = "Jan Anna Piotr Katarzyna Krzysztof Małgorzata Andrzej Agnieszka Tomasz Barbara Paweł Ewa Michał Magdalena Marcin Elżbieta Marek Joanna Grzegorz Aleksandra Jakub Monika Łukasz Zofia Adam Marta Mateusz Natalia Dawid Karolina Rafał Justyna Robert Dorota Jacek Beata Maciej Iwona Kamil Marzena Wojciech Renata Bartosz Weronika Damian Julia Artur Patrycja Sebastian Edyta Szymon Sylwia Przemysław Paulina Dariusz Alicja Konrad Emilia Mariusz Kinga Zbigniew Olga Daniel Izabela Filip Wiktoria Adrian Oliwia Stanisław Hanna Jerzy Maria Józef Teresa".split(" ");
// rdzeń imienia do odmiany: Anna -> Ann (Anną, Annę), Zofia -> Zofi (Zofią), Jan -> Jan (Janem)
const stem = n => n.endsWith("a") ? n.slice(0, -1) : n;
const NAZW = "[A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]{2,}(?:[- ][A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]{2,})?";
const RULES = [
  ["EMAIL",   /[\w.+-]+@[\w-]+\.[\w.-]+/g],
  ["KONTO",   /(?<![\dA-Z])(?:PL\s?)?\d{2}(?:[\s-]?\d{4}){6}(?!\d)/g],
  ["DOWOD",   /(?<![A-Z])[A-Z]{3}\s?\d{6}(?!\d)/g],
  ["TELEFON", /\+48[\s-]?\d{3}[\s-]?\d{3}[\s-]?\d{3}\b/g], // przed PESEL: +48 i 9 cyfr to 11 cyfr
  ["PESEL",   /(?<![\d+])\d{6}[\s-]?\d{5}(?!\d)/g],
  ["NIP",     /\b\d{3}[- ]\d{3}[- ]\d{2}[- ]\d{2}\b|\bNIP[:\s]*\d{10}\b/gi],
  ["TELEFON", /(?:\+48[\s-]?)?\b\d{3}[\s-]\d{3}[\s-]\d{3}\b|\b\d{9}\b/g],
  // imię z listy, także odmienione ("z Janem Kowalskim", "z Zofią Dąbrowską"), i nazwisko z wielkiej litery;
  // bez tytułu w dopasowaniu: "Pan Jan Kowalski" i "Jan Kowalski" to ta sama osoba = ten sam token
  ["OSOBA",   new RegExp(`(?<![\\p{L}])(?:${IMIONA.map(stem).join("|")})(?:a|ą|ę|y|i|ie|em|om|owi|u)?\\s+${NAZW}`, "gu")],
  // osoba spoza listy imion, ale po zwrocie grzecznościowym: "Pani Krystyna Nowak", "panem Nowakiem"
  ["OSOBA",   new RegExp(`(?<=(?<![\\p{L}])(?:[Pp]an|[Pp]ani|[Pp]ana|[Pp]anu|[Pp]anem|[Pp]anią|p\\.)\\s)${NAZW}`, "gu")]
];

export function newState() { return { map: {}, counters: {} }; }

// mask(text, state) – state współdzielony między pytaniem a fragmentami dokumentów,
// żeby ta sama osoba miała ten sam token w całym kontekście.
export function mask(text, state = newState()) {
  let out = text;
  for (const [kind, re] of RULES) {
    out = out.replace(re, (m) => {
      const existing = Object.entries(state.map).find(([, v]) => v === m);
      if (existing) return existing[0];
      state.counters[kind] = (state.counters[kind] || 0) + 1;
      const token = `[${kind}_${state.counters[kind]}]`;
      state.map[token] = m; return token;
    });
  }
  return { masked: out, map: state.map, state };
}

export function unmask(text, map) {
  let out = text;
  for (const [token, val] of Object.entries(map)) out = out.split(token).join(val);
  return out;
}
