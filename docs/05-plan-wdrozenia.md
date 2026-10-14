# Plan wdrożenia u klienta

Etapy trwają zwykle dwa tygodnie i każdy kończy się działającym rozwiązaniem oraz pomiarem. Wdrożenie można zatrzymać po każdym etapie, a firma zachowuje to, co powstało.

| Etap | Czas | Co powstaje | Miara sukcesu |
|---|---|---|---|
| 0. Audyt | 2–3 tyg. | rozmowy z działami, mapa procesów, lista dokumentów, klasyfikacja danych, decyzja: chmura / model w firmie / hybryda | uzgodniona lista zadań na pilotaż i wycena |
| 1. Fundament | 2 tyg. | logowanie kontem firmowym (Entra ID / Google), brama z maskowaniem i klasyfikacją, baza wiedzy z pierwszymi dokumentami, szyfrowanie, kopie, monitoring | każdy pracownik dostaje odpowiedzi ze źródłem |
| 2. Pilotaż | 2 tyg. | jeden dział, jedno zadanie (np. obsługa klienta: odpowiedzi z procedur i wnioski o wizytę) | czas odpowiedzi klientowi przed i po |
| 3. Pomiar i decyzja | 1 tyg. | raport: co działa, ile kosztuje, ile oszczędza | decyzja zarządu na podstawie liczb |
| 4. Kolejne działy | 2 tyg. na dział | konfiguracja działu: dokumenty, narzędzia, polityka modeli | dział korzysta samodzielnie |
| 5. Utrzymanie | na bieżąco | aktualizacja dokumentów, nowe narzędzia, miesięczny raport użycia i kosztów | koszt w budżecie, brak incydentów dotyczących danych |

## Co klient przygotowuje

- Osoba kontaktowa w każdym dziale i administrator po stronie IT.
- Dokumenty: procedury, cenniki, wzory pism (dowolny format, przygotujemy wersje do bazy).
- Decyzje: które działy mogą korzystać z chmury, budżet miesięczny, retencja danych.
- Formalności: umowa powierzenia z dostawcą modelu, informacja dla pracowników, regulamin korzystania z asystenta.

## Integracje (w kolejnych etapach)

Kalendarz i poczta (Microsoft 365 / Google), program do faktur, magazyn, system CRM (jeśli firma go używa), Teams jako kanał rozmowy. Każda akcja na zewnątrz nadal wymaga zatwierdzenia przez człowieka.

## Odbiór

Lista kontrolna przed uruchomieniem produkcyjnym: [skills/ai-security-checklist/SKILL.md](../skills/ai-security-checklist/SKILL.md). Testy automatyczne: `npm test`.
