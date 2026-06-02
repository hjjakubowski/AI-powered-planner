# Sprawozdanie projektowe - AI Powered Planner

## 1. Informacje ogolne

**Nazwa projektu:** AI Powered Planner  
**Typ aplikacji:** aplikacja webowa typu full-stack  
**Cel biznesowy:** wspomaganie planowania nauki, pracy i codziennych zadan z wykorzystaniem klasycznego systemu CRUD oraz asystenta AI  
**Repozytorium:** projekt przygotowany do wersjonowania w Git/GitHub  
**Sposob uruchomienia:** lokalnie przez Gradle/Vite lub kompletny stack przez Docker Compose  


## 2. Cel i zakres projektu

Celem projektu bylo stworzenie aplikacji do planowania zadan, ktora pozwala uzytkownikowi:

- zalozyc konto i zalogowac sie do systemu,
- zarzadzac wlasnym kontem,
- tworzyc projekty grupujace zadania,
- dodawac, edytowac, filtrowac i usuwac zadania,
- zmieniac status zadan w widoku tablicy,
- kontrolowac postep pracy na podstawie statystyk,
- korzystac z asystenta AI generujacego sugestie planu dnia,
- przechowywac dane w trwalej bazie danych,

Aplikacja ma charakter praktycznego narzedzia planistycznego. Uzytkownik po zalogowaniu otrzymuje dashboard, w ktorym widzi projekty, zadania, filtry, widok Kanban, widok listy, statystyki oraz plynnie dostepny czat AI.

## 3. Zastosowany stack technologiczny

### 3.1. Backend

Backend zostal wykonany w technologii Java/Spring Boot:

- **Java 21** - glowny jezyk backendu.
- **Spring Boot 4** - framework aplikacyjny.
- **Spring Web** - obsluga REST API.
- **Spring Security** - autoryzacja, role, sesje HTTP i CSRF.
- **Spring Data JPA** - repozytoria i dostep do bazy danych.
- **Hibernate** - implementacja ORM.
- **Jakarta Validation** - walidacja danych wejsciowych.
- **PostgreSQL** - docelowa baza danych.
- **H2** - baza in-memory w testach.
- **Spring AI Google GenAI** - integracja z zewnetrznym modelem Gemini.
- **Springdoc OpenAPI** - generator dokumentacji API.
- **Gradle** - system budowania projektu.

Najwazniejsze pliki backendu:

```text
build.gradle
src/main/resources/application.properties
src/main/java/pl/hubert/aipoweredplanner/AiPoweredPlannerApplication.java
src/main/java/pl/hubert/aipoweredplanner/domain/**
```

### 3.2. Frontend

Frontend zostal wykonany jako aplikacja React:

- **React 19** - warstwa interfejsu uzytkownika.
- **Vite 8** - srodowisko developerskie i build frontendu.
- **Axios** - komunikacja z REST API.
- **React Markdown** - renderowanie odpowiedzi AI w czacie.
- **CSS** - dedykowane arkusze stylow dla widokow.

Najwazniejsze pliki frontendu:

```text
frontend/src/App.jsx
frontend/src/main.jsx
frontend/src/services/api.js
frontend/src/context/AuthContext.jsx
frontend/src/context/ChatContext.jsx
frontend/src/pages/**
frontend/src/components/ChatWidget.jsx
```

### 3.3. Infrastruktura

Do uruchamiania kompletnego srodowiska uzyto:

- **Docker Compose** - orkiestracja backendu, frontendu i PostgreSQL.
- **Dockerfile** w katalogu glownym - budowanie obrazu backendu.
- **frontend/Dockerfile** - budowanie statycznego frontendu.

Pliki infrastrukturalne:

```text
Dockerfile
compose.yaml
.dockerignore
.env.example
frontend/Dockerfile
frontend/nginx.conf
```

## 4. Architektura systemu

Projekt zostal podzielony na dwie glowne czesci:

1. **Backend REST API** - odpowiada za logike biznesowa, bezpieczenstwo, walidacje, persystencje danych oraz komunikacje z API AI.
2. **Frontend SPA** - odpowiada za interfejs uzytkownika, wysylanie zapytan do backendu i prezentacje danych.

