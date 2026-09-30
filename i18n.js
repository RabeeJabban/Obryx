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

  // Marke
  spruch: "Ordnung für alles, was gleichzeitig läuft.",
  anmelden: "Mit Google anmelden",
  anmeldenFehl: "Anmeldung fehlgeschlagen: {code}",
  gesperrt: "Dieses Konto ist gesperrt. Wende dich an den Betreiber.",

  // Kopfzeile
  suchen: "Suchen",
  terminFinden: "Termin finden",
  kreise: "Kreise",
  nachrichten: "Nachrichten",
  konto: "Konto",
  neuerEintrag: "Neuer Eintrag",

  // Ansichten
  vTag: "Tag", vWoche: "Woche", vMonat: "Monat",
  vAufgaben: "Aufgaben", vListe: "Liste",
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
  fTeilen: "Mit welchen Kreisen teilen",
  fTeilenHinweis: "Ohne Auswahl sieht nur du den Eintrag. Deine Kreise sehen " +
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
  kTitel: "Kreise",
  kUnter: "Ein Kreis ist eine Gruppe, die zusammen plant. Familie, Arbeit, " +
          "Kunden. Jeder kann in mehreren Kreisen sein.",
  kKeine: "Du bist noch in keinem Kreis. Leg unten einen an und lade Leute ein.",
  kNeuer: "Neuen Kreis anlegen",
  kName: "Name", kNameBsp: "Familie, Team, Kunden …",
  kFarbe: "Farbe",
  kArt: "Art",
  kArtKreis: "Kreis",
  kArtStern: "Stern",
  kArtHinweis: "Im Kreis sehen alle die belegten Zeiten aller. Beim Stern " +
               "sehen die Mitglieder nur dich, und nicht einander. Für " +
               "Kunden, Schüler oder Fahrer nimm den Stern.",
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
  kVerlassen: "Kreis verlassen",
  kVerlassenFrage: "Den Kreis „{kreis}“ verlassen?",
  kLoeschen: "Kreis löschen",
  kLoeschenFrage: "Den Kreis „{kreis}“ wirklich löschen?\n\nDie Termine bleiben " +
                  "erhalten, aber niemand sieht mehr die des anderen. Das " +
                  "lässt sich nicht rückgängig machen.",
  kNachricht: "Nachricht",
  kDarfNicht: "Du darfst keine Kreise anlegen. Der Betreiber kann das freischalten.",
  kUnbekannt: "Unbekannt",
  kNameFehlt: "Gib dem Kreis einen Namen.",

  // Einladen
  eiTitel: "Einladen",
  eiIn: "In den Kreis {kreis}",
  eiMail: "E-Mail-Adresse",
  eiAlsVerwalter: "Darf selbst Leute in diesen Kreis einladen",
  eiHinweis: "Die Person muss sich mit genau dieser Adresse anmelden. Beim " +
             "nächsten Öffnen ist sie im Kreis.",
  eiSenden: "Einladen",
  eiKeineMail: "Das sieht nicht nach einer E-Mail aus.",
  eiSchonDrin: "Du bist schon drin.",
  eiErfolg: "Eingeladen. {mail} ist im Kreis, sobald sie sich anmeldet.",

  // Termin finden
  tfTitel: "Termin finden",
  tfUnter: "Zeigt die Zeitfenster, in denen alle Ausgewählten frei sind.",
  tfMitWem: "Mit wem",
  tfVon: "Von", tfBis: "Bis",
  tfFrueh: "Frühestens", tfSpaet: "Spätestens",
  tfDauer: "Mindestdauer",
  tfMin: "{n} Min", tfStd: "{n} Std",
  tfSuchen: "Freie Zeiten suchen",
  tfEintragen: "Eintragen",
  tfNiemand: "Noch niemand in deinen Kreisen. Lege einen Kreis an und lade jemanden ein.",
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
  koKreise: "Kreise",
  koGeteilt: "geteilt",
  koAbmelden: "Abmelden",

  // Betreiber
  bTitel: "Betrieb",
  bUnter: "Konten und Kreise. Termine und Inhalte stehen hier bewusst nicht.",
  bPersonen: "Personen",
  bAktiv7: "aktiv, 7 Tage",
  bKreise: "Kreise",
  bGesperrt: "gesperrt",
  bKonten: "Konten",
  bName: "Name", bMail: "E-Mail", bZuletzt: "Zuletzt da", bStatus: "Status",
  bAktiv: "aktiv",
  bSperren: "Sperren", bFreigeben: "Freigeben",
  bDarfKreise: "Kreise anlegen",
  bJa: "ja", bNein: "nein",
  bHinweis: "Sperren wirkt beim nächsten Laden der App. Wer sofort raus soll, " +
            "wird zusätzlich in der Firebase Console unter Authentication " +
            "deaktiviert.",
  bAlleKreise: "Alle Kreise, die du siehst",
  bOffen: "{n} offen",
  bFehler: "Konnte nicht laden: {code}"
},

