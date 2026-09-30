rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ================= HILFEN =================
    function angemeldet()  { return request.auth != null; }
    function meineUid()    { return request.auth.uid; }
    function meineMail()   { return request.auth.token.email.lower(); }

    // Dieselbe Liste wie BETREIBER oben in app.js.
    // Kommt eine Adresse dazu, muss sie an BEIDEN Stellen stehen.
    function istBetreiber() {
      return angemeldet() && meineMail() in [
        'rabea.jabban.mrj@gmail.com'
      ];
    }

    function kreis(id) {
      return get(/databases/$(database)/documents/kreise/$(id)).data;
    }
    function binMitglied(id) {
      return angemeldet() && meineUid() in kreis(id).get('mitglieder', []);
    }
    function binVerwalter(id) {
      return angemeldet() && meineUid() in kreis(id).get('verwalter', []);
    }

    // Ein fehlendes Feld bricht die ganze Regelpruefung ab, und dann
    // schlaegt die KOMPLETTE Abfrage fehl, nicht nur ein Dokument.
    // Deshalb steht bei optionalen Feldern ueberall .get(feld, standard).

    // ================= OEFFENTLICHES PROFIL =================
    // Hier steht KEINE E-Mail. Name und Bild reichen fuer die Anzeige,
    // und sie stehen ohnehin im jeweiligen Kreis.
    match /users/{userId} {
      allow read: if angemeldet() && (meineUid() == userId || istBetreiber());

      // Die zwei Schalter aktiv und darfKreiseAnlegen darf man NICHT
      // selbst setzen, sonst koennte sich ein gesperrtes Konto
      // einfach wieder freischalten.
      allow create: if angemeldet() && meineUid() == userId
                    && !request.resource.data.keys()
                        .hasAny(['aktiv', 'darfKreiseAnlegen']);
      allow update: if angemeldet() && meineUid() == userId
                    && !request.resource.data.diff(resource.data)
                        .affectedKeys().hasAny(['aktiv', 'darfKreiseAnlegen']);

      // Nur der Betreiber sperrt und gibt frei, und auch nur das.
      allow update: if istBetreiber()
                    && request.resource.data.diff(resource.data)
                       .affectedKeys().hasOnly(['aktiv', 'darfKreiseAnlegen']);
    }

    // ================= PRIVATES PROFIL =================
    // Nur die E-Mail. Liest man selbst, und der Betreiber.
    match /users_privat/{userId} {
      allow read:  if angemeldet() && (meineUid() == userId || istBetreiber());
      allow write: if angemeldet() && meineUid() == userId;
    }

    // ================= KREISE =================
    match /kreise/{kreisId} {
      allow read: if angemeldet() && meineUid() in resource.data.get('mitglieder', []);

      // Anlegen: man macht sich selbst zum Mitglied und Verwalter
      allow create: if angemeldet()
                    && request.resource.data.erstellerId == meineUid()
                    && meineUid() in request.resource.data.get('mitglieder', [])
                    && meineUid() in request.resource.data.get('verwalter', []);

      // Aendern: Verwalter duerfen alles, auch Arbeitszeiten und Terminarten
      allow update: if angemeldet()
                    && meineUid() in resource.data.get('verwalter', []);

      // Verlassen: sich selbst austragen darf jedes Mitglied
      allow update: if angemeldet()
                    && meineUid() in resource.data.get('mitglieder', [])
                    && !(meineUid() in request.resource.data.get('mitglieder', []))
                    && request.resource.data.diff(resource.data)
                       .affectedKeys().hasOnly(['mitglieder', 'info', 'verwalter']);

      // Seinen eigenen Namen im Kreis darf jedes Mitglied aendern
      allow update: if angemeldet()
                    && meineUid() in resource.data.get('mitglieder', [])
                    && request.resource.data.diff(resource.data)
                       .affectedKeys().hasOnly(['info']);

      // Beitreten: wer eingeladen wurde, darf sich selbst eintragen.
      // Die Einladung hat eine feste Kennung aus Kreis und E-Mail,
      // deshalb kann die Regel sie direkt nachschlagen. Ohne diesen
      // Kniff koennte jeder beitreten, der eine Kreis-Kennung erraet.
      allow update: if angemeldet()
                    && !(meineUid() in resource.data.get('mitglieder', []))
                    && meineUid() in request.resource.data.get('mitglieder', [])
                    && request.resource.data.diff(resource.data)
                       .affectedKeys().hasOnly(['mitglieder', 'info', 'verwalter'])
                    && exists(/databases/$(database)/documents/einladungen/$(kreisId + '_' + meineMail()))
                    && (
                      !(meineUid() in request.resource.data.get('verwalter', []))
                      || get(/databases/$(database)/documents/einladungen/$(kreisId + '_' + meineMail())).data.alsVerwalter == true
                    );

      allow delete: if angemeldet() && resource.data.erstellerId == meineUid();
    }

    // ================= NAME UND MAIL IM KREIS =================
    // Kennung ist immer kreisId + "_" + uid.
    // Lesen darf sie nur der Verwalter des Kreises und die Person selbst.
    // Deshalb sehen Mitglieder die Adressen der anderen nicht.
    match /kreisinfo/{infoId} {
      allow read: if angemeldet() && (
                    resource.data.uid == meineUid()
                    || binVerwalter(resource.data.kreisId)
                  );

      allow create, update: if angemeldet()
                            && request.resource.data.uid == meineUid()
                            && infoId == request.resource.data.kreisId + '_' + meineUid()
                            && binMitglied(request.resource.data.kreisId);

      allow delete: if angemeldet() && (
                      resource.data.uid == meineUid()
                      || !exists(/databases/$(database)/documents/kreise/$(resource.data.kreisId))
                      || binVerwalter(resource.data.kreisId)
                    );
    }

    // ================= EINLADUNGEN =================
    match /einladungen/{einladungId} {
      allow read: if angemeldet() && (
                    resource.data.email == meineMail()
                    || binVerwalter(resource.data.kreisId)
                  );

      allow create: if angemeldet()
                    && binVerwalter(request.resource.data.kreisId)
                    && einladungId == request.resource.data.kreisId + '_' + request.resource.data.email
                    && request.resource.data.email == request.resource.data.email.lower();

      allow delete: if angemeldet() && (
                      resource.data.email == meineMail()
                      || !exists(/databases/$(database)/documents/kreise/$(resource.data.kreisId))
                      || binVerwalter(resource.data.kreisId)
                    );
    }

    // ================= ZEITFENSTER =================
    // Nur fuer Kreise, in denen ein Fenster genau einer Person gehoert.
    // Kennung ist kreisId + "_" + Datum + "_" + Uhrzeit.
    //
    // Der ganze Trick steht in diesen drei Zeilen: create gelingt in
    // Firestore NUR, wenn das Dokument noch nicht existiert, und update
    // ist verboten. Damit kann kein zweiter dieselbe Stunde nehmen,
    // auch nicht in derselben Sekunde. Das entscheidet die Datenbank,
    // nicht die App, und laesst sich deshalb nicht austricksen.
    match /slots/{slotId} {
      allow read: if angemeldet() && binMitglied(resource.data.kreisId);

      allow create: if angemeldet()
                    && request.resource.data.uid == meineUid()
                    && binMitglied(request.resource.data.kreisId)
                    && slotId == request.resource.data.kreisId + '_'
                               + request.resource.data.datum + '_'
                               + request.resource.data.start;

      allow update: if false;

      allow delete: if angemeldet() && (
                      resource.data.uid == meineUid()
                      || binVerwalter(resource.data.kreisId)
                    );
    }

    // ================= EINTRAEGE =================
    match /eintraege/{eintragId} {
      allow read: if angemeldet() && (
                    resource.data.ownerId == meineUid()
                    || meineUid() in resource.data.get('sichtbarFuer', [])
                  );

      allow create: if angemeldet() && request.resource.data.ownerId == meineUid();

      allow update, delete: if angemeldet() && resource.data.ownerId == meineUid();

      // Zusagen: wem der Eintrag zugewiesen ist, der darf antworten.
      // Aber wirklich nur das Feld zusagen, nichts anderes.
      allow update: if angemeldet()
                    && meineUid() in resource.data.get('zugewiesen', [])
                    && request.resource.data.diff(resource.data)
                       .affectedKeys().hasOnly(['zusagen']);
    }

    // ================= BELEGTE ZEITEN =================
    // Schattenkalender ohne Titel und Notiz. Nur Datum und Uhrzeit.
    // Dadurch sehen Kreis-Mitglieder, WANN jemand belegt ist,
    // aber nicht WOMIT.
    //
    // Hier traegt sich auch ein, wem ein Termin zugewiesen wurde:
    // in fremde Kalender darf niemand schreiben, also setzt die App
    // des Zugewiesenen den Block selbst, mit ownerId gleich sich selbst.
    match /belegt/{belegtId} {
      allow read: if angemeldet() && (
                    resource.data.ownerId == meineUid()
                    || meineUid() in resource.data.get('sichtbarFuer', [])
                  );

      allow create, update: if angemeldet()
                            && request.resource.data.ownerId == meineUid();

      allow delete: if angemeldet() && resource.data.ownerId == meineUid();
    }

    // ================= NACHRICHTEN =================
    match /nachrichten/{nachrichtId} {
      allow read, delete: if angemeldet() && (
                            resource.data.anUid == meineUid()
                            || resource.data.vonUid == meineUid()
                          );

      allow create: if angemeldet()
                    && request.resource.data.vonUid == meineUid()
                    && request.resource.data.anUid is string;

      allow update: if angemeldet()
                    && resource.data.anUid == meineUid()
                    && request.resource.data.diff(resource.data)
                       .affectedKeys().hasOnly(['gelesen']);
    }

    // ================= ALLES ANDERE =================
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