Komunikacja miedzy frontendem a backendem odbywa sie przez HTTP w formacie JSON. Frontend wysyla zadania do endpointow `/api/**`, a backend zwraca odpowiedzi w postaci DTO, czyli jawnie zdefiniowanych kontraktow danych.

Schemat uproszczony:

```text
Uzytkownik
   |
   v
React/Vite Frontend
   |
   | HTTP + JSON + session cookie + CSRF
   v
Spring Boot REST API
   |
   | Spring Data JPA / Hibernate
   v
PostgreSQL

Spring Boot REST API
   |
   | Spring AI
   v
Google Gemini API
```

## 5. Struktura backendu

Backend zostal podzielony na warstwy zgodne z typowa architektura aplikacji Spring:

```text
domain/config
domain/controller
domain/dto
domain/entity
domain/exception
domain/repository
domain/security
domain/service
```

### 5.1. Warstwa encji

Encje reprezentuja model danych zapisywany w bazie:

- `AppUser` - konto uzytkownika,
- `Project` - projekt nalezacy do uzytkownika,
- `Task` - zadanie nalezace do uzytkownika,
- `Role` - rola uzytkownika (`USER`, `ADMIN`),
- `TaskStatus` - status zadania (`TODO`, `DOING`, `DONE`).

Relacje:

- uzytkownik ma wiele projektow,
- uzytkownik ma wiele zadan,
- projekt ma wiele zadan,
- zadanie zawsze nalezy do uzytkownika,
- zadanie moze, ale nie musi, nalezec do projektu.

Zastosowano adnotacje JPA, m.in. `@Entity`, `@Table`, `@Id`, `@GeneratedValue`, `@ManyToOne`, `@OneToMany`, `@Enumerated`.

W encji `AppUser` pole `passwordHash` oraz kolekcje relacyjne zostaly oznaczone jako ignorowane w serializacji JSON. Jest to dodatkowe zabezpieczenie przed przypadkowym ujawnieniem hasha hasla lub relacji JPA w odpowiedzi API.

### 5.2. Warstwa repozytoriow

Repozytoria dziedzicza po `JpaRepository` i zapewniaja dostep do danych:

- `AppUserRepository`,
- `ProjectRepository`,
- `TaskRepository`.

Przyklady zastosowanych metod:

- wyszukiwanie uzytkownika po nazwie lub emailu bez rozrozniania wielkosci liter,
- pobieranie projektow po `userId`,
- pobieranie zadan po `userId`,
- pobieranie zadan po statusie.

### 5.3. Warstwa DTO

DTO oddzielaja model bazy danych od kontraktow API. Dzieki temu frontend nie otrzymuje bezposrednio encji JPA.

Najwazniejsze DTO:

- `AuthRequest`,
- `AuthResponse`,
- `RegisterRequest`,
- `UserUpdateRequest`,
- `ProjectRequest`,
- `ProjectDto`,
- `TaskRequest`,
- `TaskDto`,
- `TaskStatusRequest`,
- `AiChatRequest`,
- `ApiError`.

Walidacja danych wejsciowych jest wykonywana przez Jakarta Validation, np. `@NotBlank`, `@Email`, `@Size`, `@NotNull`.

### 5.4. Warstwa serwisow

Serwisy zawieraja logike biznesowa:

- `ProjectService` - tworzenie, pobieranie, aktualizacja i usuwanie projektow.
- `TaskService` - tworzenie, pobieranie, aktualizacja, usuwanie i zmiana statusu zadan.
- `AiPlannerService` - przygotowanie kontekstu zadan i komunikacja z modelem Gemini.

Serwisy sprawdzaja m.in. czy zasob nalezy do aktualnego uzytkownika. Dzieki temu uzytkownik nie moze pobrac ani zmodyfikowac projektu lub zadania innego konta.

### 5.5. Warstwa kontrolerow

Kontrolery udostepniaja REST API:

- `AuthController` - rejestracja, logowanie, wylogowanie, pobranie tokenu CSRF.
- `UserController` - dane aktualnego konta, zmiana emaila, usuniecie konta.
- `AdminController` - lista uzytkownikow dla roli `ADMIN`.
- `ProjectController` - CRUD projektow.
- `TaskController` - CRUD zadan i zmiana statusu.
- `AiController` - czat AI i generowanie planu dnia.

### 5.6. Obsluga bledow

