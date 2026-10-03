# Orbyx mit Firebase Hosting veröffentlichen

**Hosting wird erst am Ende eingerichtet.** Zum jetzigen Speichern des Codes im öffentlichen Repository gilt [GITHUB-DATEIEN.md](GITHUB-DATEIEN.md). Für die spätere Veröffentlichung direkt über GitHub im Browser, ohne lokalen Webserver oder Terminal, verwende [GITHUB-ANLEITUNG.md](GITHUB-ANLEITUNG.md). Die folgende Anleitung beschreibt alternativ die Einrichtung über PowerShell.

Stand: 2. Oktober 2026. Diese Anleitung verwendet das bereits in der App eingestellte Firebase-Projekt `orbyx-8d73c`. Die Hosting-Dateien sind lokal vorbereitet; bisher wurde damit nichts auf Firebase oder GitHub veröffentlicht.

Firebase betreibt nach der Veröffentlichung die Webseite, Google-Anmeldung und Firestore-Datenbank. GitHub speichert den Quellcode; die vorbereitete Veröffentlichung wird ausschließlich manuell gestartet. Nach erfolgreicher Veröffentlichung darf dein Laptop ausgeschaltet sein.

## 1. Firebase-Projekt prüfen

Öffne [dein Firebase-Projekt](https://console.firebase.google.com/project/orbyx-8d73c/overview) mit dem Google-Konto, dem das Projekt gehört.

Verwende **Hosting** (klassisches Firebase Hosting) und den kostenlosen **Spark-Tarif**, wenn du ohne Abrechnung starten möchtest. Die App benötigt kein Firebase App Hosting. Spark bleibt innerhalb seiner kostenlosen Kontingente kostenlos; bei 60 Personen hängt der Verbrauch von der tatsächlichen Nutzung ab. Siehe [Firebase-Tarife](https://firebase.google.com/docs/projects/billing/firebase-pricing-plans).

## 2. PowerShell vorbereiten

Öffne das Terminal als **PowerShell**. Kopiere diese Zeilen hinein:

```powershell
cd "C:\Users\rabia\Downloads\Orbyx"
$orbyxNode = "C:\Users\rabia\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
$orbyxCli = "C:\Users\rabia\Downloads\Orbyx\node_modules\firebase-tools\lib\bin\firebase.js"
$env:Path = "$(Split-Path -Parent $orbyxNode);$env:Path"
& $orbyxNode --version
```

Du solltest eine Node-Versionsnummer sehen. Diese Befehle verwenden die bereits vorhandene Node-Laufzeit und Firebase CLI. Die PATH-Ergänzung gilt für dieses Terminal und ermöglicht auch den automatischen Vorbereitungsschritt beim Veröffentlichen.

Bei einem neu geöffneten Terminal gibst du diese Zeilen erneut ein. Auf einem anderen Rechner installierst du zunächst Node.js und die Firebase CLI nach der [offiziellen CLI-Anleitung](https://firebase.google.com/docs/cli).

## 3. Bei Firebase anmelden

Im selben Terminal:

```powershell
& $orbyxNode $orbyxCli login
```

Im geöffneten Browser meldest du dich mit dem Google-Konto an, das dein Firebase-Projekt verwaltet. Danach kehrst du ins Terminal zurück. Eine Frage zu optionalen Nutzungsstatistiken kannst du mit `No` beantworten.

## 4. App und Datenbankregeln veröffentlichen

Dieser Befehl veröffentlicht die aktuelle App und die zugehörigen Zugriffsregeln in deinem vorhandenen Firebase-Projekt:

```powershell
& $orbyxNode $orbyxCli deploy --only "hosting,firestore:rules" --project orbyx-8d73c
```

Firebase erstellt vor dem Upload automatisch den Ordner `public/`. Er enthält nur HTML, CSS, JavaScript, Manifest und App-Symbole. Du musst `firebase init hosting` nicht zusätzlich ausführen; die Konfiguration liegt bereits vor.

Warte auf **Deploy complete!** und die Ausgabe **Hosting URL**. Öffne anschließend [https://orbyx-8d73c.web.app](https://orbyx-8d73c.web.app). Nach erfolgreichem Deploy ist die App über diesen Link erreichbar, auch wenn dein Laptop aus ist. Die [Firebase-Hosting-Anleitung](https://firebase.google.com/docs/hosting/quickstart) beschreibt die Veröffentlichung und die bereitgestellten Domains.

Die Regeln werden im bestehenden Projekt aktualisiert. Bereits gespeicherte Termine bleiben in Firestore. App und Regeln gehören bei dieser ersten Veröffentlichung zusammen, damit die neuen Buchungen und Berechtigungen funktionieren.

## 5. Google-Anmeldung prüfen

Öffne die veröffentlichte Adresse und melde dich an. In der Firebase-Konsole prüfst du unter **Authentication → Einstellungen → Autorisierte Domains**, ob diese Hostnamen zugelassen sind:

- `orbyx-8d73c.web.app`
- `orbyx-8d73c.firebaseapp.com`

Fehlt ein Hostname, füge ihn ohne `https://` und ohne weiteren Pfad hinzu. Unter **Authentication → Anmeldemethode** muss Google aktiviert sein. Siehe [Google-Anmeldung mit Firebase](https://firebase.google.com/docs/auth/web/google-signin).

Prüfe anschließend das Anlegen und Löschen eines Termins sowie eine Einladung und Buchung mit einem zweiten Konto. Teile danach die Hosting-Adresse mit deinen Nutzern.

## 6. Den aktuellen Code auf GitHub speichern

Verwende [GitHub Desktop](https://desktop.github.com/). Wähle den passenden Weg:

### Du hast bereits ein Repository für Orbyx

1. Melde dich in GitHub Desktop an und wähle **File → Clone repository**. Wähle dein vorhandenes Orbyx-Repository und klone es in einen separaten Ordner.
2. Öffne diesen Ordner über **Repository → Show in Explorer**.
3. Übertrage den aktuellen Quellcode aus `C:\Users\rabia\Downloads\Orbyx` in diesen geklonten Ordner. Dazu gehören die acht App-Dateien, `icons/`, `tools/`, `tests/`, `firebase.json`, `firestore.rules`, `package.json`, `pnpm-lock.yaml`, `.gitignore`, `README.md` und diese Anleitung. Übertrage nicht `node_modules/`, `.test-runtime/`, `preview/`, `public/` oder Debug-Logs. Behalte den vorhandenen `.git`-Ordner im geklonten Repository.
4. Prüfe in GitHub Desktop die angezeigten Änderungen, schreibe als Zusammenfassung beispielsweise `Orbyx aktualisieren und Hosting vorbereiten`, klicke **Commit**, danach **Push origin**.
5. Das Repository bleibt aktuell **Public**. Speichere weitere Entwicklungsänderungen zunächst in `entwicklung`, wie in [GITHUB-DATEIEN.md](GITHUB-DATEIEN.md) beschrieben.

### Du hast noch kein Repository

1. In GitHub Desktop: **File → Add local repository**, dann `C:\Users\rabia\Downloads\Orbyx` auswählen.
2. Da dieser Ordner noch kein Git-Repository ist, wähle den angebotenen Link **create a repository here**. Name: `Orbyx`; Local path: `C:\Users\rabia\Downloads`. Der endgültige Repository-Pfad soll der vorhandene Ordner `C:\Users\rabia\Downloads\Orbyx` sein.
3. Speichere gegebenenfalls die Änderungen mit **Commit to main**.
4. Klicke **Publish repository**. Für das gewünschte öffentliche Repository entfernst du den Haken bei **Keep this code private**.

Die `.gitignore` schließt Abhängigkeiten, Testlaufzeiten, Vorschauen und den generierten Hosting-Ordner aus. GitHub beschreibt die Schritte unter [Projekt mit GitHub Desktop veröffentlichen](https://docs.github.com/en/desktop/adding-and-cloning-repositories/adding-an-existing-project-to-github-using-github-desktop).

## 7. Veröffentlichung aus GitHub manuell starten

Der Workflow liegt bereits unter `.github/workflows/firebase-hosting.yml` und hat ausschließlich den Auslöser `workflow_dispatch`. Eine zusätzliche automatische GitHub-Anbindung ist aktuell nicht vorgesehen. Richte den später benötigten Zugang nach [GITHUB-ANLEITUNG.md](GITHUB-ANLEITUNG.md) ein. Wenn die App fertig ist, starte **Actions → Orbyx auf Firebase veröffentlichen → Run workflow → main → Run workflow**.

Der vorbereitete Workflow veröffentlicht **Hosting**. Änderungen an `firestore.rules` veröffentlichst du zusätzlich im Terminal:

```powershell
& $orbyxNode $orbyxCli deploy --only firestore:rules --project orbyx-8d73c
```

## Spätere Änderungen ohne automatische Veröffentlichung

Bearbeite die Originaldateien und veröffentliche App und Regeln mit dem Befehl aus Schritt 4 erneut. `public/` wird automatisch neu erstellt. Zum reinen Vorbereiten ohne Veröffentlichung kannst du ausführen:

```powershell
& $orbyxNode .\tools\build-hosting.cjs
```

Die Nutzer öffnen den Firebase-Link. Dein lokaler Vorschau-Server ist nur für die Entwicklung erforderlich.
