// Narzędzia (akcje) agenta. Każda trafia do kolejki i wymaga zatwierdzenia przez człowieka.
// W produkcji: wywołania API kalendarza, poczty, programu do faktur (lub MCP). Tu: zapis do pamięci spraw.

export const TOOLS = [
  { name: "zapisz_sprawe", title: "Zapisz sprawę / notatkę o kliencie", depts: ["sprzedaz", "obsluga", "biuro", "zarzad"],
    args: { klient: "nazwa firmy lub osoby", notatka: "treść", nastepny_krok: "co dalej", termin: "YYYY-MM-DD lub null" } },
  { name: "umow_spotkanie", title: "Umów spotkanie w kalendarzu", depts: ["sprzedaz", "obsluga", "biuro", "zarzad"],
    args: { z_kim: "osoba/firma", kiedy: "data i godzina", temat: "temat" } },
  { name: "przypomnienie_platnosc", title: "Wyślij przypomnienie o płatności", depts: ["ksiegowosc", "zarzad"],
    args: { kontrahent: "nazwa", faktura: "numer", kwota: "kwota" } }
];

export function executeTool(a, store) {
  const when = new Date().toISOString();
  if (a.tool === "zapisz_sprawe") {
    store.addCase({ dept: a.dept, klient: a.args.klient, notatka: a.args.notatka, nastepny_krok: a.args.nastepny_krok, termin: a.args.termin, by: a.userId, when });
    return `Zapisano sprawę: ${a.args.klient}`;
  }
  if (a.tool === "umow_spotkanie") {
    store.addCase({ dept: a.dept, klient: a.args.z_kim, notatka: `Spotkanie: ${a.args.temat}`, nastepny_krok: `Spotkanie ${a.args.kiedy}`, termin: a.args.kiedy, by: a.userId, when });
    return `Spotkanie z ${a.args.z_kim} (${a.args.kiedy}) zapisane. W produkcji: wpis w kalendarzu + zaproszenie e-mail.`;
  }
  if (a.tool === "przypomnienie_platnosc") {
    store.addCase({ dept: a.dept, klient: a.args.kontrahent, notatka: `Przypomnienie o płatności FV ${a.args.faktura} (${a.args.kwota})`, nastepny_krok: "Czekamy na wpłatę", termin: null, by: a.userId, when });
    return `Przypomnienie dla ${a.args.kontrahent} przygotowane. W produkcji: e-mail z szablonu + wpis w programie do faktur.`;
  }
  return "Nieznane narzędzie";
}

// Tryb demo bez modelu: prosta detekcja intencji po słowach kluczowych
export function detectToolMock(message, user) {
  const m = message.toLowerCase();
  const can = t => TOOLS.find(x => x.name === t).depts.includes(user.dept);
  if (/um[óo]w|spotkani|zaplanuj/.test(m) && can("umow_spotkanie")) {
    const kiedy = (m.match(/\b(\d{1,2}[.:]\d{2}|jutro|pojutrze|poniedzia\w+|wtor\w+|środ\w+|czwart\w+|piąt\w+)\b/g) || ["do ustalenia"]).join(" ");
    return { tool: "umow_spotkanie", args: { z_kim: guessClient(message), kiedy, temat: message.slice(0, 80) } };
  }
  if (/przypomn|zaleg|nie zapłac|płatno/.test(m) && can("przypomnienie_platnosc")) {
    return { tool: "przypomnienie_platnosc", args: { kontrahent: guessClient(message), faktura: (m.match(/fv[\s/-]?\d+[\/\d]*/i) || ["(numer)"])[0], kwota: (m.match(/\d[\d\s]*(?:,\d+)?\s*zł/) || ["(kwota)"])[0] } };
  }
  if (/zapisz|zanotuj|notatk|zapamiętaj/.test(m) && can("zapisz_sprawe")) {
    return { tool: "zapisz_sprawe", args: { klient: guessClient(message), notatka: message, nastepny_krok: "do ustalenia", termin: null } };
  }
  return null;
}
function guessClient(message) {
  const m = message.match(/(?:z|dla|do|firm[aąy]|klient\w*)\s+(?:(?:Pan|Pani|p\.)\s+)?((?:[A-ZĄĆĘŁŃÓŚŹŻ][\w&.-]*|Sp\.|z|o\.o\.|S\.A\.)(?:\s(?:[A-ZĄĆĘŁŃÓŚŹŻ][\w&.-]*|Sp\.|z|o\.o\.|S\.A\.))*)/);
  return m ? m[1].replace(/\s+(tel|we|w|na|jutro|o)$/i, "").trim() : "(klient)";
}
