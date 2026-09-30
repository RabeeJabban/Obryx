// ===== Firebase-Zugangsdaten fuer das Projekt sawa-82a09 =====
const firebaseConfig = {
  apiKey: "AIzaSyAFCT65NaUVuu1YYBkKZM693zX_fKM7-Io",
  authDomain: "sawa-82a09.firebaseapp.com",
  projectId: "sawa-82a09",
  storageBucket: "sawa-82a09.firebasestorage.app",
  messagingSenderId: "200029883618",
  appId: "1:200029883618:web:18059e0fa3127bf62f62bb"
};
// Wer das Admin-Dashboard sieht.
const ADMIN_MAILS = ["rabea.jabban.mrj@gmail.com"];
// ==============================================================

import { initializeApp }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, collection, doc, addDoc, setDoc, updateDoc, deleteDoc,
  getDoc, getDocs, query, where, orderBy, limit, onSnapshot, serverTimestamp,
  writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

const WOCHENTAGE = ["Montag","Dienstag","Mittwoch","Donnerstag",
                    "Freitag","Samstag","Sonntag"];
const KURZ   = ["Mo","Di","Mi","Do","Fr","Sa","So"];
const MONATE = ["Januar","Februar","März","April","Mai","Juni","Juli",
                "August","September","Oktober","November","Dezember"];
// Dieselben zehn Farben wie im Icon.
const FARBEN = ["#D4533B","#DB8121","#C9A227","#8CA524","#3F9E5E",
                "#2E9E8F","#3480B0","#4C63C4","#8A54C0","#C24A8E"];

/* ===================================================================
   DATUM
   Alles ist Text in der Form JJJJ-MM-TT. toISOString() waere falsch,
   das rechnet nach UTC um und verschiebt abends den Tag.
   =================================================================== */

