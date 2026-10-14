# Koszty

## Dlaczego „AI zjada tokeny” i dlaczego tu nie

Koszt rośnie, gdy do modelu wysyła się całe dokumenty, całą historię i długie instrukcje, a agent kręci się w pętli. Tu do modelu idą najwyżej cztery fragmenty dokumentów, sześć ostatnich wiadomości i prośba o krótką odpowiedź. Jedno pytanie to zwykle 250 do 900 tokenów wejścia i 50 do 250 wyjścia.

## Koszt pytania (ceny API Anthropic, USD za milion tokenów)

| Model | Rola | Wejście / wyjście | Typowe pytanie | 1000 pytań |
|---|---|---|---|---|
| Claude Haiku 5.5 | proste pytania | 0,10 / 0,50 | ok. 0,0001 USD | ok. 0,10 USD |
| Claude Sonnet 5.5 | analizy | 2 / 10 | ok. 0,004 USD | ok. 4 USD |
| Claude Opus 5.5 | analizy, gdy liczy się jakość | 4 / 20 | ok. 0,008 USD | ok. 8 USD |
| model w firmie | dane chronione, księgowość, zarząd | 0 za token | 0 | 0 |
| pamięć odpowiedzi | powtarzające się pytania | 0 | 0 | 0 |

Pomiar z wersji pokazowej: proste pytanie na Haiku 0,00013 USD, analiza na Sonnecie 0,0035 USD, przygotowanie wniosku 0,004 USD. Ceny sprawdzić w aktualnym cenniku dostawcy przed ofertą.

## Co obniża koszt (wbudowane)

1. Dobór modelu do pytania: proste do taniego, analizy do mocnego.
2. Pamięć odpowiedzi: to samo pytanie bez danych osobowych w tym samym dziale nie wywołuje modelu przez 7 dni.
3. Brak dokumentów: pytanie bez trafień nie idzie do modelu, odpowiedź „nie ma tego w dokumentach” jest darmowa.
4. Mały kontekst: fragmenty zamiast dokumentów, krótka historia.
5. Polityka działów: księgowość i zarząd bez chmury.
6. Limity: miesięczny budżet w USD dla firmy i limit pytań na dział; po przekroczeniu model w firmie albo tryb bez modelu.
7. Twardy limit wydatków w konsoli dostawcy jako ostatni bezpiecznik.

## Model w firmie

| Wariant | Koszt | Uwagi |
|---|---|---|
| komputer z kartą graficzną 24 GB (np. Bielik 11B przez Ollamę) | ok. 8–15 tys. zł jednorazowo + prąd | dane nie opuszczają firmy, wystarczy do pytań o procedury |
| serwer z GPU w chmurze w UE | od kilkuset zł miesięcznie | gdy firma nie chce sprzętu u siebie |
| serwer bez GPU, mały model | kilkadziesiąt zł miesięcznie | wolny (kilkanaście sekund na odpowiedź), do pokazów i małego ruchu |

## Przykładowy miesiąc

Firma 40 osób, 25 pytań na osobę miesięcznie (1000 pytań), 70% prostych, 20% analiz, 10% powtórzeń z pamięci, księgowość i zarząd lokalnie:

- chmura: ok. 0,07 USD (Haiku) + ok. 0,80 USD (Sonnet) ≈ **1 USD miesięcznie**,
- serwer aplikacji (VPS w UE): ok. 8–15 EUR miesięcznie,
- model w firmie: jednorazowo sprzęt albo stały koszt serwera z GPU.

Główny koszt to wdrożenie i utrzymanie (dokumenty, integracje, opieka), nie tokeny.
