// Ochrona przed zmyślonymi źródłami: model może zacytować [n], którego nie dostał.
// Zostawiamy tylko numery istniejących fragmentów; resztę usuwamy i liczymy (trafia do dziennika).
export function checkCitations(answer, sourceCount) {
  let removed = 0;
  const text = String(answer).replace(/\s?\[(\d+)\]/g, (m, d) => (+d >= 1 && +d <= sourceCount) ? m : (removed++, ""));
  return { text, removed };
}
