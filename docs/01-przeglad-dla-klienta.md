# Compax: przegląd dla zarządu

Jeden asystent AI dla wszystkich pracowników firmy. Każdy dział widzi tylko swoje dokumenty i sprawy. Dane osobowe nie opuszczają firmy w jawnej postaci, a każdą akcję na zewnątrz zatwierdza człowiek.

## Problem, który rozwiązuje

W firmie z kilkoma działami wiedza leży w procedurach, cennikach i głowach kilku osób. Pracownicy pytają się nawzajem o te same rzeczy, a nowe osoby szukają odpowiedzi tygodniami. Jednocześnie ludzie już używają darmowych czatów AI na prywatnych kontach i wklejają tam dane klientów. Firma nie wie, co wyszło na zewnątrz ani ile to kosztuje.

## Co robi

| Funkcja | Dla kogo | Przykład |
|---|---|---|
| Odpowiedzi z dokumentów firmy, ze wskazaniem źródła | każdy pracownik | „Jaki rabat mogę dać sam?”, „Ile mamy czasu na odpowiedź na reklamację?” |
| Przygotowanie akcji do zatwierdzenia | sprzedaż, obsługa, biuro, księgowość | spotkanie z klientem, notatka o sprawie, przypomnienie o płatności |
| Rejestr spraw zamiast osobnego CRM | dział i zarząd | zatwierdzone spotkania i notatki widoczne w zakładce Sprawy |
| Baza wiedzy działu, rozwijana przez pracowników | każdy dział | dodanie procedury lub cennika w aplikacji, działa od razu |
| Dziennik i koszty | zarząd | kto pytał, co wyszło do modelu, ile kosztował miesiąc w każdym dziale |

## Czego nie robi

- Nie podejmuje decyzji za ludzi. Przygotowuje, a człowiek zatwierdza.
- Nie zgaduje. Gdy w dokumentach nie ma odpowiedzi, mówi to wprost i nie wywołuje płatnego modelu.
- Nie uczy się z czatu. Wiedzą firmy jest tylko to, co ktoś świadomie dodał jako dokument albo zatwierdził jako sprawę.

## Jak chroni dane

1. Pracownik widzi wyłącznie dokumenty swojego działu i wspólne. Filtr działa przy wyszukiwaniu, zanim cokolwiek trafi do modelu.
2. Nazwiska, telefony, e-maile, NIP-y i numery kont są zamazywane, zanim pytanie wyjdzie z firmy.
3. Dane szczególnie wrażliwe (PESEL, numer konta, zdrowie, wynagrodzenia, dokumenty tożsamości) mogą trafić wyłącznie do modelu uruchomionego w firmie. Bez niego pytanie nie wychodzi nigdzie, a administrator dostaje powiadomienie.
4. Dane zapisane w systemie są zaszyfrowane na dysku. Codziennie powstaje kopia zapasowa.

Szczegóły: [02-bezpieczenstwo-i-rodo.md](02-bezpieczenstwo-i-rodo.md).

## Modele AI i koszty

Model jest dobierany do pytania. Proste pytania idą do taniego modelu, analizy do mocniejszego, powtarzające się pytania wracają z pamięci za darmo. Księgowość i zarząd domyślnie nie korzystają z chmury wcale. Zarząd ustala miesięczny budżet. Po jego wyczerpaniu system przechodzi na model w firmie albo tryb bez modelu.

Rząd wielkości: firma 40 osób, 1000 pytań miesięcznie, to kilka dolarów miesięcznie za chmurę. Szczegóły: [04-koszty.md](04-koszty.md).

## Wdrożenie

Etapami, z pomiarem po każdym: audyt procesów, fundament, pilot w jednym dziale, decyzja na podstawie liczb, kolejne działy co dwa tygodnie. Szczegóły: [05-plan-wdrozenia.md](05-plan-wdrozenia.md). Koncepcja w PDF: [Platforma_AI_dla_firmy_wielodzialowej.pdf](../Platforma_AI_dla_firmy_wielodzialowej.pdf).