Globalna obsluga bledow znajduje sie w `GlobalExceptionHandler`. Zwraca spojny format odpowiedzi `ApiError`, zawierajacy:

- timestamp,
- kod statusu HTTP,
- nazwe bledu,
- komunikat,
- sciezke requestu,
- bledy walidacji pol formularza.

Obslugiwane sa m.in.:

- bledy walidacji,
- niepoprawny JSON,
- brak zasobu,
- konflikt danych,
- brak uprawnien,
- naruszenia ograniczen bazy,
- bledy nieoczekiwane.

## 6. Model danych i persystencja

Dane sa przechowywane w PostgreSQL. Aplikacja wykorzystuje JPA/Hibernate jako warstwe ORM.

### 6.1. Encja AppUser

Przechowuje dane konta:

- `id`,
- `email`,
- `username`,
- `passwordHash`,
- `role`,
- lista projektow,
- lista zadan.

Haslo nie jest przechowywane jawnie. Podczas rejestracji backend zapisuje hash hasla wygenerowany przez `BCryptPasswordEncoder`.

### 6.2. Encja Project

Przechowuje:

- `id`,
- `name`,
- wlasciciela (`AppUser`),


Projekt zawsze nalezy do konkretnego uzytkownika.

### 6.3. Encja Task

Przechowuje:

- `id`,
- `title`,
- `description`,
- `status`,
- opcjonalny projekt,
- wlasciciela,
- date utworzenia,
- termin wykonania,
- opcjonalny stan Kanban.

Status zadania jest reprezentowany przez enum `TaskStatus`.

### 6.4. Trwalosc danych

W Docker Compose baza PostgreSQL korzysta z wolumenu:

```text
planner-postgres-data
```

Dzieki temu dane nie znikaja po restarcie kontenerow. Spelnia to wymaganie persystencji danych.

## 7. Bezpieczenstwo

Bezpieczenstwo zostalo zrealizowane w oparciu o Spring Security.

### 7.1. Rejestracja

Uzytkownik podaje:

- email,
- nazwe uzytkownika,
- haslo.

Backend waliduje dane, normalizuje email i sprawdza unikalnosc emaila oraz nazwy uzytkownika. Haslo jest hashowane przy uzyciu BCrypt.

### 7.2. Logowanie

Logowanie odbywa sie przez `POST /api/auth/login`. Po poprawnym logowaniu backend tworzy sesje HTTP i zapisuje uwierzytelnienie w kontekscie Spring Security.

Projekt nie przechowuje jawnych danych logowania w `localStorage`. Jest to istotna poprawa bezpieczenstwa wzgledem rozwiazan opartych o przechowywanie hasla lub naglowka Basic Auth po stronie przegladarki.

### 7.3. Sesje i CSRF

Aplikacja korzysta z:

- ciasteczek sesyjnych,
- `withCredentials: true` w Axios,
- tokenu CSRF,
- naglowka `X-XSRF-TOKEN` dla operacji modyfikujacych dane.

Endpoint `GET /api/auth/csrf` pozwala frontendowi pobrac token wymagany przy operacjach `POST`, `PUT`, `PATCH` i `DELETE`.


### 7.4. Izolacja danych uzytkownikow

Projekty i zadania sa zawsze filtrowane po aktualnie zalogowanym uzytkowniku. Serwisy sprawdzaja, czy dany zasob nalezy do uzytkownika wykonujacego operacje.

Przyklad:

- uzytkownik A nie moze pobrac projektu uzytkownika B,
- uzytkownik A nie moze zaktualizowac zadania uzytkownika B,
- uzytkownik A nie moze przypisac zadania do projektu, ktory nie nalezy do niego.

## 8. Frontend i interfejs uzytkownika

Frontend jest aplikacja SPA napisana w React.

### 8.1. Routing

Routing obsluguje:

- `/login` - ekran logowania,
- `/register` - ekran rejestracji,
- `/` - glowny dashboard,
- `/account` - zarzadzanie kontem.

Dostep do widokow prywatnych jest chroniony przez `ProtectedRoute`. Jesli uzytkownik nie jest zalogowany, zostaje przekierowany do logowania.

### 8.2. AuthContext

`AuthContext` przechowuje informacje o aktualnym uzytkowniku i udostepnia metody:

- `login`,
- `register`,
- `logout`,
- `updateAccountEmail`,
- `deleteAccount`.

Po odswiezeniu strony frontend sprawdza aktywna sesje przez `GET /api/user/me`.

### 8.3. Dashboard

Glowny dashboard zawiera:

- podsumowanie liczby zadan,
- liczbe zadan aktywnych,
- liczbe zadan ukonczonych,
- liczbe zadan po terminie,
- panel projektow,
- formularz dodawania projektu,
- filtry,
- wyszukiwarke,
- widok tablicy,
- widok listy,
- widok statystyk,
- modal tworzenia i edycji zadania.

### 8.4. Widok Kanban

Zadania sa grupowane wedlug statusow:

- `TODO`,
- `DOING`,
- `DONE`.

Uzytkownik moze przeciagac zadania miedzy kolumnami. Zmiana statusu jest zapisywana przez endpoint `PATCH /api/tasks/{id}/status`.

### 8.5. Widok listy

Widok listy prezentuje zadania w formie tabelarycznej. Uzytkownik moze:

- wyszukiwac po tytule lub opisie,
- filtrowac po statusie,
- filtrowac po projekcie,
- zmieniac status z poziomu listy,
- edytowac zadanie,
- usuwac zadanie.

### 8.6. Widok statystyk

Widok statystyk pokazuje:

- procent ukonczenia zadan,
- liczby zadan w poszczegolnych statusach,
- postep projektow,
- najblizsze terminy.

Spelnia to wymaganie graficznej prezentacji danych w formie list, tabel, licznikow i wizualizacji postepu.

### 8.7. Strona konta

Strona konta pozwala:

- podejrzec nazwe uzytkownika,
- podejrzec role,
- zmienic email,
- usunac konto.

Usuniecie konta usuwa rowniez powiazane projekty i zadania dzieki relacjom JPA z kaskadowaniem.

## 9. Integracja z zewnetrznym API AI

Projekt wykorzystuje zewnetrzne API Google Gemini przez Spring AI.

### 9.1. Konfiguracja

Klucz API jest przekazywany przez zmienna:

```text
GOOGLE_GENAI_API_KEY
```

Model jest konfigurowany przez:

```text
GOOGLE_GENAI_MODEL
```

Domyslnie aplikacja moze dzialac bez realnego klucza:

```text
GOOGLE_GENAI_API_KEY=disabled
```

W takiej konfiguracji backend nie wykonuje realnego zapytania do AI, tylko zwraca kontrolowany komunikat informujacy o braku konfiguracji.

### 9.2. Czat AI

Endpoint:

```text
POST /api/ai/chat
```

przyjmuje wiadomosc uzytkownika i przekazuje ja do asystenta AI wraz z kontekstem aktualnych zadan.

### 9.3. Generowanie planu dnia

Endpoint:

```text
POST /api/ai/suggest-plan
```

automatycznie prosi model o wygenerowanie planu dnia na podstawie zadan w statusach `TODO` i `DOING`.

### 9.4. Ograniczenie kontekstu i ochrona promptu

W `AiPlannerService` kontekst przekazywany do AI jest ograniczony:

- brane sa tylko otwarte zadania,
- liczba zadan w kontekscie jest limitowana,
- dlugosc pol tekstowych jest skracana,
- tytuly i opisy zadan sa traktowane jako niezaufane dane uzytkownika,
- system prompt zawiera instrukcje ignorowania polecen zapisanych w tytulach lub opisach zadan.

Dzieki temu ograniczono ryzyko prompt injection oraz nadmiernego rozrostu promptu.

## 10. REST API

Glowne endpointy aplikacji:

