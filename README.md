# Orbyx

Installierbare Kalender- und Aufgaben-App mit Google-Anmeldung, Firebase Firestore, offenen Orbits für Familie und Zusammenarbeit sowie Service-Orbits für Unterricht, Dienstleistungen und Touren. Die Oberfläche unterstützt Deutsch, Arabisch (RTL), helle und dunkle Darstellung sowie Smartphone und Desktop.

## Code auf GitHub speichern

Vorerst bleibt das Repository öffentlich und Hosting wird erst nach den weiteren Verbesserungen eingerichtet. [GITHUB-DATEIEN.md](GITHUB-DATEIEN.md) zeigt die Ordnerstruktur und den einfachen Browser-Upload in die Arbeitsbranch `entwicklung`. Kalenderdaten und Benutzerkonten bleiben in Firebase. Der vorbereitete Firebase-Workflow startet ausschließlich manuell; Code-Änderungen lösen keinen Firebase-Deploy aus. Eine bisherige Netlify-Verbindung wird getrennt in Netlify auf **Stopped builds** gestellt.

## Start

Mit Node.js: `node tools/serve.cjs`, anschließend `http://localhost:4173` öffnen. Google-Anmeldung benötigt eine zugelassene Domain in Firebase Auth. Die App lädt Firebase-Module vom Google-CDN; ein Build ist nicht erforderlich.

Im bisherigen Projekt funktionierte der Google-Anmeldestart über `localhost`; `127.0.0.1` wurde von Firebase mit `auth/unauthorized-domain` abgelehnt. Der lokale Vorschau-Server leitet seine Startseite deshalb auf `localhost` weiter. Für lokale Tests im neuen Projekt muss auch `localhost` unter den autorisierten Auth-Domains eingetragen sein. Die veröffentlichte App verwendet ihre Firebase-Hosting-Adresse.

Die aktuelle Vorschau ist unter `http://localhost:4173/?v=16` erreichbar. Versionierte Modul- und Style-URLs verhindern eine Mischung mit alten Dateien. Die lokale Vorschau entfernt ausschließlich den Orbyx-App-Cache und den Worker dieses Pfads; Anmeldung und Kalenderdaten bleiben gespeichert. Auf veröffentlichten Seiten lädt der Worker aktuelle Dateien aus dem Netz und nutzt den App-Cache bei fehlender Verbindung.

Das konfigurierte Firebase-Projekt heißt `orbyx-8d73c`. Der Ordner enthält keine Git-Metadaten. `firebase.json` konfiguriert Regeln, klassisches Firebase Hosting und einen lokalen Firestore-Emulator. GitHub, produktives Hosting und die dort eingesetzten Firestore-Regeln wurden nicht verändert.

Die öffentliche App-Konfiguration des neuen Projekts ist übernommen und der App-Cache auf `orbyx-16` aktualisiert. Die Datenbank ist laut Projektinhaber bereits in Firebase eingerichtet. Von diesem Arbeitsordner aus wurde keine Übertragung der alten Daten ausgeführt. Falls diese noch benötigt wird, enthält [DATEN-UEBERTRAGEN.md](DATEN-UEBERTRAGEN.md) die einmalige Übernahme über Google Cloud Shell einschließlich Benutzer-ID-Prüfung und Sicherung. Die Kopierwerkzeuge lesen die Quelle, erhalten IDs und Firestore-Feldtypen, stoppen bei abweichenden Zieldaten und können eine identische Teilkopie fortsetzen. Sie sind mit Beispieldaten getestet; gegen die echten Projekte wurde hier noch kein Kopierlauf ausgeführt.

