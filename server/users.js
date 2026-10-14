// W produkcji: SSO Microsoft Entra / Google Workspace. Tu: użytkownicy demo z hasłem.
// login = identyfikator firmowy do formularza; passwordHash = scrypt z solą (server/security.js); hasła kont demo poza repozytorium.
export const DEPTS = {
  wspolne: "Dokumenty wspólne",
  sprzedaz: "Sprzedaż",
  obsluga: "Obsługa klienta",
  biuro: "Biuro / administracja",
  ksiegowosc: "Księgowość",
  zarzad: "Zarząd"
};

export const users = [
  { id: "anna", login: "a.lis",   name: "Anna Lis",        dept: "sprzedaz",   role: "handlowiec",            passwordHash: "scrypt$3a669bcac7c6635b21c3394c820f21bb$b2b4540d8354a0ed0e73ab1d19dd6ba398d7d6c69553f9e471c09c55535a1e14" },
  { id: "marek", login: "m.wojcik",  name: "Marek Wójcik",    dept: "obsluga",    role: "obsługa klienta",       passwordHash: "scrypt$e10e83fc1931129758bc2a4d36ae23db$ba6051619e14714cf16e1dc48143081a480d418c9f9e14b6220dc5813f0bb1a3" },
  { id: "ewa", login: "e.nowak",    name: "Ewa Nowak",       dept: "biuro",      role: "asystentka biura",      passwordHash: "scrypt$6644ab6e6a871181b372071ec7a56119$91f436cf2e48fdeadbc3fa6f4fccf9484eed6a51806d8ea7b48ecba6a98f9c3e" },
  { id: "tomasz", login: "t.kaczmarek", name: "Tomasz Kaczmarek",dept: "ksiegowosc", role: "księgowy",              passwordHash: "scrypt$e9ec54d5e487556efb13644b319e1e9a$73bc5332f82222f2ba5c5e5e97f6d21d698af7f2c067ee8c6d6f82866ea4df56" },
  { id: "prezes", login: "j.zielinski", name: "Jan Zieliński",   dept: "zarzad",     role: "prezes (widzi wszystko)", passwordHash: "scrypt$91bbf552943a564004ad38a6086b30b7$e2776aee7999fffcd99cee3a6bbb53e34e0172226b8e5de39667f67eeb212c64" }
];
