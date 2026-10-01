/* ===================================================================
   ORBYX – SPRACHEN
   ===================================================================

   Eine neue Sprache hinzufügen:

     1. Unten einen Block kopieren, zum Beispiel "de", und umbenennen.
        Der Name ist der Sprachcode: en, tr, ru, fr …
     2. Alle Werte übersetzen. Die Schlüssel links NIEMALS ändern.
     3. In SPRACHEN oben den Namen eintragen, und "rtl: true" setzen,
        wenn von rechts nach links gelesen wird (Arabisch, Hebräisch,
        Persisch, Urdu).

   Mehr ist nicht nötig. Die App findet die Sprache von allein.

   Platzhalter in Texten stehen in geschweiften Klammern, etwa {n} oder
   {name}. Die müssen in der Übersetzung erhalten bleiben, dürfen aber
   an einer anderen Stelle im Satz stehen.
   =================================================================== */

export const SPRACHEN = {
  de: { name: "Deutsch",  eigen: "Deutsch",  rtl: false },
  ar: { name: "Arabisch", eigen: "العربية", rtl: true  }
};

export const TEXTE = {

/* ================================ DEUTSCH ================================ */
de: {
  wochentage: ["Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag","Sonntag"],
  kurzTage:   ["Mo","Di","Mi","Do","Fr","Sa","So"],
  monate: ["Januar","Februar","März","April","Mai","Juni",
           "Juli","August","September","Oktober","November","Dezember"],

  // Datumsformen. {wt} Wochentag, {tag} Tageszahl, {monat} Monat.
  // Deutsch schreibt den Ordnungspunkt nach der Zahl, Arabisch nicht.
  datLang: "{wt}, {tag}. {monat}",
  datKurz: "{wt}, {tag}.{monat}.",


  // ---- Balkenplan ----
  planNiemand: "Heute ist niemand eingetragen.",
  planBelegt: "Belegt",
  planAnderswo: "Anderswo",
  planIch: "Ich",
  planGanzerTag: "Ohne Uhrzeit",
  planJetzt: "jetzt",
  planFrei: "frei",
  planBuchen: "Diese Zeit nehmen",
  planVergeben: "vergeben",
  planEngerZeigen: "Enger",
  planWeiterZeigen: "Weiter",

  // ---- Kreis-Einstellungen ----
  kEinstellungen: "Einstellungen",
  kBelegung: "Wie die Zeit vergeben wird",
  kParallel: "Gemeinsamer Plan",
  kExklusiv: "Einzeltermin",
  kBelegungHinweis: "Gemeinsamer Plan: alle arbeiten in derselben Zeit, wie Fahrer " +
                    "in einer Schicht. Einzeltermin: ein Zeitfenster gehört genau " +
                    "einer Person, wie eine Fahrstunde.",
  kArten: "Terminarten",
  kArtenHinweis: "Was in diesem Orbit immer wieder vorkommt. Beim Anlegen eines " +
                 "Termins genügt dann ein Tipp. Etwas anderes eintragen geht trotzdem.",
  kArtName: "Bezeichnung",
  kArtNameBsp: "Fahrstunde, Theorie, Schicht",
  kArtDauer: "Dauer in Minuten",
  kArtHinzu: "Hinzufügen",
  kArtKeine: "Noch keine Terminart angelegt.",
  kZeiten: "Arbeitszeiten",
  kZeitenHinweis: "Wann in diesem Orbit überhaupt gearbeitet wird. Der Plan zeigt nur " +
                  "diesen Ausschnitt, und bei „Einzeltermin“ entstehen daraus die Zeitfenster.",
  kZeitHinzu: "Zeit hinzufügen",
  kZeitKeine: "Keine Arbeitszeiten festgelegt, der Plan zeigt den ganzen Tag.",
  kSpeichern: "Einstellungen speichern",
  kGespeichert: "Gespeichert.",
  kNurVerwalter: "Das darf nur ein Verwalter ändern.",
  kDauerFehlt: "Bezeichnung und Dauer eintragen.",
  kZeitFehlt: "Wähle Wochentage und Uhrzeiten.",

  // ---- Zeitfenster ----
  slBelegt: "Diese Zeit ist schon vergeben. Nimm ein anderes Fenster.",
  slFrei: "{n} frei",
  slAlleWeg: "Alle Fenster vergeben.",
  slNimm: "Nehmen",
  slDein: "Deins",

  // ---- Name ----
  nmTitel: "Wie heißt du?",
  nmUnter: "Der Name steht in deinen Orbits. Deine E-Mail-Adresse sehen die " +
           "anderen Mitglieder nicht.",
  nmFeld: "Name",
  nmBsp: "Vorname Nachname",
  nmWeiter: "Weiter",
  nmFehlt: "Trag bitte einen Namen ein.",
  nmAendern: "Namen ändern",


  // ---- Beitritt ----
  nBeigetreten: "ist jetzt im Orbit {kreis}",
  nWillkommen: "Du bist jetzt im Orbit {kreis}",
  eiFertig: "Einladungstext kopieren",
  eiKopiert: "Kopiert. Schick den Text an {mail}.",
  eiText: "Ich habe dich zu Orbyx eingeladen: {link}\n\n" +
          "Melde dich dort mit {mail} an. Die Einladung zu „{kreis}“ wartet dann " +
          "in der Glocke auf dich.",
  eiNochNicht: "Lade erst jemanden ein.",


  // ---- Aktualisieren ----
  akAktualisieren: "Aktualisieren",
  akAktuell: "Du hast die neueste Fassung ({fassung}).\n\nTrotzdem alles neu laden?",
  akNeu: "Es gibt eine neuere Fassung.\n\nDu hast {alt}, auf dem Server liegt {neu}.\n\n" +
         "Jetzt aktualisieren?",
  akUnbekannt: "Die App neu laden und alle zwischengespeicherten Dateien verwerfen?",
  akLaeuft: "Wird neu geladen …",
  akFassung: "Fassung {fassung}",
  akKeine: "noch nicht gespeichert",


  // ---- Menü und Übersicht ----
  mnTitel: "Menü",
  mnAnsichten: "Ansichten",
  mnUebersicht: "Übersicht",
  mnEinstellungen: "Einstellungen",
  uZurueck: "Zurück",
  uNichts: "Hier ist gerade nichts.",
  uTippZahl: "Tipp auf eine Zahl, dann siehst du, was dahintersteckt.",

  // ---- Fristen ----
  frTitel: "Fristen",
  frKeine: "Nichts mit Frist. Aufgaben ohne Frist stehen unter Aufgaben.",
  frAlleMit: "Alles mit Frist, das Dringendste zuerst.",

  // ---- Einladung annehmen ----
  eiFrage: "{name} lädt dich in „{kreis}“ ein",
  eiAnnehmen: "Annehmen",
  eiAblehnen: "Ablehnen",
  eiOffen: "Einladung",
  nAngenommen: "hat die Einladung zu {kreis} angenommen",
  nAbgelehnt: "hat die Einladung zu {kreis} abgelehnt",
  eiAblehnenFrage: "Die Einladung zu „{kreis}“ ablehnen?",

  // ---- Serie als Schalter ----
  fWiederholt: "Wiederholt sich",


  // ---- Terminarten mit eigenem Zeitplan ----
  kArtTage: "An welchen Tagen",
  kArtZeitraum: "In dieser Zeit",
  kArtPlaetze: "Wie viele gleichzeitig",
  kArtPlaetzeHinweis: "1 heißt: das Zeitfenster gehört genau einer Person, wie eine " +
                      "Fahrstunde. 4 heißt: vier Leute können dieselbe Schicht nehmen. " +
                      "Leer heißt: keine Begrenzung, dann entstehen auch keine festen " +
                      "Zeitfenster.",
  kArtOhne: "frei planbar",
  kArtEinZeile: "{tage} · {von}–{bis} · {dauer} Min · {plaetze}",
  kArtEinPlatz: "1 Platz",
  kArtPlaetzeN: "{n} Plätze",
  kArtFrei: "ohne Begrenzung",
  kArtTageFehlt: "Wähle die Tage und die Zeit für diese Terminart.",

  // ---- Pausen ----
  kPausen: "Pausen",
  kPausenHinweis: "In dieser Zeit entsteht kein Zeitfenster. Für Mittag, Fahrtwege, " +
                  "oder was sonst frei bleiben soll.",
  kPauseHinzu: "Pause hinzufügen",
  kPauseKeine: "Keine Pause festgelegt.",
  kPause: "Pause",

  // ---- Plätze im Zeitfenster ----
  slPlaetze: "{frei} von {alle} frei",
  slVoll: "voll",
  slEinerFrei: "frei",

  // ---- Schreibtisch ----
  dsHeute: "Heute",
  dsNichts: "Für heute ist nichts eingetragen.",
  dsOffen: "Offen von vorher",
  dsLegende: "Feiertag und Schulferien",
  lgFeiertag: "Feiertag",
  lgFerien: "Schulferien",


  kArtNameFehlt: "Gib der Terminart erst einen Namen.",
  kArtNameDoppelt: "Diesen Namen gibt es schon. Zwei Arten mit demselben Namen kann der Plan nicht auseinanderhalten.",
  kArtOhneZeit: "bekommt keine Zeit",
  kArtDazu: "„{name}“ ist in der Liste. Nicht vergessen: unten speichern.",
  kPauseDazu: "Pause in der Liste. Nicht vergessen: unten speichern.",
  kZeitDazu: "Arbeitszeit in der Liste. Nicht vergessen: unten speichern.",

  // ---- Die drei Schritte beim Einrichten ----
  kSchritt1: "Schritt 1 · Arbeitszeiten",
  kSchritt2: "Schritt 2 · Pausen",
  kSchritt3: "Schritt 3 · Terminarten",

  // ---- Terminart: feste Zeiten oder der Rest ----
  kModus: "Zeiten dieser Art",
  kModusFest: "Feste Zeiten",
  kModusRest: "Der Rest",
  kModusHinweis: "Feste Zeiten: diese Art bekommt genau die Tage und Stunden, die du " +
                 "einträgst. Der Rest: sie bekommt alles, was von deiner Arbeitszeit " +
                 "übrig ist, nachdem die Arten darüber sich bedient haben. Die " +
                 "Reihenfolge entscheidet, Pausen sind immer abgezogen.",
  kRahmenFehlt: "Trag zuerst deine Arbeitszeiten ein, sonst bleibt für „Der Rest“ nichts übrig.",
  kRest: "Rest",
  kArtHoch: "Nach oben",

  // ---- Zeitfenster zuteilen ----
  zuTitel: "Zeitfenster vergeben",
  zuUnter: "{art} am {datum} um {zeit}",
  zuWer: "An wen",
  zuSelbst: "Selbst nehmen",
  zuKeine: "In dieser Gruppe ist sonst niemand.",
  zuVergeben: "An {name} vergeben.",
  zuBelegt: "Dieser Platz ist gerade weggegangen.",

  // ---- Freie Zeiten suchen ----
  suTitel: "Freie Zeiten suchen",
  suUnter: "Wähle die Art, dann zeigt dir Orbyx, wann noch etwas frei ist.",
  suOrbit: "Wo",
  suArt: "Welche Art",
  suWaehleArt: "Wähle eine Terminart.",
  suSuchen: "Suchen",
  suKeine: "In diesem Zeitraum ist nichts frei. Versuch einen späteren Zeitraum.",
  suNehmen: "Nehmen",
  suGebucht: "Eingetragen.",
  suNochFrei: "{n} frei",
  suKeineArt: "In diesem Orbit sind noch keine Terminarten mit festen Zeiten angelegt.",
  suSuchenKurz: "Suchen",

  // ---- Absagen gibt die Zeit frei ----
  nAbgesagtFrei: "hat abgesagt, die Zeit ist wieder frei",
  nFreigeworden: "„{titel}“ am {datum} {zeit} wurde abgesagt. Die Zeit ist wieder frei.",
  abAbgesagt: "Abgesagt, die Zeit ist wieder frei.",
  abAbsagenFrage: "Diesen Termin absagen? Die Zeit wird wieder frei.",

  // Marke
  spruch: "Ordnung für alles, was gleichzeitig läuft.",
  anmelden: "Mit Google anmelden",
  anmeldenFehl: "Anmeldung fehlgeschlagen: {code}",
  gesperrt: "Dieses Konto ist gesperrt. Wende dich an den Betreiber.",

  // Kopfzeile
  suchen: "Suchen",
  terminFinden: "Termin finden",
  kreise: "Orbits",
  nachrichten: "Nachrichten",
  konto: "Konto",
  neuerEintrag: "Neuer Eintrag",

  // Ansichten
  vTag: "Tag", vWoche: "Woche", vMonat: "Monat",
  vAufgaben: "Aufgaben", vListe: "Fristen",
  fAlles: "Alles", fTermine: "Nur Termine", fAufgaben: "Nur Aufgaben",

  // Zeitleiste
  heute: "Heute", vergangen: "Vergangen",
  woche: "Woche", wasAnsteht: "Was ansteht", naechste30: "Die nächsten 30 Tage",
  zurueck: "Zurück", weiter: "Weiter",

  // Leere Zustände
  nichtsTag: "Nichts eingetragen für diesen Tag.",
  nichtsTagFeiertag: "{name} – nichts eingetragen.",
  nichtsGeplant: "Nichts eingetragen.",
  keineAufgaben: "Keine offenen Aufgaben.",
  nichts30: "In den nächsten 30 Tagen ist nichts eingetragen.",
  frei: "frei",
  tippe2: "Tippe mindestens zwei Zeichen.",
  nichtsGefunden: "Nichts gefunden für „{wort}“.",
  sucheLaeuft: "Suche …",
  ladeFehler: "Konnte nicht laden: {code}",
  ladeHinweis: "Bei „permission-denied“ sind die Regeln noch nicht veröffentlicht. " +
               "Bei „failed-precondition“ fehlt ein Index, dann steht in der Konsole ein Link.",

  // Abschnitte
  aTermine: "Termine",
  aAufgaben: "Aufgaben",
  aOffenFrueher: "Noch offen von früher",
  aUeberfaellig: "Überfällig",
  aHeuteFaellig: "Heute fällig",
  aDieseWoche: "Diese Woche",
  aWiederkehrend: "Heute wiederkehrend",
  aSpaeter: "Später",
  aOhneFrist: "Ohne Frist",
  aErledigt: "Zuletzt erledigt",
  aTreffer: "{n} Treffer",
  aZugewiesen: "Dir zugewiesen",

  // Fristen
  fristWar: "Frist war {datum}",
  fristSpaet: "{n} Tage überfällig",
  fristHeute: "Heute fällig",
  fristMorgen: "Morgen fällig",
  fristBald: "In {n} Tagen fällig",
  fristDatum: "Frist {datum}",
  vonPerson: "von {name}",
  serie: "Serie",
  abhaken: "Aufgabe abhaken",
  loeschen: "Löschen",

  // Zusage
  zStatus: "Zusagen",
  zZugesagt: "zugesagt",
  zAbgesagt: "abgesagt",
  zOffen: "offen",
  zZusagen: "Zusagen",
  zAbsagen: "Absagen",
  zWartet: "{n} offen",
  zAlleZu: "alle zugesagt",
  zUebersicht: "{zu} von {alle} zugesagt",

  // Formular
  fNeu: "Neuer Eintrag",
  fBearbeiten: "Eintrag bearbeiten",
  fWasSteht: "Was steht an?",
  fSerieHinweis: "Änderungen gelten für die ganze Serie.",
  fTermin: "Termin", fAufgabe: "Aufgabe",
  fEinmal: "Einmal", fSerie: "Wiederholt sich",
  fTitel: "Titel", fTitelBsp: "Zahnarzt, Einkaufen, Vorlesung",
  fDatum: "Datum", fErsterTag: "Erster Tag", fGeplantAm: "Geplant am",
  fVon: "Von", fBis: "Bis", fUhrzeitOpt: "Uhrzeit (optional)",
  fWochentage: "An welchen Wochentagen",
  fBisEinschl: "Bis einschließlich",
  fOhneFeiertage: "An Feiertagen aussetzen",
  fOhneFerien: "In den Schulferien aussetzen",
  fNrw: "Feiertage und Ferien gelten für Nordrhein-Westfalen.",
  fFrist: "Frist (optional)",
  fOrt: "Ort (optional)", fOrtBsp: "Büro, Online, Zuhause",
  fNotiz: "Notiz", fOptional: "Optional",
  fTeilen: "Mit welchen Orbits teilen",
  fTeilenHinweis: "Ohne Auswahl sieht nur du den Eintrag. Deine Orbits sehen " +
                  "immer, dass die Zeit belegt ist, aber nur bei geteilten " +
                  "Einträgen auch womit.",
  fZuweisen: "Wem zuweisen",
  fZuweisenHinweis: "Die Ausgewählten bekommen eine Anfrage und können zusagen " +
                    "oder absagen. Du siehst, wer geantwortet hat.",
  fTagAbsagen: "Am {datum} absagen",
  abbrechen: "Abbrechen", speichern: "Speichern", schliessen: "Schließen",

  // Formularfehler
  eTitelDatum: "Titel und Datum sind nötig.",
  eStartzeit: "Ein Termin braucht eine Startzeit.",
  eEnde: "Das Ende muss nach dem Start liegen.",
  eFrist: "Die Frist liegt vor dem geplanten Tag.",
  eWochentag: "Wähle mindestens einen Wochentag.",
  eSerienende: "Eine Serie braucht ein Enddatum.",
  eSerieVor: "Das Serienende liegt vor dem ersten Tag.",
  eSpeichern: "Speichern fehlgeschlagen: {code}",
  eLoeschenFrage: "Diesen Eintrag löschen?",
  eSerieLoeschen: "Die ganze Serie „{titel}“ löschen?\n\nWenn nur dieser Tag " +
                  "ausfallen soll: abbrechen, auf den Eintrag tippen und " +
                  "„Diesen Tag absagen“ wählen.",

  // Kreise
  kTitel: "Orbits",
  kUnter: "Ein Orbit ist eine Gruppe, die zusammen plant. Familie, Arbeit, " +
          "Kunden. Jeder kann in mehreren Orbits sein.",
  kKeine: "Du bist noch in keinem Orbit. Leg einen an und lade Leute ein.",
  kNeuer: "Neuer Orbit",
  kName: "Name", kNameBsp: "Familie, Team, Kunden …",
  kFarbe: "Farbe",
  kArt: "Art",
  kArtKreis: "Offene Gruppe",
  kArtStern: "Service-Gruppe",
  kArtHinweis: "Offene Gruppe: alle sehen sich gegenseitig und planen miteinander. " +
               "Für Familie und Team. Service-Gruppe: du bietest Zeiten an, deine " +
               "Leute buchen sie. Sie sehen nur dich, nicht einander. Für " +
               "Fahrschüler, Kunden, Fahrer.",
  kAnlegen: "Anlegen",
  kEinladen: "Einladen",
  kVerwalter: "Verwalter",
  kDu: "(du)",
  kWartet: "wartet",
  kEingeladen: "Eingeladen",
  kEingeladenVerw: "Eingeladen als Verwalter",
  kZurueckziehen: "Zurückziehen",
  kZurueckFrage: "Einladung an {mail} zurückziehen?",
  kEntfernen: "Entfernen",
  kEntfernenFrage: "{name} aus „{kreis}“ entfernen?",
  kVerlassen: "Orbit verlassen",
  kVerlassenFrage: "Den Orbit „{kreis}“ verlassen?",
  kLoeschen: "Orbit löschen",
  kLoeschenFrage: "Den Orbit „{kreis}“ wirklich löschen?\n\nDie Termine bleiben " +
                  "erhalten, aber niemand sieht mehr die des anderen. Das " +
                  "lässt sich nicht rückgängig machen.",
  kNachricht: "Nachricht",
  kDarfNicht: "Du darfst keine Orbits anlegen. Der Betreiber kann das freischalten.",
  kUnbekannt: "Unbekannt",
  kNameFehlt: "Gib dem Orbit einen Namen.",

  // Einladen
  eiTitel: "Einladen",
  eiIn: "In den Orbit {kreis}",
  eiMail: "E-Mail-Adresse",
  eiAlsVerwalter: "Darf selbst Leute in diesen Orbit einladen",
  eiHinweis: "Die Person muss sich mit genau dieser Adresse anmelden. Sie bekommt " +
             "die Einladung in der Glocke und kann annehmen oder ablehnen.",
  eiSenden: "Einladen",
  eiKeineMail: "Das sieht nicht nach einer E-Mail aus.",
  eiSchonDrin: "Du bist schon drin.",
  eiErfolg: "Eingeladen. {mail} entscheidet selbst, ob sie annimmt.",

  // Termin finden
  tfTitel: "Termin finden",
  tfUnter: "Zeigt die Zeitfenster, in denen alle Ausgewählten frei sind.",
  tfMitWem: "Mit wem",
  tfVon: "Von", tfBis: "Bis",
  tfFrueh: "Frühestens", tfSpaet: "Spätestens",
  tfDauer: "Mindestdauer",
  tfMin: "{n} Min", tfStd: "{n} Std",
  komma: ",",
  tfSuchen: "Freie Zeiten suchen",
  tfEintragen: "Eintragen",
  tfNiemand: "Noch niemand in deinen Orbits. Leg einen an und lade jemanden ein.",
  tfKeine: "Kein gemeinsames Fenster in diesem Zeitraum. Versuch einen längeren " +
           "Zeitraum oder eine kürzere Dauer.",
  tfAlleFrei: "Alle frei: {namen}",
  tfZeitraum: "Prüfe den Zeitraum.",
  tfUhrzeiten: "Prüfe die Uhrzeiten.",
  tfZuLang: "Höchstens 60 Tage auf einmal.",

  // Nachrichten
  nTitel: "Nachrichten",
  nUnter: "Was andere dir geschickt oder mit dir geteilt haben.",
  nKeine: "Keine Nachrichten.",
  nGelesen: "Gelesen",
  nAlleGelesen: "Alle gelesen",
  nAntworten: "Antworten",
  nHatGeteilt: "hat „{titel}“ mit {kreis} geteilt",
  nHatZugewiesen: "hat dir „{titel}“ zugewiesen",
  nHatZugesagt: "hat für „{titel}“ zugesagt",
  nHatAbgesagt: "hat für „{titel}“ abgesagt",
  nGerade: "gerade eben",
  nVorMin: "vor {n} Min",
  nVorStd: "vor {n} Std",
  nJemand: "Jemand",

  // Schreiben
  sTitel: "Nachricht schreiben",
  sAn: "An {name}",
  sText: "Text", sTextBsp: "Worum geht es?",
  sSenden: "Senden",
  sGesendet: "Gesendet.",

  // Konto
  koTitel: "Mein Konto",
  koSprache: "Sprache",
  koZahlen: "Deine Zahlen",
  koTermine: "Termine",
  koOffen: "offene Aufgaben",
  koUeberfaellig: "überfällig",
  koSerien: "Serien",
  koKreise: "Orbits",
  koGeteilt: "geteilt",
  koAbmelden: "Abmelden",

  // Betreiber
  bTitel: "Betrieb",
  bUnter: "Konten und Orbits. Termine und Inhalte stehen hier bewusst nicht.",
  bPersonen: "Personen",
  bAktiv7: "aktiv, 7 Tage",
  bKreise: "Orbits",
  bGesperrt: "gesperrt",
  bKonten: "Konten",
  bName: "Name", bMail: "E-Mail", bZuletzt: "Zuletzt da", bStatus: "Status",
  bAktiv: "aktiv",
  bSperren: "Sperren", bFreigeben: "Freigeben",
  bDarfKreise: "Orbits anlegen",
  bJa: "ja", bNein: "nein",
  bHinweis: "Sperren wirkt beim nächsten Laden der App. Wer sofort raus soll, " +
            "wird zusätzlich in der Firebase Console unter Authentication " +
            "deaktiviert.",
  bAlleKreise: "Alle Orbits, die du siehst",
  bOffen: "{n} offen",
  bFehler: "Konnte nicht laden: {code}"
},

/* ================================ ARABISCH ================================ */
ar: {
  wochentage: ["الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت","الأحد"],
  kurzTage:   ["إث","ثل","أر","خم","جم","سب","أح"],
  monate: ["يناير","فبراير","مارس","أبريل","مايو","يونيو",
           "يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"],

  datLang: "{wt}، ⁦{tag} {monat}⁩",
  datKurz: "{wt}، ⁦{tag}/{monat}⁩",


  planNiemand: "لا أحد مسجَّل اليوم.",
  planBelegt: "مشغول",
  planAnderswo: "في مكان آخر",
  planIch: "أنا",
  planGanzerTag: "بدون وقت",
  planJetzt: "الآن",
  planFrei: "متاح",
  planBuchen: "حجز هذا الوقت",
  planVergeben: "محجوز",
  planEngerZeigen: "أضيق",
  planWeiterZeigen: "أوسع",

  kEinstellungen: "الإعدادات",
  kBelegung: "كيف يُوزَّع الوقت",
  kParallel: "خطة مشتركة",
  kExklusiv: "موعد فردي",
  kBelegungHinweis: "خطة مشتركة: الجميع يعملون في الوقت ذاته، مثل السائقين في وردية. " +
                    "موعد فردي: الفترة الزمنية تخص شخصاً واحداً، مثل درس قيادة.",
  kArten: "أنواع المواعيد",
  kArtenHinweis: "ما يتكرر في هذا المدار. عندها يكفي ضغطة واحدة عند إنشاء موعد، " +
                 "ويبقى بإمكانك كتابة شيء آخر.",
  kArtName: "التسمية",
  kArtNameBsp: "درس قيادة، نظري، وردية",
  kArtDauer: "المدة بالدقائق",
  kArtHinzu: "إضافة",
  kArtKeine: "لا يوجد نوع مواعيد بعد.",
  kZeiten: "أوقات العمل",
  kZeitenHinweis: "متى يُعمل في هذا المدار أصلاً. الخطة تعرض هذا النطاق فقط، " +
                  "وفي وضع «موعد فردي» تنشأ منه الفترات الزمنية.",
  kZeitHinzu: "إضافة وقت",
  kZeitKeine: "لم تُحدَّد أوقات عمل، والخطة تعرض اليوم كاملاً.",
  kSpeichern: "حفظ الإعدادات",
  kGespeichert: "تم الحفظ.",
  kNurVerwalter: "المشرف وحده يستطيع تغيير هذا.",
  kDauerFehlt: "أدخل التسمية والمدة.",
  kZeitFehlt: "اختر أيام الأسبوع والأوقات.",

  slBelegt: "هذا الوقت محجوز بالفعل. اختر فترة أخرى.",
  slFrei: "{n} متاحة",
  slAlleWeg: "كل الفترات محجوزة.",
  slNimm: "حجز",
  slDein: "لك",

  nmTitel: "ما اسمك؟",
  nmUnter: "الاسم يظهر في مداراتك. أما بريدك الإلكتروني فلا يراه بقية الأعضاء.",
  nmFeld: "الاسم",
  nmBsp: "الاسم الأول واسم العائلة",
  nmWeiter: "متابعة",
  nmFehlt: "من فضلك أدخل اسماً.",
  nmAendern: "تغيير الاسم",


  nBeigetreten: "أصبح الآن في مدار {kreis}",
  nWillkommen: "أنت الآن في مدار {kreis}",
  eiFertig: "نسخ نص الدعوة",
  eiKopiert: "تم النسخ. أرسل النص إلى {mail}.",
  eiText: "دعوتك إلى Orbyx: {link}\n\n" +
          "سجّل الدخول هناك ببريد {mail}. وستجد دعوة «{kreis}» بانتظارك في الجرس.",
  eiNochNicht: "ادعُ شخصاً أولاً.",


  akAktualisieren: "تحديث",
  akAktuell: "لديك أحدث إصدار ({fassung}).\n\nهل تريد إعادة التحميل مع ذلك؟",
  akNeu: "يتوفر إصدار أحدث.\n\nلديك {alt}، وعلى الخادم {neu}.\n\nهل تريد التحديث الآن؟",
  akUnbekannt: "إعادة تحميل التطبيق وحذف كل الملفات المخزَّنة مؤقتاً؟",
  akLaeuft: "جارٍ إعادة التحميل …",
  akFassung: "الإصدار {fassung}",
  akKeine: "غير محفوظ بعد",


  mnTitel: "القائمة",
  mnAnsichten: "العروض",
  mnUebersicht: "نظرة عامة",
  mnEinstellungen: "الإعدادات",
  uZurueck: "رجوع",
  uNichts: "لا يوجد شيء هنا الآن.",
  uTippZahl: "اضغط على رقم لترى ما خلفه.",

  frTitel: "المواعيد النهائية",
  frKeine: "لا شيء له موعد نهائي. المهام بلا موعد تجدها تحت المهام.",
  frAlleMit: "كل ما له موعد نهائي، الأكثر إلحاحاً أولاً.",

  eiFrage: "يدعوك {name} إلى «{kreis}»",
  eiAnnehmen: "قبول",
  eiAblehnen: "رفض",
  eiOffen: "دعوة",
  nAngenommen: "قبل الدعوة إلى {kreis}",
  nAbgelehnt: "رفض الدعوة إلى {kreis}",
  eiAblehnenFrage: "رفض الدعوة إلى «{kreis}»؟",

  fWiederholt: "يتكرر",


  kArtTage: "في أي أيام",
  kArtZeitraum: "في هذا الوقت",
  kArtPlaetze: "كم شخصاً في الوقت نفسه",
  kArtPlaetzeHinweis: "1 يعني أن الفترة تخص شخصاً واحداً، مثل درس قيادة. 4 يعني أن " +
                      "أربعة يمكنهم أخذ الوردية نفسها. والفراغ يعني بلا حد، " +
                      "وعندها لا تنشأ فترات ثابتة.",
  kArtOhne: "تخطيط حر",
  kArtEinZeile: "{tage} · {von}–{bis} · {dauer} دقيقة · {plaetze}",
  kArtEinPlatz: "مكان واحد",
  kArtPlaetzeN: "{n} أماكن",
  kArtFrei: "بلا حد",
  kArtTageFehlt: "اختر الأيام والوقت لهذا النوع.",

  kPausen: "الاستراحات",
  kPausenHinweis: "في هذا الوقت لا تنشأ فترات. للغداء أو التنقل أو ما تريد إبقاءه فارغاً.",
  kPauseHinzu: "إضافة استراحة",
  kPauseKeine: "لا استراحة محددة.",
  kPause: "استراحة",

  slPlaetze: "{frei} من {alle} متاح",
  slVoll: "مكتمل",
  slEinerFrei: "متاح",

  dsHeute: "اليوم",
  dsNichts: "لا يوجد شيء اليوم.",
  dsOffen: "مفتوح من قبل",
  dsLegende: "عطلة رسمية ومدرسية",
  lgFeiertag: "عطلة رسمية",
  lgFerien: "عطلة مدرسية",


  kArtNameFehlt: "أعطِ نوع الموعد اسماً أولاً.",
  kArtNameDoppelt: "هذا الاسم موجود مسبقاً. لا تستطيع الخطة التمييز بين نوعين بالاسم نفسه.",
  kArtOhneZeit: "لا يحصل على وقت",
  kArtDazu: "أُضيف «{name}» إلى القائمة. لا تنسَ الحفظ في الأسفل.",
  kPauseDazu: "أُضيفت الاستراحة. لا تنسَ الحفظ في الأسفل.",
  kZeitDazu: "أُضيف وقت العمل. لا تنسَ الحفظ في الأسفل.",

  kSchritt1: "الخطوة ١ · أوقات العمل",
  kSchritt2: "الخطوة ٢ · الاستراحات",
  kSchritt3: "الخطوة ٣ · أنواع المواعيد",

  kModus: "أوقات هذا النوع",
  kModusFest: "أوقات ثابتة",
  kModusRest: "الباقي",
  kModusHinweis: "أوقات ثابتة: يأخذ هذا النوع الأيام والساعات التي تدخلها بالضبط. " +
                 "الباقي: يأخذ كل ما تبقّى من وقت عملك بعد أن تأخذ الأنواع التي " +
                 "فوقه نصيبها. الترتيب هو الفيصل، والاستراحات مخصومة دائماً.",
  kRahmenFehlt: "أدخل أوقات عملك أولاً، وإلا لن يبقى شيء لـ«الباقي».",
  kRest: "الباقي",
  kArtHoch: "إلى الأعلى",

  zuTitel: "إسناد موعد",
  zuUnter: "{art} في {datum} الساعة {zeit}",
  zuWer: "لمن",
  zuSelbst: "آخذه لنفسي",
  zuKeine: "لا يوجد أحد آخر في هذه المجموعة.",
  zuVergeben: "تم الإسناد إلى {name}.",
  zuBelegt: "هذا المكان حُجز للتو.",

  suTitel: "البحث عن أوقات متاحة",
  suUnter: "اختر النوع، وسيعرض لك Orbyx ما تبقّى متاحاً.",
  suOrbit: "أين",
  suArt: "أي نوع",
  suWaehleArt: "اختر نوع الموعد.",
  suSuchen: "بحث",
  suKeine: "لا يوجد شيء متاح في هذه الفترة. جرّب فترة لاحقة.",
  suNehmen: "حجز",
  suGebucht: "تم التسجيل.",
  suNochFrei: "{n} متاح",
  suKeineArt: "لا توجد في هذا المدار أنواع مواعيد بأوقات ثابتة بعد.",
  suSuchenKurz: "بحث",

  nAbgesagtFrei: "اعتذر، والوقت صار متاحاً من جديد",
  nFreigeworden: "تم الاعتذار عن «{titel}» في {datum} {zeit}. الوقت متاح من جديد.",
  abAbgesagt: "تم الاعتذار، والوقت متاح من جديد.",
  abAbsagenFrage: "هل تعتذر عن هذا الموعد؟ سيصبح الوقت متاحاً من جديد.",

  spruch: "تنظيم لكل ما يجري في وقت واحد.",
  anmelden: "تسجيل الدخول عبر Google",
  anmeldenFehl: "فشل تسجيل الدخول: {code}",
  gesperrt: "هذا الحساب محظور. تواصل مع المشغّل.",

  suchen: "بحث",
  terminFinden: "إيجاد موعد",
  kreise: "مدارات",
  nachrichten: "الرسائل",
  konto: "الحساب",
  neuerEintrag: "إدخال جديد",

  vTag: "اليوم", vWoche: "الأسبوع", vMonat: "الشهر",
  vAufgaben: "المهام", vListe: "المواعيد النهائية",
  fAlles: "الكل", fTermine: "المواعيد فقط", fAufgaben: "المهام فقط",

  heute: "اليوم", vergangen: "مضى",
  woche: "الأسبوع", wasAnsteht: "ما هو قادم", naechste30: "الثلاثون يوماً القادمة",
  zurueck: "السابق", weiter: "التالي",

  nichtsTag: "لا يوجد شيء في هذا اليوم.",
  nichtsTagFeiertag: "{name} – لا يوجد شيء مسجَّل.",
  nichtsGeplant: "لا يوجد شيء مسجَّل.",
  keineAufgaben: "لا توجد مهام مفتوحة.",
  nichts30: "لا يوجد شيء في الثلاثين يوماً القادمة.",
  frei: "فارغ",
  tippe2: "اكتب حرفين على الأقل.",
  nichtsGefunden: "لا نتائج لـ «{wort}».",
  sucheLaeuft: "جارٍ البحث …",
  ladeFehler: "تعذّر التحميل: {code}",
  ladeHinweis: "إذا ظهر «permission-denied» فالقواعد لم تُنشر بعد. " +
               "وإذا ظهر «failed-precondition» فالفهرس ناقص، والرابط في وحدة التحكم.",

  aTermine: "المواعيد",
  aAufgaben: "المهام",
  aOffenFrueher: "ما زال مفتوحاً من قبل",
  aUeberfaellig: "متأخر",
  aHeuteFaellig: "مستحق اليوم",
  aDieseWoche: "هذا الأسبوع",
  aWiederkehrend: "متكرر اليوم",
  aSpaeter: "لاحقاً",
  aOhneFrist: "بدون موعد نهائي",
  aErledigt: "أُنجز مؤخراً",
  aTreffer: "{n} نتيجة",
  aZugewiesen: "مُسنَد إليك",

  fristWar: "كان الموعد النهائي {datum}",
  fristSpaet: "متأخر {n} يوم",
  fristHeute: "مستحق اليوم",
  fristMorgen: "مستحق غداً",
  fristBald: "مستحق خلال {n} يوم",
  fristDatum: "الموعد النهائي {datum}",
  vonPerson: "من {name}",
  serie: "متكرر",
  abhaken: "تعليم المهمة كمنجزة",
  loeschen: "حذف",

  zStatus: "الردود",
  zZugesagt: "موافق",
  zAbgesagt: "معتذر",
  zOffen: "بانتظار الرد",
  zZusagen: "موافقة",
  zAbsagen: "اعتذار",
  zWartet: "{n} بانتظار الرد",
  zAlleZu: "الجميع وافق",
  zUebersicht: "وافق {zu} من {alle}",

  fNeu: "إدخال جديد",
  fBearbeiten: "تعديل الإدخال",
  fWasSteht: "ما الذي ستضيفه؟",
  fSerieHinweis: "التعديلات تسري على كل التكرارات.",
  fTermin: "موعد", fAufgabe: "مهمة",
  fEinmal: "مرة واحدة", fSerie: "يتكرر",
  fTitel: "العنوان", fTitelBsp: "طبيب الأسنان، تسوّق، محاضرة",
  fDatum: "التاريخ", fErsterTag: "اليوم الأول", fGeplantAm: "مخطط ليوم",
  fVon: "من", fBis: "إلى", fUhrzeitOpt: "الوقت (اختياري)",
  fWochentage: "في أي أيام الأسبوع",
  fBisEinschl: "حتى تاريخ شامل",
  fOhneFeiertage: "التوقف في العطل الرسمية",
  fOhneFerien: "التوقف في العطل المدرسية",
  fNrw: "العطل الرسمية والمدرسية حسب ولاية نوردراين فيستفالن.",
  fFrist: "الموعد النهائي (اختياري)",
  fOrt: "المكان (اختياري)", fOrtBsp: "المكتب، عبر الإنترنت، المنزل",
  fNotiz: "ملاحظة", fOptional: "اختياري",
  fTeilen: "المشاركة مع أي مدارات",
  fTeilenHinweis: "بدون اختيار لن يرى الإدخال سواك. مداراتك ترى دائماً أن الوقت " +
                  "مشغول، لكنها ترى التفاصيل فقط في الإدخالات المشتركة.",
  fZuweisen: "إسناد إلى",
  fZuweisenHinweis: "من تختارهم يصلهم طلب ويمكنهم الموافقة أو الاعتذار. " +
                    "وسترى من ردّ.",
  fTagAbsagen: "إلغاء يوم {datum}",
  abbrechen: "إلغاء", speichern: "حفظ", schliessen: "إغلاق",

  eTitelDatum: "العنوان والتاريخ مطلوبان.",
  eStartzeit: "الموعد يحتاج وقت بداية.",
  eEnde: "يجب أن تكون النهاية بعد البداية.",
  eFrist: "الموعد النهائي قبل اليوم المخطط.",
  eWochentag: "اختر يوماً واحداً على الأقل.",
  eSerienende: "التكرار يحتاج تاريخ انتهاء.",
  eSerieVor: "تاريخ الانتهاء قبل اليوم الأول.",
  eSpeichern: "فشل الحفظ: {code}",
  eLoeschenFrage: "حذف هذا الإدخال؟",
  eSerieLoeschen: "حذف كل تكرارات «{titel}»؟\n\nإذا أردت إلغاء هذا اليوم فقط: " +
                  "ألغِ، ثم اضغط على الإدخال واختر «إلغاء هذا اليوم».",

  kTitel: "مدارات",
  kUnter: "المدار مجموعة تخطط معاً. العائلة، العمل، الزبائن. " +
          "يمكن لأي شخص أن يكون في عدة مدارات.",
  kKeine: "لست في أي مدار بعد. أنشئ واحداً وادعُ أشخاصاً.",
  kNeuer: "مدار جديد",
  kName: "الاسم", kNameBsp: "العائلة، الفريق، الزبائن …",
  kFarbe: "اللون",
  kArt: "النوع",
  kArtKreis: "مجموعة مفتوحة",
  kArtStern: "مجموعة خدمات",
  kArtHinweis: "مجموعة مفتوحة: الجميع يرون بعضهم ويخططون معاً. للعائلة والفريق. " +
               "مجموعة خدمات: أنت تعرض الأوقات وهم يحجزونها. يرونك أنت فقط ولا " +
               "يرون بعضهم. للطلاب والزبائن والسائقين.",
  kAnlegen: "إنشاء",
  kEinladen: "دعوة",
  kVerwalter: "مشرف",
  kDu: "(أنت)",
  kWartet: "بالانتظار",
  kEingeladen: "مدعو",
  kEingeladenVerw: "مدعو كمشرف",
  kZurueckziehen: "سحب الدعوة",
  kZurueckFrage: "سحب الدعوة المرسلة إلى {mail}؟",
  kEntfernen: "إزالة",
  kEntfernenFrage: "إزالة {name} من «{kreis}»؟",
  kVerlassen: "مغادرة المدار",
  kVerlassenFrage: "مغادرة المدار «{kreis}»؟",
  kLoeschen: "حذف المدار",
  kLoeschenFrage: "حذف المدار «{kreis}» فعلاً؟\n\nالمواعيد تبقى، لكن لن يرى " +
                  "أحد مواعيد الآخر بعد الآن. لا يمكن التراجع عن هذا.",
  kNachricht: "رسالة",
  kDarfNicht: "لا تملك صلاحية إنشاء المدارات. يمكن للمشغّل تفعيلها لك.",
  kUnbekannt: "غير معروف",
  kNameFehlt: "أعطِ المدار اسماً.",

  eiTitel: "دعوة",
  eiIn: "إلى المدار {kreis}",
  eiMail: "البريد الإلكتروني",
  eiAlsVerwalter: "يمكنه دعوة أشخاص إلى هذا المدار",
  eiHinweis: "يجب أن يسجّل الشخص الدخول بهذا البريد بالذات. وتصله الدعوة في " +
             "الجرس فيقبلها أو يرفضها.",
  eiSenden: "إرسال الدعوة",
  eiKeineMail: "هذا لا يبدو بريداً إلكترونياً.",
  eiSchonDrin: "أنت موجود بالفعل.",
  eiErfolg: "تمت الدعوة. يقرر {mail} بنفسه القبول أو الرفض.",

  tfTitel: "إيجاد موعد",
  tfUnter: "يعرض الفترات التي يكون فيها كل المختارين متفرغين.",
  tfMitWem: "مع من",
  tfVon: "من", tfBis: "إلى",
  tfFrueh: "لا قبل", tfSpaet: "لا بعد",
  tfDauer: "أقل مدة",
  tfMin: "{n} دقيقة", tfStd: "{n} ساعة",
  komma: "٫",
  tfSuchen: "ابحث عن الأوقات المتاحة",
  tfEintragen: "تسجيل",
  tfNiemand: "لا أحد في مداراتك بعد. أنشئ مداراً وادعُ شخصاً.",
  tfKeine: "لا توجد فترة مشتركة في هذا المدى. جرّب مدى أطول أو مدة أقصر.",
  tfAlleFrei: "الجميع متفرغ: {namen}",
  tfZeitraum: "تحقق من المدى الزمني.",
  tfUhrzeiten: "تحقق من الأوقات.",
  tfZuLang: "ستون يوماً كحد أقصى في المرة الواحدة.",

  nTitel: "الرسائل",
  nUnter: "ما أرسله إليك الآخرون أو شاركوه معك.",
  nKeine: "لا توجد رسائل.",
  nGelesen: "مقروء",
  nAlleGelesen: "تعليم الكل كمقروء",
  nAntworten: "رد",
  nHatGeteilt: "شارك «{titel}» مع {kreis}",
  nHatZugewiesen: "أسند إليك «{titel}»",
  nHatZugesagt: "وافق على «{titel}»",
  nHatAbgesagt: "اعتذر عن «{titel}»",
  nGerade: "الآن",
  nVorMin: "قبل {n} دقيقة",
  nVorStd: "قبل {n} ساعة",
  nJemand: "شخص ما",

  sTitel: "كتابة رسالة",
  sAn: "إلى {name}",
  sText: "النص", sTextBsp: "ما الموضوع؟",
  sSenden: "إرسال",
  sGesendet: "تم الإرسال.",

  koTitel: "حسابي",
  koSprache: "اللغة",
  koZahlen: "أرقامك",
  koTermine: "مواعيد",
  koOffen: "مهام مفتوحة",
  koUeberfaellig: "متأخرة",
  koSerien: "تكرارات",
  koKreise: "مدارات",
  koGeteilt: "مشترك",
  koAbmelden: "تسجيل الخروج",

  bTitel: "التشغيل",
  bUnter: "الحسابات والمدارات. المواعيد والمحتويات غير معروضة هنا عن قصد.",
  bPersonen: "أشخاص",
  bAktiv7: "نشط، 7 أيام",
  bKreise: "مدارات",
  bGesperrt: "محظور",
  bKonten: "الحسابات",
  bName: "الاسم", bMail: "البريد", bZuletzt: "آخر ظهور", bStatus: "الحالة",
  bAktiv: "نشط",
  bSperren: "حظر", bFreigeben: "رفع الحظر",
  bDarfKreise: "إنشاء المدارات",
  bJa: "نعم", bNein: "لا",
  bHinweis: "الحظر يسري عند التحميل التالي للتطبيق. لإخراج شخص فوراً، عطّل " +
            "حسابه أيضاً في Firebase Console ضمن Authentication.",
  bAlleKreise: "كل المدارات التي تراها",
  bOffen: "{n} بانتظار الرد",
  bFehler: "تعذّر التحميل: {code}"
}

};