| Metoda | Endpoint | Opis |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Rejestracja uzytkownika |
| `POST` | `/api/auth/login` | Logowanie |
| `POST` | `/api/auth/logout` | Wylogowanie |
| `GET` | `/api/auth/csrf` | Pobranie tokenu CSRF |
| `GET` | `/api/user/me` | Dane aktualnego uzytkownika |
| `PUT` | `/api/user/me` | Zmiana emaila |
| `DELETE` | `/api/user/me` | Usuniecie konta |
| `GET` | `/api/projects` | Lista projektow |
| `POST` | `/api/projects` | Dodanie projektu |
| `GET` | `/api/projects/{id}` | Szczegoly projektu |
| `PUT` | `/api/projects/{id}` | Aktualizacja projektu |
| `DELETE` | `/api/projects/{id}` | Usuniecie projektu |
| `GET` | `/api/tasks` | Lista zadan |
| `POST` | `/api/tasks` | Dodanie zadania |
| `GET` | `/api/tasks/{id}` | Szczegoly zadania |
| `PUT` | `/api/tasks/{id}` | Aktualizacja zadania |
| `PATCH` | `/api/tasks/{id}/status` | Zmiana statusu |
| `DELETE` | `/api/tasks/{id}` | Usuniecie zadania |
| `POST` | `/api/ai/chat` | Czat z AI |
| `POST` | `/api/ai/suggest-plan` | Sugestia planu dnia |
| `GET` | `/api/admin/users` | Lista uzytkownikow dla administratora |

## 11. Dokumentacja API

Do wygenerowania dokumentacji API wykorzystano **Springdoc OpenAPI**.

Konfiguracja znajduje sie w:

```text
src/main/java/pl/hubert/aipoweredplanner/domain/config/OpenApiConfig.java
```

Zaleznosc znajduje sie w `build.gradle`:

```gradle
implementation 'org.springdoc:springdoc-openapi-starter-webmvc-ui:3.0.3'
```

Po uruchomieniu backendu dokumentacja jest dostepna pod adresem:

```text
http://localhost:8080/swagger-ui.html
```

Specyfikacja OpenAPI w formacie JSON:

```text
http://localhost:8080/v3/api-docs
```

Springdoc generuje dokumentacje na podstawie kontrolerow REST, DTO i konfiguracji aplikacji. Spelnia to wymaganie wygenerowania dokumentacji przy uzyciu wybranego generatora.

## 12. Konteneryzacja

Aplikacja zostala przygotowana do uruchomienia w kontenerach Docker.

### 12.1. Backend

Backend jest budowany w wieloetapowym `Dockerfile`:

1. Etap budowania uzywa obrazu Gradle z JDK 21.
2. Aplikacja jest budowana do pliku JAR.
3. Etap runtime uzywa obrazu `eclipse-temurin:21-jre-alpine`.
4. Kontener uruchamia aplikacje komenda `java -jar`.

### 12.2. Frontend

Frontend jest budowany w `frontend/Dockerfile`:

1. Etap Node buduje aplikacje Vite.
2. Wynikowy katalog `dist` jest kopiowany do obrazu Nginx.
3. Nginx serwuje frontend jako statyczna aplikacje SPA.

### 12.3. Docker Compose

`compose.yaml` definiuje trzy uslugi:

- `postgres`,
- `backend`,
- `frontend`.

PostgreSQL posiada healthcheck i wolumen na dane. Backend czeka na zdrowa baze danych. Frontend jest wystawiony na porcie `5173`, backend na porcie `8080`, a PostgreSQL na porcie `5433` hosta.

Uruchomienie:

```bash
cp .env.example .env
docker compose up --build
```

## 13. Testy

Projekt zawiera testy backendu:

```text
src/test/java/pl/hubert/aipoweredplanner/AiPoweredPlannerApplicationTests.java
src/test/java/pl/hubert/aipoweredplanner/domain/service/ProjectServiceTest.java
src/test/java/pl/hubert/aipoweredplanner/domain/service/TaskServiceTest.java
src/test/resources/application-test.properties
```

### 13.1. Test startu kontekstu

`AiPoweredPlannerApplicationTests` sprawdza, czy kontekst Spring Boot uruchamia sie poprawnie w profilu testowym.

### 13.2. Testy ProjectService

Testy `ProjectServiceTest` sprawdzaja m.in.:

- tworzenie projektu i przypisanie go do aktualnego uzytkownika,
- aktualizacje nazwy projektu, gdy projekt nalezy do uzytkownika.

### 13.3. Testy TaskService

Testy `TaskServiceTest` sprawdzaja m.in.:

- tworzenie zadania,
- przypisanie zadania do uzytkownika,
- przypisanie zadania do projektu,
- domyslny status `TODO`,
- zmiane statusu zadania.

### 13.4. Baza testowa

Testy wykorzystuja H2 in-memory w trybie kompatybilnym z PostgreSQL:

```text
jdbc:h2:mem:planner_test;DB_CLOSE_DELAY=-1;MODE=PostgreSQL
```

Uruchomienie testow:

```bash
./gradlew test
```

Frontend posiada skrypty:

```bash
npm run lint
npm run build
```

## 14. Konfiguracja aplikacji

Najwazniejsze zmienne srodowiskowe:

| Zmienna | Opis |
| --- | --- |
| `POSTGRES_DB` | Nazwa bazy danych w Docker Compose |
| `POSTGRES_USER` | Uzytkownik bazy danych |
| `POSTGRES_PASSWORD` | Haslo bazy danych |
| `SPRING_DATASOURCE_URL` | URL JDBC backendu |
| `SPRING_DATASOURCE_USERNAME` | Uzytkownik bazy dla backendu |
| `SPRING_DATASOURCE_PASSWORD` | Haslo bazy dla backendu |
| `GOOGLE_GENAI_API_KEY` | Klucz Google AI Studio |
| `GOOGLE_GENAI_MODEL` | Model Gemini |
| `VITE_API_URL` | Bazowy URL API dla frontendu |

Repozytorium zawiera `.env.example`, ale prawdziwy `.env` jest ignorowany przez Git. Spelnia to dobra praktyke niecommitowania sekretow.

## 15. Spelnienie wymagan funkcjonalnych projektu

Ponizsza tabela pokazuje, w jaki sposob projekt spelnia wymagania z tresci zadania.

| Wymaganie | Sposob realizacji w projekcie |
| --- | --- |
| Repozytorium Git/GitHub | Projekt jest przygotowany jako repozytorium Git, posiada `.gitignore`, logiczna strukture katalogow i dokumentacje. |
| Dokumentacja projektu | Utworzono `README.md` oraz niniejsze sprawozdanie `docs/sprawozdanie.md`. |
| Dokumentacja wygenerowana generatorem | Uzyto Springdoc OpenAPI, dostepnego przez `/swagger-ui.html` i `/v3/api-docs`. |
| Aplikacja webowa | Frontend React + backend Spring Boot udostepniaja kompletna aplikacje webowa. |
| Interfejs uzytkownika | Zrealizowano widoki logowania, rejestracji, dashboard, konto, tablice, liste, statystyki i czat AI. |
| Persystencja danych | Dane sa zapisywane w PostgreSQL, a Docker Compose uzywa wolumenu `planner-postgres-data`. |
| ORM | Zastosowano Spring Data JPA i Hibernate jako odpowiednik Entity Framework. |
| Obsluga bazy danych | Repozytoria JPA obsluguja zapis, odczyt, aktualizacje i usuwanie danych. |
| Zapis i odczyt danych w aplikacji | Uzytkownik moze tworzyc, pobierac, edytowac i usuwac projekty oraz zadania. |
| Kolekcje obiektow | Listy projektow i zadan sa pobierane, filtrowane i grupowane po stronie backendu oraz frontendu. |
| Formularze recznego wprowadzania danych | Frontend zawiera formularze rejestracji, logowania, projektu, zadania i edycji konta. |
| Graficzna prezentacja danych | Dashboard prezentuje karty statystyk, tablice Kanban, liste zadan, postepy projektow i terminy. |
| Logowanie | Zaimplementowano logowanie sesyjne przez `POST /api/auth/login`. |
| Role uzytkownikow | Zaimplementowano role `USER` i `ADMIN`, a endpointy admina wymagaja roli `ADMIN`. |
| Komunikacja sieciowa z zewnetrznym API | Backend komunikuje sie z Google Gemini API przez Spring AI. |
| Format wymiany danych | Frontend i backend wymieniaja dane w formacie JSON. |
| Walidacja danych | DTO uzywaja Jakarta Validation, np. `@NotBlank`, `@Email`, `@Size`, `@NotNull`. |
| Obsluga wyjatkow | `GlobalExceptionHandler` mapuje wyjatki na spojne odpowiedzi `ApiError`. |
| Konteneryzacja | Projekt posiada Dockerfile backendu, Dockerfile frontendu i `compose.yaml`. |
| Bezpieczenstwo | Zastosowano Spring Security, sesje HTTP, CSRF, role i filtrowanie danych per uzytkownik. |
| Testy | Dodano test startu kontekstu oraz testy serwisow projektow i zadan. |

