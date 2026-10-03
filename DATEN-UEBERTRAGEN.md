# Alte Daten in das neue Firebase-Projekt übernehmen

Quelle: **sawa-82a09**. Ziel: **orbyx-8d73c**. Die Werkzeuge sind vorbereitet und lokal mit Beispieldaten geprüft. Es wurde noch keine echte Sicherung oder Übertragung ausgeführt.

Übernommen werden die Firebase-Anmeldekonten und die Firestore-Dokumente mit ihren ursprünglichen IDs und Feldern. Dadurch bleiben Termine, Aufgaben, Orbits, Mitgliedschaften, Einladungen und Rechte den richtigen Personen zugeordnet. Die App verwendet Google-Anmeldung. Falls der Benutzerexport auch Passwortkonten enthält, stoppt die Prüfung, bis deren Hash-Konfiguration vorbereitet ist.

Die folgenden Befehle laufen einmalig in **Google Cloud Shell im Browser**. Dein Laptop hostet dabei keine App. Danach veröffentlicht GitHub Actions die Webseite wie in [GITHUB-ANLEITUNG.md](GITHUB-ANLEITUNG.md) beschrieben.

## 1. Neues Projekt vorbereiten

Öffne [orbyx-8d73c](https://console.firebase.google.com/project/orbyx-8d73c/overview). Aktiviere **Authentication → Google** und erstelle unter **Firestore Database** eine Standard-Datenbank mit der ID **(default)** im Produktionsmodus. Wähle den Datenbankstandort bewusst, möglichst entsprechend deinem bisherigen Projekt. Veröffentliche anschließend unsere `firestore.rules` im neuen Projekt.

Die erste Anmeldung in der neuen Orbyx-App erfolgt **nach** dem Benutzerimport. Das verhindert neue Benutzer-IDs vor der Übernahme.

Für diese Befehle muss dein angemeldetes Google-Konto beide Projekte verwalten dürfen. Ein Web-API-Schlüssel allein ist kein Administratorzugang. Die [Firestore-REST-Dokumentation](https://firebase.google.com/docs/firestore/use-rest-api) beschreibt den Zugriff über Google-Anmeldedaten und Projektberechtigungen.

## 2. Code in Cloud Shell bereitstellen

Öffne [Google Cloud Shell](https://console.cloud.google.com/?project=orbyx-8d73c&cloudshell=true) und bestätige bei Bedarf den Zugriff für dein Google-Konto.

Lade das aktuelle Update-ZIP über **Cloud-Shell-Menü → Upload** in dein Cloud-Shell-Home-Verzeichnis. Verwende die Version für `orbyx-8d73c`. Anschließend:

```bash
umask 077
mkdir -p "$HOME/orbyx-migration-code"
unzip "$HOME/Orbyx-GitHub-Update.zip" -d "$HOME/orbyx-migration-code"
cd "$HOME/orbyx-migration-code"
mkdir -p "$HOME/orbyx-migration-private"
```

Das Verzeichnis `orbyx-migration-private` liegt außerhalb des Codes und enthält später private Daten. Diese Sicherungen bleiben bei dir und werden nicht auf GitHub hochgeladen.

## 3. Sicherungen erstellen und Ziel prüfen

Während Sicherung und Kopie sollen Nutzer ihre Termine und Orbits im alten Projekt nicht ändern. Die Kopie wird seitenweise gelesen und ist keine atomare Momentaufnahme der gesamten Datenbank.

```bash
firebase auth:export "$HOME/orbyx-migration-private/users-source.json" --format=json --project sawa-82a09
firebase auth:export "$HOME/orbyx-migration-private/users-target-before.json" --format=json --project orbyx-8d73c
node tools/check-auth-migration.cjs check "$HOME/orbyx-migration-private/users-source.json" "$HOME/orbyx-migration-private/users-target-before.json"
node tools/migrate-firestore.cjs export "$HOME/orbyx-migration-private/firestore-source.json"
node tools/migrate-firestore.cjs check "$HOME/orbyx-migration-private/firestore-source.json"
```

Führe die Befehle einzeln aus. Gehe erst weiter, wenn jeder Befehl erfolgreich endet. Falls die Firebase CLI eine Anmeldung verlangt, verwende `firebase login --no-localhost` und folge den angezeigten Schritten im Browser. Cloud Shell enthält die CLI bereits; siehe [Firebase Hosting und Cloud Shell](https://firebase.google.com/docs/hosting/quickstart).

`check` liest nur. Abweichende Benutzer oder Dokumente im neuen Projekt stoppen die Übernahme. Leere Ziele oder bereits identisch kopierte Teilmengen sind zulässig. Eine vorhandene Sicherungsdatei wird vom Firestore-Werkzeug nicht ersetzt.

Lade nach erfolgreicher Sicherung die beiden Quelldateien zusätzlich über die Download-Funktion von Cloud Shell auf deinen Rechner herunter. Es sind private Sicherungen, keine Dateien für den GitHub-Code-Upload.

## 4. Benutzerkonten mit gleichen IDs übernehmen

```bash
firebase auth:import "$HOME/orbyx-migration-private/users-source.json" --project orbyx-8d73c
firebase auth:export "$HOME/orbyx-migration-private/users-target-after.json" --format=json --project orbyx-8d73c
node tools/check-auth-migration.cjs verify "$HOME/orbyx-migration-private/users-source.json" "$HOME/orbyx-migration-private/users-target-after.json"
```

Die Prüfung verlangt gleiche Benutzer-IDs, E-Mail-Adressen, Google-Kennungen sowie den bisherigen Verifizierungs- und Sperrstatus. Firebase dokumentiert diesen Vorgang unter [Benutzer importieren und exportieren](https://firebase.google.com/docs/cli/auth).

## 5. Firestore kopieren und prüfen

```bash
node tools/migrate-firestore.cjs import "$HOME/orbyx-migration-private/firestore-source.json"
node tools/migrate-firestore.cjs verify "$HOME/orbyx-migration-private/firestore-source.json"
```

Das Werkzeug kopiert alle gefundenen Sammlungen und Unter-Sammlungen der Standard-Datenbank, einschließlich Unter-Sammlungen unter fehlenden Eltern-Dokumenten. Es erhält Dokument-IDs, Benutzer-IDs, Zeitstempel in Feldern und große Ganzzahlen. Echte Dokumentverweise ins alte Projekt werden auf das neue Projekt umgestellt. Allgemeine Textfelder werden nicht verändert.

Es löscht keine Dokumente und schreibt niemals in das alte Projekt. Vorhandene identische Zieldokumente werden übersprungen, abweichende Zieldaten stoppen die Kopie. Ein Schreibfehler stoppt den Lauf; eine identische Teilkopie lässt sich nach Behebung durch denselben Importbefehl fortsetzen. Abschließend werden alle Ziel-Dokumente erneut mit der Sicherung verglichen.

Die bisherigen technischen Erstellungs- und Änderungszeiten der Dokumenthülle werden beim Anlegen im Ziel neu vergeben. Zeitangaben, die die App in Feldern speichert, bleiben erhalten. Datenbankstandort, Regeln, Indizes, Auth-Anbietereinstellungen und Hosting-Konfiguration werden separat eingerichtet. Individuell angelegte Indizes im alten Projekt müssen bei Bedarf zusätzlich übernommen werden. Cloud-Storage-Dateien kopiert dieses Werkzeug nicht; die aktuelle App hat keine eigene Datei-Upload-Funktion.

Bestehende historische Kalenderdaten werden kopiert. Eine Bereinigung alter Überschneidungen oder eine vollständige Umstellung alter Buchungen auf neue Sperren ist eine zusätzliche Datenmigration; die in README.md dokumentierten Grenzen bleiben bestehen.

## 6. App veröffentlichen und Anmeldung prüfen

Wenn beide Überprüfungen erfolgreich sind, folge [GITHUB-ANLEITUNG.md](GITHUB-ANLEITUNG.md) und veröffentliche den neuen Code. Öffne danach `https://orbyx-8d73c.web.app/?v=16`, melde dich mit deinem bisherigen Google-Konto an und prüfe deine Orbits, Termine und Rechte. Prüfe zusätzlich die Buchung und die Sichtbarkeit mit einem zweiten bisherigen Mitglied.

Im alten Projekt bleiben die Daten erhalten. Das neue Projekt übernimmt zukünftige Änderungen erst nach dem Wechsel; es findet keine laufende Synchronisierung zwischen beiden Projekten statt.

## Kontingente

Dieser Kopierweg verwendet normale Firestore-Lese- und Schreibvorgänge. Der verwaltete Export/Import, der Blaze verlangt, wird nicht verwendet. Das Werkzeug stoppt beim Export über **10.000 Dokumenten**, damit zunächst Umfang und Kontingente geplant werden können. Der gesamte Tagesverbrauch und Datentransfer müssen trotzdem in die kostenlosen Kontingente passen; ein erfolgreicher Lauf wird nicht allein durch die Anzahl von 60 Personen garantiert. Siehe [Firestore-Kontingente](https://firebase.google.com/docs/firestore/quotas).

Die Tests für die Kopierlogik verwenden ausschließlich Beispieldaten. Ein vollständiger Lauf gegen die beiden echten Projekte ist noch nicht erfolgt.