function alsText(d) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const t = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${t}`;
}
function ausText(s) {
  const [j, m, t] = s.split("-").map(Number);
  return new Date(j, m - 1, t);
}
function plus(text, tage) {
  const d = ausText(text);
  d.setDate(d.getDate() + tage);
  return alsText(d);
}
function tageBis(ziel, von) {
  return Math.round((ausText(ziel) - ausText(von)) / 86400000);
}
// 0 = Montag ... 6 = Sonntag (JavaScript zaehlt ab Sonntag)
function wochentag(text) {
  return (ausText(text).getDay() + 6) % 7;
}
function kurzDatum(text) {
  const d = ausText(text);
  return `${KURZ[wochentag(text)]}, ${d.getDate()}.${d.getMonth() + 1}.`;
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
   Sechs der elf haengen am Ostersonntag, der jedes Jahr woanders liegt.
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
function feiertagName(t) {
  return feiertageNRW(Number(t.slice(0, 4)))[t] || null;
}

/* ===================================================================
   SCHULFERIEN NRW
   Quelle: Ferienordnung des Schulministeriums NRW, beide Tage inklusive.
   Wenn die Termine bis 2033 veroeffentlicht sind, hier ergaenzen.
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
function ferienName(t) {
  for (const [von, bis, name] of FERIEN_NRW) if (t >= von && t <= bis) return name;
  return null;
}

/* ===================================================================
   SERIEN
   =================================================================== */

function istSerie(e) { return e.wiederholung === "serie" && e.serie; }

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

let nutzer     = null;
let ansicht    = "tag";
let filter     = "alles";       // alles | termin | task
let anker      = heute();       // Tag, Woche oder Monat, je nach Ansicht
let gewaehlt   = heute();       // im Monat angeklickter Tag
let nachrichten = [];
let offeneEinladungen = {};     // kreisId -> [einladungen]
let stopPost   = null;

let meineEintraege = [];        // alles, was ich sehen darf
let meineKreise    = [];
let alleNutzer     = {};        // uid -> {name, email, photoURL}

let stopKreise = null;

let bearbeiteId = null, bearbeiteTag = null;
let typ = "termin", wiederholung = "einmal";
let gewaehlteTage = [], gewaehlteKreise = [];
let neueFarbe = FARBEN[0];
let einladenKreis = null;

let sucheAn = false;

/* ===================================================================
   ANMELDUNG
   =================================================================== */

$("loginBtn").addEventListener("click", async () => {
  $("loginFehler").textContent = "";
  try { await signInWithPopup(auth, new GoogleAuthProvider()); }
  catch (e) {
    $("loginFehler").textContent = "Anmeldung fehlgeschlagen: " + e.code;
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
    nutzer = null;
    $("loginView").classList.remove("versteckt");
    $("appView").classList.add("versteckt");
    return;
  }

  nutzer = user;
  $("photo").src = user.photoURL || "";
  $("michName").textContent = user.displayName || "Mein Konto";
  $("michMail").textContent = user.email || "";
  $("loginView").classList.add("versteckt");
  $("appView").classList.remove("versteckt");

  await profilSichern();
  await einladungenAnnehmen();

  starteKreise();
  starteEintraege();
  startePost();
  zeichne();
});

async function profilSichern() {
  try {
    await setDoc(doc(db, "users", nutzer.uid), {
      name:     nutzer.displayName || "",
      email:    (nutzer.email || "").toLowerCase(),
      photoURL: nutzer.photoURL || "",
      zuletzt:  serverTimestamp()
    }, { merge: true });
  } catch (e) { console.error("Profil:", e); }
}

/* ===================================================================
   EINLADUNGEN
   Beim Anmelden schaut die App nach, ob jemand mich eingeladen hat,
   und traegt mich in den Kreis ein.
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
          const info = { ...(daten.info || {}) };
          info[nutzer.uid] = {
            name:     nutzer.displayName || "",
            email:    mail,
            photoURL: nutzer.photoURL || ""
          };
          const neu = { mitglieder: [...mitglieder, nutzer.uid], info };
          // Wer als Verwalter eingeladen wurde, wird gleich einer.
          if (ein.alsVerwalter) {
            neu.verwalter = [...(daten.verwalter || []), nutzer.uid];
          }
          await updateDoc(kref, neu);
        }
        await deleteDoc(d.ref);
      } catch (e) {
        console.error("Einladung", d.id, e);
      }
    }
  } catch (e) { console.error("Einladungen:", e); }
}

/* ===================================================================
   DATEN LADEN
   =================================================================== */

function starteKreise() {
  stopKreise = onSnapshot(
    query(collection(db, "kreise"),
          where("mitglieder", "array-contains", nutzer.uid)),
    (snap) => {
      meineKreise = snap.docs.map((x) => ({ id: x.id, ...x.data() }));
      alleNutzer = {};
      meineKreise.forEach((k) => Object.assign(alleNutzer, k.info || {}));
      alleNutzer[nutzer.uid] = {
        name: nutzer.displayName || "Ich",
        email: (nutzer.email || "").toLowerCase(),
        photoURL: nutzer.photoURL || ""
      };
      zeichne();
      ladeOffeneEinladungen();
    },
    (e) => console.error("Kreise:", e)
  );
}

// Wer wurde eingeladen und hat sich noch nicht angemeldet
async function ladeOffeneEinladungen() {
  offeneEinladungen = {};
  for (const k of meineKreise) {
    if (!(k.verwalter || []).includes(nutzer.uid)) continue;
    try {
      const snap = await getDocs(
        query(collection(db, "einladungen"), where("kreisId", "==", k.id))
      );
      offeneEinladungen[k.id] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (e) { console.warn("Einladungen", k.id, e.code); }
  }
  if ($("dlgKreise").open) zeigeKreise();
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

// Zwei Abfragen: meine eigenen Eintraege und die, die andere mit einem
// meiner Kreise geteilt haben. Zwei statt einer, damit auch Eintraege
// ohne das Feld sichtbarFuer erscheinen, etwa aus dem Import.
let eigene = [], geteilte = [];
let stopEigene = null, stopGeteilte = null;

function starteEintraege() {
  const zusammenfuehren = () => {
    const m = new Map();
    [...eigene, ...geteilte].forEach((e) => m.set(e.id, e));
    meineEintraege = [...m.values()];
    zeichne();
  };

  // Abfrage 1: meine eigenen Eintraege. Die ist die wichtige.
  // Geht sie schief, ist die App leer und sagt das auch.
  stopEigene = onSnapshot(
    query(collection(db, "eintraege"), where("ownerId", "==", nutzer.uid)),
    (snap) => {
      eigene = snap.docs.map((x) => ({ id: x.id, ...x.data() }));
      zusammenfuehren();
      nachruestenFallsNoetig();
    },
    (e) => {
      console.error("EIGENE Einträge:", e.code, e.message);
      $("buehne").innerHTML =
        '<div class="leer"><div class="gross">!</div>' +
        'Konnte nicht laden: ' + (e.code || e.message) +
        '<br><br>Bei „permission-denied“ sind die Sicherheitsregeln noch nicht ' +
        'veröffentlicht. Bei „failed-precondition“ fehlt ein Index, dann steht ' +
        'in der Konsole ein Link zum Anlegen.</div>';
    }
  );

  // Abfrage 2: was andere mit meinen Kreisen geteilt haben.
  // Solange es keine Kreise gibt, liefert die nichts. Ein Fehler hier
  // darf den Rest deshalb nicht blockieren.
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

/* Eintraege aus dem Import kennen sichtbarFuer und den Schattenkalender
   noch nicht. Beim ersten Start nach dem Umbau wird das einmal ergaenzt. */
let nachgeruestet = false;

async function nachruestenFallsNoetig() {
  if (nachgeruestet) return;
  const offen = eigene.filter((e) => !Array.isArray(e.sichtbarFuer));
  if (!offen.length) { nachgeruestet = true; return; }
  nachgeruestet = true;

  console.log("Sawa: rüste " + offen.length + " Einträge nach");
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

// Auswahl merken, damit sie beim nächsten Öffnen noch steht
function merke(schluessel, wert) {
  try { localStorage.setItem("sawa." + schluessel, wert); } catch (e) {}
}
function gemerkt(schluessel) {
  try { return localStorage.getItem("sawa." + schluessel); } catch (e) { return null; }
}

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
  if (ansicht === "tag")        anker = plus(anker, richtung);
  else if (ansicht === "woche") anker = plus(anker, richtung * 7);
  else if (ansicht === "monat") {
    const d = ausText(anker);
    d.setDate(1); d.setMonth(d.getMonth() + richtung);
    anker = alsText(d);
  } else if (ansicht === "liste") anker = plus(anker, richtung * 30);
  else return;   // Aufgabenansicht kennt kein Blättern
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

  // In der Aufgabenansicht gibt es nichts zu blättern
  $("zeitleiste").classList.toggle("versteckt", ansicht === "aufgaben");
  // und der Filter wäre dort sinnlos
  $("filter").classList.toggle("versteckt", ansicht === "aufgaben");

  const b = $("buehne");
  b.innerHTML = "";

  if (ansicht === "tag")           { kopfTag();   maleTag(b, anker); }
  else if (ansicht === "woche")    { kopfWoche(); maleWoche(b); }
  else if (ansicht === "monat")    { kopfMonat(); maleMonat(b); }
  else if (ansicht === "aufgaben") { maleAufgaben(b); }
  else                             { kopfListe(); maleListe(b); }
}

/* Der Filter greift über alle Ansichten */
function passtZumFilter(e) {
  return filter === "alles" || e.typ === filter;
}

function kopfTag() {
  const d = ausText(anker);
  $("zeitTitel").textContent =
    `${WOCHENTAGE[wochentag(anker)]}, ${d.getDate()}. ${MONATE[d.getMonth()]}`;
  const u = $("zeitUnter");
  u.innerHTML = "";
  if (anker === heute())      u.appendChild(marke("Heute"));
  else if (anker < heute())   u.appendChild(marke("Vergangen"));
  const f = feiertagName(anker);
  const s = ferienName(anker);
  if (f) u.appendChild(marke(f, true));
  if (s) u.appendChild(marke(s, true));
}
function marke(text, frei) {
  const x = el("span", "tagMarke" + (frei ? " frei" : ""), text);
  return x;
}

function kopfWoche() {
  const mo = montagVon(anker), so = plus(mo, 6);
  const a = ausText(mo), z = ausText(so);
  $("zeitTitel").textContent =
    `${a.getDate()}. ${MONATE[a.getMonth()].slice(0,3)} – ${z.getDate()}. ${MONATE[z.getMonth()].slice(0,3)}`;
  $("zeitUnter").textContent = "Woche";
}
function kopfMonat() {
  const d = ausText(anker);
  $("zeitTitel").textContent = `${MONATE[d.getMonth()]} ${d.getFullYear()}`;
  $("zeitUnter").textContent = "";
}
function kopfListe() {
  $("zeitTitel").textContent = "Was ansteht";
  $("zeitUnter").textContent = "Die nächsten 30 Tage";
}

/* ---------- Eintraege eines Tages ---------- */

function anTag(tag) {
  return meineEintraege.filter((e) => laeuftAnTag(e, tag) && passtZumFilter(e));
}
function sortiert(liste) {
  return [...liste].sort((a, b) => (a.start || "99").localeCompare(b.start || "99"));
}

function maleTag(box, tag) {
  const alles  = anTag(tag);
  const termine = sortiert(alles.filter((e) => e.typ === "termin"));
  const tasks   = sortiert(alles.filter((e) => e.typ === "task"))
    .sort((a, b) => (a.frist || "9999").localeCompare(b.frist || "9999"));

  // Offene Aufgaben aus der Vergangenheit, nur einmalige.
  const offen = filter === "termin" ? [] : meineEintraege.filter((e) =>
    e.typ === "task" && !istSerie(e) && e.status === "offen" &&
    e.datum < tag && e.ownerId === nutzer.uid);

  if (!termine.length && !tasks.length && !offen.length) {
    const f = feiertagName(tag);
    const d = el("div", "leer");
    d.appendChild(el("div", "gross", "○"));
    d.appendChild(document.createTextNode(
      f ? f + " – nichts eingetragen." : "Nichts eingetragen für diesen Tag."));
    box.appendChild(d);
    return;
  }

  if (offen.length) {
    box.appendChild(trenner("Noch offen von früher", true));
    sortiert(offen).forEach((e) => box.appendChild(zeile(e, e.datum, true)));
  }
  if (termine.length) {
    box.appendChild(trenner("Termine"));
    termine.forEach((e) => box.appendChild(zeile(e, tag)));
  }
  if (tasks.length) {
    box.appendChild(trenner("Aufgaben"));
    tasks.forEach((e) => box.appendChild(zeile(e, tag)));
  }
}

function trenner(text, warn) {
  return el("div", "trenner" + (warn ? " warn" : ""), text);
}

/* ---------- Woche ---------- */

function maleWoche(box) {
  const mo = montagVon(anker);
  const w = el("div", "woche");

  for (let i = 0; i < 7; i++) {
    const tag = plus(mo, i);
    const karte = el("div", "wochentag");

    const kopf = el("div", "kopf");
    kopf.appendChild(el("span", null, WOCHENTAGE[i]));
    kopf.appendChild(el("span", "num", kurzDatum(tag).split(", ")[1]));
    const f = feiertagName(tag);
    if (f) kopf.appendChild(el("span", "tagMarke frei", f));
    if (tag === heute()) kopf.appendChild(el("span", "heute", "Heute"));
    karte.appendChild(kopf);

    const liste = sortiert(anTag(tag));
    const zeilen = el("div", "zeilen");
    if (!liste.length) {
      zeilen.appendChild(el("div", "nix", "frei"));
    } else {
      liste.forEach((e) => {
        const r = el("div", "mini" + (erledigtAm(e, tag) ? " erledigt" : ""));
        r.appendChild(el("span", "z", e.start || (e.typ === "task" ? "Aufg." : "")));
        const t = el("span", null, e.titel);
        r.appendChild(t);
        if (e.ownerId !== nutzer.uid) {
          const p = el("span", "kreisPunkt");
          p.style.background = farbeVon(e);
          r.appendChild(p);
        }
        r.addEventListener("click", () => { anker = tag; ansicht = "tag";
          [...$("nav").children].forEach((x) => x.classList.toggle("an", x.dataset.v === "tag"));
          zeichne(); });
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
  const ersterImMonat = alsText(d);
  const start = montagVon(ersterImMonat);
  const monatNr = d.getMonth();

  const rahmen = el("div", "monat");
  const kopf = el("div", "monatKopf");
  KURZ.forEach((k) => kopf.appendChild(el("div", null, k)));
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
    if (feiertagName(tag)) z.classList.add("feier");

    z.appendChild(el("span", null, String(ausText(tag).getDate())));

    const liste = anTag(tag);
    const punkte = el("div", "punkte");
    liste.slice(0, 4).forEach((e) => {
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
  const d = ausText(gewaehlt);
  box.appendChild(trenner(
    `${WOCHENTAGE[wochentag(gewaehlt)]}, ${d.getDate()}. ${MONATE[d.getMonth()]}`));
  const liste = sortiert(anTag(gewaehlt));
  if (!liste.length) {
    box.appendChild(el("div", "leer", "Nichts eingetragen."));
    return;
  }
  const w = el("div");
  w.style.cssText = "display:flex;flex-direction:column;gap:8px";
  liste.forEach((e) => w.appendChild(zeile(e, gewaehlt)));
  box.appendChild(w);
}

/* ---------- Aufgaben ----------
   Eigener Bereich, nur Aufgaben, nicht an einen Tag gebunden.
   Sortiert nach Dringlichkeit statt nach Datum.                     */

function maleAufgaben(box) {
  const h = heute();

  // Einmalige Aufgaben, alle offenen und die zuletzt erledigten
  const einmalig = meineEintraege.filter((e) => e.typ === "task" && !istSerie(e));
  const offen    = einmalig.filter((e) => e.status !== "erledigt");
  const fertig   = einmalig.filter((e) => e.status === "erledigt")
    .sort((a, b) => b.datum.localeCompare(a.datum)).slice(0, 15);

  // Serien-Aufgaben, heute fällig
  const serien = meineEintraege.filter((e) =>
    e.typ === "task" && istSerie(e) && serieAnTag(e, h));

  const dringend = (e) => e.frist || "9999-99-99";

  const ueberfaellig = offen.filter((e) => e.frist && e.frist < h)
    .sort((a, b) => a.frist.localeCompare(b.frist));
  const heuteFaellig = offen.filter((e) => e.frist === h);
  const bald = offen.filter((e) => e.frist && e.frist > h && tageBis(e.frist, h) <= 7)
    .sort((a, b) => a.frist.localeCompare(b.frist));
  const spaeter = offen.filter((e) => e.frist && tageBis(e.frist, h) > 7)
    .sort((a, b) => a.frist.localeCompare(b.frist));
  const ohneFrist = offen.filter((e) => !e.frist)
    .sort((a, b) => a.datum.localeCompare(b.datum));

  if (!offen.length && !serien.length && !fertig.length) {
    const x = el("div", "leer");
    x.appendChild(el("div", "gross", "✓"));
    x.appendChild(document.createTextNode("Keine offenen Aufgaben."));
    box.appendChild(x);
    return;
  }

  const abschnitt = (titel, liste, warn) => {
    if (!liste.length) return;
    box.appendChild(trenner(titel, warn));
    liste.forEach((e) => box.appendChild(zeile(e, e.datum, true)));
  };

  abschnitt("Überfällig", ueberfaellig, true);
  abschnitt("Heute fällig", heuteFaellig, true);
  abschnitt("Diese Woche", bald);
  if (serien.length) {
    box.appendChild(trenner("Heute wiederkehrend"));
    serien.forEach((e) => box.appendChild(zeile(e, h)));
  }
  abschnitt("Später", spaeter);
  abschnitt("Ohne Frist", ohneFrist);
  abschnitt("Zuletzt erledigt", fertig);
}

/* ---------- Liste ---------- */

function maleListe(box) {
  const von = anker, bis = plus(anker, 30);
  let leer = true;

  for (let t = von; t <= bis; t = plus(t, 1)) {
    const liste = sortiert(anTag(t));
    if (!liste.length) continue;
    leer = false;
    const d = ausText(t);
    box.appendChild(trenner(
      `${KURZ[wochentag(t)]}, ${d.getDate()}. ${MONATE[d.getMonth()]}` +
      (t === heute() ? " · heute" : "")));
    liste.forEach((e) => box.appendChild(zeile(e, t)));
  }

  if (leer) {
    const x = el("div", "leer");
    x.appendChild(el("div", "gross", "○"));
    x.appendChild(document.createTextNode("In den nächsten 30 Tagen ist nichts eingetragen."));
    box.appendChild(x);
  }
}

/* ===================================================================
   EINE ZEILE
   =================================================================== */

function farbeVon(e) {
  const k = meineKreise.find((k) => (e.kreisIds || []).includes(k.id));
  return k ? k.farbe : "var(--text3)";
}

function fristMarke(e, tag) {
  if (e.typ !== "task" || !e.frist) return null;
  const tage = tageBis(e.frist, heute());
  let text, klasse = "";
  if (erledigtAm(e, tag)) text = "Frist war " + kurzDatum(e.frist);
  else if (tage < 0)   { text = Math.abs(tage) + " Tage überfällig"; klasse = " spaet"; }
  else if (tage === 0) { text = "Heute fällig";                      klasse = " jetzt"; }
  else if (tage === 1) { text = "Morgen fällig";                     klasse = " bald"; }
  else if (tage <= 3)  { text = "In " + tage + " Tagen fällig";      klasse = " bald"; }
  else                 { text = "Frist " + kurzDatum(e.frist); }
  return el("span", "marke" + klasse, text);
}

async function hakenUmschalten(e, tag) {
  const ref = doc(db, "eintraege", e.id);
  if (istSerie(e)) {
    const liste = Array.isArray(e.erledigtAn) ? [...e.erledigtAn] : [];
    const i = liste.indexOf(tag);
    if (i >= 0) liste.splice(i, 1); else liste.push(tag);
    await updateDoc(ref, { erledigtAn: liste });
  } else {
    await updateDoc(ref, { status: e.status === "erledigt" ? "offen" : "erledigt" });
  }
}

function zeile(e, tag, zeigeDatum) {
  const meins    = e.ownerId === nutzer.uid;
  const erledigt = erledigtAm(e, tag);
  const faellig  = e.typ === "task" && !erledigt && e.frist && e.frist < heute();

  const wrap = el("div", "eintrag" + (erledigt ? " erledigt" : "") + (faellig ? " faellig" : ""));
  const kreis = meineKreise.find((k) => (e.kreisIds || []).includes(k.id));
  if (kreis) wrap.style.borderLeftColor = kreis.farbe;

  if (e.typ === "task" && meins) {
    const h = el("button", "haken" + (erledigt ? " an" : ""), erledigt ? "✓" : "");
    h.type = "button";
    h.setAttribute("aria-label", "Aufgabe abhaken");
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
    r.title = "Serie";
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
  if (!meins) {
    const wer = alleNutzer[e.ownerId];
    zusatz.push("von " + (wer ? wer.name.split(" ")[0] : "jemandem"));
  }
  if (e.typ === "task" && e.start) zusatz.push(e.start);
  if (e.ort)   zusatz.push(e.ort);
  if (e.notiz) zusatz.push(e.notiz);
  if (zusatz.length) inhalt.appendChild(el("div", "unterzeile", zusatz.join(" · ")));

  const m = fristMarke(e, tag);
  if (m) inhalt.appendChild(m);

  if (meins) inhalt.addEventListener("click", () => oeffneEintrag(e, tag));
  wrap.appendChild(inhalt);

  if (meins) {
    const weg = el("button", "weg", "×");
    weg.type = "button";
    weg.setAttribute("aria-label", "Löschen");
    weg.addEventListener("click", async () => {
      const frage = istSerie(e)
        ? `Die ganze Serie „${e.titel}“ löschen?\n\nWenn nur dieser Tag ausfallen soll: ` +
          `abbrechen, auf den Eintrag tippen und „Diesen Tag absagen“ wählen.`
        : "Diesen Eintrag löschen?";
      if (!confirm(frage)) return;
      const b = writeBatch(db);
      b.delete(doc(db, "eintraege", e.id));
      b.delete(doc(db, "belegt", e.id));
      await b.commit();
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
  $("buehne").innerHTML = '<div class="leer">Tippe mindestens zwei Zeichen.</div>';
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

  if (wort.length < 2) {
    box.appendChild(el("div", "leer", "Tippe mindestens zwei Zeichen."));
    return;
  }

  const treffer = meineEintraege.filter((e) => {
    const heu = e.suchtext ||
      [(e.titel||""), (e.notiz||""), (e.ort||"")].join(" ").toLowerCase();
    return heu.includes(wort);
  }).sort((a, b) => b.datum.localeCompare(a.datum));

  if (!treffer.length) {
    box.appendChild(el("div", "leer", `Nichts gefunden für „${wort}“.`));
    return;
  }
  box.appendChild(trenner(treffer.length + (treffer.length === 1 ? " Treffer" : " Treffer")));
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
  $("lblStart").textContent = neu === "termin" ? "Von" : "Uhrzeit (optional)";
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
  $("lblDatum").textContent = wiederholung === "serie" ? "Erster Tag"
    : typ === "termin" ? "Datum" : "Geplant am";
}
$("typTermin").addEventListener("click", () => setzeTyp("termin"));
$("typTask").addEventListener("click", () => setzeTyp("task"));
$("wdhEinmal").addEventListener("click", () => setzeWdh("einmal"));
$("wdhSerie").addEventListener("click", () => setzeWdh("serie"));

KURZ.forEach((name, i) => {
  const b = el("button", "tagKnopf", name);
  b.type = "button"; b.dataset.tag = i;
  b.addEventListener("click", () => {
    const k = gewaehlteTage.indexOf(i);
    if (k >= 0) gewaehlteTage.splice(k, 1); else gewaehlteTage.push(i);
    b.classList.toggle("an", k < 0);
  });
  $("tageWahl").appendChild(b);
});

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
  $("dlgTitel").textContent = e ? "Eintrag bearbeiten" : "Neuer Eintrag";
  $("dlgUnter").textContent = e ? (istSerie(e) ? "Änderungen gelten für die ganze Serie." : "")
                                : "Was steht an?";

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

  gewaehlteKreise = e ? [...(e.kreisIds || [])] : [];
  zeigeTeilenWahl();

  const zeigeAbsage = !!(e && istSerie(e));
  $("absagenBtn").classList.toggle("versteckt", !zeigeAbsage);
  if (zeigeAbsage) $("absagenBtn").textContent = "Am " + kurzDatum(bearbeiteTag) + " absagen";

  $("dlgEintrag").showModal();
}

$("neuBtn").addEventListener("click", () => oeffneEintrag(null, anker));
$("abbrechen").addEventListener("click", () => $("dlgEintrag").close());

$("absagenBtn").addEventListener("click", async () => {
  const e = meineEintraege.find((x) => x.id === bearbeiteId);
  if (!e || !e.serie) return;
  const liste = Array.isArray(e.serie.ausnahmen) ? [...e.serie.ausnahmen] : [];
  if (!liste.includes(bearbeiteTag)) liste.push(bearbeiteTag);
  try {
    const b = writeBatch(db);
    b.update(doc(db, "eintraege", e.id), { "serie.ausnahmen": liste });
    // set statt update: der Schatten fehlt bei Einträgen aus dem Import
    b.set(doc(db, "belegt", e.id), {
      ownerId: nutzer.uid, typ: e.typ, datum: e.datum,
      start: e.start || "", ende: e.ende || "",
      wiederholung: "serie",
      serie: { ...e.serie, ausnahmen: liste },
      sichtbarFuer: belegtFuerListe()
    }, { merge: true });
    await b.commit();
    $("dlgEintrag").close();
  } catch (err) {
    $("formFehler").textContent = "Fehlgeschlagen: " + (err.code || err.message);
    console.error(err);
  }
});

// Wer darf den Eintrag mit Inhalt sehen
function sichtbarFuerListe(kreisIds) {
  const s = new Set([nutzer.uid]);
  meineKreise.filter((k) => kreisIds.includes(k.id))
             .forEach((k) => (k.mitglieder || []).forEach((u) => s.add(u)));
  return [...s];
}
// Wer darf sehen, dass die Zeit belegt ist: alle aus allen meinen Kreisen
function belegtFuerListe() {
  const s = new Set([nutzer.uid]);
  meineKreise.forEach((k) => (k.mitglieder || []).forEach((u) => s.add(u)));
  return [...s];
}

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

  if (!titel || !datum) { $("formFehler").textContent = "Titel und Datum sind nötig."; return; }
  if (typ === "termin" && !start) { $("formFehler").textContent = "Ein Termin braucht eine Startzeit."; return; }
  if (typ === "termin" && ende && ende <= start) { $("formFehler").textContent = "Das Ende muss nach dem Start liegen."; return; }
  if (typ === "task" && frist && frist < datum) { $("formFehler").textContent = "Die Frist liegt vor dem geplanten Tag."; return; }
  if (wiederholung === "serie") {
    if (!gewaehlteTage.length) { $("formFehler").textContent = "Wähle mindestens einen Wochentag."; return; }
    if (!bis) { $("formFehler").textContent = "Eine Serie braucht ein Enddatum."; return; }
    if (bis < datum) { $("formFehler").textContent = "Das Serienende liegt vor dem ersten Tag."; return; }
  }

  const kreisIds = [...gewaehlteKreise];

  const daten = {
    ownerId: nutzer.uid,
    typ, titel, datum,
    start: start || "",
    ende:  typ === "termin" ? (ende || "") : "",
    frist: typ === "task"   ? (frist || "") : "",
    ort, notiz,
    wiederholung,
    kreisIds,
    sichtbarFuer: sichtbarFuerListe(kreisIds),
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
    const alt = bearbeiteId ? meineEintraege.find((x) => x.id === bearbeiteId) : null;
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
      await setDoc(doc(db, "belegt", ref.id), schatten);
      if (kreisIds.length) meldeGeteilt(titel, kreisIds, ref.id);
    }

    $("dlgEintrag").close();
    if (wiederholung === "einmal" && datum !== anker && ansicht === "tag") {
      anker = datum; zeichne();
    }
  } catch (e) {
    $("formFehler").textContent = "Speichern fehlgeschlagen: " + (e.code || e.message);
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
  b.setAttribute("aria-label", "Farbe " + (i + 1));
  b.addEventListener("click", () => {
    neueFarbe = f;
    [...$("kFarben").children].forEach((x) => x.classList.toggle("an", x === b));
  });
  $("kFarben").appendChild(b);
});

$("kreiseBtn").addEventListener("click", () => { zeigeKreise(); $("dlgKreise").showModal(); });
$("kreiseZu").addEventListener("click", () => $("dlgKreise").close());

function zeigeKreise() {
  const box = $("kreisListe");
  box.innerHTML = "";

  if (!meineKreise.length) {
    box.appendChild(el("div", "hinweis",
      "Du bist noch in keinem Kreis. Leg unten einen an und lade Leute ein."));
    return;
  }

  meineKreise.forEach((k) => {
    const verwalter = (k.verwalter || []).includes(nutzer.uid);
    const ersteller = k.erstellerId === nutzer.uid;

    const karte = el("div", "kreisKarte");
    const kopf = el("div", "kopf");
    const p = el("span", "kreisPunkt");
    p.style.background = k.farbe;
    p.style.width = "14px"; p.style.height = "14px";
    kopf.appendChild(p);
    kopf.appendChild(el("b", null, k.name));

    if (verwalter) {
      const b = el("button", "knopf rand", "Einladen");
      b.type = "button";
      b.style.cssText = "width:auto;padding:7px 14px;font-size:13px";
      b.addEventListener("click", () => {
        einladenKreis = k;
        $("einladenUnter").textContent = "In den Kreis " + k.name;
        $("eMail").value = "";
        $("eVerwalter").checked = false;
        $("einladenFehler").textContent = "";
        $("einladenGut").textContent = "";
        $("dlgEinladen").showModal();
      });
      kopf.appendChild(b);
    }
    karte.appendChild(kopf);

    /* ---- Mitglieder ---- */
    (k.mitglieder || []).forEach((uid) => {
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

      const t = el("div");
      t.style.flexGrow = "1";
      t.appendChild(el("div", null,
        (info.name || "Unbekannt") + (uid === nutzer.uid ? " (du)" : "")));
      if (info.email) t.appendChild(el("div", "mail", info.email));
      z.appendChild(t);

      if ((k.verwalter || []).includes(uid)) {
        z.appendChild(el("span", "rolle", "Verwalter"));
      }

      // Nachricht schreiben
      if (uid !== nutzer.uid) {
        const nb = el("button", "klein", "Nachricht");
        nb.type = "button";
        nb.addEventListener("click", () => oeffneSchreiben(uid, info.name || info.email));
        z.appendChild(nb);
      }

      // Entfernen, nur Verwalter, nicht sich selbst, nicht den Ersteller
      if (verwalter && uid !== nutzer.uid && uid !== k.erstellerId) {
        const wb = el("button", "klein gefahr", "Entfernen");
        wb.type = "button";
        wb.addEventListener("click", async () => {
          if (!confirm(`${info.name || "Diese Person"} aus „${k.name}“ entfernen?`)) return;
          try {
            const info2 = { ...(k.info || {}) };
            delete info2[uid];
            await updateDoc(doc(db, "kreise", k.id), {
              mitglieder: (k.mitglieder || []).filter((u) => u !== uid),
              verwalter:  (k.verwalter  || []).filter((u) => u !== uid),
              info: info2
            });
          } catch (e) {
            alert("Fehlgeschlagen: " + (e.code || e.message));
          }
        });
        z.appendChild(wb);
      }

      karte.appendChild(z);
    });

    /* ---- Offene Einladungen ---- */
    (offeneEinladungen[k.id] || []).forEach((ein) => {
      const z = el("div", "einladung");
      const av = el("div", "avatar", "?");
      z.appendChild(av);
      const t = el("div");
      t.style.flexGrow = "1";
      t.appendChild(el("div", null, ein.email));
      t.appendChild(el("div", "mail",
        "Eingeladen" + (ein.alsVerwalter ? " als Verwalter" : "")));
      z.appendChild(t);
      z.appendChild(el("span", "warte", "wartet"));

      const wb = el("button", "klein gefahr", "Zurückziehen");
      wb.type = "button";
      wb.addEventListener("click", async () => {
        if (!confirm(`Einladung an ${ein.email} zurückziehen?`)) return;
        try {
          await deleteDoc(doc(db, "einladungen", ein.id));
          await ladeOffeneEinladungen();
        } catch (e) {
          alert("Fehlgeschlagen: " + (e.code || e.message));
        }
      });
      z.appendChild(wb);
      karte.appendChild(z);
    });

    /* ---- Kreis verlassen oder löschen ---- */
    const fuss = el("div");
    fuss.style.cssText = "display:flex;gap:8px;margin-top:12px;padding-top:10px;border-top:1px solid var(--linie)";

    if (ersteller) {
      const lb = el("button", "klein gefahr", "Kreis löschen");
      lb.type = "button";
      lb.addEventListener("click", async () => {
        if (!confirm(
          `Den Kreis „${k.name}“ wirklich löschen?\n\n` +
          `Die Termine bleiben erhalten, aber niemand sieht mehr die des anderen. ` +
          `Das lässt sich nicht rückgängig machen.`)) return;
        try {
          // erst die offenen Einladungen weg, dann der Kreis
          for (const ein of (offeneEinladungen[k.id] || [])) {
            await deleteDoc(doc(db, "einladungen", ein.id)).catch(() => {});
          }
          await deleteDoc(doc(db, "kreise", k.id));
        } catch (e) {
          alert("Fehlgeschlagen: " + (e.code || e.message));
        }
      });
      fuss.appendChild(lb);
    } else {
      const vb = el("button", "klein gefahr", "Kreis verlassen");
      vb.type = "button";
      vb.addEventListener("click", async () => {
        if (!confirm(`Den Kreis „${k.name}“ verlassen?`)) return;
        try {
          const info2 = { ...(k.info || {}) };
          delete info2[nutzer.uid];
          await updateDoc(doc(db, "kreise", k.id), {
            mitglieder: (k.mitglieder || []).filter((u) => u !== nutzer.uid),
            verwalter:  (k.verwalter  || []).filter((u) => u !== nutzer.uid),
            info: info2
          });
        } catch (e) {
          alert("Fehlgeschlagen: " + (e.code || e.message));
        }
      });
      fuss.appendChild(vb);
    }
    karte.appendChild(fuss);

    box.appendChild(karte);
  });
}

/* ===================================================================
   NACHRICHTEN
   =================================================================== */

let schreibenAnUid = null;

function oeffneSchreiben(uid, name) {
  schreibenAnUid = uid;
  $("schreibenAn").textContent = "An " + (name || "diese Person");
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
    $("schreibenGut").textContent = "Gesendet.";
    $("sText").value = "";
    setTimeout(() => $("dlgSchreiben").close(), 800);
  } catch (e) {
    $("schreibenFehler").textContent = "Fehlgeschlagen: " + (e.code || e.message);
    console.error(e);
  }
});

/* Wenn ich etwas mit einem Kreis teile, bekommen die anderen Bescheid */
async function meldeGeteilt(titel, kreisIds, eintragId) {
  const empfaenger = new Set();
  meineKreise.filter((k) => kreisIds.includes(k.id))
             .forEach((k) => (k.mitglieder || []).forEach((u) => {
               if (u !== nutzer.uid) empfaenger.add(u);
             }));
  if (!empfaenger.size) return;

  const kreisNamen = meineKreise.filter((k) => kreisIds.includes(k.id))
                                .map((k) => k.name).join(", ");
  try {
    for (const uid of empfaenger) {
      await addDoc(collection(db, "nachrichten"), {
        anUid:   uid,
        vonUid:  nutzer.uid,
        vonName: nutzer.displayName || nutzer.email || "",
        art:     "geteilt",
        text:    titel,
        kreisName: kreisNamen,
        eintragId: eintragId || "",
        gelesen: false,
        erstelltAm: serverTimestamp()
      });
    }
  } catch (e) { console.warn("Hinweis konnte nicht gesendet werden:", e.code); }
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
  if (min < 1) return "gerade eben";
  if (min < 60) return "vor " + min + " Min";
  if (min < 1440) return "vor " + Math.round(min / 60) + " Std";
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
}

function zeigePost() {
  const box = $("postListe");
  box.innerHTML = "";

  if (!nachrichten.length) {
    box.appendChild(el("div", "leer", "Keine Nachrichten."));
    return;
  }

  nachrichten.slice(0, 60).forEach((n) => {
    const k = el("div", "post" + (n.gelesen ? "" : " neu"));

    const kopf = el("div");
    kopf.style.cssText = "display:flex;align-items:baseline;gap:8px";
    kopf.appendChild(el("span", "von", n.vonName || "Jemand"));
    kopf.appendChild(el("span", "wann", wannText(n.erstelltAm)));
    k.appendChild(kopf);

    if (n.art === "geteilt") {
      k.appendChild(el("div", "text",
        `hat „${n.text}“ mit ${n.kreisName || "einem Kreis"} geteilt`));
    } else {
      k.appendChild(el("div", "text", n.text));
    }

    const knoepfe = el("div", "knoepfe");

    if (!n.gelesen) {
      const g = el("button", null, "Gelesen");
      g.type = "button";
      g.addEventListener("click", () =>
        updateDoc(doc(db, "nachrichten", n.id), { gelesen: true }).catch(console.error));
      knoepfe.appendChild(g);
    }

    if (n.art === "nachricht" && alleNutzer[n.vonUid]) {
      const a = el("button", null, "Antworten");
      a.type = "button";
      a.addEventListener("click", () => {
        $("dlgPost").close();
        oeffneSchreiben(n.vonUid, n.vonName);
      });
      knoepfe.appendChild(a);
    }

    const w = el("button", null, "Löschen");
    w.type = "button";
    w.addEventListener("click", () =>
      deleteDoc(doc(db, "nachrichten", n.id)).catch(console.error));
    knoepfe.appendChild(w);

    k.appendChild(knoepfe);
    box.appendChild(k);
  });
}

$("kreisAnlegen").addEventListener("click", async () => {
  $("kreisFehler").textContent = "";
  const name = $("kName").value.trim();
  if (!name) { $("kreisFehler").textContent = "Gib dem Kreis einen Namen."; return; }

  try {
    await addDoc(collection(db, "kreise"), {
      name,
      farbe: neueFarbe,
      erstellerId: nutzer.uid,
      mitglieder: [nutzer.uid],
      verwalter:  [nutzer.uid],
      info: {
        [nutzer.uid]: {
          name: nutzer.displayName || "",
          email: (nutzer.email || "").toLowerCase(),
          photoURL: nutzer.photoURL || ""
        }
      },
      erstelltAm: serverTimestamp()
    });
    $("kName").value = "";
  } catch (e) {
    $("kreisFehler").textContent = "Fehlgeschlagen: " + (e.code || e.message);
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
  if (!mail.includes("@")) { $("einladenFehler").textContent = "Das sieht nicht nach einer E-Mail aus."; return; }
  if (mail === (nutzer.email || "").toLowerCase()) { $("einladenFehler").textContent = "Du bist schon drin."; return; }

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

    $("einladenGut").textContent =
      "Eingeladen. " + mail + " ist im Kreis, sobald sie sich mit dieser Adresse anmeldet.";
    $("eMail").value = "";
  } catch (e) {
    $("einladenFehler").textContent = "Fehlgeschlagen: " + (e.code || e.message);
    console.error(e);
  }
});

/* ===================================================================
   TERMIN FINDEN
   Liest nur den Schattenkalender: Datum und Uhrzeit, keine Titel.
   =================================================================== */

let findenPersonenWahl = [];
let findenDauer = 60;

[30, 60, 90, 120].forEach((m, i) => {
  const b = el("button", i === 1 ? "an" : "", m < 60 ? m + " Min" : (m / 60) + " Std");
  b.type = "button";
  b.addEventListener("click", () => {
    findenDauer = m;
    [...$("fvDauerWahl").children].forEach((x) => x.classList.toggle("an", x === b));
  });
  $("fvDauerWahl").appendChild(b);
});

$("findenBtn").addEventListener("click", () => {
  findenPersonenWahl = [];
  $("findenErgebnis").innerHTML = "";
  $("findenFehler").textContent = "";
  $("fvVon").value = heute();
  $("fvBis").value = plus(heute(), 13);

  const box = $("findenPersonen");
  box.innerHTML = "";
  const andere = [...new Set(meineKreise.flatMap((k) => k.mitglieder || []))]
    .filter((u) => u !== nutzer.uid);

  if (!andere.length) {
    box.appendChild(el("div", "hinweis",
      "Noch niemand in deinen Kreisen. Lege einen Kreis an und lade jemanden ein."));
  }

  andere.forEach((uid) => {
    const info = alleNutzer[uid] || {};
    const b = el("button", "person", info.name || info.email || "Unbekannt");
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
  erg.innerHTML = '<div class="hinweis">Suche …</div>';

  const von = $("fvVon").value, bis = $("fvBis").value;
  const frueh = minuten($("fvFrueh").value), spaet = minuten($("fvSpaet").value);

  if (!von || !bis || bis < von) { $("findenFehler").textContent = "Prüfe den Zeitraum."; erg.innerHTML = ""; return; }
  if (frueh === null || spaet === null || spaet <= frueh) { $("findenFehler").textContent = "Prüfe die Uhrzeiten."; erg.innerHTML = ""; return; }
  if (tageBis(bis, von) > 60) { $("findenFehler").textContent = "Höchstens 60 Tage auf einmal."; erg.innerHTML = ""; return; }

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
    $("findenFehler").textContent = "Konnte belegte Zeiten nicht laden: " + (e.code || e.message);
    erg.innerHTML = "";
    return;
  }

  const luecken = freieFenster(belegt, von, bis, frueh, spaet, findenDauer);

  erg.innerHTML = "";
  if (!luecken.length) {
    erg.appendChild(el("div", "hinweis",
      "Kein gemeinsames Fenster in diesem Zeitraum. Versuch einen längeren " +
      "Zeitraum oder eine kürzere Dauer."));
    return;
  }

  const namen = wer.map((u) => (alleNutzer[u] || {}).name || "?")
                   .map((n) => n.split(" ")[0]).join(", ");
  erg.appendChild(el("div", "hinweis", `Alle frei: ${namen}`));

  luecken.slice(0, 40).forEach((l) => {
    const z = el("div", "luecke");
    const links = el("div");
    links.appendChild(el("b", null, ausMinuten(l.von) + " – " + ausMinuten(l.bis)));
    links.appendChild(el("div", "dauer", kurzDatum(l.tag)));
    z.appendChild(links);
    const dauer = l.bis - l.von;
    z.appendChild(el("span", "marke",
      dauer >= 60 ? Math.floor(dauer / 60) + " Std" + (dauer % 60 ? " " + (dauer % 60) + " Min" : "")
                  : dauer + " Min"));
    const nimm = el("button", "knopf", "Eintragen");
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
    // Alle belegten Zeitfenster dieses Tages einsammeln
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
   KONTO UND DASHBOARD
   =================================================================== */

$("michBtn").addEventListener("click", async () => {
  zeigeMeineZahlen();
  const admin = ADMIN_MAILS.includes((nutzer.email || "").toLowerCase());
  $("adminBlock").classList.toggle("versteckt", !admin);
  if (admin) await ladeDashboard();
  $("dlgMich").showModal();
});
$("michZu").addEventListener("click", () => $("dlgMich").close());

function kachel(zahl, text) {
  const k = el("div", "kachel");
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
  const geteiltVonMir = meins.filter((e) => (e.kreisIds || []).length);

  box.appendChild(kachel(termine.length, "Termine"));
  box.appendChild(kachel(offen.length, "offene Aufgaben"));
  box.appendChild(kachel(spaet.length, "überfällig"));
  box.appendChild(kachel(serien.length, "Serien"));
  box.appendChild(kachel(meineKreise.length, "Kreise"));
  box.appendChild(kachel(geteiltVonMir.length, "geteilt"));
}

async function ladeDashboard() {
  const t = $("adminTabelle");
  t.innerHTML = "<tr><th>Name</th><th>E-Mail</th><th>Zuletzt da</th></tr>";

  try {
    const snap = await getDocs(collection(db, "users"));
    const reihen = snap.docs.map((d) => ({ uid: d.id, ...d.data() }))
      .sort((a, b) => (b.zuletzt?.seconds || 0) - (a.zuletzt?.seconds || 0));

    const jetzt = Date.now();
    let aktiv7 = 0;
    reihen.forEach((u) => {
      const tr = el("tr");
      tr.appendChild(el("td", null, u.name || "—"));
      tr.appendChild(el("td", "n", u.email || "—"));
      let z = "—";
      if (u.zuletzt?.seconds) {
        const d = new Date(u.zuletzt.seconds * 1000);
        if (jetzt - d.getTime() < 7 * 86400000) aktiv7++;
        z = d.toLocaleDateString("de-DE",
              { day: "2-digit", month: "2-digit", year: "2-digit" });
      }
      tr.appendChild(el("td", "n", z));
      t.appendChild(tr);
    });

    // Zahlen oben
    const zb = $("adminZahlen");
    zb.innerHTML = "";
    zb.appendChild(kachel(reihen.length, "Personen"));
    zb.appendChild(kachel(aktiv7, "aktiv, 7 Tage"));

    // Kreise, die ich sehen darf
    const kb = $("adminKreise");
    kb.innerHTML = "";
    if (!meineKreise.length) {
      kb.appendChild(el("div", "hinweis", "Noch keine Kreise."));
    } else {
      zb.appendChild(kachel(meineKreise.length, "Kreise"));
      meineKreise.forEach((k) => {
        const z = el("div", "mitglied");
        z.style.borderTop = "none";
        const p = el("span", "kreisPunkt");
        p.style.background = k.farbe;
        p.style.width = "12px"; p.style.height = "12px";
        z.appendChild(p);
        const t2 = el("div");
        t2.style.flexGrow = "1";
        t2.appendChild(el("div", null, k.name));
        const namen = (k.mitglieder || [])
          .map((u) => ((k.info || {})[u] || {}).name || "?")
          .map((n) => n.split(" ")[0]).join(", ");
        t2.appendChild(el("div", "mail", namen));
        z.appendChild(t2);
        const warte = (offeneEinladungen[k.id] || []).length;
        if (warte) z.appendChild(el("span", "rolle", warte + " offen"));
        kb.appendChild(z);
      });
    }

    $("adminHinweis").textContent =
      "Das Dashboard sieht nur, wer in ADMIN_MAILS oben in app.js steht. " +
      "Termine anderer stehen hier bewusst nicht, dafür bräuchte es Zugriff " +
      "auf fremde Einträge.";
  } catch (e) {
    $("adminHinweis").textContent = "Konnte nicht laden: " + (e.code || e.message);
    console.error(e);
  }
}

/* ===================================================================
   PWA
   =================================================================== */

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch((e) => console.log("SW:", e));
  });
}