## 16. Przykladowe scenariusze uzycia

### 16.1. Rejestracja i logowanie

1. Uzytkownik otwiera frontend.
2. Przechodzi do rejestracji.
3. Podaje email, nazwe uzytkownika i haslo.
4. Backend waliduje dane i zapisuje konto z hashem hasla.
5. Uzytkownik loguje sie.
6. Backend tworzy sesje, a frontend przechodzi do dashboardu.

### 16.2. Tworzenie projektu i zadania

1. Uzytkownik tworzy projekt, np. "Studia".
2. Backend przypisuje projekt do aktualnego konta.
3. Uzytkownik tworzy zadanie z tytulem, opisem, statusem, terminem i projektem.
4. Zadanie pojawia sie na dashboardzie w odpowiedniej kolumnie.

### 16.3. Planowanie pracy

1. Uzytkownik przechodzi do widoku Kanban.
2. Przenosi zadanie z `TODO` do `DOING`.
3. Frontend wysyla `PATCH /api/tasks/{id}/status`.
4. Backend aktualizuje status w bazie.
5. Statystyki dashboardu przeliczaja postep.

### 16.4. Sugestia AI

1. Uzytkownik otwiera czat AI.
2. Klika "Zaproponuj plan".
3. Frontend wysyla request do `/api/ai/suggest-plan`.
4. Backend pobiera otwarte zadania uzytkownika.
5. `AiPlannerService` tworzy ograniczony kontekst.
6. Model Gemini generuje propozycje planu dnia.
7. Odpowiedz jest wyswietlana w czacie.

## 17. Jak uruchomic projekt

### 17.1. Docker Compose

```bash
cp .env.example .env
docker compose up --build
```

Adresy:

```text
Frontend:   http://localhost:5173
Backend:    http://localhost:8080/api
Swagger UI: http://localhost:8080/swagger-ui.html
PostgreSQL: localhost:5433
```

### 17.2. Tryb developerski

Baza:

```bash
docker compose up -d postgres
```

Backend:

```bash
./gradlew bootRun
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

## 18. Decyzje projektowe

### 18.1. Oddzielenie frontendu i backendu

Zdecydowano sie na architekture SPA + REST API, poniewaz dobrze rozdziela odpowiedzialnosci:

- backend odpowiada za dane, bezpieczenstwo i logike,
- frontend odpowiada za interakcje i prezentacje.

### 18.2. DTO zamiast encji w API

Nie zwracano bezposrednio encji JPA w wiekszosci endpointow. Zastosowanie DTO:

- ogranicza przypadkowy wyciek danych,
- stabilizuje kontrakty API,
- upraszcza frontend,
- pozwala ukryc pola techniczne, np. `passwordHash`.


### 18.3. Springdoc OpenAPI jako generator dokumentacji

Projekt udostepnia REST API, dlatego najbardziej praktycznym generatorem dokumentacji jest Springdoc OpenAPI. Pozwala on prowadzacemu i uzytkownikom technicznym szybko sprawdzic dostepne endpointy oraz ich kontrakty.

### 18.4. Docker Compose jako srodowisko uruchomieniowe

Docker Compose upraszcza uruchomienie projektu, poniewaz jedna komenda tworzy:

- baze danych,
- backend,
- frontend.

Dzieki temu projekt jest latwiejszy do sprawdzenia na innym komputerze.

## 19. Podsumowanie

AI Powered Planner realizuje kompletna aplikacje webowa z persystencja danych, logowaniem, rolami, walidacja, obsluga wyjatkow, integracja z zewnetrznym API, graficzna prezentacja danych, konteneryzacja i wygenerowana dokumentacja API.

Najwazniejsze elementy projektu to:

- backend Spring Boot z warstwowa architektura,
- baza PostgreSQL obslugiwana przez JPA/Hibernate,
- frontend React z dashboardem planera,
- bezpieczne logowanie sesyjne z CSRF,
- role `USER` i `ADMIN`,
- asystent AI oparty o Gemini,
- Docker Compose dla calego srodowiska,
- Swagger/OpenAPI jako dokumentacja API,
- testy backendu dla najwazniejszej logiki serwisowej.