Für die spätere Veröffentlichung direkt im Browser über das vorhandene Repository [RabeeJabban/Obryx](https://github.com/RabeeJabban/Obryx) lies [GITHUB-ANLEITUNG.md](GITHUB-ANLEITUNG.md). Nach Einrichtung des dort dokumentierten GitHub-Secrets veröffentlicht der vorbereitete Workflow Hosting auf `orbyx-8d73c` nur über **Actions → Run workflow**. Ein Upload auf `main` startet ihn nicht. Datenbankregeln werden separat in der Firebase-Konsole veröffentlicht. Der Workflow wurde hier noch nicht in GitHub ausgeführt.

Die alternative Anleitung mit PowerShell steht in [VEROEFFENTLICHEN.md](VEROEFFENTLICHEN.md). `npm run build:hosting` erstellt den generierten Ordner `public/` ausschließlich aus App-Dateien und Symbolen. Firebase führt diesen Schritt vor jedem Hosting-Deploy erneut aus. Bearbeite die Originaldateien im Projekt; `public/` wird neu erstellt und nicht in Git gespeichert.

## Orbit-Modell vom 2. Oktober 2026

- **Mein Orbit** zeigt eigene Termine und Termine, an denen die Person tatsächlich teilnimmt. Die Orbit-Reiter stehen über Tag, Woche und Monat; der Kontext bleibt beim Wechsel erhalten.
- Die Orbit-Reiter stehen direkt unter der Kopfzeile über dem gesamten Kalenderbereich. Links bleiben Mini-Kalender und offene Aufgaben. Der Hintergrund übernimmt die gewählte Orbit-Farbe mit geringer Intensität; der persönliche Kalender bleibt neutral. Die Reiter lassen sich auch mit Pfeiltasten, Pos1 und Ende wechseln.
- Eigene Termine und Aufgaben lassen sich aus dem Bearbeitungsdialog löschen, auch in der Tages- und Wochenansicht. Bei Serien sind ein einzelner Tag und die ganze Serie getrennte Aktionen. Abbrechen oder ein Schreibfehler behält den Eintrag; erfolgreiches Löschen gibt die zugehörige Verfügbarkeit und Zeitsperren frei. Einzelne Serientage aktualisieren auch die anonyme Verfügbarkeit.
- Der Löschknopf steht direkt neben dem Dialogtitel. Bei Service-Buchungen sehen Planer ebenfalls „Termin löschen“; die Aktion gibt nur den ausgewählten Platz frei und erhält andere Teilnehmer.
- Ein **offener Orbit** erlaubt Mitgliedern standardmäßig gemeinsame Planung. Ein **Service-Orbit** trennt Anbieter/Planer von Schülern und Kunden. Schüler sehen ihre eigenen Termine sowie freie bzw. belegte Zeitfenster. Eine Mitgliedschaft allein blockiert keinen Kalender.
- Die erste Terminart nutzt automatisch die Arbeitszeit abzüglich Pausen. Weitere feste Arten werden vor der Rest-Art eingeordnet. Jede Art hat einen zuständigen Anbieter und optional einen Treffpunkt.
- Buchung, Platz, Termin, Schattenkalender, anonyme Verfügbarkeit und Zeitsperren werden in einer Firestore-Transaktion gespeichert. Mehrere Plätze gehören zu einer gemeinsamen Sitzung: der Anbieter ist einmal beschäftigt, die einzelnen Schüler jeweils für ihren Platz.
- Private Termine und Termine aus anderen Orbits blockieren die tatsächlich Beteiligten. Neue Termine schreiben zusätzlich deterministische Sperren in fünf Minuten großen Abschnitten. Eine angrenzende Buchung ab der Endzeit bleibt möglich; minutenweise Eingaben werden konservativ auf diese Abschnitte abgebildet.
- Schüler können auch einen vom Lehrer zugewiesenen Platz direkt absagen. Die Transaktion entfernt ihren Termin und ihre Sperren. Der Anbieter bleibt beschäftigt, solange weitere Plätze derselben Sitzung belegt sind.
- Beim Einladen lassen sich erlaubte Terminarten, Planung und Einladen getrennt festlegen. Der Betreiber kann zusätzlich den eigenen Kalender/Aufgaben und das Erstellen weiterer Orbits freigeben. Derselbe Dialog bearbeitet später Mitgliedsrechte.
- Die globale Verfügbarkeit enthält ausschließlich Zeitangaben und technische Kennungen. Ein Leser benötigt eine aktuelle gemeinsame Orbit-Mitgliedschaft. Private Titel, Notizen, Orte und Terminarten stehen nicht in diesen Verfügbarkeitsdokumenten.
- Planer dürfen Titel, Treffpunkt und Notiz einer Buchung ändern, Plätze absagen sowie eine Buchung im Bearbeitungsdialog auf ein anderes freies Fenster oder eine andere Terminart verschieben. Der Wechsel erfolgt atomar: wenn der neue Platz nicht frei ist, bleiben der ursprüngliche Termin und seine Reservierung erhalten. Bei mehreren Plätzen wird der ausgewählte Teilnehmer verschoben. Freie Termine offener Orbits sind regulär bearbeitbar.
- Die Anmeldung bleibt bei einem fehlgeschlagenen Laden der Firebase-Module beschriftet und zeigt einen verständlichen Fehler.

## Überarbeitung vom 1. Oktober 2026

- Neue Übersicht mit Planüberschrift, Kennzahlen, klaren Aktionen, beschrifteter Desktop-Navigation und anpassbaren Dialogen. Mobile Ansicht, Dark Mode und Arabisch bleiben unterstützt.
- Gruppenauswahl bleibt beim Wechsel zwischen Tag, Woche, Monat, Aufgaben und Fristen erhalten. Die Ansichten und Textsuche filtern nach der Gruppe.
- In der Wochenansicht sind freie Buchungsfenster direkt auswählbar. Die Terminsuche ist von jeder Gruppenansicht erreichbar.
- Eine neue Gruppe führt zuerst zur Einrichtung. Arbeitszeiten sind für jeden Wochentag getrennt bearbeitbar, auch mit mehreren Schichten.
- „Terminart speichern“ speichert die Einrichtung direkt. „Einstellungen speichern“ übernimmt zusätzlich eine noch ausgefüllte Terminart. Bestehende Arten sind bearbeitbar.
- Eine einzige Rest-Art steht zuletzt. Sie erhält die Arbeitszeit abzüglich Pausen und der festen Terminarten. Weitere feste Arten werden vor ihr eingefügt. Geschlossene Tage bleiben geschlossen; überlappende Arbeitszeiten erzeugen keine doppelten Fenster.
- Termine und Schattenkalender werden beim Anlegen gemeinsam in einem Batch geschrieben. Bei gemeinsamer Bearbeitung bleibt der Eigentümer erhalten.
- Service Worker auf `orbyx-15` aktualisiert; Styles, Startmodul und Buchungsmodul werden mitgecacht. Cache-Bereinigung ist auf Orbyx begrenzt. Fehlgeschlagene Beitritte löschen die Einladung nicht mehr.

## Berechtigungen

Kontozugang und Gruppenrolle sind getrennt:

| Einstellung | Bedeutung |
| --- | --- |
| Kalender + Aufgaben | Eigener Kalender und persönliche Aufgaben |
| Nur Gruppenplan | Gruppenansichten und Terminsuche; ohne Gruppe ein Hinweis auf Einladungen |
| Gruppen anlegen | Separates Kontorecht, vom Betreiber vergeben |
| Mitglied | Gruppentermine ansehen/buchen, eigene Einträge verwalten |
| Plan bearbeiten | Mitarbeiter dürfen den gemeinsamen Gruppenplan bearbeiten und Termine zuweisen |
| Verwalter | Zusätzlich Einrichtung, Einladungen und Gruppenrollen verwalten |
| Betreiber | Konten sperren, Kontozugang ändern, alle Gruppen verwalten und Termine bearbeiten |

Der Betreiber kann beim Einladen den persönlichen Kalender/Aufgaben und das Erstellen weiterer Orbits getrennt freigeben. Die Einstellungen werden beim Annehmen übernommen. Orbit-Verwalter vergeben lokale Rechte, aber keine globalen Kontorechte. Bestehende Konten ohne `vollzugriff` behalten ihren persönlichen Zugang. In Service-Orbits benötigt die Bearbeitung fremder Termine explizite Planer- oder Verwalterrechte; in offenen Orbits gilt gemeinsame Planung als Standard.

Gemeinsame Bearbeitung unterstützt Einträge mit genau einer Gruppe. Bei älteren, in mehrere Gruppen geteilten Einträgen bleiben Eigentümer und Betreiber zuständig. Neue Planer laden die Einträge ihrer Gruppe direkt; sie müssen nicht warten, bis deren Eigentümer die App öffnet.

## Firebase-Regeln und Veröffentlichung

`firestore.rules` enthält die zugehörigen Änderungen: Kontosperren und globale Rechte, geschützte Rollenlisten, eigener Profileintrag und eigene Zusage, unveränderlicher Termineigentümer sowie Zugriff für Gruppenplaner. Admin-Erkennung verlangt eine verifizierte E-Mail.

**Die Regeln und echte Transaktionen wurden lokal im Firestore-Emulator mit dem isolierten Projekt `demo-orbyx` geprüft.** Die Browserprüfungen verwenden zusätzlich einen lokalen Test-Datenspeicher. App und Regeln sind noch nicht produktiv veröffentlicht und müssen zusammen ausgerollt werden.

Für historische Daten gelten Grenzen: alte Termine erhalten anonyme Verfügbarkeit, wenn ihr Eigentümer die App öffnet. Bestehende Überschneidungen werden dadurch nicht verändert; alte Termine erhalten nicht nachträglich vollständige Zeitsperren. Bei Rollenentzug bzw. Entfernung zieht die Verwaltung Lesefreigaben für nicht eigene Termine mit genau einem Orbit aktiv zurück. Ältere Einträge mit mehreren Orbits und historische Schattenkalender benötigen weiterhin eine vollständige Migration. Kontosperren und der Zugang zur neuen anonymen Verfügbarkeit werden serverseitig geprüft.

Sehr große Serien werden vor dem Schreiben abgelehnt, wenn die benötigten Sperren die erlaubte Größe einer atomaren Änderung überschreiten. Es werden dann keine halben Termine angelegt. Dieses Modell verursacht zusätzliche Schreibvorgänge pro beteiligter Person; vor einem größeren Firmenbetrieb sollten Umfang und Firestore-Kosten gemessen werden. Fahrzeuge besitzen noch keinen separaten Ressourcenkalender; mehrere Plätze beschreiben zurzeit gemeinsame Sitzungen mit einem Anbieter.

Die Regeln basieren auf [Firebase-Feldschutz](https://firebase.google.com/docs/firestore/security/rules-fields) und [Bedingungen für Zugriffsregeln](https://firebase.google.com/docs/firestore/security/rules-conditions).

## Dateien

| Datei | Inhalt |
| --- | --- |
| `index.html` | HTML und bestehende Basis-Stile |
| `ui.css` | Überarbeitete Oberfläche und responsive Darstellung |
| `app.js` | Kalender, Gruppen, Rollen, Firebase und Buchung |
| `booking.js` | Buchungszustand, Kapazität, Teilnehmer und Konflikte |
| `startup.js` | Beschrifteter Start und verständlicher Ladefehler |
| `i18n.js` | Deutsche und arabische Texte |
| `firestore.rules` | Datenbankregeln |
| `sw.js`, `manifest.webmanifest` | Installation und lokaler App-Cache |
| `tools/serve.cjs` | Lokaler HTTP-Server ohne zusätzliche Abhängigkeiten |
| `tools/build-hosting.cjs` | Erzeugt die App-Dateien für Firebase Hosting ohne zusätzliche Abhängigkeiten |
| `VEROEFFENTLICHEN.md` | Veröffentlichung und private GitHub-Anbindung, mit PowerShell-Befehlen für diesen Rechner |

## Tests

`npm test` führt 30 Tests für Kapazität, eigene Absagen, Teilnehmerkonflikte, Restzeiten, Pausen, Samstag, Service Worker und die Migrationswerkzeuge aus. Die Migrationstests prüfen Benutzer-IDs und Google-Kennungen, gesperrte Konten, private Rechte, Feldtypen, Dokumentverweise, Unter-Sammlungen, Abbruch bei abweichenden Daten, Fortsetzung einer Teilkopie und vollständige Prüfung ohne Zugriff auf echte Projekte.

Abhängigkeiten reproduzierbar installieren: `pnpm install --frozen-lockfile`. Für Browserprüfungen: `npm run test:browser`. Die Tests verwenden Microsoft Edge im Headless-Modus und greifen nicht auf produktives Firebase zu. Geprüft werden direkt sichtbares Löschen privater Termine und Service-Buchungen, Tag/Woche/Monat, Aufgaben, Serientage und ganze Serien, Abbrechen und fehlgeschlagene Löschvorgänge, Orbit-Reiter über dem Kalender samt Tastaturbedienung, Hintergrundfarben beim Wechsel, Wiederherstellung einer alten gespeicherten App-Ansicht, Arbeitszeiten, Speichern, Einladungsrechte/Terminarten, Rollenentzug, Bearbeitung, Buchungen, zugewiesene Absagen, Verfügbarkeit, Ladefehler, Mobilansicht, Arabisch und Dark Mode. Screenshots mit Beispieldaten entstehen unter `preview/`.

`npm run test:rules` startet ausschließlich den lokalen Firestore-Emulator und führt 14 Szenarien mit echten SDK-Transaktionen und mehreren Konten aus. Benötigt Java 21 im PATH oder die portable Laufzeit unter `.test-runtime/java`. Der Testlauf nutzt eine separate CLI-Konfiguration unter `.test-runtime/config`. Geprüft werden das Löschen privater Termine und einzelner Serientage samt erneuter Buchbarkeit, konkurrierende Buchungen, mehrere Plätze, eigene/zugewiesene Absagen, private Termine und Bearbeitung ihrer Sperren, doppelte Plätze derselben Person, Umbuchung/Terminart-Wechsel und Rollback, Planerrechte, Konflikte über mehrere Orbits, Terminart-Beschränkungen, anonyme Zeitfreigaben und deren Entzug, Einladungsannahme und offene Zusammenarbeit. Absichtlich verbotene Zugriffe müssen fehlschlagen.
