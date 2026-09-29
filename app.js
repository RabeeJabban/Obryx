// ===== Firebase-Zugangsdaten fuer das Projekt sawa-82a09 =====
const firebaseConfig = {
  apiKey: "AIzaSyAFCT65NaUVuu1YYBkKZM693zX_fKM7-Io",
  authDomain: "sawa-82a09.firebaseapp.com",
  projectId: "sawa-82a09",
  storageBucket: "sawa-82a09.firebasestorage.app",
  messagingSenderId: "200029883618",
  appId: "1:200029883618:web:18059e0fa3127bf62f62bb"
};
// ==============================================================

import { initializeApp }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, collection, doc, addDoc, updateDoc, deleteDoc,
  getDoc, getDocs, setDoc, query, where, orderBy, onSnapshot, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

const $ = (id) => document.getElementById(id);

const WOCHENTAGE = ["Montag","Dienstag","Mittwoch","Donnerstag",
                    "Freitag","Samstag","Sonntag"];
const KURZ       = ["Mo","Di","Mi","Do","Fr","Sa","So"];
const MONATE = ["Januar","Februar","März","April","Mai","Juni","Juli",
                "August","September","Oktober","November","Dezember"];

/* ============================================================
   DATUM
   Alle Daten sind Text in der Form JJJJ-MM-TT.
   toISOString() wird bewusst NICHT benutzt: das rechnet nach UTC
   um und verschiebt abends den Tag um eins nach vorn.
   ============================================================ */

