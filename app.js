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
  getDoc, getDocs, query, where, orderBy, onSnapshot, serverTimestamp,
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
let anker      = heute();       // Tag, Woche oder Monat, je nach Ansicht
let gewaehlt   = heute();       // im Monat angeklickter Tag

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
  [stopEigene, stopGeteilte, stopKreise].forEach((f) => { if (f) f(); });
  stopEigene = stopGeteilte = stopKreise = null;
  eigene = []; geteilte = []; meineEintraege = []; nachgeruestet = false;

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
    },
    (e) => console.error("Kreise:", e)
  );
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

  const fehler = (e) => {
    console.error("Eintraege:", e);
    $("buehne").innerHTML =
      '<div class="leer"><div class="gross">!</div>' +
      'Konnte nicht laden. Drücke F12 und schau in die Konsole – ' +
      'dort steht meist ein Link zum Anlegen eines Index.</div>';
  };

  stopEigene = onSnapshot(
    query(collection(db, "eintraege"), where("ownerId", "==", nutzer.uid)),
    (snap) => {
      eigene = snap.docs.map((x) => ({ id: x.id, ...x.data() }));
      zusammenfuehren();
      nachruestenFallsNoetig();
    },
    fehler
  );

  stopGeteilte = onSnapshot(
    query(collection(db, "eintraege"),
          where("sichtbarFuer", "array-contains", nutzer.uid)),
    (snap) => {
      geteilte = snap.docs.map((x) => ({ id: x.id, ...x.data() }))
                          .filter((e) => e.ownerId !== nutzer.uid);
      zusammenfuehren();
    },
    fehler
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
  zeichne();
});

function schiebe(richtung) {
  if (ansicht === "tag")        anker = plus(anker, richtung);
  else if (ansicht === "woche") anker = plus(anker, richtung * 7);
  else if (ansicht === "monat") {
    const d = ausText(anker);
    d.setDate(1); d.setMonth(d.getMonth() + richtung);
    anker = alsText(d);
  } else if (ansicht === "liste") anker = plus(anker, richtung * 30);
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

  $("zeitleiste").classList.remove("versteckt");
  const b = $("buehne");
  b.innerHTML = "";

  if (ansicht === "tag")        { kopfTag();   maleTag(b, anker); }
  else if (ansicht === "woche") { kopfWoche(); maleWoche(b); }
  else if (ansicht === "monat") { kopfMonat(); maleMonat(b); }
  else                          { kopfListe(); maleListe(b); }
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
  return meineEintraege.filter((e) => laeuftAnTag(e, tag));
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
  const offen = meineEintraege.filter((e) =>
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
    const karte = el("div", "kreisKarte");
    const kopf = el("div", "kopf");
    const p = el("span", "kreisPunkt");
    p.style.background = k.farbe;
    p.style.width = "14px"; p.style.height = "14px";
    kopf.appendChild(p);
    kopf.appendChild(el("b", null, k.name));

    const verwalter = (k.verwalter || []).includes(nutzer.uid);
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
      t.appendChild(el("div", null, (info.name || "Unbekannt") + (uid === nutzer.uid ? " (du)" : "")));
      if (info.email) t.appendChild(el("div", "mail", info.email));
      z.appendChild(t);
      if ((k.verwalter || []).includes(uid)) z.appendChild(el("span", "rolle", "Verwalter"));
      karte.appendChild(z);
    });

    box.appendChild(karte);
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
  const admin = ADMIN_MAILS.includes((nutzer.email || "").toLowerCase());
  $("adminBlock").classList.toggle("versteckt", !admin);
  if (admin) await ladeDashboard();
  $("dlgMich").showModal();
});
$("michZu").addEventListener("click", () => $("dlgMich").close());

async function ladeDashboard() {
  const t = $("adminTabelle");
  t.innerHTML = "<tr><th>Name</th><th>E-Mail</th><th>Zuletzt da</th></tr>";
  try {
    const snap = await getDocs(collection(db, "users"));
    const reihen = snap.docs.map((d) => d.data())
      .sort((a, b) => (b.zuletzt?.seconds || 0) - (a.zuletzt?.seconds || 0));

    reihen.forEach((u) => {
      const tr = el("tr");
      tr.appendChild(el("td", null, u.name || "—"));
      tr.appendChild(el("td", "n", u.email || "—"));
      const z = u.zuletzt?.seconds
        ? new Date(u.zuletzt.seconds * 1000).toLocaleDateString("de-DE",
            { day: "2-digit", month: "2-digit", year: "2-digit" })
        : "—";
      tr.appendChild(el("td", "n", z));
      t.appendChild(tr);
    });
    $("adminZahl").textContent = reihen.length + " Personen nutzen Sawa.";
  } catch (e) {
    $("adminZahl").textContent = "Konnte nicht laden: " + (e.code || e.message);
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
