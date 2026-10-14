import { test } from "node:test";
import assert from "node:assert/strict";
import { checkCitations } from "../server/grounding.js";

test("źródła: zostają tylko numery fragmentów, które model naprawdę dostał", () => {
  assert.deepEqual(checkCitations("Rabat do 10% [1]. Powyżej decyzja zarządu [2].", 2), { text: "Rabat do 10% [1]. Powyżej decyzja zarządu [2].", removed: 0 });
  assert.deepEqual(checkCitations("Rabat do 10% [1], termin 14 dni [7].", 2), { text: "Rabat do 10% [1], termin 14 dni.", removed: 1 });
  assert.deepEqual(checkCitations("Nie znajduję tego w dokumentach firmy [1].", 0), { text: "Nie znajduję tego w dokumentach firmy.", removed: 1 });
  assert.deepEqual(checkCitations("Zakres 0 [0] nie istnieje", 3), { text: "Zakres 0 nie istnieje", removed: 1 });
});
