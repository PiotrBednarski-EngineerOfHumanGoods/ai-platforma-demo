// W produkcji: SSO Microsoft Entra / Google Workspace. Tu: użytkownicy demo z PIN-em.
export const DEPTS = {
  wspolne: "Dokumenty wspólne",
  sprzedaz: "Sprzedaż",
  obsluga: "Obsługa klienta",
  biuro: "Biuro / administracja",
  ksiegowosc: "Księgowość",
  zarzad: "Zarząd"
};

export const users = [
  { id: "anna",   name: "Anna Lis",        dept: "sprzedaz",   role: "handlowiec",            pin: "1111" },
  { id: "marek",  name: "Marek Wójcik",    dept: "obsluga",    role: "obsługa klienta",       pin: "2222" },
  { id: "ewa",    name: "Ewa Nowak",       dept: "biuro",      role: "asystentka biura",      pin: "3333" },
  { id: "tomasz", name: "Tomasz Kaczmarek",dept: "ksiegowosc", role: "księgowy",              pin: "4444" },
  { id: "prezes", name: "Jan Zieliński",   dept: "zarzad",     role: "prezes (widzi wszystko)", pin: "0000" }
];
