/* ===================================================================
   ORBYX
   organize your chaos

   Hier steht die ganze Logik. Die Texte stehen in i18n.js,
   das Aussehen in index.html.

   Zwei Dinge musst du unten anpassen:
     1. firebaseConfig  – aus der Firebase Console
     2. BETREIBER       – die E-Mail-Adressen, die "Betrieb" sehen
   =================================================================== */

const firebaseConfig = {
  apiKey: "AIzaSyAFCT65NaUVuu1YYBkKZM693zX_fKM7-Io",
  authDomain: "sawa-82a09.firebaseapp.com",
  projectId: "sawa-82a09",
  storageBucket: "sawa-82a09.firebasestorage.app",
  messagingSenderId: "200029883618",
  appId: "1:200029883618:web:18059e0fa3127bf62f62bb"
};

// Wer den Betrieb-Bereich sieht. Dieselbe Liste muss in firestore.rules stehen.
const BETREIBER = ["rabea.jabban.mrj@gmail.com"];

/* =================================================================== */

import { initializeApp }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, collection, doc, addDoc, setDoc, updateDoc, deleteDoc,
  getDoc, getDocs, query, where, onSnapshot, serverTimestamp, writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  SPRACHEN, t, liste, setzeSprache, holeSprache, istRTL, spracheRaten
} from "./i18n.js";

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

const $  = (id) => document.getElementById(id);
const el = (tag, klasse, text) => {
  const x = document.createElement(tag);
  if (klasse) x.className = klasse;
  if (text !== undefined) x.textContent = text;
  return x;
};

// Dieselben zehn Farben wie im Logo. Hellmodus-Werte, weil sie
// in der Datenbank landen und dort fest bleiben müssen.
const FARBEN = ["#1B65C9","#219447","#D9A21B","#C0392B","#7A4FC4",
                "#0F8E96","#D2691E","#C2417F","#4A6572","#5C8A1E"];

/* ===================================================================
   GEDÄCHTNIS IM BROWSER
   =================================================================== */

function merke(schluessel, wert) {
  try { localStorage.setItem("orbyx." + schluessel, wert); } catch (e) {}
}
function gemerkt(schluessel) {
  try { return localStorage.getItem("orbyx." + schluessel); } catch (e) { return null; }
}

/* ===================================================================
   SPRACHE
   Ein Durchlauf über alle Elemente mit data-i18n reicht, um die
   ganze Oberfläche umzuschalten. Neue Texte brauchen nur das Attribut.
   =================================================================== */

function wendeSpracheAn(code) {
  setzeSprache(code);
  merke("sprache", code);

  document.documentElement.lang = code;
  document.documentElement.dir  = istRTL() ? "rtl" : "ltr";

  document.querySelectorAll("[data-i18n]").forEach((x) => {
    x.textContent = t(x.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-ph]").forEach((x) => {
    x.placeholder = t(x.dataset.i18nPh);
  });
  document.querySelectorAll("[data-i18n-al]").forEach((x) => {
    x.setAttribute("aria-label", t(x.dataset.i18nAl));
  });

  // Im Arabischen zeigen die Blätter-Pfeile andersherum: dort bedeutet
  // ein Pfeil nach rechts "zurück", weil man von rechts nach links liest.
  $("zurueck").textContent = istRTL() ? "›" : "‹";
  $("vor").textContent     = istRTL() ? "‹" : "›";

  baueSprachwahl();
  baueTageWahl();
  baueDauerWahl();
  setzeTyp(typ);
  setzeWdh(wiederholung);

  if (nutzer) {
    zeichne();
    if ($("dlgKreise").open) zeigeKreise();
    if ($("dlgPost").open)   zeigePost();
    if ($("dlgMich").open)   zeigeMeineZahlen();
  }
}

function baueSprachwahl() {
  ["sprachwahl", "sprachwahl2"].forEach((id) => {
    const box = $(id);
    if (!box) return;
    box.innerHTML = "";
    Object.entries(SPRACHEN).forEach(([code, s]) => {
      const b = el("button", holeSprache() === code ? "an" : "", s.eigen);
      b.type = "button";
      b.lang = code;
      b.addEventListener("click", () => {
        wendeSpracheAn(code);
        if (nutzer) {
          updateDoc(doc(db, "users", nutzer.uid), { sprache: code }).catch(() => {});
        }
      });
      box.appendChild(b);
    });
  });
}

/* ===================================================================
   DATUM
   Alles ist Text in der Form JJJJ-MM-TT. toISOString() wäre falsch,
   das rechnet nach UTC um und verschiebt abends den Tag.
   =================================================================== */

