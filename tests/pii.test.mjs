// Wykrywanie danych chronionych, których nie łapały proste wzorce: karta płatnicza, numery rozbite na kilka wiadomości.
import { test } from "node:test";
import assert from "node:assert/strict";
import { classify } from "../server/policy.js";
import { mask, luhn } from "../server/pii.js";

test("karta płatnicza: wykrywana po sumie Luhna (ze spacjami i bez), przypadkowe cyfry nie", () => {
  assert.equal(luhn("4111 1111 1111 1111"), true);
  assert.equal(luhn("4111111111111112"), false);
  assert.deepEqual(classify("Klient płaci kartą 4111 1111 1111 1111", 0).reasons, ["numer karty"]);
  assert.equal(classify("Zamówienie 4111111111111112", 0).level, "public");
  assert.equal(mask("Karta 4111-1111-1111-1111").masked, "Karta [KARTA_1]");
});

test("PESEL rozbity na kilka wiadomości jest sklejany w kolejności i sprawdzany cyfrą kontrolną", () => {
  assert.equal(classify(["8501", "0112", "345"].join("\n"), 0).level, "restricted");
  assert.equal(classify(["9001", "0112", "345"].join("\n"), 0).level, "public", "zła cyfra kontrolna: bez fałszywego alarmu");
});

test("bez fałszywych alarmów: telefon, godzina, faktura, data, kwota", () => {
  for (const s of ["tel. 600 123 456 o 10 00 we wtorek", "FV 123/2026 na 4 200 zł, termin 14.10.2026", "Umów spotkanie we wtorek o 10:00, sala 3"])
    assert.equal(classify(s, 0).level, "public", s);
});

test("IBAN nie jest cięty przez regułę karty", () => {
  assert.equal(mask("IBAN PL61 1090 1014 0000 0712 1981 2874").masked, "IBAN [KONTO_1]");
});

test("klasyfikacja po audycie: obejścia wykrywane, typowe zdania firmy bez fałszywych alarmów", async () => {
  const { classify } = await import("../server/policy.js");
  const lvl = t => classify(t, 0).level;
  for (const t of ["Kowalski choruje na cukrzycę", "jest w szpitalu od wtorku", "moje hasło to Lato2026!", "PESEL ８５０１１２３４５６１", "44O514O1458",
    "Pierwsza część numeru: 440514\na druga część to 01458", "ile zarabia nasz handlowiec Nowak", "dowód abc123456", "PESEL 4405​1401458"])
    assert.equal(lvl(t), "restricted", t);
  for (const t of ["Diagnoza usterki agregatu chłodniczego", "Numer zamówienia 12345678901.", "Ile kosztuje przegląd klimatyzacji?", "Faktura FV 12/2026 na 4 500 zł, termin 14 dni"])
    assert.notEqual(lvl(t), "restricted", t);
});

test("maskowanie po audycie: nazwiska po końcówce, telefony stacjonarne i 2-2-2, adresy; nazwy instytucji bez zmian", () => {
  const m = t => mask(t).masked;
  assert.equal(m("Zadzwoń do Kowalskiego jutro"), "Zadzwoń do [OSOBA_1] jutro");
  assert.equal(m("Krystyna Wiśniewska prosi o ofertę"), "[OSOBA_1] prosi o ofertę");
  assert.equal(m("telefon 22 123 45 67 albo 600 12 34 56"), "telefon [TELEFON_1] albo [TELEFON_2]");
  assert.equal(m("ul. Długa 5/3, 00-950 Warszawa"), "[ADRES_1], [ADRES_2]");
  assert.equal(m("NIP: 123 45 67 890"), "[NIP_1]");
  assert.equal(m("Bank Polski i Urząd Gdański"), "Bank Polski i Urząd Gdański");
  assert.equal(m("Faktura FV 12/2026 na 4 500 zł"), "Faktura FV 12/2026 na 4 500 zł");
});