/* ================================ ARABISCH ================================ */
ar: {
  wochentage: ["الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت","الأحد"],
  kurzTage:   ["إث","ثل","أر","خم","جم","سب","أح"],
  monate: ["يناير","فبراير","مارس","أبريل","مايو","يونيو",
           "يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"],

  datLang: "{wt}، {tag} {monat}",
  datKurz: "{wt}، {tag}/{monat}",

  spruch: "تنظيم لكل ما يجري في وقت واحد.",
  anmelden: "تسجيل الدخول عبر Google",
  anmeldenFehl: "فشل تسجيل الدخول: {code}",
  gesperrt: "هذا الحساب محظور. تواصل مع المشغّل.",

  suchen: "بحث",
  terminFinden: "إيجاد موعد",
  kreise: "الدوائر",
  nachrichten: "الرسائل",
  konto: "الحساب",
  neuerEintrag: "إدخال جديد",

  vTag: "اليوم", vWoche: "الأسبوع", vMonat: "الشهر",
  vAufgaben: "المهام", vListe: "القائمة",
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
  fTeilen: "المشاركة مع أي دوائر",
  fTeilenHinweis: "بدون اختيار لن يرى الإدخال سواك. دوائرك ترى دائماً أن الوقت " +
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

  kTitel: "الدوائر",
  kUnter: "الدائرة مجموعة تخطط معاً. العائلة، العمل، الزبائن. " +
          "يمكن لأي شخص أن يكون في عدة دوائر.",
  kKeine: "لست في أي دائرة بعد. أنشئ واحدة بالأسفل وادعُ أشخاصاً.",
  kNeuer: "إنشاء دائرة جديدة",
  kName: "الاسم", kNameBsp: "العائلة، الفريق، الزبائن …",
  kFarbe: "اللون",
  kArt: "النوع",
  kArtKreis: "دائرة",
  kArtStern: "نجمة",
  kArtHinweis: "في الدائرة يرى الجميع أوقات الجميع المشغولة. في النجمة يرى " +
               "الأعضاء أوقاتك أنت فقط، ولا يرون بعضهم. للزبائن أو الطلاب " +
               "أو السائقين اختر النجمة.",
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
  kVerlassen: "مغادرة الدائرة",
  kVerlassenFrage: "مغادرة الدائرة «{kreis}»؟",
  kLoeschen: "حذف الدائرة",
  kLoeschenFrage: "حذف الدائرة «{kreis}» فعلاً؟\n\nالمواعيد تبقى، لكن لن يرى " +
                  "أحد مواعيد الآخر بعد الآن. لا يمكن التراجع عن هذا.",
  kNachricht: "رسالة",
  kDarfNicht: "لا تملك صلاحية إنشاء الدوائر. يمكن للمشغّل تفعيلها لك.",
  kUnbekannt: "غير معروف",
  kNameFehlt: "أعطِ الدائرة اسماً.",

  eiTitel: "دعوة",
  eiIn: "إلى الدائرة {kreis}",
  eiMail: "البريد الإلكتروني",
  eiAlsVerwalter: "يمكنه دعوة أشخاص إلى هذه الدائرة",
  eiHinweis: "يجب أن يسجّل الشخص الدخول بهذا البريد بالذات. وعند فتحه التالي " +
             "سيكون داخل الدائرة.",
  eiSenden: "إرسال الدعوة",
  eiKeineMail: "هذا لا يبدو بريداً إلكترونياً.",
  eiSchonDrin: "أنت موجود بالفعل.",
  eiErfolg: "تمت الدعوة. سينضم {mail} فور تسجيل الدخول.",

  tfTitel: "إيجاد موعد",
  tfUnter: "يعرض الفترات التي يكون فيها كل المختارين متفرغين.",
  tfMitWem: "مع من",
  tfVon: "من", tfBis: "إلى",
  tfFrueh: "لا قبل", tfSpaet: "لا بعد",
  tfDauer: "أقل مدة",
  tfMin: "{n} دقيقة", tfStd: "{n} ساعة",
  tfSuchen: "ابحث عن الأوقات المتاحة",
  tfEintragen: "تسجيل",
  tfNiemand: "لا أحد في دوائرك بعد. أنشئ دائرة وادعُ شخصاً.",
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
  koKreise: "دوائر",
  koGeteilt: "مشترك",
  koAbmelden: "تسجيل الخروج",

  bTitel: "التشغيل",
  bUnter: "الحسابات والدوائر. المواعيد والمحتويات غير معروضة هنا عن قصد.",
  bPersonen: "أشخاص",
  bAktiv7: "نشط، 7 أيام",
  bKreise: "دوائر",
  bGesperrt: "محظور",
  bKonten: "الحسابات",
  bName: "الاسم", bMail: "البريد", bZuletzt: "آخر ظهور", bStatus: "الحالة",
  bAktiv: "نشط",
  bSperren: "حظر", bFreigeben: "رفع الحظر",
  bDarfKreise: "إنشاء الدوائر",
  bJa: "نعم", bNein: "لا",
  bHinweis: "الحظر يسري عند التحميل التالي للتطبيق. لإخراج شخص فوراً، عطّل " +
            "حسابه أيضاً في Firebase Console ضمن Authentication.",
  bAlleKreise: "كل الدوائر التي تراها",
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
