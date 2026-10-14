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
  { id: "anna", login: "a.lis",   name: "Anna Lis",        dept: "sprzedaz",   role: "handlowiec",            passwordHash: "scrypt$44fed1eac826740a47bad66afe9b35a0$ef1f25c526276ca88a50551c08ca40f3b2c835a8d691943b506395e7a2cfa01a" },
  { id: "marek", login: "m.wojcik",  name: "Marek Wójcik",    dept: "obsluga",    role: "obsługa klienta",       passwordHash: "scrypt$3b45c5dc6fd418406706bdcbe767d7be$b018ee681b699ee73fe4022318a428d2b0b0fb65cc4c23cd4b8b10a8c6d24aa1" },
  { id: "ewa", login: "e.nowak",    name: "Ewa Nowak",       dept: "biuro",      role: "asystentka biura",      passwordHash: "scrypt$25e188fb5a47d238e14b6d19734865c5$8247bb2376df798b1af531e6a3c45258e380197faff3a7982304a84bb5a4acff" },
  { id: "tomasz", login: "t.kaczmarek", name: "Tomasz Kaczmarek",dept: "ksiegowosc", role: "księgowy",              passwordHash: "scrypt$0ceeac165b6efe09e11750b400e2bd70$a9072b779ef8f21df41378ab002062c70ce65116db32be5d62e4b4ab80f6288a" },
  { id: "prezes", login: "j.zielinski", name: "Jan Zieliński",   dept: "zarzad",     role: "prezes (widzi wszystko)", passwordHash: "scrypt$c2b195af4559be7ec156bb0441361ec2$111093aebca3045a6dd3294e6a4e0e00416e48120437433659bc983498044d87" }
];
