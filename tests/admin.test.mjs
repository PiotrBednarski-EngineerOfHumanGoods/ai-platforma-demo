// Narzędzie administratora (RODO: dostęp, usunięcie; zmiana klucza) na zaszyfrowanych danych.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import path from "path";
import { spawnSync } from "child_process";

const DIR = fs.mkdtempSync(path.join(os.tmpdir(), "compax-admin-"));
const KEY1 = "b".repeat(64), KEY2 = "c".repeat(64);
process.env.DATA_DIR = DIR; process.env.DATA_KEY = KEY1;
const { store } = await import("../server/store.js");
const admin = (args, env = {}) => spawnSync(process.execPath, ["scripts/admin.mjs", ...args], { env: { ...process.env, DATA_DIR: DIR, ...env }, encoding: "utf8" });

store.addCase({ dept: "sprzedaz", klient: "Jan Kowalski", notatka: "oferta na 3 lokalizacje", when: new Date().toISOString() });
store.addCase({ dept: "sprzedaz", klient: "Bałtyk Market", notatka: "spotkanie we wtorek", when: new Date().toISOString() });

test("admin: szukaj znajduje sprawę osoby w zaszyfrowanych danych, bez względu na wielkość liter i ogonki", () => {
  const r = admin(["szukaj", "kowalski"]);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /sprawy:\s+1/);
  assert.ok(fs.readFileSync(path.join(DIR, "cases.json"), "utf8").startsWith("ENC1:"), "plik nadal zaszyfrowany");
});

test("admin: usun bez --tak to tylko podgląd; z --tak usuwa wyłącznie sprawy osoby", () => {
  admin(["usun", "Kowalski"]);
  assert.equal(store.cases(["sprzedaz"]).length, 2);
  const r = admin(["usun", "Kowalski", "--tak"]);
  assert.equal(r.status, 0, r.stderr);
  const left = store.cases(["sprzedaz"]);
  assert.equal(left.length, 1);
  assert.equal(left[0].klient, "Bałtyk Market");
});

test("admin: nowy-klucz przeszyfrowuje dane; stary klucz przestaje działać, nowy czyta wszystko", () => {
  const r = admin(["nowy-klucz"], { NEW_DATA_KEY: KEY2 });
  assert.equal(r.status, 0, r.stderr);
  assert.notEqual(admin(["szukaj", "Bałtyk"], { DATA_KEY: KEY1 }).status, 0, "stary klucz nie odszyfruje danych");
  const ok = admin(["szukaj", "Bałtyk"], { DATA_KEY: KEY2 });
  assert.equal(ok.status, 0, ok.stderr);
  assert.match(ok.stdout, /sprawy:\s+1/);
});

test("aplikacja ze złym kluczem nie nadpisuje danych: nieczytelny plik zostaje odłożony", () => {
  process.env.DATA_KEY = "d".repeat(64); // zły klucz (dane są teraz pod KEY2)
  store.cases(["sprzedaz"]);
  assert.ok(fs.readdirSync(DIR).some(f => f.startsWith("cases.json.nieczytelny-")), "kopia nieczytelnego pliku");
  process.env.DATA_KEY = KEY2;
});