function alsText(d) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const t2 = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${t2}`;
}
function ausText(s) {
  const [j, m, t2] = s.split("-").map(Number);
  return new Date(j, m - 1, t2);
}
function plus(text, tage) {
  const d = ausText(text);
  d.setDate(d.getDate() + tage);
  return alsText(d);
}
function tageBis(ziel, von) {
  return Math.round((ausText(ziel) - ausText(von)) / 86400000);
}
// 0 = Montag ... 6 = Sonntag (JavaScript zählt ab Sonntag)
function wochentag(text) {
  return (ausText(text).getDay() + 6) % 7;
}
/* Zahlen und Datumsstücke bekommen eine unsichtbare Klammer um sich.
   Ohne die würde "27.9." im arabischen Satz als ".27.9" erscheinen,
   weil der Punkt am Ende sonst an die falsche Seite rutscht. */
function zahl(s) { return "⁦" + s + "⁩"; }

function kurzDatum(text) {
  const d = ausText(text);
  return t("datKurz", {
    wt:    liste("kurzTage")[wochentag(text)],
    tag:   zahl(String(d.getDate())),
    monat: zahl(String(d.getMonth() + 1))
  });
}
function langDatum(text) {
  const d = ausText(text);
  return t("datLang", {
    wt:    liste("wochentage")[wochentag(text)],
    tag:   zahl(String(d.getDate())),
    monat: liste("monate")[d.getMonth()]
  });
}
/* Für die Kopfzeile: kurzer Wochentag, damit die Zeile auf einem
   schmalen Handy nicht umbricht. */
function tagTitel(text) {
  const d = ausText(text);
  return t("datLang", {
    wt:    liste("kurzTage")[wochentag(text)],
    tag:   zahl(String(d.getDate())),
    monat: liste("monate")[d.getMonth()]
  });
}
function heute() { return alsText(new Date()); }
function montagVon(text) { return plus(text, -wochentag(text)); }

function minuten(uhr) {
  if (!uhr) return null;
  const [h, m] = uhr.split(":").map(Number);
  return h * 60 + m;
}
function ausMinuten(min) {
  const h = Math.floor(min / 60), m = min % 60;
  return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
}

/* ===================================================================
   FEIERTAGE NRW
   Sechs der elf hängen am Ostersonntag, der jedes Jahr woanders liegt.
   Osterformel nach Meeus/Jones/Butcher.
   =================================================================== */

const feiertagCache = {};

function ostersonntag(jahr) {
  const a = jahr % 19, b = Math.floor(jahr / 100), c = jahr % 100;
  const d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const monat = Math.floor((h + l - 7 * m + 114) / 31);
  const tag   = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(jahr, monat - 1, tag);
}
function plusT(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }

function feiertageNRW(jahr) {
  if (feiertagCache[jahr]) return feiertagCache[jahr];
  const o = ostersonntag(jahr);
  feiertagCache[jahr] = {
    [`${jahr}-01-01`]: "Neujahr",
    [alsText(plusT(o, -2))]: "Karfreitag",
    [alsText(plusT(o,  1))]: "Ostermontag",
    [`${jahr}-05-01`]: "Tag der Arbeit",
    [alsText(plusT(o, 39))]: "Christi Himmelfahrt",
    [alsText(plusT(o, 50))]: "Pfingstmontag",
    [alsText(plusT(o, 60))]: "Fronleichnam",
    [`${jahr}-10-03`]: "Tag der Deutschen Einheit",
    [`${jahr}-11-01`]: "Allerheiligen",
    [`${jahr}-12-25`]: "1. Weihnachtstag",
    [`${jahr}-12-26`]: "2. Weihnachtstag"
  };
  return feiertagCache[jahr];
}

/* Namen der Feste in anderen Sprachen. Eine neue Sprache braucht
   hier nur einen weiteren Block, sonst bleibt der deutsche Name. */
const FESTE = {
  ar: {
    "Neujahr": "رأس السنة",
    "Karfreitag": "الجمعة العظيمة",
    "Ostermontag": "اثنين الفصح",
    "Tag der Arbeit": "عيد العمال",
    "Christi Himmelfahrt": "خميس الصعود",
    "Pfingstmontag": "اثنين العنصرة",
    "Fronleichnam": "عيد الجسد",
    "Tag der Deutschen Einheit": "يوم الوحدة الألمانية",
    "Allerheiligen": "عيد جميع القديسين",
    "1. Weihnachtstag": "عيد الميلاد",
    "2. Weihnachtstag": "ثاني أيام الميلاد",
    "Sommerferien": "العطلة الصيفية",
    "Herbstferien": "عطلة الخريف",
    "Weihnachtsferien": "عطلة الميلاد",
    "Osterferien": "عطلة الفصح",
    "Pfingstferien": "عطلة العنصرة"
  }
};
function festName(deutsch) {
  if (!deutsch) return deutsch;
  const tabelle = FESTE[holeSprache()];
  return (tabelle && tabelle[deutsch]) || deutsch;
}

function feiertagName(tag) {
  const roh = feiertageNRW(Number(tag.slice(0, 4)))[tag];
  return roh ? festName(roh) : null;
}
function istFeiertag(tag) {
  return !!feiertageNRW(Number(tag.slice(0, 4)))[tag];
}

/* ===================================================================
   SCHULFERIEN NRW
   Quelle: Ferienordnung des Schulministeriums NRW, beide Tage inklusive.
   Wenn neue Jahre veröffentlicht sind, hier ergänzen.
   =================================================================== */

const FERIEN_NRW = [
  ["2026-07-20","2026-09-01","Sommerferien"],
  ["2026-10-17","2026-10-31","Herbstferien"],
  ["2026-12-23","2027-01-06","Weihnachtsferien"],
  ["2027-03-22","2027-04-03","Osterferien"],
  ["2027-05-18","2027-05-18","Pfingstferien"],
  ["2027-07-19","2027-08-31","Sommerferien"],
  ["2027-10-23","2027-11-06","Herbstferien"],
  ["2027-12-24","2028-01-08","Weihnachtsferien"],
  ["2028-04-10","2028-04-22","Osterferien"],
  ["2028-07-10","2028-08-22","Sommerferien"],
  ["2028-10-23","2028-11-04","Herbstferien"],
  ["2028-12-21","2029-01-05","Weihnachtsferien"],
  ["2029-03-26","2029-04-07","Osterferien"],
  ["2029-05-22","2029-05-22","Pfingstferien"]
];
function ferienRoh(tag) {
  for (const [von, bis, name] of FERIEN_NRW) if (tag >= von && tag <= bis) return name;
  return null;
}
function ferienName(tag) {
  const r = ferienRoh(tag);
  return r ? festName(r) : null;
}

/* ===================================================================
   SERIEN
   Eine Serie ist EIN Dokument mit einer Regel, nicht hundert Kopien.
   =================================================================== */

function istSerie(e) { return e.wiederholung === "serie" && e.serie; }

function serieAnTag(e, tag) {
  if (!istSerie(e)) return false;
  const s = e.serie;
  if (tag < e.datum) return false;
  if (s.bis && tag > s.bis) return false;
  if (!Array.isArray(s.wochentage) || !s.wochentage.includes(wochentag(tag))) return false;
  if (Array.isArray(s.ausnahmen) && s.ausnahmen.includes(tag)) return false;
  if (s.ohneFeiertage && istFeiertag(tag)) return false;
  if (s.ohneFerien && ferienRoh(tag)) return false;
  return true;
}
function laeuftAnTag(e, tag) {
  return istSerie(e) ? serieAnTag(e, tag) : e.datum === tag;
}
function erledigtAm(e, tag) {
  return istSerie(e)
    ? (Array.isArray(e.erledigtAn) && e.erledigtAn.includes(tag))
    : e.status === "erledigt";
}

/* ===================================================================
   ZUSTAND
   =================================================================== */

let nutzer  = null;
let profil  = {};               // mein eigenes Profil aus der Datenbank
let ansicht = "tag";
let filter  = "alles";          // alles | termin | task
let anker   = heute();
let gewaehlt = heute();

let meineEintraege = [];
let meineKreise    = [];
let alleNutzer     = {};        // uid -> {name, email, photoURL}
let nachrichten    = [];
let offeneEinladungen = {};     // kreisId -> [einladungen]

let eigene = [], geteilte = [];
let stopEigene = null, stopGeteilte = null, stopKreise = null, stopPost = null;

let bearbeiteId = null, bearbeiteTag = null;
let typ = "termin", wiederholung = "einmal";
let gewaehlteTage = [], gewaehlteKreise = [], gewaehltePersonen = [];
let neueFarbe = FARBEN[0], neueArt = "kreis";
let einladenKreis = null;
let schreibenAnUid = null;
let sucheAn = false;
let nachgeruestet = false;

/* ===================================================================
   KREISE: WER SIEHT WEN
   ------------------------------------------------------------------
   Kreis  – alle sehen die belegten Zeiten aller. Familie, Team.
   Stern  – nur der Verwalter sieht alle. Die Mitglieder sehen nur ihn,
            nicht einander. Fahrschüler, Kunden, Fahrer.
   =================================================================== */

function istStern(k) { return (k.art || "kreis") === "stern"; }
function binVerwalter(k) { return (k.verwalter || []).includes(nutzer.uid); }

/* Wer darf durch diesen Kreis sehen, dass ICH belegt bin */
function siehtMichDurch(k) {
  const mitglieder = k.mitglieder || [];
  if (!istStern(k)) return mitglieder;
  return binVerwalter(k) ? mitglieder : (k.verwalter || []);
}

/* Wen darf ich durch diesen Kreis sehen */
function icheSeheDurch(k) {
  const mitglieder = k.mitglieder || [];
  if (!istStern(k)) return mitglieder;
  return binVerwalter(k) ? mitglieder : (k.verwalter || []);
}

/* Alle Personen, deren Zeiten ich sehen darf */
function sichtbarePersonen() {
  const s = new Set();
  meineKreise.forEach((k) => icheSeheDurch(k).forEach((u) => s.add(u)));
  s.delete(nutzer.uid);
  return [...s];
}

/* Wer darf den Eintrag MIT Inhalt sehen */
function sichtbarFuerListe(kreisIds, personen) {
  const s = new Set([nutzer.uid]);
  meineKreise.filter((k) => kreisIds.includes(k.id))
             .forEach((k) => siehtMichDurch(k).forEach((u) => s.add(u)));
  (personen || []).forEach((u) => s.add(u));
  return [...s];
}

/* Wer darf sehen, DASS die Zeit belegt ist – ohne Titel und Notiz */
function belegtFuerListe() {
  const s = new Set([nutzer.uid]);
  meineKreise.forEach((k) => siehtMichDurch(k).forEach((u) => s.add(u)));
  return [...s];
}

/* ===================================================================
   ANMELDUNG
   =================================================================== */

$("loginBtn").addEventListener("click", async () => {
  $("loginFehler").textContent = "";
  try { await signInWithPopup(auth, new GoogleAuthProvider()); }
  catch (e) {
    $("loginFehler").textContent = t("anmeldenFehl", { code: e.code });
    console.error(e);
  }
});
$("logoutBtn").addEventListener("click", () => signOut(auth));

onAuthStateChanged(auth, async (user) => {
  [stopEigene, stopGeteilte, stopKreise, stopPost].forEach((f) => { if (f) f(); });
  stopEigene = stopGeteilte = stopKreise = stopPost = null;
  eigene = []; geteilte = []; meineEintraege = []; nachrichten = [];
  nachgeruestet = false;

  if (!user) {
    nutzer = null; profil = {};
    $("loginView").classList.remove("versteckt");
    $("appView").classList.add("versteckt");
    return;
  }

  nutzer = user;

  // Gesperrte Konten kommen nicht rein.
  profil = await ladeProfil();
  if (profil.aktiv === false) {
    await signOut(auth);
    $("loginFehler").textContent = t("gesperrt");
    return;
  }

  // Sprache aus dem Profil hat Vorrang vor dem Browser.
  if (profil.sprache && profil.sprache !== holeSprache()) {
    wendeSpracheAn(profil.sprache);
  }

  // Ohne Profilbild von Google zeigt der Knopf den ersten Buchstaben,
  // sonst hinge dort das kaputte Bildsymbol des Browsers.
  const bild = $("photo");
  if (user.photoURL) {
    bild.src = user.photoURL;
    bild.classList.remove("versteckt");
    $("michBtn").dataset.kuerzel = "";
  } else {
    bild.removeAttribute("src");
    bild.classList.add("versteckt");
    $("michBtn").dataset.kuerzel =
      (user.displayName || user.email || "?").trim().slice(0, 1).toUpperCase();
  }

  $("michName").textContent = user.displayName || t("koTitel");
  $("michMail").textContent = user.email || "";
  $("betriebBtn").classList.toggle("versteckt", !istBetreiber());

  $("loginView").classList.add("versteckt");
  $("appView").classList.remove("versteckt");

  await profilSichern();
  await einladungenAnnehmen();

  starteKreise();
  starteEintraege();
  startePost();
  zeichne();
});

function istBetreiber() {
  return BETREIBER.includes((nutzer?.email || "").toLowerCase());
}
function darfKreiseAnlegen() {
  return profil.darfKreiseAnlegen !== false;
}

async function ladeProfil() {
  try {
    const d = await getDoc(doc(db, "users", nutzer.uid));
    return d.exists() ? d.data() : {};
  } catch (e) { console.warn("Profil lesen:", e.code); return {}; }
}

async function profilSichern() {
  try {
    await setDoc(doc(db, "users", nutzer.uid), {
      name:     nutzer.displayName || "",
      email:    (nutzer.email || "").toLowerCase(),
      photoURL: nutzer.photoURL || "",
      sprache:  holeSprache(),
      zuletzt:  serverTimestamp()
    }, { merge: true });
  } catch (e) { console.error("Profil:", e); }
}

/* ===================================================================
   EINLADUNGEN
   Beim Anmelden schaut die App nach, ob jemand mich eingeladen hat,
   und trägt mich in den Kreis ein.
   =================================================================== */

async function einladungenAnnehmen() {
  const mail = (nutzer.email || "").toLowerCase();
  if (!mail) return;

  try {
    const snap = await getDocs(
      query(collection(db, "einladungen"), where("email", "==", mail))
    );

    for (const d of snap.docs) {
      const ein = d.data();
      try {
        const kref = doc(db, "kreise", ein.kreisId);
        const k = await getDoc(kref);
        if (!k.exists()) { await deleteDoc(d.ref); continue; }

        const daten = k.data();
        const mitglieder = daten.mitglieder || [];

        if (!mitglieder.includes(nutzer.uid)) {
          const neu = { mitglieder: [...mitglieder, nutzer.uid] };
          const alsVerwalter = !!ein.alsVerwalter;
          if (alsVerwalter) {
            neu.verwalter = [...(daten.verwalter || []), nutzer.uid];
          }

          // Im Stern steht der Name der Mitglieder NICHT im Kreis-Dokument,
          // sonst könnten sich die Mitglieder gegenseitig auslesen.
          const sternMitglied = (daten.art || "kreis") === "stern" && !alsVerwalter;
          if (!sternMitglied) {
            const info = { ...(daten.info || {}) };
            info[nutzer.uid] = meinSteckbrief();
            neu.info = info;
          }

          await updateDoc(kref, neu);

          if (sternMitglied) {
            await setDoc(doc(db, "kreisinfo", ein.kreisId + "_" + nutzer.uid), {
              kreisId: ein.kreisId, uid: nutzer.uid, ...meinSteckbrief()
            }).catch((e) => console.warn("kreisinfo:", e.code));
          }
        }
        await deleteDoc(d.ref);
      } catch (e) {
        console.error("Einladung", d.id, e);
      }
    }
  } catch (e) { console.error("Einladungen:", e); }
}

function meinSteckbrief() {
  return {
    name:     nutzer.displayName || "",
    email:    (nutzer.email || "").toLowerCase(),
    photoURL: nutzer.photoURL || ""
  };
}

/* ===================================================================
   DATEN LADEN
   =================================================================== */

function starteKreise() {
  stopKreise = onSnapshot(
    query(collection(db, "kreise"),
          where("mitglieder", "array-contains", nutzer.uid)),
    async (snap) => {
      meineKreise = snap.docs.map((x) => ({ id: x.id, ...x.data() }));

      alleNutzer = {};
      meineKreise.forEach((k) => Object.assign(alleNutzer, k.info || {}));
      alleNutzer[nutzer.uid] = meinSteckbrief();
      alleNutzer[nutzer.uid].name = nutzer.displayName || "Ich";

      zeichne();
      await ladeKreisinfo();
      ladeOffeneEinladungen();
      sichtbarkeitNachziehen();
    },
    (e) => console.error("Kreise:", e)
  );
}

/* Namen der Stern-Mitglieder. Die stehen in einer eigenen Sammlung,
   und lesen darf sie nur der Verwalter des Kreises. */
async function ladeKreisinfo() {
  let neu = false;
  for (const k of meineKreise) {
    if (!istStern(k) || !binVerwalter(k)) continue;
    try {
      const snap = await getDocs(
        query(collection(db, "kreisinfo"), where("kreisId", "==", k.id))
      );
      snap.docs.forEach((d) => {
        const x = d.data();
        if (x.uid && !alleNutzer[x.uid]) {
          alleNutzer[x.uid] = { name: x.name, email: x.email, photoURL: x.photoURL };
          neu = true;
        }
      });
    } catch (e) { console.warn("kreisinfo", k.id, e.code); }
  }
  if (neu) { zeichne(); if ($("dlgKreise").open) zeigeKreise(); }
}

/* Wer wurde eingeladen und hat sich noch nicht angemeldet */
async function ladeOffeneEinladungen() {
  offeneEinladungen = {};
  for (const k of meineKreise) {
    if (!binVerwalter(k)) continue;
    try {
      const snap = await getDocs(
        query(collection(db, "einladungen"), where("kreisId", "==", k.id))
      );
      offeneEinladungen[k.id] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (e) { console.warn("Einladungen", k.id, e.code); }
  }
  if ($("dlgKreise").open) zeigeKreise();
}

/* Kommt jemand neu in einen Kreis, sieht er alte Einträge nicht,
   weil in sichtbarFuer sein Name fehlt. Ändert sich die Besetzung,
   werden die eigenen Einträge deshalb einmal nachgezogen. */
async function sichtbarkeitNachziehen() {
  if (!eigene.length) return;
  const stand = meineKreise
    .map((k) => k.id + ":" + (k.art || "kreis") + ":" + [...(k.mitglieder || [])].sort().join(","))
    .sort().join("|");
  if (gemerkt("besetzung") === stand) return;

  const belegtListe = belegtFuerListe();
  try {
    let b = writeBatch(db), zahl = 0;
    for (const e of eigene) {
      const soll = sichtbarFuerListe(e.kreisIds || [], e.zugewiesen || []);
      const ist  = e.sichtbarFuer || [];
      const gleich = soll.length === ist.length && soll.every((u) => ist.includes(u));
      if (!gleich) {
        b.set(doc(db, "eintraege", e.id), { sichtbarFuer: soll }, { merge: true });
        zahl++;
      }
      b.set(doc(db, "belegt", e.id), { sichtbarFuer: belegtListe }, { merge: true });
      zahl++;
      if (zahl >= 400) { await b.commit(); b = writeBatch(db); zahl = 0; }
    }
    if (zahl) await b.commit();
    merke("besetzung", stand);
  } catch (e) { console.warn("Sichtbarkeit:", e.code); }
}

/* ---------- Nachrichten ---------- */

function startePost() {
  stopPost = onSnapshot(
    query(collection(db, "nachrichten"), where("anUid", "==", nutzer.uid)),
    (snap) => {
      nachrichten = snap.docs.map((x) => ({ id: x.id, ...x.data() }))
        .sort((a, b) => (b.erstelltAm?.seconds || 0) - (a.erstelltAm?.seconds || 0));
      zeigeZaehler();
      if ($("dlgPost").open) zeigePost();
    },
    (e) => console.warn("Nachrichten:", e.code, e.message)
  );
}

function zeigeZaehler() {
  const neu = nachrichten.filter((n) => !n.gelesen).length;
  $("postZahl").textContent = neu > 9 ? "9+" : String(neu);
  $("postZahl").classList.toggle("versteckt", neu === 0);
}

/* ---------- Einträge ----------
   Zwei Abfragen: die eigenen und die, die andere mit mir teilen.
   Zwei statt einer, damit auch Einträge ohne das Feld sichtbarFuer
   erscheinen, etwa aus dem Import. Und mit getrennten Fehlerwegen,
   damit ein Fehler in der zweiten nicht die ganze App leert.        */

function starteEintraege() {
  const zusammenfuehren = () => {
    const m = new Map();
    [...eigene, ...geteilte].forEach((e) => m.set(e.id, e));
    meineEintraege = [...m.values()];
    zeichne();
  };

  stopEigene = onSnapshot(
    query(collection(db, "eintraege"), where("ownerId", "==", nutzer.uid)),
    (snap) => {
      eigene = snap.docs.map((x) => ({ id: x.id, ...x.data() }));
      zusammenfuehren();
      nachruestenFallsNoetig();
      sichtbarkeitNachziehen();
    },
    (e) => {
      console.error("EIGENE Einträge:", e.code, e.message);
      const b = $("buehne");
      b.innerHTML = "";
      const d = el("div", "leer");
      d.appendChild(el("div", "gross", "!"));
      d.appendChild(el("div", null, t("ladeFehler", { code: e.code || e.message })));
      d.appendChild(el("div", "hinweis", t("ladeHinweis")));
      b.appendChild(d);
    }
  );

  stopGeteilte = onSnapshot(
    query(collection(db, "eintraege"),
          where("sichtbarFuer", "array-contains", nutzer.uid)),
    (snap) => {
      geteilte = snap.docs.map((x) => ({ id: x.id, ...x.data() }))
                          .filter((e) => e.ownerId !== nutzer.uid);
      zusammenfuehren();
    },
    (e) => {
      console.warn("GETEILTE Einträge (nicht kritisch):", e.code, e.message);
      geteilte = [];
      zusammenfuehren();
    }
  );
}

/* Einträge aus dem Import kennen sichtbarFuer und den Schattenkalender
   noch nicht. Beim ersten Start nach dem Umbau wird das einmal ergänzt. */
async function nachruestenFallsNoetig() {
  if (nachgeruestet) return;
  const offen = eigene.filter((e) => !Array.isArray(e.sichtbarFuer));
  if (!offen.length) { nachgeruestet = true; return; }
  nachgeruestet = true;

  console.log("Orbyx: rüste " + offen.length + " Einträge nach");
  try {
    for (const e of offen) {
      const b = writeBatch(db);
      b.set(doc(db, "eintraege", e.id),
            { kreisIds: e.kreisIds || [], sichtbarFuer: [nutzer.uid] },
            { merge: true });
      b.set(doc(db, "belegt", e.id), {
        ownerId: nutzer.uid,
        typ: e.typ, datum: e.datum,
        start: e.start || "", ende: e.ende || "",
        wiederholung: e.wiederholung || "einmal",
        ...(e.serie ? { serie: e.serie } : {}),
        sichtbarFuer: belegtFuerListe()
      }, { merge: true });
      await b.commit();
    }
  } catch (err) {
    console.error("Nachrüsten:", err);
    nachgeruestet = false;
  }
}

/* ===================================================================
   ANSICHT WECHSELN
   =================================================================== */

$("nav").addEventListener("click", (ev) => {
  const b = ev.target.closest("button[data-v]");
  if (!b) return;
  ansicht = b.dataset.v;
  [...$("nav").children].forEach((x) => x.classList.toggle("an", x === b));
  if (ansicht === "monat") anker = gewaehlt;
  merke("ansicht", ansicht);
  zeichne();
});

$("filter").addEventListener("click", (ev) => {
  const b = ev.target.closest("button[data-f]");
  if (!b) return;
  filter = b.dataset.f;
  [...$("filter").children].forEach((x) => x.classList.toggle("an", x === b));
  merke("filter", filter);
  zeichne();
});

(function stelleWieder() {
  const a = gemerkt("ansicht");
  const f = gemerkt("filter");
  if (a && [...$("nav").children].some((x) => x.dataset.v === a)) {
    ansicht = a;
    [...$("nav").children].forEach((x) => x.classList.toggle("an", x.dataset.v === a));
  }
  if (f && ["alles","termin","task"].includes(f)) {
    filter = f;
    [...$("filter").children].forEach((x) => x.classList.toggle("an", x.dataset.f === f));
  }
})();

function schiebe(richtung) {
  // Im Arabischen zeigen die Pfeile spiegelverkehrt, die Bedeutung bleibt.
  if (ansicht === "tag")        anker = plus(anker, richtung);
  else if (ansicht === "woche") anker = plus(anker, richtung * 7);
  else if (ansicht === "monat") {
    const d = ausText(anker);
    d.setDate(1); d.setMonth(d.getMonth() + richtung);
    anker = alsText(d);
  } else if (ansicht === "liste") anker = plus(anker, richtung * 30);
  else return;
  zeichne();
}
$("zurueck").addEventListener("click", () => schiebe(-1));
$("vor").addEventListener("click", () => schiebe(1));
$("heuteBtn").addEventListener("click", () => {
  anker = heute(); gewaehlt = heute(); zeichne();
});

/* ===================================================================
   ZEICHNEN
   =================================================================== */

function zeichne() {
  if (!nutzer) return;
  if (sucheAn) { sucheAusfuehren(); return; }

  $("zeitleiste").classList.toggle("versteckt", ansicht === "aufgaben");
  $("filter").classList.toggle("versteckt", ansicht === "aufgaben");

  const b = $("buehne");
  b.innerHTML = "";

  if (ansicht === "tag")           { kopfTag();   maleTag(b, anker); }
  else if (ansicht === "woche")    { kopfWoche(); maleWoche(b); }
  else if (ansicht === "monat")    { kopfMonat(); maleMonat(b); }
  else if (ansicht === "aufgaben") { maleAufgaben(b); }
  else                             { kopfListe(); maleListe(b); }
}

function passtZumFilter(e) {
  return filter === "alles" || e.typ === filter;
}

function marke(text, frei) {
  return el("span", "tagMarke" + (frei ? " frei" : ""), text);
}

function kopfTag() {
  $("zeitTitel").textContent = tagTitel(anker);
  const u = $("zeitUnter");
  u.innerHTML = "";
  if (anker === heute())    u.appendChild(marke(t("heute")));
  else if (anker < heute()) u.appendChild(marke(t("vergangen")));
  const f = feiertagName(anker);
  const s = ferienName(anker);
  if (f) u.appendChild(marke(f, true));
  if (s) u.appendChild(marke(s, true));
}

function kopfWoche() {
  const mo = montagVon(anker), so = plus(mo, 6);
  const a = ausText(mo), z = ausText(so);
  const M = liste("monate");
  const el1 = el("span", "ltr",
    `${a.getDate()}. ${M[a.getMonth()].slice(0,3)} – ${z.getDate()}. ${M[z.getMonth()].slice(0,3)}`);
  $("zeitTitel").innerHTML = "";
  $("zeitTitel").appendChild(el1);
  $("zeitUnter").textContent = t("woche");
}
function kopfMonat() {
  const d = ausText(anker);
  $("zeitTitel").textContent = `${liste("monate")[d.getMonth()]} ${d.getFullYear()}`;
  $("zeitUnter").textContent = "";
}
function kopfListe() {
  $("zeitTitel").textContent = t("wasAnsteht");
  $("zeitUnter").textContent = t("naechste30");
}

/* ---------- Einträge eines Tages ---------- */

function anTag(tag) {
  return meineEintraege.filter((e) => laeuftAnTag(e, tag) && passtZumFilter(e));
}
function sortiert(l) {
  return [...l].sort((a, b) => (a.start || "99").localeCompare(b.start || "99"));
}
function trenner(text, warn) {
  return el("div", "trenner" + (warn ? " warn" : ""), text);
}
function leerKasten(zeichen, text) {
  const d = el("div", "leer");
  d.appendChild(el("div", "gross", zeichen));
  d.appendChild(document.createTextNode(text));
  return d;
}

function maleTag(box, tag) {
  const alles   = anTag(tag);
  const termine = sortiert(alles.filter((e) => e.typ === "termin"));
  const tasks   = sortiert(alles.filter((e) => e.typ === "task"))
    .sort((a, b) => (a.frist || "9999").localeCompare(b.frist || "9999"));

  // Offene Aufgaben aus der Vergangenheit, nur einmalige, nur eigene.
  const offen = filter === "termin" ? [] : meineEintraege.filter((e) =>
    e.typ === "task" && !istSerie(e) && e.status === "offen" &&
    e.datum < tag && e.ownerId === nutzer.uid);

  // Was mir jemand zugewiesen hat und worauf ich noch nicht geantwortet habe
  const anfragen = alles.filter((e) =>
    e.ownerId !== nutzer.uid &&
    (e.zugewiesen || []).includes(nutzer.uid) &&
    !((e.zusagen || {})[nutzer.uid]));

  if (!termine.length && !tasks.length && !offen.length) {
    const f = feiertagName(tag);
    box.appendChild(leerKasten("○",
      f ? t("nichtsTagFeiertag", { name: f }) : t("nichtsTag")));
    return;
  }

  if (anfragen.length) {
    box.appendChild(trenner(t("aZugewiesen")));
    anfragen.forEach((e) => box.appendChild(zeile(e, tag)));
  }
  if (offen.length) {
    box.appendChild(trenner(t("aOffenFrueher"), true));
    sortiert(offen).forEach((e) => box.appendChild(zeile(e, e.datum, true)));
  }
  if (termine.length) {
    box.appendChild(trenner(t("aTermine")));
    termine.forEach((e) => box.appendChild(zeile(e, tag)));
  }
  if (tasks.length) {
    box.appendChild(trenner(t("aAufgaben")));
    tasks.forEach((e) => box.appendChild(zeile(e, tag)));
  }
}

/* ---------- Woche ---------- */

function maleWoche(box) {
  const mo = montagVon(anker);
  const w = el("div", "woche");
  const W = liste("wochentage");

  for (let i = 0; i < 7; i++) {
    const tag = plus(mo, i);
    const karte = el("div", "wochentag");

    const kopf = el("div", "kopf");
    kopf.appendChild(el("span", null, W[i]));
    const d = ausText(tag);
    kopf.appendChild(el("span", "num ltr", `${d.getDate()}.${d.getMonth() + 1}.`));
    const f = feiertagName(tag);
    if (f) kopf.appendChild(el("span", "tagMarke frei", f));
    if (tag === heute()) kopf.appendChild(el("span", "heute", t("heute")));
    karte.appendChild(kopf);

    const l = sortiert(anTag(tag));
    const zeilen = el("div", "zeilen");
    if (!l.length) {
      zeilen.appendChild(el("div", "nix", t("frei")));
    } else {
      l.forEach((e) => {
        const r = el("div", "mini" + (erledigtAm(e, tag) ? " erledigt" : ""));
        r.appendChild(el("span", "z", e.start || "—"));
        r.appendChild(el("span", null, e.titel));
        if (e.ownerId !== nutzer.uid) {
          const p = el("span", "kreisPunkt");
          p.style.background = farbeVon(e);
          r.appendChild(p);
        }
        r.addEventListener("click", () => {
          anker = tag; ansicht = "tag";
          [...$("nav").children].forEach((x) => x.classList.toggle("an", x.dataset.v === "tag"));
          merke("ansicht", "tag");
          zeichne();
        });
        zeilen.appendChild(r);
      });
    }
    karte.appendChild(zeilen);
    w.appendChild(karte);
  }
  box.appendChild(w);
}

/* ---------- Monat ---------- */

function maleMonat(box) {
  const d = ausText(anker); d.setDate(1);
  const start = montagVon(alsText(d));
  const monatNr = d.getMonth();

  const rahmen = el("div", "monat");
  const kopf = el("div", "monatKopf");
  liste("kurzTage").forEach((k) => kopf.appendChild(el("div", null, k)));
  rahmen.appendChild(kopf);

  const gitter = el("div", "monatGitter");
  for (let i = 0; i < 42; i++) {
    const tag = plus(start, i);
    const imMonat = ausText(tag).getMonth() === monatNr;
    const z = el("button", "monatZelle");
    z.type = "button";
    if (!imMonat) z.classList.add("fremd");
    if (tag === heute()) z.classList.add("heute");
    if (tag === gewaehlt) z.classList.add("gewaehlt");
    if (istFeiertag(tag)) z.classList.add("feier");

    z.appendChild(el("span", "ltr", String(ausText(tag).getDate())));

    const l = anTag(tag);
    const punkte = el("div", "punkte");
    l.slice(0, 4).forEach((e) => {
      const p = el("span", "punkt" + (e.typ === "task" ? " task" : ""));
      if (e.ownerId !== nutzer.uid) p.style.background = farbeVon(e);
      punkte.appendChild(p);
    });
    z.appendChild(punkte);

    z.addEventListener("click", () => {
      gewaehlt = tag;
      if (!imMonat) { anker = tag; zeichne(); return; }
      [...gitter.children].forEach((c) => c.classList.remove("gewaehlt"));
      z.classList.add("gewaehlt");
      maleMonatTag();
    });

    gitter.appendChild(z);
  }
  rahmen.appendChild(gitter);
  box.appendChild(rahmen);

  const unten = el("div");
  unten.id = "monatTag";
  box.appendChild(unten);
  maleMonatTag();
}

function maleMonatTag() {
  const box = $("monatTag");
  if (!box) return;
  box.innerHTML = "";
  box.appendChild(trenner(langDatum(gewaehlt)));
  const l = sortiert(anTag(gewaehlt));
  if (!l.length) {
    box.appendChild(el("div", "leer", t("nichtsGeplant")));
    return;
  }
  const w = el("div");
  w.style.cssText = "display:flex;flex-direction:column;gap:8px";
  l.forEach((e) => w.appendChild(zeile(e, gewaehlt)));
  box.appendChild(w);
}

/* ---------- Aufgaben ----------
   Eigener Bereich, nach Dringlichkeit statt nach Datum sortiert. */

function maleAufgaben(box) {
  const h = heute();

  const einmalig = meineEintraege.filter((e) => e.typ === "task" && !istSerie(e));
  const offen    = einmalig.filter((e) => e.status !== "erledigt");
  const fertig   = einmalig.filter((e) => e.status === "erledigt")
    .sort((a, b) => b.datum.localeCompare(a.datum)).slice(0, 15);

  const serien = meineEintraege.filter((e) =>
    e.typ === "task" && istSerie(e) && serieAnTag(e, h));

  const zugewiesen = meineEintraege.filter((e) =>
    e.ownerId !== nutzer.uid && (e.zugewiesen || []).includes(nutzer.uid) &&
    (e.zusagen || {})[nutzer.uid] !== "nein");

  const ueberfaellig = offen.filter((e) => e.frist && e.frist < h)
    .sort((a, b) => a.frist.localeCompare(b.frist));
  const heuteFaellig = offen.filter((e) => e.frist === h);
  const bald = offen.filter((e) => e.frist && e.frist > h && tageBis(e.frist, h) <= 7)
    .sort((a, b) => a.frist.localeCompare(b.frist));
  const spaeter = offen.filter((e) => e.frist && tageBis(e.frist, h) > 7)
    .sort((a, b) => a.frist.localeCompare(b.frist));
  const ohneFrist = offen.filter((e) => !e.frist)
    .sort((a, b) => a.datum.localeCompare(b.datum));

  if (!offen.length && !serien.length && !fertig.length && !zugewiesen.length) {
    box.appendChild(leerKasten("✓", t("keineAufgaben")));
    return;
  }

  const abschnitt = (schluessel, l, warn) => {
    if (!l.length) return;
    box.appendChild(trenner(t(schluessel), warn));
    l.forEach((e) => box.appendChild(zeile(e, e.datum, true)));
  };

  abschnitt("aZugewiesen", zugewiesen);
  abschnitt("aUeberfaellig", ueberfaellig, true);
  abschnitt("aHeuteFaellig", heuteFaellig, true);
  abschnitt("aDieseWoche", bald);
  if (serien.length) {
    box.appendChild(trenner(t("aWiederkehrend")));
    serien.forEach((e) => box.appendChild(zeile(e, h)));
  }
  abschnitt("aSpaeter", spaeter);
  abschnitt("aOhneFrist", ohneFrist);
  abschnitt("aErledigt", fertig);
}

/* ---------- Liste ---------- */

function maleListe(box) {
  const von = anker, bis = plus(anker, 30);
  let leer = true;

  for (let tg = von; tg <= bis; tg = plus(tg, 1)) {
    const l = sortiert(anTag(tg));
    if (!l.length) continue;
    leer = false;
    box.appendChild(trenner(
      tagTitel(tg) + (tg === heute() ? " · " + t("heute") : "")));
    l.forEach((e) => box.appendChild(zeile(e, tg)));
  }

  if (leer) box.appendChild(leerKasten("○", t("nichts30")));
}

/* ===================================================================
   EINE ZEILE
   =================================================================== */

function farbeVon(e) {
  const k = meineKreise.find((k) => (e.kreisIds || []).includes(k.id));
  return k ? k.farbe : "var(--text3)";
}
function vorname(uid) {
  const w = alleNutzer[uid];
  if (!w) return t("nJemand");
  return (w.name || w.email || "?").split(" ")[0];
}

function fristMarke(e, tag) {
  if (e.typ !== "task" || !e.frist) return null;
  const tage = tageBis(e.frist, heute());
  let text, klasse = "";
  if (erledigtAm(e, tag)) text = t("fristWar", { datum: kurzDatum(e.frist) });
  else if (tage < 0)   { text = t("fristSpaet", { n: Math.abs(tage) }); klasse = " spaet"; }
  else if (tage === 0) { text = t("fristHeute");                        klasse = " jetzt"; }
  else if (tage === 1) { text = t("fristMorgen");                       klasse = " bald"; }
  else if (tage <= 3)  { text = t("fristBald", { n: tage });            klasse = " bald"; }
  else                 { text = t("fristDatum", { datum: kurzDatum(e.frist) }); }
  return el("span", "marke" + klasse, text);
}

async function hakenUmschalten(e, tag) {
  const ref = doc(db, "eintraege", e.id);
  try {
    if (istSerie(e)) {
      const l = Array.isArray(e.erledigtAn) ? [...e.erledigtAn] : [];
      const i = l.indexOf(tag);
      if (i >= 0) l.splice(i, 1); else l.push(tag);
      await updateDoc(ref, { erledigtAn: l });
    } else {
      await updateDoc(ref, { status: e.status === "erledigt" ? "offen" : "erledigt" });
    }
  } catch (err) { console.error(err); }
}

/* Zusagen: der Zugewiesene antwortet, der Besitzer sieht den Stand. */
async function antworte(e, wert) {
  try {
    await updateDoc(doc(db, "eintraege", e.id), {
      ["zusagen." + nutzer.uid]: wert
    });
    await addDoc(collection(db, "nachrichten"), {
      anUid:   e.ownerId,
      vonUid:  nutzer.uid,
      vonName: nutzer.displayName || nutzer.email || "",
      art:     wert === "ja" ? "zusage" : "absage",
      text:    e.titel,
      eintragId: e.id,
      gelesen: false,
      erstelltAm: serverTimestamp()
    });
  } catch (err) {
    console.error(err);
    alert(t("eSpeichern", { code: err.code || err.message }));
  }
}

function zusageBlock(e) {
  const meine = (e.zusagen || {})[nutzer.uid] || "";
  const box = el("div", "zusage");

  const ja = el("button", "ja" + (meine === "ja" ? " an" : ""), t("zZusagen"));
  ja.type = "button";
  ja.addEventListener("click", (ev) => { ev.stopPropagation(); antworte(e, "ja"); });

  const nein = el("button", "nein" + (meine === "nein" ? " an" : ""), t("zAbsagen"));
  nein.type = "button";
  nein.addEventListener("click", (ev) => { ev.stopPropagation(); antworte(e, "nein"); });

  box.appendChild(ja);
  box.appendChild(nein);
  return box;
}

function zusageStand(e) {
  const wer = e.zugewiesen || [];
  if (!wer.length) return null;
  const z = e.zusagen || {};
  const ja = wer.filter((u) => z[u] === "ja").length;
  const offen = wer.filter((u) => !z[u]).length;
  const text = offen === 0 && ja === wer.length
    ? t("zAlleZu")
    : t("zUebersicht", { zu: ja, alle: wer.length });
  return el("span", "marke" + (offen ? " bald" : " gut"), text);
}

function zeile(e, tag, zeigeDatum) {
  const meins    = e.ownerId === nutzer.uid;
  const erledigt = erledigtAm(e, tag);
  const faellig  = e.typ === "task" && !erledigt && e.frist && e.frist < heute();
  const mirZugewiesen = !meins && (e.zugewiesen || []).includes(nutzer.uid);

  const wrap = el("div", "eintrag" + (erledigt ? " erledigt" : "") + (faellig ? " faellig" : ""));
  const kreis = meineKreise.find((k) => (e.kreisIds || []).includes(k.id));
  if (kreis) wrap.style.borderInlineStartColor = kreis.farbe;

  if (e.typ === "task" && meins) {
    const h = el("button", "haken" + (erledigt ? " an" : ""), erledigt ? "✓" : "");
    h.type = "button";
    h.setAttribute("aria-label", t("abhaken"));
    h.addEventListener("click", () => hakenUmschalten(e, tag));
    wrap.appendChild(h);
  } else {
    const z = el("div", "zeit");
    z.appendChild(el("span", null, e.start || (e.typ === "task" ? "—" : "")));
    if (e.typ === "termin" && e.ende) z.appendChild(el("small", null, e.ende));
    wrap.appendChild(z);
  }

  const inhalt = el("div", "inhalt");

  const titel = el("div", "titel");
  titel.appendChild(el("span", null, e.titel));
  if (istSerie(e)) {
    const r = el("span", "serieRing", "↻");
    r.title = t("serie");
    titel.appendChild(r);
  }
  if (kreis) {
    const p = el("span", "kreisPunkt");
    p.style.background = kreis.farbe;
    p.title = kreis.name;
    titel.appendChild(p);
  }
  inhalt.appendChild(titel);

  const zusatz = [];
  if (zeigeDatum) zusatz.push(kurzDatum(e.datum));
  if (!meins) zusatz.push(t("vonPerson", { name: vorname(e.ownerId) }));
  if (e.typ === "task" && e.start) zusatz.push(e.start);
  if (e.ort)   zusatz.push(e.ort);
  if (e.notiz) zusatz.push(e.notiz);
  if (zusatz.length) inhalt.appendChild(el("div", "unterzeile", zusatz.join(" · ")));

  const m = fristMarke(e, tag);
  if (m) inhalt.appendChild(m);

  if (meins) {
    const st = zusageStand(e);
    if (st) inhalt.appendChild(st);
    inhalt.addEventListener("click", () => oeffneEintrag(e, tag));
  }
  if (mirZugewiesen) inhalt.appendChild(zusageBlock(e));

  wrap.appendChild(inhalt);

  if (meins) {
    const weg = el("button", "weg", "×");
    weg.type = "button";
    weg.setAttribute("aria-label", t("loeschen"));
    weg.addEventListener("click", async () => {
      const frage = istSerie(e)
        ? t("eSerieLoeschen", { titel: e.titel })
        : t("eLoeschenFrage");
      if (!confirm(frage)) return;
      try {
        const b = writeBatch(db);
        b.delete(doc(db, "eintraege", e.id));
        b.delete(doc(db, "belegt", e.id));
        await b.commit();
      } catch (err) { alert(t("eSpeichern", { code: err.code || err.message })); }
    });
    wrap.appendChild(weg);
  }

  return wrap;
}

/* ===================================================================
   SUCHE
   =================================================================== */

$("sucheBtn").addEventListener("click", () => {
  sucheAn = true;
  $("suchleiste").classList.remove("versteckt");
  $("zeitleiste").classList.add("versteckt");
  $("sucheFeld").value = "";
  $("sucheFeld").focus();
  $("buehne").innerHTML = "";
  $("buehne").appendChild(el("div", "leer", t("tippe2")));
});
$("sucheZu").addEventListener("click", () => {
  sucheAn = false;
  $("suchleiste").classList.add("versteckt");
  zeichne();
});
$("sucheFeld").addEventListener("input", sucheAusfuehren);
$("sucheFeld").addEventListener("keydown", (ev) => {
  if (ev.key === "Escape") $("sucheZu").click();
});

function sucheAusfuehren() {
  const wort = $("sucheFeld").value.trim().toLowerCase();
  const box  = $("buehne");
  box.innerHTML = "";

  if (wort.length < 2) { box.appendChild(el("div", "leer", t("tippe2"))); return; }

  const treffer = meineEintraege.filter((e) => {
    const heu = e.suchtext ||
      [(e.titel||""), (e.notiz||""), (e.ort||"")].join(" ").toLowerCase();
    return heu.includes(wort);
  }).sort((a, b) => b.datum.localeCompare(a.datum));

  if (!treffer.length) {
    box.appendChild(el("div", "leer", t("nichtsGefunden", { wort })));
    return;
  }
  box.appendChild(trenner(t("aTreffer", { n: treffer.length })));
  treffer.forEach((e) => box.appendChild(zeile(e, e.datum, true)));
}

/* ===================================================================
   EINTRAG ANLEGEN UND ÄNDERN
   =================================================================== */

function setzeTyp(neu) {
  typ = neu;
  $("typTermin").classList.toggle("an", neu === "termin");
  $("typTask").classList.toggle("an", neu === "task");
  $("endeFeld").classList.toggle("versteckt", neu !== "termin");
  $("fristFeld").classList.toggle("versteckt", neu !== "task");
  $("lblStart").textContent = neu === "termin" ? t("fVon") : t("fUhrzeitOpt");
  setzeLabelDatum();
}
function setzeWdh(neu) {
  wiederholung = neu;
  $("wdhEinmal").classList.toggle("an", neu === "einmal");
  $("wdhSerie").classList.toggle("an", neu === "serie");
  $("serieFeld").classList.toggle("versteckt", neu !== "serie");
  setzeLabelDatum();
}
function setzeLabelDatum() {
  $("lblDatum").textContent = wiederholung === "serie" ? t("fErsterTag")
    : typ === "termin" ? t("fDatum") : t("fGeplantAm");
}
$("typTermin").addEventListener("click", () => setzeTyp("termin"));
$("typTask").addEventListener("click", () => setzeTyp("task"));
$("wdhEinmal").addEventListener("click", () => setzeWdh("einmal"));
$("wdhSerie").addEventListener("click", () => setzeWdh("serie"));

function baueTageWahl() {
  const box = $("tageWahl");
  box.innerHTML = "";
  liste("kurzTage").forEach((name, i) => {
    const b = el("button", "tagKnopf" + (gewaehlteTage.includes(i) ? " an" : ""), name);
    b.type = "button"; b.dataset.tag = i;
    b.addEventListener("click", () => {
      const k = gewaehlteTage.indexOf(i);
      if (k >= 0) gewaehlteTage.splice(k, 1); else gewaehlteTage.push(i);
      b.classList.toggle("an", k < 0);
    });
    box.appendChild(b);
  });
}
function zeigeTageWahl() {
  $("tageWahl").querySelectorAll(".tagKnopf").forEach((b) => {
    b.classList.toggle("an", gewaehlteTage.includes(Number(b.dataset.tag)));
  });
}

function zeigeTeilenWahl() {
  const box = $("teilenWahl");
  box.innerHTML = "";
  $("teilenBlock").classList.toggle("versteckt", !meineKreise.length);
  meineKreise.forEach((k) => {
    const b = el("button", "person" + (gewaehlteKreise.includes(k.id) ? " an" : ""));
    b.type = "button";
    const p = el("span", "kreisPunkt");
    p.style.background = k.farbe;
    b.appendChild(p);
    b.appendChild(el("span", null, k.name));
    b.addEventListener("click", () => {
      const i = gewaehlteKreise.indexOf(k.id);
      if (i >= 0) gewaehlteKreise.splice(i, 1); else gewaehlteKreise.push(k.id);
      b.classList.toggle("an", i < 0);
    });
    box.appendChild(b);
  });
}

function zeigeZuweisenWahl() {
  const box = $("zuweisenWahl");
  box.innerHTML = "";
  const leute = sichtbarePersonen();
  $("zuweisenBlock").classList.toggle("versteckt", !leute.length);
  leute.forEach((uid) => {
    const info = alleNutzer[uid] || {};
    const b = el("button", "person" + (gewaehltePersonen.includes(uid) ? " an" : ""),
                 info.name || info.email || t("kUnbekannt"));
    b.type = "button";
    b.addEventListener("click", () => {
      const i = gewaehltePersonen.indexOf(uid);
      if (i >= 0) gewaehltePersonen.splice(i, 1); else gewaehltePersonen.push(uid);
      b.classList.toggle("an", i < 0);
    });
    box.appendChild(b);
  });
}

function naechsteStunde() {
  const d = new Date();
  d.setMinutes(0, 0, 0); d.setHours(d.getHours() + 1);
  if (d.getHours() < 8)  d.setHours(8);
  if (d.getHours() > 23) d.setHours(23);
  return String(d.getHours()).padStart(2, "0") + ":00";
}

function oeffneEintrag(e, tag) {
  $("formFehler").textContent = "";
  bearbeiteId  = e ? e.id : null;
  bearbeiteTag = tag || anker;
  $("dlgTitel").textContent = e ? t("fBearbeiten") : t("fNeu");
  $("dlgUnter").textContent = e ? (istSerie(e) ? t("fSerieHinweis") : "") : t("fWasSteht");

  setzeTyp(e ? e.typ : "termin");
  setzeWdh(e && istSerie(e) ? "serie" : "einmal");

  $("fTitel").value = e ? e.titel : "";
  $("fDatum").value = e ? e.datum : (ansicht === "monat" ? gewaehlt : anker);
  $("fStart").value = e ? (e.start || "") : naechsteStunde();
  $("fEnde").value  = e ? (e.ende  || "") : "";
  $("fFrist").value = e ? (e.frist || "") : "";
  $("fOrt").value   = e ? (e.ort   || "") : "";
  $("fNotiz").value = e ? (e.notiz || "") : "";

  const s = e && e.serie ? e.serie : null;
  gewaehlteTage = s && Array.isArray(s.wochentage) ? [...s.wochentage] : [];
  if (!e) gewaehlteTage = [wochentag($("fDatum").value)];
  zeigeTageWahl();

  $("fBis").value         = s ? (s.bis || "") : "";
  $("fFeiertage").checked = s ? !!s.ohneFeiertage : true;
  $("fFerien").checked    = s ? !!s.ohneFerien    : false;

  gewaehlteKreise   = e ? [...(e.kreisIds   || [])] : [];
  gewaehltePersonen = e ? [...(e.zugewiesen || [])] : [];
  zeigeTeilenWahl();
  zeigeZuweisenWahl();

  const zeigeAbsage = !!(e && istSerie(e));
  $("absagenBtn").classList.toggle("versteckt", !zeigeAbsage);
  if (zeigeAbsage) $("absagenBtn").textContent = t("fTagAbsagen", { datum: kurzDatum(bearbeiteTag) });

  $("dlgEintrag").showModal();
}

$("neuBtn").addEventListener("click", () => oeffneEintrag(null, anker));
$("abbrechen").addEventListener("click", () => $("dlgEintrag").close());

$("absagenBtn").addEventListener("click", async () => {
  const e = meineEintraege.find((x) => x.id === bearbeiteId);
  if (!e || !e.serie) return;
  const l = Array.isArray(e.serie.ausnahmen) ? [...e.serie.ausnahmen] : [];
  if (!l.includes(bearbeiteTag)) l.push(bearbeiteTag);
  try {
    const b = writeBatch(db);
    b.update(doc(db, "eintraege", e.id), { "serie.ausnahmen": l });
    // set statt update: der Schatten fehlt bei Einträgen aus dem Import
    b.set(doc(db, "belegt", e.id), {
      ownerId: nutzer.uid, typ: e.typ, datum: e.datum,
      start: e.start || "", ende: e.ende || "",
      wiederholung: "serie",
      serie: { ...e.serie, ausnahmen: l },
      sichtbarFuer: belegtFuerListe()
    }, { merge: true });
    await b.commit();
    $("dlgEintrag").close();
  } catch (err) {
    $("formFehler").textContent = t("eSpeichern", { code: err.code || err.message });
    console.error(err);
  }
});

$("formEintrag").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  $("formFehler").textContent = "";

  const titel = $("fTitel").value.trim();
  const datum = $("fDatum").value;
  const start = $("fStart").value;
  const ende  = $("fEnde").value;
  const frist = $("fFrist").value;
  const ort   = $("fOrt").value.trim();
  const notiz = $("fNotiz").value.trim();
  const bis   = $("fBis").value;

  const fehler = (k) => { $("formFehler").textContent = t(k); };

  if (!titel || !datum) return fehler("eTitelDatum");
  if (typ === "termin" && !start) return fehler("eStartzeit");
  if (typ === "termin" && ende && ende <= start) return fehler("eEnde");
  if (typ === "task" && frist && frist < datum) return fehler("eFrist");
  if (wiederholung === "serie") {
    if (!gewaehlteTage.length) return fehler("eWochentag");
    if (!bis) return fehler("eSerienende");
    if (bis < datum) return fehler("eSerieVor");
  }

  const kreisIds   = [...gewaehlteKreise];
  const zugewiesen = [...gewaehltePersonen];

  const alt = bearbeiteId ? meineEintraege.find((x) => x.id === bearbeiteId) : null;

  // Zusagen von Leuten, die noch zugewiesen sind, bleiben erhalten.
  const zusagen = {};
  if (alt && alt.zusagen) {
    zugewiesen.forEach((u) => { if (alt.zusagen[u]) zusagen[u] = alt.zusagen[u]; });
  }

  const daten = {
    ownerId: nutzer.uid,
    typ, titel, datum,
    start: start || "",
    ende:  typ === "termin" ? (ende || "") : "",
    frist: typ === "task"   ? (frist || "") : "",
    ort, notiz,
    wiederholung,
    kreisIds,
    zugewiesen,
    zusagen,
    sichtbarFuer: sichtbarFuerListe(kreisIds, zugewiesen),
    suchtext: [titel, notiz, ort].join(" ").toLowerCase().trim()
  };

  const schatten = {
    ownerId: nutzer.uid,
    typ, datum,
    start: start || "",
    ende:  typ === "termin" ? (ende || "") : "",
    wiederholung,
    sichtbarFuer: belegtFuerListe()
  };

  if (wiederholung === "serie") {
    const s = {
      bis,
      wochentage: [...gewaehlteTage].sort((a, b) => a - b),
      ausnahmen: alt && alt.serie && Array.isArray(alt.serie.ausnahmen) ? alt.serie.ausnahmen : [],
      ohneFeiertage: $("fFeiertage").checked,
      ohneFerien:    $("fFerien").checked
    };
    daten.serie = s;
    schatten.serie = s;
  }

  try {
    let id = bearbeiteId;
    if (bearbeiteId) {
      const b = writeBatch(db);
      b.set(doc(db, "eintraege", bearbeiteId), daten, { merge: true });
      b.set(doc(db, "belegt",    bearbeiteId), schatten, { merge: true });
      await b.commit();
    } else {
      daten.erstelltAm = serverTimestamp();
      if (typ === "task") {
        daten.status = "offen";
        if (wiederholung === "serie") daten.erledigtAn = [];
      } else {
        daten.status = "";
      }
      const ref = await addDoc(collection(db, "eintraege"), daten);
      id = ref.id;
      await setDoc(doc(db, "belegt", ref.id), schatten);
      if (kreisIds.length) meldeGeteilt(titel, kreisIds, ref.id);
    }

    // Neu Zugewiesene bekommen Bescheid
    const vorher = alt ? (alt.zugewiesen || []) : [];
    const neuDazu = zugewiesen.filter((u) => !vorher.includes(u));
    if (neuDazu.length) meldeZugewiesen(titel, neuDazu, id);

    $("dlgEintrag").close();
    if (wiederholung === "einmal" && datum !== anker && ansicht === "tag") {
      anker = datum; zeichne();
    }
  } catch (e) {
    $("formFehler").textContent = t("eSpeichern", { code: e.code || e.message });
    console.error(e);
  }
});

/* ===================================================================
   KREISE
   =================================================================== */

FARBEN.forEach((f, i) => {
  const b = el("button", "farbe" + (i === 0 ? " an" : ""));
  b.type = "button";
  b.style.background = f;
  b.setAttribute("aria-label", f);
  b.addEventListener("click", () => {
    neueFarbe = f;
    [...$("kFarben").children].forEach((x) => x.classList.toggle("an", x === b));
  });
  $("kFarben").appendChild(b);
});

function setzeArt(a) {
  neueArt = a;
  $("artKreis").classList.toggle("an", a === "kreis");
  $("artStern").classList.toggle("an", a === "stern");
}
$("artKreis").addEventListener("click", () => setzeArt("kreis"));
$("artStern").addEventListener("click", () => setzeArt("stern"));

$("kreiseBtn").addEventListener("click", () => { zeigeKreise(); $("dlgKreise").showModal(); });
$("kreiseZu").addEventListener("click", () => $("dlgKreise").close());
$("kreiseZu2").addEventListener("click", () => $("dlgKreise").close());

function zeigeKreise() {
  // Wer keine Kreise anlegen darf, sieht das Formular gar nicht erst.
  const darf = darfKreiseAnlegen();
  $("neuerKreisBlock").classList.toggle("versteckt", !darf);
  $("kreiseNurZu").classList.toggle("versteckt", darf);

  const box = $("kreisListe");
  box.innerHTML = "";

  if (!meineKreise.length) {
    box.appendChild(el("div", "hinweis", darf ? t("kKeine") : t("kDarfNicht")));
    return;
  }

  meineKreise.forEach((k) => {
    const verwalter = binVerwalter(k);
    const ersteller = k.erstellerId === nutzer.uid;
    const stern = istStern(k);

    const karte = el("div", "kreisKarte");
    const kopf = el("div", "kopf");
    const p = el("span", "kreisPunkt");
    p.style.background = k.farbe;
    p.style.width = "14px"; p.style.height = "14px";
    kopf.appendChild(p);
    kopf.appendChild(el("b", null, k.name));
    kopf.appendChild(el("span", "rolle", stern ? t("kArtStern") : t("kArtKreis")));

    if (verwalter) {
      const b = el("button", "knopf rand", t("kEinladen"));
      b.type = "button";
      b.style.cssText = "width:auto;padding:7px 14px;font-size:13px";
      b.addEventListener("click", () => {
        einladenKreis = k;
        $("einladenUnter").textContent = t("eiIn", { kreis: k.name });
        $("eMail").value = "";
        $("eVerwalter").checked = false;
        $("einladenFehler").textContent = "";
        $("einladenGut").textContent = "";
        $("dlgEinladen").showModal();
      });
      kopf.appendChild(b);
    }
    karte.appendChild(kopf);

    /* ---- Mitglieder ----
       Im Stern sieht ein normales Mitglied nur die Verwalter. */
    const zeigeUids = stern && !verwalter ? (k.verwalter || []) : (k.mitglieder || []);

    zeigeUids.forEach((uid) => {
      const info = (k.info || {})[uid] || alleNutzer[uid] || {};
      const z = el("div", "mitglied");

      const av = el("div", "avatar");
      if (info.photoURL) {
        const img = el("img"); img.src = info.photoURL; img.alt = "";
        av.appendChild(img);
      } else {
        av.textContent = (info.name || "?").slice(0, 1).toUpperCase();
      }
      z.appendChild(av);

      const txt = el("div");
      txt.style.flexGrow = "1";
      txt.appendChild(el("div", null,
        (info.name || t("kUnbekannt")) + (uid === nutzer.uid ? " " + t("kDu") : "")));
      if (info.email) txt.appendChild(el("div", "mail", info.email));
      z.appendChild(txt);

      if ((k.verwalter || []).includes(uid)) z.appendChild(el("span", "rolle", t("kVerwalter")));

      if (uid !== nutzer.uid) {
        const nb = el("button", "klein", t("kNachricht"));
        nb.type = "button";
        nb.addEventListener("click", () => oeffneSchreiben(uid, info.name || info.email));
        z.appendChild(nb);
      }

      if (verwalter && uid !== nutzer.uid && uid !== k.erstellerId) {
        const wb = el("button", "klein gefahr", t("kEntfernen"));
        wb.type = "button";
        wb.addEventListener("click", async () => {
          if (!confirm(t("kEntfernenFrage", {
            name: info.name || t("kUnbekannt"), kreis: k.name }))) return;
          try {
            const info2 = { ...(k.info || {}) };
            delete info2[uid];
            await updateDoc(doc(db, "kreise", k.id), {
              mitglieder: (k.mitglieder || []).filter((u) => u !== uid),
              verwalter:  (k.verwalter  || []).filter((u) => u !== uid),
              info: info2
            });
            await deleteDoc(doc(db, "kreisinfo", k.id + "_" + uid)).catch(() => {});
          } catch (e) { alert(t("eSpeichern", { code: e.code || e.message })); }
        });
        z.appendChild(wb);
      }

      karte.appendChild(z);
    });

    /* ---- Offene Einladungen ---- */
    (offeneEinladungen[k.id] || []).forEach((ein) => {
      const z = el("div", "einladung");
      z.appendChild(el("div", "avatar", "?"));
      const txt = el("div");
      txt.style.flexGrow = "1";
      txt.appendChild(el("div", null, ein.email));
      txt.appendChild(el("div", "mail",
        ein.alsVerwalter ? t("kEingeladenVerw") : t("kEingeladen")));
      z.appendChild(txt);
      z.appendChild(el("span", "warte", t("kWartet")));

      const wb = el("button", "klein gefahr", t("kZurueckziehen"));
      wb.type = "button";
      wb.addEventListener("click", async () => {
        if (!confirm(t("kZurueckFrage", { mail: ein.email }))) return;
        try {
          await deleteDoc(doc(db, "einladungen", ein.id));
          await ladeOffeneEinladungen();
        } catch (e) { alert(t("eSpeichern", { code: e.code || e.message })); }
      });
      z.appendChild(wb);
      karte.appendChild(z);
    });

    /* ---- Verlassen oder löschen ---- */
    const fuss = el("div");
    fuss.style.cssText =
      "display:flex;gap:8px;margin-top:12px;padding-top:10px;border-top:1px solid var(--linie)";

    if (ersteller) {
      const lb = el("button", "klein gefahr", t("kLoeschen"));
      lb.type = "button";
      lb.addEventListener("click", async () => {
        if (!confirm(t("kLoeschenFrage", { kreis: k.name }))) return;
        try {
          for (const ein of (offeneEinladungen[k.id] || [])) {
            await deleteDoc(doc(db, "einladungen", ein.id)).catch(() => {});
          }
          await deleteDoc(doc(db, "kreise", k.id));
        } catch (e) { alert(t("eSpeichern", { code: e.code || e.message })); }
      });
      fuss.appendChild(lb);
    } else {
      const vb = el("button", "klein gefahr", t("kVerlassen"));
      vb.type = "button";
      vb.addEventListener("click", async () => {
        if (!confirm(t("kVerlassenFrage", { kreis: k.name }))) return;
        try {
          const info2 = { ...(k.info || {}) };
          delete info2[nutzer.uid];
          await updateDoc(doc(db, "kreise", k.id), {
            mitglieder: (k.mitglieder || []).filter((u) => u !== nutzer.uid),
            verwalter:  (k.verwalter  || []).filter((u) => u !== nutzer.uid),
            info: info2
          });
          await deleteDoc(doc(db, "kreisinfo", k.id + "_" + nutzer.uid)).catch(() => {});
        } catch (e) { alert(t("eSpeichern", { code: e.code || e.message })); }
      });
      fuss.appendChild(vb);
    }
    karte.appendChild(fuss);
    box.appendChild(karte);
  });
}

$("kreisAnlegen").addEventListener("click", async () => {
  $("kreisFehler").textContent = "";
  if (!darfKreiseAnlegen()) { $("kreisFehler").textContent = t("kDarfNicht"); return; }

  const name = $("kName").value.trim();
  if (!name) { $("kreisFehler").textContent = t("kNameFehlt"); return; }

  try {
    await addDoc(collection(db, "kreise"), {
      name,
      farbe: neueFarbe,
      art: neueArt,
      erstellerId: nutzer.uid,
      mitglieder: [nutzer.uid],
      verwalter:  [nutzer.uid],
      info: { [nutzer.uid]: meinSteckbrief() },
      erstelltAm: serverTimestamp()
    });
    $("kName").value = "";
  } catch (e) {
    $("kreisFehler").textContent = t("eSpeichern", { code: e.code || e.message });
    console.error(e);
  }
});

/* ---------- Einladen ---------- */

$("einladenZu").addEventListener("click", () => $("dlgEinladen").close());

$("formEinladen").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  $("einladenFehler").textContent = "";
  $("einladenGut").textContent = "";
  if (!einladenKreis) return;

  const mail = $("eMail").value.trim().toLowerCase();
  if (!mail.includes("@")) { $("einladenFehler").textContent = t("eiKeineMail"); return; }
  if (mail === (nutzer.email || "").toLowerCase()) {
    $("einladenFehler").textContent = t("eiSchonDrin"); return;
  }

  try {
    // Feste Kennung, damit die Sicherheitsregel sie nachschlagen kann.
    await setDoc(doc(db, "einladungen", einladenKreis.id + "_" + mail), {
      kreisId:   einladenKreis.id,
      kreisName: einladenKreis.name,
      email:     mail,
      vonUid:    nutzer.uid,
      vonName:   nutzer.displayName || "",
      alsVerwalter: $("eVerwalter").checked,
      erstelltAm: serverTimestamp()
    });
    $("einladenGut").textContent = t("eiErfolg", { mail });
    $("eMail").value = "";
    await ladeOffeneEinladungen();
  } catch (e) {
    $("einladenFehler").textContent = t("eSpeichern", { code: e.code || e.message });
    console.error(e);
  }
});

/* ===================================================================
   NACHRICHTEN
   =================================================================== */

function oeffneSchreiben(uid, name) {
  schreibenAnUid = uid;
  $("schreibenAn").textContent = t("sAn", { name: name || "" });
  $("sText").value = "";
  $("schreibenFehler").textContent = "";
  $("schreibenGut").textContent = "";
  $("dlgSchreiben").showModal();
}
$("schreibenZu").addEventListener("click", () => $("dlgSchreiben").close());

$("formSchreiben").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  $("schreibenFehler").textContent = "";
  const text = $("sText").value.trim();
  if (!text || !schreibenAnUid) return;

  try {
    await addDoc(collection(db, "nachrichten"), {
      anUid:   schreibenAnUid,
      vonUid:  nutzer.uid,
      vonName: nutzer.displayName || nutzer.email || "",
      art:     "nachricht",
      text,
      gelesen: false,
      erstelltAm: serverTimestamp()
    });
    $("schreibenGut").textContent = t("sGesendet");
    $("sText").value = "";
    setTimeout(() => $("dlgSchreiben").close(), 800);
  } catch (e) {
    $("schreibenFehler").textContent = t("eSpeichern", { code: e.code || e.message });
    console.error(e);
  }
});

/* Teile ich etwas mit einem Kreis, bekommen die anderen Bescheid */
async function meldeGeteilt(titel, kreisIds, eintragId) {
  const empfaenger = new Set();
  meineKreise.filter((k) => kreisIds.includes(k.id))
             .forEach((k) => siehtMichDurch(k).forEach((u) => {
               if (u !== nutzer.uid) empfaenger.add(u);
             }));
  if (!empfaenger.size) return;

  const kreisNamen = meineKreise.filter((k) => kreisIds.includes(k.id))
                                .map((k) => k.name).join(", ");
  try {
    for (const uid of empfaenger) {
      await addDoc(collection(db, "nachrichten"), {
        anUid: uid, vonUid: nutzer.uid,
        vonName: nutzer.displayName || nutzer.email || "",
        art: "geteilt", text: titel, kreisName: kreisNamen,
        eintragId: eintragId || "", gelesen: false,
        erstelltAm: serverTimestamp()
      });
    }
  } catch (e) { console.warn("Hinweis:", e.code); }
}

async function meldeZugewiesen(titel, uids, eintragId) {
  try {
    for (const uid of uids) {
      await addDoc(collection(db, "nachrichten"), {
        anUid: uid, vonUid: nutzer.uid,
        vonName: nutzer.displayName || nutzer.email || "",
        art: "zuweisung", text: titel,
        eintragId: eintragId || "", gelesen: false,
        erstelltAm: serverTimestamp()
      });
    }
  } catch (e) { console.warn("Zuweisung:", e.code); }
}

$("postBtn").addEventListener("click", () => { zeigePost(); $("dlgPost").showModal(); });
$("postZu").addEventListener("click", () => $("dlgPost").close());

$("postGelesen").addEventListener("click", async () => {
  const neu = nachrichten.filter((n) => !n.gelesen);
  if (!neu.length) return;
  try {
    const b = writeBatch(db);
    neu.forEach((n) => b.update(doc(db, "nachrichten", n.id), { gelesen: true }));
    await b.commit();
  } catch (e) { console.error(e); }
});

function wannText(zeit) {
  if (!zeit || !zeit.seconds) return "";
  const d = new Date(zeit.seconds * 1000);
  const min = Math.round((Date.now() - d.getTime()) / 60000);
  if (min < 1)    return t("nGerade");
  if (min < 60)   return t("nVorMin", { n: min });
  if (min < 1440) return t("nVorStd", { n: Math.round(min / 60) });
  return `${d.getDate()}.${d.getMonth() + 1}.`;
}

function postText(n) {
  if (n.art === "geteilt")
    return t("nHatGeteilt", { titel: n.text, kreis: n.kreisName || "—" });
  if (n.art === "zuweisung") return t("nHatZugewiesen", { titel: n.text });
  if (n.art === "zusage")    return t("nHatZugesagt",   { titel: n.text });
  if (n.art === "absage")    return t("nHatAbgesagt",   { titel: n.text });
  return n.text;
}

function zeigePost() {
  const box = $("postListe");
  box.innerHTML = "";

  if (!nachrichten.length) {
    box.appendChild(el("div", "leer", t("nKeine")));
    return;
  }

  nachrichten.slice(0, 60).forEach((n) => {
    const k = el("div", "post" + (n.gelesen ? "" : " neu"));

    const kopf = el("div");
    kopf.style.cssText = "display:flex;align-items:baseline;gap:8px";
    kopf.appendChild(el("span", "von", n.vonName || t("nJemand")));
    kopf.appendChild(el("span", "wann", wannText(n.erstelltAm)));
    k.appendChild(kopf);
    k.appendChild(el("div", "text", postText(n)));

    const knoepfe = el("div", "knoepfe");

    if (!n.gelesen) {
      const g = el("button", null, t("nGelesen"));
      g.type = "button";
      g.addEventListener("click", () =>
        updateDoc(doc(db, "nachrichten", n.id), { gelesen: true }).catch(console.error));
      knoepfe.appendChild(g);
    }

    if (n.art === "nachricht" && alleNutzer[n.vonUid]) {
      const a = el("button", null, t("nAntworten"));
      a.type = "button";
      a.addEventListener("click", () => {
        $("dlgPost").close();
        oeffneSchreiben(n.vonUid, n.vonName);
      });
      knoepfe.appendChild(a);
    }

    const w = el("button", null, t("loeschen"));
    w.type = "button";
    w.addEventListener("click", () =>
      deleteDoc(doc(db, "nachrichten", n.id)).catch(console.error));
    knoepfe.appendChild(w);

    k.appendChild(knoepfe);
    box.appendChild(k);
  });
}

/* ===================================================================
   TERMIN FINDEN
   Liest nur den Schattenkalender: Datum und Uhrzeit, keine Titel.
   =================================================================== */

let findenPersonenWahl = [];
let findenDauer = 60;

function baueDauerWahl() {
  const box = $("fvDauerWahl");
  box.innerHTML = "";
  [30, 60, 90, 120].forEach((m) => {
    const b = el("button", m === findenDauer ? "an" : "",
      m < 60 ? t("tfMin", { n: m }) : t("tfStd", { n: m / 60 }));
    b.type = "button";
    b.addEventListener("click", () => {
      findenDauer = m;
      [...box.children].forEach((x) => x.classList.toggle("an", x === b));
    });
    box.appendChild(b);
  });
}

$("findenBtn").addEventListener("click", () => {
  findenPersonenWahl = [];
  $("findenErgebnis").innerHTML = "";
  $("findenFehler").textContent = "";
  $("fvVon").value = heute();
  $("fvBis").value = plus(heute(), 13);

  const box = $("findenPersonen");
  box.innerHTML = "";
  const andere = sichtbarePersonen();

  if (!andere.length) box.appendChild(el("div", "hinweis", t("tfNiemand")));

  andere.forEach((uid) => {
    const info = alleNutzer[uid] || {};
    const b = el("button", "person", info.name || info.email || t("kUnbekannt"));
    b.type = "button";
    b.addEventListener("click", () => {
      const i = findenPersonenWahl.indexOf(uid);
      if (i >= 0) findenPersonenWahl.splice(i, 1); else findenPersonenWahl.push(uid);
      b.classList.toggle("an", i < 0);
    });
    box.appendChild(b);
  });

  $("dlgFinden").showModal();
});
$("findenZu").addEventListener("click", () => $("dlgFinden").close());

$("findenStart").addEventListener("click", async () => {
  $("findenFehler").textContent = "";
  const erg = $("findenErgebnis");
  erg.innerHTML = "";
  erg.appendChild(el("div", "hinweis", t("sucheLaeuft")));

  const von = $("fvVon").value, bis = $("fvBis").value;
  const frueh = minuten($("fvFrueh").value), spaet = minuten($("fvSpaet").value);
  const raus = (k) => { $("findenFehler").textContent = t(k); erg.innerHTML = ""; };

  if (!von || !bis || bis < von) return raus("tfZeitraum");
  if (frueh === null || spaet === null || spaet <= frueh) return raus("tfUhrzeiten");
  if (tageBis(bis, von) > 60) return raus("tfZuLang");

  const wer = [nutzer.uid, ...findenPersonenWahl];

  let belegt;
  try {
    const snap = await getDocs(
      query(collection(db, "belegt"),
            where("sichtbarFuer", "array-contains", nutzer.uid))
    );
    belegt = snap.docs.map((d) => d.data()).filter((x) => wer.includes(x.ownerId));
  } catch (e) {
    console.error(e);
    $("findenFehler").textContent = t("ladeFehler", { code: e.code || e.message });
    erg.innerHTML = "";
    return;
  }

  const luecken = freieFenster(belegt, von, bis, frueh, spaet, findenDauer);

  erg.innerHTML = "";
  if (!luecken.length) { erg.appendChild(el("div", "hinweis", t("tfKeine"))); return; }

  const namen = wer.map(vorname).join(", ");
  erg.appendChild(el("div", "hinweis", t("tfAlleFrei", { namen })));

  luecken.slice(0, 40).forEach((l) => {
    const z = el("div", "luecke");
    const links = el("div");
    links.appendChild(el("b", null, ausMinuten(l.von) + " – " + ausMinuten(l.bis)));
    links.appendChild(el("div", "dauer", kurzDatum(l.tag)));
    z.appendChild(links);

    const dauer = l.bis - l.von;
    z.appendChild(el("span", "marke",
      dauer >= 60
        ? t("tfStd", { n: Math.floor(dauer / 60) }) +
          (dauer % 60 ? " " + t("tfMin", { n: dauer % 60 }) : "")
        : t("tfMin", { n: dauer })));

    const nimm = el("button", "knopf", t("tfEintragen"));
    nimm.type = "button";
    nimm.style.cssText = "width:auto;padding:8px 14px;font-size:13px";
    nimm.addEventListener("click", () => {
      $("dlgFinden").close();
      oeffneEintrag(null, l.tag);
      $("fDatum").value = l.tag;
      $("fStart").value = ausMinuten(l.von);
      $("fEnde").value  = ausMinuten(Math.min(l.von + findenDauer, l.bis));
      gewaehlteKreise = meineKreise
        .filter((k) => findenPersonenWahl.every((u) => (k.mitglieder || []).includes(u)))
        .slice(0, 1).map((k) => k.id);
      zeigeTeilenWahl();
    });
    z.appendChild(nimm);
    erg.appendChild(z);
  });
});

/* Rechnet aus, wann alle frei sind. */
function freieFenster(belegt, von, bis, frueh, spaet, dauer) {
  const raus = [];

  for (let tag = von; tag <= bis; tag = plus(tag, 1)) {
    const blocks = [];
    belegt.forEach((e) => {
      if (!laeuftAnTag(e, tag)) return;
      const a = minuten(e.start);
      if (a === null) return;                 // Aufgabe ohne Uhrzeit blockiert nicht
      const z = minuten(e.ende) ?? (a + 60);  // ohne Ende: eine Stunde annehmen
      blocks.push([a, Math.max(z, a + 15)]);
    });

    blocks.sort((x, y) => x[0] - y[0]);

    // Überlappende zusammenfassen
    const dicht = [];
    blocks.forEach(([a, z]) => {
      if (dicht.length && a <= dicht[dicht.length - 1][1]) {
        dicht[dicht.length - 1][1] = Math.max(dicht[dicht.length - 1][1], z);
      } else dicht.push([a, z]);
    });

    // Die Lücken dazwischen sind frei
    let zeiger = frueh;
    dicht.forEach(([a, z]) => {
      if (a > zeiger && a - zeiger >= dauer) {
        raus.push({ tag, von: zeiger, bis: Math.min(a, spaet) });
      }
      zeiger = Math.max(zeiger, z);
    });
    if (spaet - zeiger >= dauer) raus.push({ tag, von: zeiger, bis: spaet });
  }

  return raus.filter((l) => l.bis - l.von >= dauer);
}

/* ===================================================================
   KONTO
   =================================================================== */

$("michBtn").addEventListener("click", () => {
  zeigeMeineZahlen();
  $("betriebBtn").classList.toggle("versteckt", !istBetreiber());
  $("dlgMich").showModal();
});
$("michZu").addEventListener("click", () => $("dlgMich").close());

function kachel(zahl, text, warn) {
  const k = el("div", "kachel" + (warn ? " warn" : ""));
  k.appendChild(el("b", null, String(zahl)));
  k.appendChild(el("span", null, text));
  return k;
}

function zeigeMeineZahlen() {
  const box = $("meineZahlen");
  box.innerHTML = "";
  const h = heute();
  const meins = meineEintraege.filter((e) => e.ownerId === nutzer.uid);

  const termine = meins.filter((e) => e.typ === "termin");
  const tasks   = meins.filter((e) => e.typ === "task");
  const offen   = tasks.filter((e) => !istSerie(e) && e.status !== "erledigt");
  const spaet   = offen.filter((e) => e.frist && e.frist < h);
  const serien  = meins.filter(istSerie);
  const geteilt = meins.filter((e) => (e.kreisIds || []).length);

  box.appendChild(kachel(termine.length, t("koTermine")));
  box.appendChild(kachel(offen.length,   t("koOffen")));
  box.appendChild(kachel(spaet.length,   t("koUeberfaellig"), spaet.length > 0));
  box.appendChild(kachel(serien.length,  t("koSerien")));
  box.appendChild(kachel(meineKreise.length, t("koKreise")));
  box.appendChild(kachel(geteilt.length, t("koGeteilt")));
}

/* ===================================================================
   BETRIEB
   Konten und Kreise. Termine und Inhalte stehen hier bewusst nicht:
   dafür bräuchte es Lesezugriff auf fremde Einträge, und genau den
   soll der Betreiber nicht haben.
   =================================================================== */

$("betriebBtn").addEventListener("click", async () => {
  if (!istBetreiber()) return;
  $("dlgBetrieb").showModal();
  await ladeBetrieb();
});
$("betriebZu").addEventListener("click", () => $("dlgBetrieb").close());

async function ladeBetrieb() {
  const tab = $("betriebTabelle");
  const zb  = $("betriebZahlen");
  const kb  = $("betriebKreise");
  $("betriebFehler").textContent = "";
  tab.innerHTML = ""; zb.innerHTML = ""; kb.innerHTML = "";

  try {
    const snap = await getDocs(collection(db, "users"));
    const reihen = snap.docs.map((d) => ({ uid: d.id, ...d.data() }))
      .sort((a, b) => (b.zuletzt?.seconds || 0) - (a.zuletzt?.seconds || 0));

    const jetzt = Date.now();
    let aktiv7 = 0, gesperrt = 0;

    const kopf = el("tr");
    [t("bName"), t("bMail"), t("bZuletzt"), t("bStatus"), t("bDarfKreise")]
      .forEach((x) => kopf.appendChild(el("th", null, x)));
    tab.appendChild(kopf);

    reihen.forEach((u) => {
      const tr = el("tr");
      tr.appendChild(el("td", null, u.name || "—"));
      tr.appendChild(el("td", "n", u.email || "—"));

      let z = "—";
      if (u.zuletzt?.seconds) {
        const d = new Date(u.zuletzt.seconds * 1000);
        if (jetzt - d.getTime() < 7 * 86400000) aktiv7++;
        z = `${d.getDate()}.${d.getMonth() + 1}.${String(d.getFullYear()).slice(2)}`;
      }
      const tdZ = el("td", "n"); tdZ.appendChild(el("span", "ltr", z));
      tr.appendChild(tdZ);

      // Status: sperren und freigeben
      const aktiv = u.aktiv !== false;
      if (!aktiv) gesperrt++;
      const tdS = el("td");
      const sb = el("button", "klein" + (aktiv ? " gefahr" : ""),
                    aktiv ? t("bSperren") : t("bFreigeben"));
      sb.type = "button";
      sb.addEventListener("click", async () => {
        sb.disabled = true;
        try {
          await updateDoc(doc(db, "users", u.uid), { aktiv: !aktiv });
          await ladeBetrieb();
        } catch (e) {
          $("betriebFehler").textContent = t("eSpeichern", { code: e.code || e.message });
          sb.disabled = false;
        }
      });
      tdS.appendChild(el("div", aktiv ? "" : "rolle", aktiv ? t("bAktiv") : t("bGesperrt")));
      tdS.appendChild(sb);
      tr.appendChild(tdS);

      // Darf Kreise anlegen
      const darf = u.darfKreiseAnlegen !== false;
      const tdK = el("td");
      const kbn = el("button", "klein", darf ? t("bJa") : t("bNein"));
      kbn.type = "button";
      kbn.addEventListener("click", async () => {
        kbn.disabled = true;
        try {
          await updateDoc(doc(db, "users", u.uid), { darfKreiseAnlegen: !darf });
          await ladeBetrieb();
        } catch (e) {
          $("betriebFehler").textContent = t("eSpeichern", { code: e.code || e.message });
          kbn.disabled = false;
        }
      });
      tdK.appendChild(kbn);
      tr.appendChild(tdK);

      tab.appendChild(tr);
    });

    zb.appendChild(kachel(reihen.length, t("bPersonen")));
    zb.appendChild(kachel(aktiv7, t("bAktiv7")));
    zb.appendChild(kachel(meineKreise.length, t("bKreise")));
    if (gesperrt) zb.appendChild(kachel(gesperrt, t("bGesperrt"), true));

    // Kreise, die ich selbst sehen darf
    if (!meineKreise.length) {
      kb.appendChild(el("div", "hinweis", t("kKeine")));
    } else {
      meineKreise.forEach((k) => {
        const z = el("div", "mitglied");
        z.style.borderTop = "none";
        const p = el("span", "kreisPunkt");
        p.style.background = k.farbe;
        p.style.width = "12px"; p.style.height = "12px";
        z.appendChild(p);
        const txt = el("div");
        txt.style.flexGrow = "1";
        txt.appendChild(el("div", null,
          k.name + " · " + (istStern(k) ? t("kArtStern") : t("kArtKreis"))));
        txt.appendChild(el("div", "mail",
          (k.mitglieder || []).length + " " + t("bPersonen")));
        z.appendChild(txt);
        const warte = (offeneEinladungen[k.id] || []).length;
        if (warte) z.appendChild(el("span", "rolle", t("bOffen", { n: warte })));
        kb.appendChild(z);
      });
    }
  } catch (e) {
    $("betriebFehler").textContent = t("bFehler", { code: e.code || e.message });
    console.error(e);
  }
}

/* ===================================================================
   START
   =================================================================== */

wendeSpracheAn(gemerkt("sprache") || spracheRaten());

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch((e) => console.log("SW:", e));
  });
}
