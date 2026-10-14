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
