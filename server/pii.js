// Maskowanie danych osobowych przed wysłaniem do modelu i odmaskowanie odpowiedzi.
// Reguły dla danych o stałym formacie + heurystyka imię+nazwisko (lista popularnych imion).
// W produkcji: Microsoft Presidio + model NER dla języka polskiego.

const IMIONA = "Jan Anna Piotr Katarzyna Krzysztof Małgorzata Andrzej Agnieszka Tomasz Barbara Paweł Ewa Michał Magdalena Marcin Elżbieta Marek Joanna Grzegorz Aleksandra Jakub Monika Łukasz Zofia Adam Marta Mateusz Natalia Dawid Karolina Rafał Justyna Robert Dorota Jacek Beata Maciej Iwona Kamil Marzena Wojciech Renata Bartosz Weronika Damian Julia Artur Patrycja Sebastian Edyta Szymon Sylwia Przemysław Paulina Dariusz Alicja Konrad Emilia Mariusz Kinga Zbigniew Olga Daniel Izabela Filip Wiktoria Adrian Oliwia Stanisław Hanna Jerzy Maria Józef Teresa".split(" ");
const NAZW = "[A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]{2,}(?:[- ][A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]{2,})?";
const RULES = [
  ["EMAIL",   /[\w.+-]+@[\w-]+\.[\w.-]+/g],
  ["KONTO",   /\b\d{2}(?:[\s-]?\d{4}){6}\b/g],
  ["PESEL",   /\b\d{11}\b/g],
  ["NIP",     /\b\d{3}[- ]\d{3}[- ]\d{2}[- ]\d{2}\b|\bNIP[:\s]*\d{10}\b/gi],
  ["TELEFON", /(?:\+48[\s-]?)?\b\d{3}[\s-]\d{3}[\s-]\d{3}\b|\b\d{9}\b/g],
  // bez tytułu grzecznościowego w dopasowaniu: "Pan Jan Kowalski" i "Jan Kowalski" to ta sama osoba = ten sam token
  ["OSOBA",   new RegExp(`\\b(?:${IMIONA.join("|")})\\s+${NAZW}`, "g")]
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