/* ===================================================================
   Werkzeug
   =================================================================== */

let aktuelleSprache = "de";

export function setzeSprache(code) {
  aktuelleSprache = TEXTE[code] ? code : "de";
  return aktuelleSprache;
}
export function holeSprache() { return aktuelleSprache; }
export function istRTL() { return !!(SPRACHEN[aktuelleSprache] || {}).rtl; }

/** Text holen. Platzhalter wie {n} werden ersetzt.
 *  Fehlt ein Schlüssel in der Sprache, wird Deutsch genommen. */
export function t(schluessel, werte) {
  const satz = (TEXTE[aktuelleSprache] || {})[schluessel]
            ?? (TEXTE.de[schluessel])
            ?? schluessel;
  if (typeof satz !== "string" || !werte) return satz;
  return satz.replace(/\{(\w+)\}/g, (ganz, name) =>
    werte[name] !== undefined ? werte[name] : ganz);
}

/** Listen wie Wochentage und Monate */
export function liste(schluessel) {
  return (TEXTE[aktuelleSprache] || {})[schluessel] || TEXTE.de[schluessel] || [];
}

/** Sprache aus dem Browser raten, falls noch keine gewählt wurde */
export function spracheRaten() {
  const roh = (navigator.languages || [navigator.language || "de"]);
  for (const l of roh) {
    const kurz = String(l).toLowerCase().split("-")[0];
    if (TEXTE[kurz]) return kurz;
  }
  return "de";
}