function alsText(d) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const t = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${t}`;
}
function ausText(s) {
  const [j, m, t] = s.split("-").map(Number);
  return new Date(j, m - 1, t);
}
function tageBis(ziel, von) {
  return Math.round((ausText(ziel) - ausText(von)) / 86400000);
}
// 0 = Montag ... 6 = Sonntag. JavaScript zaehlt anders (0 = Sonntag),
// deshalb die Verschiebung. Die alte App zaehlt auch ab Montag.
function wochentag(text) {
  return (ausText(text).getDay() + 6) % 7;
}
function kurzDatum(text) {
  const d = ausText(text);
  return `${KURZ[wochentag(text)]}, ${d.getDate()}.${d.getMonth() + 1}.`;
}

/* ============================================================
   GESETZLICHE FEIERTAGE NRW
   Elf Tage im Jahr. Sechs davon haengen am Ostersonntag, der
   jedes Jahr woanders liegt und deshalb berechnet wird
   (Gauss-Osterformel in der Fassung von Meeus/Jones/Butcher).
   ============================================================ */

const feiertagCache = {};

function ostersonntag(jahr) {
  const a = jahr % 19;
  const b = Math.floor(jahr / 100);
  const c = jahr % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const monat = Math.floor((h + l - 7 * m + 114) / 31);
  const tag   = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(jahr, monat - 1, tag);
}

function plusTage(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function feiertageNRW(jahr) {
  if (feiertagCache[jahr]) return feiertagCache[jahr];

  const o = ostersonntag(jahr);
  const liste = {
    [`${jahr}-01-01`]: "Neujahr",
    [alsText(plusTage(o, -2))]: "Karfreitag",
    [alsText(plusTage(o,  1))]: "Ostermontag",
    [`${jahr}-05-01`]: "Tag der Arbeit",
    [alsText(plusTage(o, 39))]: "Christi Himmelfahrt",
    [alsText(plusTage(o, 50))]: "Pfingstmontag",
    [alsText(plusTage(o, 60))]: "Fronleichnam",
    [`${jahr}-10-03`]: "Tag der Deutschen Einheit",
    [`${jahr}-11-01`]: "Allerheiligen",
    [`${jahr}-12-25`]: "1. Weihnachtstag",
    [`${jahr}-12-26`]: "2. Weihnachtstag"
  };

  feiertagCache[jahr] = liste;
  return liste;
}

function feiertagName(text) {
  return feiertageNRW(Number(text.slice(0, 4)))[text] || null;
}

/* ============================================================
   SCHULFERIEN NRW
   Quelle: Ferienordnung des Schulministeriums NRW.
   Beide Tage sind eingeschlossen.
   ============================================================ */

const FERIEN_NRW = [
  ["2026-07-20", "2026-09-01", "Sommerferien"],
  ["2026-10-17", "2026-10-31", "Herbstferien"],
  ["2026-12-23", "2027-01-06", "Weihnachtsferien"],
  ["2027-03-22", "2027-04-03", "Osterferien"],
  ["2027-05-18", "2027-05-18", "Pfingstferien"],
  ["2027-07-19", "2027-08-31", "Sommerferien"],
  ["2027-10-23", "2027-11-06", "Herbstferien"],
  ["2027-12-24", "2028-01-08", "Weihnachtsferien"],
  ["2028-04-10", "2028-04-22", "Osterferien"],
  ["2028-07-10", "2028-08-22", "Sommerferien"],
  ["2028-10-23", "2028-11-04", "Herbstferien"],
  ["2028-12-21", "2029-01-05", "Weihnachtsferien"],
  ["2029-03-26", "2029-04-07", "Osterferien"],
  ["2029-05-22", "2029-05-22", "Pfingstferien"]
];

function ferienName(text) {
  for (const [von, bis, name] of FERIEN_NRW) {
    if (text >= von && text <= bis) return name;
  }
  return null;
}

/* ============================================================
   SERIEN
   Entscheidet, ob eine Serie an einem bestimmten Tag stattfindet.
   ============================================================ */

function istSerie(e) {
  return e.wiederholung === "serie" && e.serie;
}

function serieAnTag(e, tag) {
  if (!istSerie(e)) return false;

  const s = e.serie;
  if (tag < e.datum) return false;
  if (s.bis && tag > s.bis) return false;
  if (!Array.isArray(s.wochentage) || !s.wochentage.includes(wochentag(tag))) return false;
  if (Array.isArray(s.ausnahmen) && s.ausnahmen.includes(tag)) return false;
  if (s.ohneFeiertage && feiertagName(tag)) return false;
  if (s.ohneFerien && ferienName(tag)) return false;

  return true;
}

function serieErledigt(e, tag) {
  return Array.isArray(e.erledigtAn) && e.erledigtAn.includes(tag);
}

/* ============================================================
   ZUSTAND
   ============================================================ */

let aktiverTag = alsText(new Date());
let nutzer     = null;

let stopEinzel = null;   // Listener: Eintraege dieses Tages
let stopSerien = null;   // Listener: alle Serien
let stopOffen  = null;   // Listener: alte offene Aufgaben

let einzelHeute = [];
let alleSerien  = [];
let alteOffene  = [];

let bearbeiteId  = null;
let bearbeiteTag = null;   // bei Serien: der Tag, von dem aus geoeffnet wurde
let typ          = "termin";
let wiederholung = "einmal";
let gewaehlteTage = [];

let sucheAn   = false;
let alleCache = null;

/* ============================================================
   ANMELDUNG
   ============================================================ */

$("loginBtn").addEventListener("click", async () => {
  $("loginFehler").textContent = "";
  try {
    await signInWithPopup(auth, new GoogleAuthProvider());
  } catch (e) {
    $("loginFehler").textContent = "Anmeldung fehlgeschlagen: " + e.code;
    console.error(e);
  }
});

$("logoutBtn").addEventListener("click", () => signOut(auth));

onAuthStateChanged(auth, async (user) => {
  alleListenerStoppen();
  alleCache = null;

  if (!user) {
    nutzer = null;
    $("loginView").classList.remove("versteckt");
    $("appView").classList.add("versteckt");
    return;
  }

  nutzer = user;
  $("photo").src = user.photoURL || "";
  $("loginView").classList.add("versteckt");
  $("appView").classList.remove("versteckt");

  starteSerienListener();
  zeigeTag();

  try {
    const ref = doc(db, "users", user.uid);
    if (!(await getDoc(ref)).exists()) {
      await setDoc(ref, {
        name: user.displayName || "",
        email: user.email || "",
        photoURL: user.photoURL || "",
        rolle: "nutzer",
        erstelltAm: serverTimestamp()
      });
    }
  } catch (e) {
    console.error("Profil:", e);
  }
});

function alleListenerStoppen() {
  [stopEinzel, stopSerien, stopOffen].forEach((f) => { if (f) f(); });
  stopEinzel = stopSerien = stopOffen = null;
}

/* ============================================================
   DATEN LADEN
   ============================================================ */

// Serien werden EINMAL geladen, nicht pro Tag. Es sind wenige
// Dokumente, und beim Blaettern muss dann nichts nachgeladen werden.
function starteSerienListener() {
  if (stopSerien) stopSerien();
  stopSerien = onSnapshot(
    query(
      collection(db, "eintraege"),
      where("ownerId", "==", nutzer.uid),
      where("wiederholung", "==", "serie")
    ),
    (snap) => {
      alleSerien = snap.docs.map((x) => ({ id: x.id, ...x.data() }));
      male();
    },
    (e) => ladefehler(e)
  );
}

function zeigeTag() {
  const d = ausText(aktiverTag);
  $("tagLang").textContent =
    `${WOCHENTAGE[wochentag(aktiverTag)]}, ${d.getDate()}. ${MONATE[d.getMonth()]}`;

  const heute = alsText(new Date());
  const hinweise = [];
  if (aktiverTag === heute) hinweise.push("Heute");
  else if (aktiverTag < heute) hinweise.push("Vergangen");
  const f = feiertagName(aktiverTag);
  const s = ferienName(aktiverTag);
  if (f) hinweise.push(f);
  if (s) hinweise.push(s);
  $("tagHinweis").textContent = hinweise.join(" · ");

  if (stopEinzel) { stopEinzel(); stopEinzel = null; }
  if (stopOffen)  { stopOffen();  stopOffen  = null; }
  if (!nutzer) return;

  // leeren, sonst blitzt beim Blaettern kurz der alte Tag auf
  einzelHeute = [];
  alteOffene  = [];
  male();

  stopEinzel = onSnapshot(
    query(
      collection(db, "eintraege"),
      where("ownerId", "==", nutzer.uid),
      where("datum", "==", aktiverTag),
      orderBy("start")
    ),
    (snap) => {
      // Serien kommen aus dem eigenen Listener, sonst waeren sie
      // an ihrem ersten Tag doppelt in der Liste.
      einzelHeute = snap.docs
        .map((x) => ({ id: x.id, ...x.data() }))
        .filter((e) => !istSerie(e));
      male();
    },
    (e) => ladefehler(e)
  );

  stopOffen = onSnapshot(
    query(
      collection(db, "eintraege"),
      where("ownerId", "==", nutzer.uid),
      where("typ", "==", "task"),
      where("status", "==", "offen"),
      where("datum", "<", aktiverTag),
      orderBy("datum")
    ),
    (snap) => {
      alteOffene = snap.docs
        .map((x) => ({ id: x.id, ...x.data() }))
        .filter((e) => !istSerie(e));
      male();
    },
    (e) => ladefehler(e)
  );
}

function ladefehler(e) {
  console.error(e);
  $("liste").innerHTML =
    '<div class="leer">Konnte nicht laden. Drücke F12 und schau in die ' +
    'Konsole – dort steht meist ein Link zum Anlegen des Index.</div>';
}

/* ============================================================
   TAGESANSICHT ZEICHNEN
   ============================================================ */

function male() {
  if (sucheAn) return;

  const box = $("liste");
  box.innerHTML = "";

  const serienHeute = alleSerien.filter((e) => serieAnTag(e, aktiverTag));
  const alles = [...einzelHeute, ...serienHeute];

  const termine = alles.filter((e) => e.typ === "termin")
                       .sort((a, b) => (a.start || "").localeCompare(b.start || ""));
  const tasks   = alles.filter((e) => e.typ === "task")
                       .sort((a, b) => (a.frist || "9999").localeCompare(b.frist || "9999"));

  if (!termine.length && !tasks.length && !alteOffene.length) {
    const f = feiertagName(aktiverTag);
    box.innerHTML = '<div class="leer">' +
      (f ? f + " – nichts eingetragen." : "Nichts eingetragen für diesen Tag.") +
      "</div>";
    return;
  }

  if (alteOffene.length) {
    box.appendChild(trenner("Noch offen von früher", true));
    alteOffene.forEach((e) => box.appendChild(zeile(e, e.datum, true)));
  }
  if (termine.length) {
    box.appendChild(trenner("Termine"));
    termine.forEach((e) => box.appendChild(zeile(e, aktiverTag)));
  }
  if (tasks.length) {
    box.appendChild(trenner("Aufgaben"));
    tasks.forEach((e) => box.appendChild(zeile(e, aktiverTag)));
  }
}

function trenner(text, warn) {
  const d = document.createElement("div");
  d.className = "trenner" + (warn ? " warn" : "");
  d.textContent = text;
  return d;
}

/* ============================================================
   EINE ZEILE
   tag = der Tag, in dessen Zusammenhang der Eintrag gezeigt wird.
   Bei Serien entscheidet er ueber Haken und Fristanzeige.
   ============================================================ */

function erledigtStatus(e, tag) {
  return istSerie(e) ? serieErledigt(e, tag) : e.status === "erledigt";
}

function fristMarke(e, tag) {
  if (e.typ !== "task" || !e.frist) return null;

  const heute = alsText(new Date());
  const tage  = tageBis(e.frist, heute);

  let text, klasse = "";
  if (erledigtStatus(e, tag))  text = "Frist war " + kurzDatum(e.frist);
  else if (tage < 0)   { text = Math.abs(tage) + " Tage überfällig"; klasse = " spaet"; }
  else if (tage === 0) { text = "Heute fällig";                     klasse = " jetzt"; }
  else if (tage === 1) { text = "Morgen fällig";                    klasse = " bald"; }
  else if (tage <= 3)  { text = "In " + tage + " Tagen fällig";     klasse = " bald"; }
  else                 { text = "Frist " + kurzDatum(e.frist); }

  const s = document.createElement("span");
  s.className = "marke" + klasse;
  s.textContent = text;
  return s;
}

async function hakenUmschalten(e, tag) {
  const ref = doc(db, "eintraege", e.id);

  if (istSerie(e)) {
    const liste = Array.isArray(e.erledigtAn) ? [...e.erledigtAn] : [];
    const i = liste.indexOf(tag);
    if (i >= 0) liste.splice(i, 1); else liste.push(tag);
    await updateDoc(ref, { erledigtAn: liste });
  } else {
    await updateDoc(ref, {
      status: e.status === "erledigt" ? "offen" : "erledigt"
    });
  }
}

function zeile(e, tag, zeigeDatum) {
  const erledigt = erledigtStatus(e, tag);
  const heute = alsText(new Date());
  const faellig = e.typ === "task" && !erledigt && e.frist && e.frist < heute;

  const wrap = document.createElement("div");
  wrap.className = "eintrag"
    + (erledigt ? " erledigt" : "")
    + (faellig ? " faellig" : "");

  if (e.typ === "task") {
    const h = document.createElement("button");
    h.className = "haken" + (erledigt ? " an" : "");
    h.type = "button";
    h.setAttribute("aria-label", "Aufgabe abhaken");
    h.textContent = erledigt ? "✓" : "";
    h.addEventListener("click", () => hakenUmschalten(e, tag));
    wrap.appendChild(h);
  } else {
    const z = document.createElement("div");
    z.className = "zeit";
    z.textContent = e.start || "";
    wrap.appendChild(z);
  }

  const inhalt = document.createElement("div");
  inhalt.className = "inhalt";

  const t = document.createElement("div");
  t.className = "titel";
  t.textContent = e.titel;
  if (istSerie(e)) {
    const ring = document.createElement("span");
    ring.className = "serieZeichen";
    ring.textContent = "↻";
    ring.title = "Serie";
    t.appendChild(ring);
  }
  inhalt.appendChild(t);

  const zusatz = [];
  if (zeigeDatum) zusatz.push(kurzDatum(e.datum));
  if (e.typ === "termin" && e.ende) zusatz.push("bis " + e.ende);
  if (e.typ === "task" && e.start)  zusatz.push(e.start);
  if (e.ort)   zusatz.push(e.ort);
  if (e.notiz) zusatz.push(e.notiz);
  if (zusatz.length) {
    const n = document.createElement("div");
    n.className = "notiz";
    n.textContent = zusatz.join(" · ");
    inhalt.appendChild(n);
  }

  const marke = fristMarke(e, tag);
  if (marke) inhalt.appendChild(marke);

  inhalt.addEventListener("click", () => oeffneFormular(e, tag));
  wrap.appendChild(inhalt);

  const weg = document.createElement("button");
  weg.className = "weg";
  weg.type = "button";
  weg.setAttribute("aria-label", "Löschen");
  weg.textContent = "×";
  weg.addEventListener("click", async () => {
    const frage = istSerie(e)
      ? "Die ganze Serie „" + e.titel + "“ löschen?\n\n" +
        "Wenn nur dieser eine Tag ausfallen soll: abbrechen, auf den " +
        "Eintrag tippen und dort „Diesen Tag absagen“ wählen."
      : "Diesen Eintrag löschen?";
    if (!confirm(frage)) return;
    await deleteDoc(doc(db, "eintraege", e.id));
    alleCache = null;
    if (sucheAn) sucheAusfuehren();
  });
  wrap.appendChild(weg);

  return wrap;
}

/* ============================================================
   SUCHE
   ============================================================ */

$("sucheBtn").addEventListener("click", () => {
  sucheAn = true;
  $("suchleiste").classList.remove("versteckt");
  $("datumsleiste").classList.add("versteckt");
  $("sucheFeld").value = "";
  $("sucheFeld").focus();
  $("liste").innerHTML = '<div class="leer">Tippe mindestens zwei Zeichen.</div>';
});

$("sucheZu").addEventListener("click", schliesseSuche);

function schliesseSuche() {
  sucheAn = false;
  $("suchleiste").classList.add("versteckt");
  $("datumsleiste").classList.remove("versteckt");
  male();
}

$("sucheFeld").addEventListener("input", sucheAusfuehren);
$("sucheFeld").addEventListener("keydown", (ev) => {
  if (ev.key === "Escape") schliesseSuche();
});

async function ladeAlle() {
  if (alleCache) return alleCache;
  const snap = await getDocs(
    query(
      collection(db, "eintraege"),
      where("ownerId", "==", nutzer.uid),
      orderBy("datum", "desc")
    )
  );
  alleCache = snap.docs.map((x) => ({ id: x.id, ...x.data() }));
  return alleCache;
}

async function sucheAusfuehren() {
  const wort = $("sucheFeld").value.trim().toLowerCase();
  const box  = $("liste");

  if (wort.length < 2) {
    box.innerHTML = '<div class="leer">Tippe mindestens zwei Zeichen.</div>';
    return;
  }

  box.innerHTML = '<div class="leer">Suche …</div>';

  let alle;
  try {
    alle = await ladeAlle();
  } catch (e) {
    ladefehler(e);
    return;
  }

  if ($("sucheFeld").value.trim().toLowerCase() !== wort) return;

  const treffer = alle.filter((e) => {
    const heu = e.suchtext ||
      ((e.titel || "") + " " + (e.notiz || "") + " " + (e.ort || "")).toLowerCase();
    return heu.includes(wort);
  });

  box.innerHTML = "";
  if (!treffer.length) {
    box.innerHTML = '<div class="leer">Nichts gefunden für „' + wort + '".</div>';
    return;
  }

  box.appendChild(trenner(treffer.length + " Treffer"));
  treffer.forEach((e) => box.appendChild(zeile(e, e.datum, true)));
}

/* ============================================================
   FORMULAR
   ============================================================ */

function setzeTyp(neu) {
  typ = neu;
  $("typTermin").classList.toggle("aktiv", neu === "termin");
  $("typTask").classList.toggle("aktiv", neu === "task");
  $("endeFeld").classList.toggle("versteckt", neu !== "termin");
  $("fristFeld").classList.toggle("versteckt", neu !== "task");
  $("lblStart").textContent = neu === "termin" ? "Von" : "Uhrzeit (optional)";
  setzeLabelDatum();
}

function setzeWiederholung(neu) {
  wiederholung = neu;
  $("wdhEinmal").classList.toggle("aktiv", neu === "einmal");
  $("wdhSerie").classList.toggle("aktiv", neu === "serie");
  $("serieFeld").classList.toggle("versteckt", neu !== "serie");
  setzeLabelDatum();
}

function setzeLabelDatum() {
  $("lblDatum").textContent =
    wiederholung === "serie" ? "Erster Tag"
    : typ === "termin" ? "Datum" : "Geplant am";
}

$("typTermin").addEventListener("click", () => setzeTyp("termin"));
$("typTask").addEventListener("click", () => setzeTyp("task"));
$("wdhEinmal").addEventListener("click", () => setzeWiederholung("einmal"));
$("wdhSerie").addEventListener("click", () => setzeWiederholung("serie"));

// Wochentag-Knoepfe bauen
KURZ.forEach((name, i) => {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "tagKnopf";
  b.textContent = name;
  b.dataset.tag = i;
  b.addEventListener("click", () => {
    const k = gewaehlteTage.indexOf(i);
    if (k >= 0) gewaehlteTage.splice(k, 1); else gewaehlteTage.push(i);
    b.classList.toggle("aktiv", k < 0);
  });
  $("tageWahl").appendChild(b);
});

function zeigeGewaehlteTage() {
  $("tageWahl").querySelectorAll(".tagKnopf").forEach((b) => {
    b.classList.toggle("aktiv", gewaehlteTage.includes(Number(b.dataset.tag)));
  });
}

function naechsteStunde() {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  if (d.getHours() < 8)  d.setHours(8);
  if (d.getHours() > 23) d.setHours(23);
  return String(d.getHours()).padStart(2, "0") + ":00";
}

function oeffneFormular(e, tag) {
  $("formFehler").textContent = "";
  bearbeiteId  = e ? e.id : null;
  bearbeiteTag = tag || aktiverTag;
  $("dlgTitel").textContent = e ? "Eintrag bearbeiten" : "Neuer Eintrag";

  setzeTyp(e ? e.typ : "termin");
  setzeWiederholung(e && istSerie(e) ? "serie" : "einmal");

  $("fTitel").value = e ? e.titel : "";
  $("fDatum").value = e ? e.datum : aktiverTag;
  $("fStart").value = e ? (e.start || "") : naechsteStunde();
  $("fEnde").value  = e ? (e.ende  || "") : "";
  $("fFrist").value = e ? (e.frist || "") : "";
  $("fOrt").value   = e ? (e.ort   || "") : "";
  $("fNotiz").value = e ? (e.notiz || "") : "";

  const s = e && e.serie ? e.serie : null;
  gewaehlteTage = s && Array.isArray(s.wochentage) ? [...s.wochentage] : [];
  if (!e) gewaehlteTage = [wochentag(aktiverTag)];
  zeigeGewaehlteTage();

  $("fBis").value        = s ? (s.bis || "") : "";
  $("fFeiertage").checked = s ? !!s.ohneFeiertage : true;
  $("fFerien").checked    = s ? !!s.ohneFerien    : false;

  // "Diesen Tag absagen" nur beim Bearbeiten einer Serie
  const zeigeAbsage = !!(e && istSerie(e));
  $("absagenBtn").classList.toggle("versteckt", !zeigeAbsage);
  if (zeigeAbsage) $("absagenBtn").textContent = "Am " + kurzDatum(bearbeiteTag) + " absagen";

  $("dlg").showModal();
}

$("neuBtn").addEventListener("click", () => oeffneFormular(null, aktiverTag));
$("abbrechen").addEventListener("click", () => $("dlg").close());

// Einen einzelnen Tag aus der Serie nehmen
$("absagenBtn").addEventListener("click", async () => {
  const e = alleSerien.find((x) => x.id === bearbeiteId);
  if (!e) return;
  const liste = Array.isArray(e.serie.ausnahmen) ? [...e.serie.ausnahmen] : [];
  if (!liste.includes(bearbeiteTag)) liste.push(bearbeiteTag);
  try {
    await updateDoc(doc(db, "eintraege", e.id),
                    { "serie.ausnahmen": liste });
    $("dlg").close();
  } catch (err) {
    $("formFehler").textContent = "Fehlgeschlagen: " + err.code;
    console.error(err);
  }
});

$("form").addEventListener("submit", async (ev) => {
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

  if (!titel || !datum) {
    $("formFehler").textContent = "Titel und Datum sind nötig.";
    return;
  }
  if (typ === "termin" && !start) {
    $("formFehler").textContent = "Ein Termin braucht eine Startzeit.";
    return;
  }
  if (typ === "termin" && ende && ende <= start) {
    $("formFehler").textContent = "Das Ende muss nach dem Start liegen.";
    return;
  }
  if (typ === "task" && frist && frist < datum) {
    $("formFehler").textContent = "Die Frist liegt vor dem geplanten Tag.";
    return;
  }
  if (wiederholung === "serie") {
    if (!gewaehlteTage.length) {
      $("formFehler").textContent = "Wähle mindestens einen Wochentag.";
      return;
    }
    if (!bis) {
      $("formFehler").textContent = "Eine Serie braucht ein Enddatum.";
      return;
    }
    if (bis < datum) {
      $("formFehler").textContent = "Das Serienende liegt vor dem ersten Tag.";
      return;
    }
  }

  const daten = {
    ownerId: nutzer.uid,
    typ,
    titel,
    datum,
    start: start || "",
    ende:  typ === "termin" ? (ende  || "") : "",
    frist: typ === "task"   ? (frist || "") : "",
    ort,
    notiz,
    wiederholung,
    suchtext: (titel + " " + notiz + " " + ort).toLowerCase()
  };

  if (wiederholung === "serie") {
    const alt = bearbeiteId
      ? alleSerien.find((x) => x.id === bearbeiteId)
      : null;
    daten.serie = {
      bis,
      wochentage: [...gewaehlteTage].sort((a, b) => a - b),
      // bestehende Ausnahmen behalten
      ausnahmen: alt && alt.serie && Array.isArray(alt.serie.ausnahmen)
                 ? alt.serie.ausnahmen : [],
      ohneFeiertage: $("fFeiertage").checked,
      ohneFerien:    $("fFerien").checked
    };
  }

  try {
    if (bearbeiteId) {
      await updateDoc(doc(db, "eintraege", bearbeiteId), daten);
    } else {
      daten.erstelltAm = serverTimestamp();
      if (typ === "task") {
        daten.status = "offen";
        if (wiederholung === "serie") daten.erledigtAn = [];
      } else {
        daten.status = "";
      }
      await addDoc(collection(db, "eintraege"), daten);
    }

    alleCache = null;
    $("dlg").close();

    if (sucheAn) {
      sucheAusfuehren();
    } else if (wiederholung === "einmal" && datum !== aktiverTag) {
      aktiverTag = datum;
      zeigeTag();
    }
  } catch (e) {
    $("formFehler").textContent = "Speichern fehlgeschlagen: " + e.code;
    console.error(e);
  }
});

/* ============================================================
   DATUM BLAETTERN
   ============================================================ */

function schiebe(tage) {
  const d = ausText(aktiverTag);
  d.setDate(d.getDate() + tage);
  aktiverTag = alsText(d);
  zeigeTag();
}
$("zurueck").addEventListener("click", () => schiebe(-1));
$("vor").addEventListener("click", () => schiebe(1));
$("heuteBtn").addEventListener("click", () => {
  aktiverTag = alsText(new Date());
  zeigeTag();
});
