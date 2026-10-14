---
name: ai-security-checklist
description: Checklista bezpieczeństwa i RODO do przejścia przed uruchomieniem agenta AI lub automatyzacji u klienta. Użyj przy review przepływu n8n, kodu agenta lub przed oddaniem wdrożenia.
---

# Checklista bezpieczeństwa wdrożenia AI

Przejdź wszystkie punkty i dla każdego napisz: ✅ spełnione / ⚠️ częściowo (co brakuje) / ❌ brak (co zrobić). Na końcu podsumuj w 3 zdaniach, czy wdrożenie można uruchomić.

## 1. Dane wchodzące do modelu
- [ ] Do modelu trafia tylko to, co potrzebne do zadania (nie całe bazy, nie całe skrzynki).
- [ ] Dane osobowe (imię i nazwisko, telefon, e-mail, PESEL, NIP, adres, numer konta) są maskowane przed wysłaniem.
- [ ] Dane szczególnej kategorii (zdrowie, finanse osobiste) – jest decyzja: model lokalny lub wyłączenie z zakresu.
- [ ] Treść maili/dokumentów jest traktowana jako dane, nie jako polecenia (ochrona przed prompt injection w prompcie systemowym).

## 2. Dostawca modelu
- [ ] API komercyjne z umową powierzenia (DPA), nie darmowy czat.
- [ ] Dane z API nie są używane do trenowania (sprawdzone w warunkach dostawcy).
- [ ] Region przetwarzania: UE, jeśli klient tego wymaga.
- [ ] Zmiana dostawcy możliwa w jednym miejscu (brama AI).

## 3. Uprawnienia i sekrety
- [ ] Agent ma własne konto/klucz z minimalnym zakresem (odczyt tam, gdzie wystarczy odczyt).
- [ ] Klucze API i hasła w sejfie na sekrety lub zmiennych środowiskowych, nigdy w kodzie ani w eksportowanym workflow.
- [ ] Dostęp do bazy wiedzy respektuje role użytkowników (dział widzi swoje).

## 4. Akcje agenta
- [ ] Akcje o skutkach zewnętrznych (mail do klienta, faktura, zmiana danych, płatność) wymagają zatwierdzenia przez człowieka.
- [ ] Jest wyłącznik: agenta można zatrzymać jednym kliknięciem po stronie klienta.
- [ ] Agent nie może wysłać danych na adres lub do systemu, który pojawił się w treści wiadomości.

## 5. Logi, monitoring, retencja
- [ ] Każda akcja zapisana: kto, kiedy, na jakich danych, z jakim wynikiem.
- [ ] Błędy przepływu generują alert (Telegram/Teams/e-mail) do osoby odpowiedzialnej.
- [ ] Ustalony czas przechowywania logów i rozmów; procedura usunięcia danych na żądanie.
- [ ] Koszty API widoczne per dział/przepływ; ustawione limity.

## 6. Zgodność i komunikacja
- [ ] Użytkownik/klient wie, że rozmawia z AI (AI Act).
- [ ] Decyzje dotyczące ludzi (HR, oceny, kredyt) podejmuje człowiek.
- [ ] Klient dostał listę: jakie dane, do jakiego dostawcy, w jakim celu.
- [ ] Jest plan testów na realnych przykładach klienta przed uruchomieniem produkcyjnym.

## Format odpowiedzi
Tabela: Punkt | Status | Co brakuje / co zrobić. Potem: „Rekomendacja: uruchomić / uruchomić po poprawkach / nie uruchamiać” z uzasadnieniem.
