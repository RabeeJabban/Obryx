/* ===================================================================
   ORBYX
   organize your chaos

   Die Texte stehen in i18n.js, das Aussehen in index.html,
   die Logik hier.

   Zwei Dinge musst du unten anpassen:
     1. firebaseConfig  – aus der Firebase Console
     2. BETREIBER       – die E-Mail-Adressen, die "Betrieb" sehen.
        Dieselbe Liste muss in firestore.rules stehen.
   =================================================================== */

const firebaseConfig = {
  apiKey: "AIzaSyAFCT65NaUVuu1YYBkKZM693zX_fKM7-Io",
  authDomain: "sawa-82a09.firebaseapp.com",
  projectId: "sawa-82a09",
  storageBucket: "sawa-82a09.firebasestorage.app",
  messagingSenderId: "200029883618",
  appId: "1:200029883618:web:18059e0fa3127bf62f62bb"
};

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

// Dieselben zehn Farben wie in index.html, damit der gespeicherte Wert
// und die Anzeige zusammenpassen.
const FARBEN = ["#1874FF","#10C862","#FF9100","#F5123A","#8B5CF6",
                "#06B6D4","#E8B923","#EC4899","#64748B","#84CC16"];

const TAG_VON_STD = 7;     // wann der Plan beginnt, wenn nichts anderes gilt
const TAG_BIS_STD = 23;

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
   Ein Durchlauf über alle Elemente mit data-i18n schaltet die ganze
   Oberfläche um. Neue Texte brauchen nur das Attribut.
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
  baueFilter();
  baueTageWahl();
  baueZeitTage();
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
        if (nutzer) updateDoc(doc(db, "users", nutzer.uid), { sprache: code }).catch(() => {});
      });
      box.appendChild(b);
    });
  });
}

function baueFilter() {
  const box = $("filter");
  box.innerHTML = "";
  [["alles","fAlles"], ["termin","fTermine"], ["task","fAufgaben"]].forEach(([wert, schl]) => {
    const b = el("button", filter === wert ? "an" : "", t(schl));
    b.type = "button"; b.dataset.f = wert;
    box.appendChild(b);
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
function wochentag(text) { return (ausText(text).getDay() + 6) % 7; }
function heute() { return alsText(new Date()); }
function montagVon(text) { return plus(text, -wochentag(text)); }

/* Zahlen bekommen eine unsichtbare Klammer. Ohne die stünde "27.9."
   im arabischen Satz als ".27.9" da. */
function zahl(s) { return "⁦" + s + "⁩"; }

function kurzDatum(text) {
  const d = ausText(text);
  return t("datKurz", { wt: liste("kurzTage")[wochentag(text)],
                        tag: zahl(String(d.getDate())),
                        monat: zahl(String(d.getMonth() + 1)) });
}
function langDatum(text) {
  const d = ausText(text);
  return t("datLang", { wt: liste("wochentage")[wochentag(text)],
                        tag: zahl(String(d.getDate())),
                        monat: liste("monate")[d.getMonth()] });
}
function tagTitel(text) {
  const d = ausText(text);
  return t("datLang", { wt: liste("kurzTage")[wochentag(text)],
                        tag: zahl(String(d.getDate())),
                        monat: liste("monate")[d.getMonth()] });
}

function minuten(uhr) {
  if (!uhr) return null;
  const [h, m] = uhr.split(":").map(Number);
  return h * 60 + m;
}
function ausMinuten(min) {
  const h = Math.floor(min / 60), m = Math.round(min % 60);
  return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
}
function jetztMinuten() {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
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

/* Namen der Feste in anderen Sprachen. Eine neue Sprache braucht hier
   nur einen weiteren Block, sonst bleibt der deutsche Name stehen. */
const FESTE = {
  ar: {
    "Neujahr": "رأس السنة", "Karfreitag": "الجمعة العظيمة",
    "Ostermontag": "اثنين الفصح", "Tag der Arbeit": "عيد العمال",
    "Christi Himmelfahrt": "خميس الصعود", "Pfingstmontag": "اثنين العنصرة",
    "Fronleichnam": "عيد الجسد", "Tag der Deutschen Einheit": "يوم الوحدة الألمانية",
    "Allerheiligen": "عيد جميع القديسين", "1. Weihnachtstag": "عيد الميلاد",
    "2. Weihnachtstag": "ثاني أيام الميلاد", "Sommerferien": "العطلة الصيفية",
    "Herbstferien": "عطلة الخريف", "Weihnachtsferien": "عطلة الميلاد",
    "Osterferien": "عطلة الفصح", "Pfingstferien": "عطلة العنصرة"
  }
};
function festName(deutsch) {
  if (!deutsch) return deutsch;
  const tab = FESTE[holeSprache()];
  return (tab && tab[deutsch]) || deutsch;
}
function feiertagName(tag) {
  const roh = feiertageNRW(Number(tag.slice(0, 4)))[tag];
  return roh ? festName(roh) : null;
}
function istFeiertag(tag) { return !!feiertageNRW(Number(tag.slice(0, 4)))[tag]; }

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
function ferienName(tag) { const r = ferienRoh(tag); return r ? festName(r) : null; }

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
function laeuftAnTag(e, tag) { return istSerie(e) ? serieAnTag(e, tag) : e.datum === tag; }
function erledigtAm(e, tag) {
  return istSerie(e)
    ? (Array.isArray(e.erledigtAn) && e.erledigtAn.includes(tag))
    : e.status === "erledigt";
}

/* Von wann bis wann belegt ein Eintrag den Tag. Ohne Endzeit gilt die
   Dauer der Terminart, sonst eine Stunde. */
function zeitraum(e) {
  const von = minuten(e.start);
  if (von === null) return null;
  let bis = minuten(e.ende);
  if (bis === null || bis <= von) bis = von + (Number(e.dauer) > 0 ? Number(e.dauer) : 60);
  return { von, bis: Math.min(bis, 24 * 60) };
}

/* ===================================================================
   ZUSTAND
   =================================================================== */

let nutzer  = null;
let profil  = {};
let ansicht = "tag";
let filter  = "alles";
let anker   = heute();
let gewaehlt = heute();
let planKreis = "";            // welcher Kreis im Tagesplan gezeigt wird

let meineEintraege = [];
let meineKreise    = [];
let alleNutzer     = {};       // uid -> {name, email, photoURL}
let belegtFremd    = [];       // belegte Zeiten anderer, ohne Titel
let slots          = [];       // vergebene Zeitfenster in exklusiven Kreisen
let nachrichten    = [];
let offeneEinladungen = {};

let eigene = [], geteilte = [];
let stopEigene = null, stopGeteilte = null, stopKreise = null;
let stopPost = null, stopBelegt = null, stopSlots = null;

let bearbeiteId = null, bearbeiteTag = null;
let typ = "termin", wiederholung = "einmal";
let gewaehlteTage = [], gewaehlteKreise = [], gewaehltePersonen = [];
let neueFarbe = FARBEN[0], neueArt = "kreis", neueBelegung = "parallel";
let einladenKreis = null, einstKreis = null;
let einstArten = [], einstZeiten = [], einstBelegung = "parallel", einstTage = [];
let schreibenAnUid = null;
let sucheAn = false;
let nachgeruestet = false;
let vorgabeDauer = 0;          // Dauer aus der gewählten Terminart

/* ===================================================================
   KREISE: WER SIEHT WEN
   ------------------------------------------------------------------
   Kreis  – alle sehen die belegten Zeiten aller. Familie, Team.
   Stern  – nur der Verwalter sieht alle. Die Mitglieder sehen nur ihn,
            nicht einander. Fahrschüler, Kunden, Fahrer.
   =================================================================== */

function istStern(k) { return (k.art || "kreis") === "stern"; }
function istExklusiv(k) { return (k.belegung || "parallel") === "exklusiv"; }
function binVerwalter(k) { return (k.verwalter || []).includes(nutzer.uid); }

/* Wer darf durch diesen Kreis sehen, dass ICH belegt bin */
function siehtMichDurch(k) {
  const m = k.mitglieder || [];
  if (!istStern(k)) return m;
  return binVerwalter(k) ? m : (k.verwalter || []);
}
/* Wen darf ich durch diesen Kreis sehen */
function icheSeheDurch(k) {
  const m = k.mitglieder || [];
  if (!istStern(k)) return m;
  return binVerwalter(k) ? m : (k.verwalter || []);
}
function sichtbarePersonen() {
  const s = new Set();
  meineKreise.forEach((k) => icheSeheDurch(k).forEach((u) => s.add(u)));
  s.delete(nutzer.uid);
  return [...s];
}
function sichtbarFuerListe(kreisIds, personen) {
  const s = new Set([nutzer.uid]);
  meineKreise.filter((k) => kreisIds.includes(k.id))
             .forEach((k) => siehtMichDurch(k).forEach((u) => s.add(u)));
  (personen || []).forEach((u) => s.add(u));
  return [...s];
}
function belegtFuerListe() {
  const s = new Set([nutzer.uid]);
  meineKreise.forEach((k) => siehtMichDurch(k).forEach((u) => s.add(u)));
  return [...s];
}
function kreisVon(id) { return meineKreise.find((k) => k.id === id) || null; }

/* ===================================================================
   ARBEITSZEITEN EINES KREISES
   zeiten: [{tage:[0..6], von:"17:00", bis:"22:00"}]
   =================================================================== */

function zeitenAnTag(k, tag) {
  if (!k || !Array.isArray(k.zeiten)) return [];
  const wt = wochentag(tag);
  return k.zeiten.filter((z) => Array.isArray(z.tage) && z.tage.includes(wt))
                 .map((z) => ({ von: minuten(z.von), bis: minuten(z.bis) }))
                 .filter((z) => z.von !== null && z.bis !== null && z.bis > z.von)
                 .sort((a, b) => a.von - b.von);
}

/* Die Zeitfenster eines exklusiven Kreises an einem Tag */
function raster(k, tag) {
  const dauer = (k.arten && k.arten[0] && Number(k.arten[0].dauer)) || 60;
  const raus = [];
  zeitenAnTag(k, tag).forEach((z) => {
    for (let a = z.von; a + dauer <= z.bis; a += dauer) {
      raus.push({ von: a, bis: a + dauer });
    }
  });
  return raus;
}
function slotKennung(kreisId, tag, von) {
  return `${kreisId}_${tag}_${ausMinuten(von)}`;
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
  [stopEigene, stopGeteilte, stopKreise, stopPost, stopBelegt, stopSlots]
    .forEach((f) => { if (f) f(); });
  stopEigene = stopGeteilte = stopKreise = stopPost = stopBelegt = stopSlots = null;
  eigene = []; geteilte = []; meineEintraege = []; nachrichten = [];
  belegtFremd = []; slots = []; nachgeruestet = false;

  if (!user) {
    nutzer = null; profil = {};
    $("loginView").classList.remove("versteckt");
    $("appView").classList.add("versteckt");
    return;
  }

  nutzer = user;

  profil = await ladeProfil();
  if (profil.aktiv === false) {
    await signOut(auth);
    $("loginFehler").textContent = t("gesperrt");
    return;
  }

  if (profil.sprache && profil.sprache !== holeSprache()) wendeSpracheAn(profil.sprache);

  zeigeAvatar();
  $("michName").textContent = profil.name || user.displayName || t("koTitel");
  $("michMail").textContent = user.email || "";
  $("betriebBtn").classList.toggle("versteckt", !istBetreiber());

  $("loginView").classList.add("versteckt");
  $("appView").classList.remove("versteckt");

  await profilSichern();
  if (!profil.name) { fragNachName(); return; }   // erst der Name, dann der Rest
  starteAlles();
});

function starteAlles() {
  einladungenAnnehmen().then(() => {
    starteKreise();
    starteEintraege();
    starteBelegt();
    startePost();
    zeichne();
  });
}

function istBetreiber() { return BETREIBER.includes((nutzer?.email || "").toLowerCase()); }
function darfKreiseAnlegen() { return profil.darfKreiseAnlegen !== false; }
function meinName() { return profil.name || nutzer.displayName || nutzer.email || "?"; }

function zeigeAvatar() {
  const bild = $("photo");
  if (nutzer.photoURL) {
    bild.src = nutzer.photoURL;
    bild.classList.remove("versteckt");
    $("michBtn").dataset.kuerzel = "";
  } else {
    bild.removeAttribute("src");
    bild.classList.add("versteckt");
    $("michBtn").dataset.kuerzel = meinName().trim().slice(0, 1).toUpperCase();
  }
}

async function ladeProfil() {
  try {
    const d = await getDoc(doc(db, "users", nutzer.uid));
    return d.exists() ? d.data() : {};
  } catch (e) { console.warn("Profil lesen:", e.code); return {}; }
}

/* Das öffentliche Profil enthält KEINE E-Mail. Die steht getrennt,
   damit andere Mitglieder sie nicht auslesen können. */
async function profilSichern() {
  try {
    await setDoc(doc(db, "users", nutzer.uid), {
      name:     profil.name || "",
      photoURL: nutzer.photoURL || "",
      sprache:  holeSprache(),
      zuletzt:  serverTimestamp()
    }, { merge: true });
    await setDoc(doc(db, "users_privat", nutzer.uid), {
      email: (nutzer.email || "").toLowerCase()
    }, { merge: true }).catch(() => {});
  } catch (e) { console.error("Profil:", e); }
}

function meinSteckbrief() {
  return { name: meinName(), photoURL: nutzer.photoURL || "" };
}

/* ---------- Name beim ersten Mal ---------- */

function fragNachName(nachtraeglich) {
  $("nName").value = profil.name || nutzer.displayName || "";
  $("nameFehler").textContent = "";
  $("dlgName").dataset.spaeter = nachtraeglich ? "1" : "";
  $("dlgName").showModal();
}

$("formName").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const name = $("nName").value.trim();
  if (!name) { $("nameFehler").textContent = t("nmFehlt"); return; }
  try {
    await setDoc(doc(db, "users", nutzer.uid), { name }, { merge: true });
    profil.name = name;
    $("michName").textContent = name;
    zeigeAvatar();
    $("dlgName").close();
    if ($("dlgName").dataset.spaeter) {
      await namenInKreisenNachziehen();
      zeichne();
    } else {
      starteAlles();
    }
  } catch (e) {
    $("nameFehler").textContent = t("eSpeichern", { code: e.code || e.message });
  }
});
$("nameBtn").addEventListener("click", () => { $("dlgMich").close(); fragNachName(true); });

/* Ändert jemand seinen Namen, muss er in den Kreisen mitgeändert werden */
async function namenInKreisenNachziehen() {
  for (const k of meineKreise) {
    try {
      if ((k.info || {})[nutzer.uid]) {
        await updateDoc(doc(db, "kreise", k.id),
          { [`info.${nutzer.uid}.name`]: meinName() });
      }
      await setDoc(doc(db, "kreisinfo", k.id + "_" + nutzer.uid),
        { kreisId: k.id, uid: nutzer.uid, name: meinName(),
          email: (nutzer.email || "").toLowerCase() }, { merge: true });
    } catch (e) { console.warn("Name in Kreis", k.id, e.code); }
  }
}

/* ===================================================================
   EINLADUNGEN
   =================================================================== */

async function einladungenAnnehmen() {
  const mail = (nutzer.email || "").toLowerCase();
  if (!mail) return;

  try {
    const snap = await getDocs(
      query(collection(db, "einladungen"), where("email", "==", mail)));

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
          if (alsVerwalter) neu.verwalter = [...(daten.verwalter || []), nutzer.uid];

          // Im Sternkreis steht der Name eines einfachen Mitglieds NICHT
          // im Kreis-Dokument, sonst könnten sich die Mitglieder
          // gegenseitig auslesen.
          const sternMitglied = (daten.art || "kreis") === "stern" && !alsVerwalter;
          if (!sternMitglied) {
            const info = { ...(daten.info || {}) };
            info[nutzer.uid] = meinSteckbrief();
            neu.info = info;
          }
          await updateDoc(kref, neu);

          // Der Verwalter braucht Name und E-Mail seiner Mitglieder.
          // Die stehen getrennt und sind nur für ihn lesbar.
          await setDoc(doc(db, "kreisinfo", ein.kreisId + "_" + nutzer.uid), {
            kreisId: ein.kreisId, uid: nutzer.uid,
            name: meinName(), email: mail
          }).catch((e) => console.warn("kreisinfo:", e.code));
        }
        await deleteDoc(d.ref);
      } catch (e) { console.error("Einladung", d.id, e); }
    }
  } catch (e) { console.error("Einladungen:", e); }
}

/* ===================================================================
   DATEN LADEN
   =================================================================== */

function starteKreise() {
  stopKreise = onSnapshot(
    query(collection(db, "kreise"), where("mitglieder", "array-contains", nutzer.uid)),
    async (snap) => {
      meineKreise = snap.docs.map((x) => ({ id: x.id, ...x.data() }))
                             .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      alleNutzer = {};
      meineKreise.forEach((k) => Object.assign(alleNutzer, k.info || {}));
      alleNutzer[nutzer.uid] = meinSteckbrief();

      if (planKreis && !kreisVon(planKreis)) planKreis = "";
      zeichne();
      starteSlots();
      await ladeKreisinfo();
      ladeOffeneEinladungen();
      sichtbarkeitNachziehen();
    },
    (e) => console.error("Kreise:", e)
  );
}

/* Namen und E-Mails der Mitglieder. Lesen darf sie nur der Verwalter
   des jeweiligen Kreises, und jeder seine eigene. */
async function ladeKreisinfo() {
  let neu = false;
  for (const k of meineKreise) {
    if (!binVerwalter(k)) continue;
    try {
      const snap = await getDocs(
        query(collection(db, "kreisinfo"), where("kreisId", "==", k.id)));
      snap.docs.forEach((d) => {
        const x = d.data();
        if (!x.uid) return;
        const alt = alleNutzer[x.uid] || {};
        alleNutzer[x.uid] = { ...alt, name: x.name || alt.name, email: x.email };
        neu = true;
      });
    } catch (e) { console.warn("kreisinfo", k.id, e.code); }
  }
  if (neu) { zeichne(); if ($("dlgKreise").open) zeigeKreise(); }
}

async function ladeOffeneEinladungen() {
  offeneEinladungen = {};
  for (const k of meineKreise) {
    if (!binVerwalter(k)) continue;
    try {
      const snap = await getDocs(
        query(collection(db, "einladungen"), where("kreisId", "==", k.id)));
      offeneEinladungen[k.id] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (e) { console.warn("Einladungen", k.id, e.code); }
  }
  if ($("dlgKreise").open) zeigeKreise();
}

/* Kommt jemand neu in einen Kreis, sieht er alte Einträge nicht, weil
   in sichtbarFuer sein Name fehlt. Ändert sich die Besetzung, werden
   die eigenen Einträge deshalb einmal nachgezogen. */
async function sichtbarkeitNachziehen() {
  if (!eigene.length) return;
  const stand = meineKreise
    .map((k) => k.id + ":" + (k.art || "kreis") + ":" + [...(k.mitglieder || [])].sort().join(","))
    .sort().join("|");
  if (gemerkt("besetzung") === stand) return;

  const bl = belegtFuerListe();
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
      b.set(doc(db, "belegt", e.id), { sichtbarFuer: bl }, { merge: true });
      zahl++;
      if (zahl >= 400) { await b.commit(); b = writeBatch(db); zahl = 0; }
    }
    if (zahl) await b.commit();
    merke("besetzung", stand);
  } catch (e) { console.warn("Sichtbarkeit:", e.code); }
}

/* ---------- Belegte Zeiten anderer ---------- */

function starteBelegt() {
  stopBelegt = onSnapshot(
    query(collection(db, "belegt"), where("sichtbarFuer", "array-contains", nutzer.uid)),
    (snap) => {
      belegtFremd = snap.docs.map((x) => ({ id: x.id, ...x.data() }))
                             .filter((x) => x.ownerId !== nutzer.uid);
      zeichne();
    },
    (e) => { console.warn("Belegt:", e.code); belegtFremd = []; }
  );
}

/* ---------- Vergebene Zeitfenster ---------- */

function starteSlots() {
  if (stopSlots) { stopSlots(); stopSlots = null; }
  const ids = meineKreise.filter(istExklusiv).map((k) => k.id).slice(0, 10);
  if (!ids.length) { slots = []; return; }
  stopSlots = onSnapshot(
    query(collection(db, "slots"), where("kreisId", "in", ids)),
    (snap) => { slots = snap.docs.map((x) => ({ id: x.id, ...x.data() })); zeichne(); },
    (e) => { console.warn("Slots:", e.code); slots = []; }
  );
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
   Zwei Abfragen mit getrennten Fehlerwegen, damit ein Fehler in der
   zweiten nicht die ganze App leert.                                  */

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
    query(collection(db, "eintraege"), where("sichtbarFuer", "array-contains", nutzer.uid)),
    (snap) => {
      geteilte = snap.docs.map((x) => ({ id: x.id, ...x.data() }))
                          .filter((e) => e.ownerId !== nutzer.uid);
      zusammenfuehren();
      zuweisungenSpiegeln();
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
            { kreisIds: e.kreisIds || [], sichtbarFuer: [nutzer.uid] }, { merge: true });
      b.set(doc(db, "belegt", e.id), {
        ownerId: nutzer.uid, typ: e.typ, datum: e.datum,
        start: e.start || "", ende: e.ende || "",
        wiederholung: e.wiederholung || "einmal",
        ...(e.serie ? { serie: e.serie } : {}),
        sichtbarFuer: belegtFuerListe()
      }, { merge: true });
      await b.commit();
    }
  } catch (err) { console.error("Nachrüsten:", err); nachgeruestet = false; }
}

/* Ein zugewiesener Termin soll die Zeit des Zugewiesenen wirklich
   blockieren. In fremde Kalender darf niemand schreiben, deshalb
   trägt sich die App des Zugewiesenen den Block selbst ein.
   Sagt er ab, verschwindet er wieder. */
async function zuweisungenSpiegeln() {
  const meins = geteilte.filter((e) => (e.zugewiesen || []).includes(nutzer.uid));
  const bl = belegtFuerListe();
  for (const e of meins) {
    const id = e.id + "__" + nutzer.uid;
    const abgesagt = (e.zusagen || {})[nutzer.uid] === "nein";
    try {
      if (abgesagt) {
        await deleteDoc(doc(db, "belegt", id)).catch(() => {});
      } else if (e.typ === "termin" && e.start) {
        await setDoc(doc(db, "belegt", id), {
          ownerId: nutzer.uid, typ: "termin", datum: e.datum,
          start: e.start, ende: e.ende || "", dauer: e.dauer || 0,
          wiederholung: e.wiederholung || "einmal",
          ...(e.serie ? { serie: e.serie } : {}),
          vonEintrag: e.id, sichtbarFuer: bl
        }, { merge: true });
      }
    } catch (err) { console.warn("Zuweisung spiegeln:", err.code); }
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
  const a = gemerkt("ansicht"), f = gemerkt("filter");
  if (a && [...$("nav").children].some((x) => x.dataset.v === a)) {
    ansicht = a;
    [...$("nav").children].forEach((x) => x.classList.toggle("an", x.dataset.v === a));
  }
  if (f && ["alles","termin","task"].includes(f)) filter = f;
})();

function schiebe(richtung) {
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
$("heuteBtn").addEventListener("click", () => { anker = heute(); gewaehlt = heute(); zeichne(); });

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

  if (ansicht === "tag")           { kopfTag();   maleTag(b); }
  else if (ansicht === "woche")    { kopfWoche(); maleWoche(b); }
  else if (ansicht === "monat")    { kopfMonat(); maleMonat(b); }
  else if (ansicht === "aufgaben") { maleAufgaben(b); }
  else                             { kopfListe(); maleListe(b); }
}

function passtZumFilter(e) { return filter === "alles" || e.typ === filter; }
function marke(text, frei) { return el("span", "tagMarke" + (frei ? " frei" : ""), text); }

function kopfTag() {
  $("zeitTitel").textContent = tagTitel(anker);
  const u = $("zeitUnter");
  u.innerHTML = "";
  if (anker === heute())    u.appendChild(marke(t("heute")));
  else if (anker < heute()) u.appendChild(marke(t("vergangen")));
  const f = feiertagName(anker), s = ferienName(anker);
  if (f) u.appendChild(marke(f, true));
  if (s) u.appendChild(marke(s, true));
}
function kopfWoche() {
  const mo = montagVon(anker), so = plus(mo, 6);
  const a = ausText(mo), z = ausText(so), M = liste("monate");
  $("zeitTitel").innerHTML = "";
  $("zeitTitel").appendChild(el("span", "ltr",
    `${a.getDate()}. ${M[a.getMonth()].slice(0,3)} – ${z.getDate()}. ${M[z.getMonth()].slice(0,3)}`));
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

/* ---------- Auswahl ---------- */

function anTag(tag, uid) {
  return meineEintraege.filter((e) =>
    laeuftAnTag(e, tag) && passtZumFilter(e) &&
    (uid === undefined || e.ownerId === uid ||
     (e.zugewiesen || []).includes(uid)));
}
function sortiert(l) {
  return [...l].sort((a, b) => (a.start || "99").localeCompare(b.start || "99"));
}
function trenner(text, warn) { return el("div", "trenner" + (warn ? " warn" : ""), text); }
function leerKasten(zeichen, text) {
  const d = el("div", "leer");
  d.appendChild(el("div", "gross", zeichen));
  d.appendChild(document.createTextNode(text));
  return d;
}
function farbeVon(e) {
  const k = meineKreise.find((k) => (e.kreisIds || []).includes(k.id));
  return k ? k.farbe : null;
}
function vorname(uid) {
  const w = alleNutzer[uid];
  if (!w) return t("nJemand");
  return (w.name || w.email || "?").split(" ")[0];
}

/* ===================================================================
   BALKENPLAN
   Die gemeinsame Maschinerie für Tag und Woche.
   =================================================================== */

function stundeHoehe() {
  const v = getComputedStyle(document.documentElement).getPropertyValue("--stunde");
  const n = parseFloat(v);
  return n > 0 ? n : 54;
}

/* Überlappende Balken nebeneinander legen */
function verteile(stuecke) {
  const s = [...stuecke].sort((a, b) => a.von - b.von || b.bis - a.bis);
  const gruppen = [];
  let aktuell = [], ende = -1;
  s.forEach((x) => {
    if (aktuell.length && x.von >= ende) { gruppen.push(aktuell); aktuell = []; ende = -1; }
    aktuell.push(x); ende = Math.max(ende, x.bis);
  });
  if (aktuell.length) gruppen.push(aktuell);

  gruppen.forEach((g) => {
    const enden = [];
    g.forEach((x) => {
      let i = 0;
      while (enden[i] !== undefined && enden[i] > x.von) i++;
      enden[i] = x.bis;
      x.spur = i;
    });
    const n = enden.length;
    g.forEach((x) => { x.anteil = 100 / n; x.versatz = x.spur * (100 / n); });
  });
  return s;
}

/* Gerüst: Stundenraster mit Spalten */
function planGeruest(box, spaltenKoepfe, vonStd, bisStd, eng) {
  const H = stundeHoehe();
  const hoehe = (bisStd - vonStd) * H;

  const rolle = el("div", "planRolle");
  const plan  = el("div", "plan");

  const kopf = el("div", "planKopf");
  kopf.appendChild(el("div", "planEcke"));
  const namen = el("div", "planNamen" + (eng ? " eng" : ""));
  spaltenKoepfe.forEach((k) => namen.appendChild(k));
  kopf.appendChild(namen);
  plan.appendChild(kopf);

  const koerper = el("div", "planKoerper");
  const zeit = el("div", "planZeit");
  for (let h = vonStd; h < bisStd; h++) {
    zeit.appendChild(el("div", "ltr", String(h).padStart(2, "0") + ":00"));
  }
  koerper.appendChild(zeit);

  const feld = el("div", "planFeld");
  feld.style.height = hoehe + "px";

  const linien = el("div", "planLinien");
  for (let h = vonStd; h <= bisStd; h++) {
    const i = el("i");
    i.style.top = ((h - vonStd) * H) + "px";
    linien.appendChild(i);
    if (h < bisStd) {
      const j = el("i", "halb");
      j.style.top = ((h - vonStd) * H + H / 2) + "px";
      linien.appendChild(j);
    }
  }
  feld.appendChild(linien);

  const spalten = el("div", "planSpalten" + (eng ? " eng" : ""));
  spalten.style.height = hoehe + "px";
  spaltenKoepfe.forEach(() => {
    const s = el("div", "planSpalte");
    s.style.height = hoehe + "px";
    spalten.appendChild(s);
  });
  feld.appendChild(spalten);

  koerper.appendChild(feld);
  plan.appendChild(koerper);
  rolle.appendChild(plan);
  box.appendChild(rolle);

  return { spalten: [...spalten.children], feld, vonStd, H, hoehe, rolle };
}

/* Beim Öffnen dorthin rollen, wo etwas los ist: zur jetzigen Uhrzeit,
   sonst zum ersten Balken. Sonst starrt man auf leere Vormittage. */
function rolleZu(g, minute) {
  if (!g.rolle || minute === null || minute === undefined) return;
  const ziel = (minute - g.vonStd * 60) * g.H / 60 - 60;
  requestAnimationFrame(() => { g.rolle.scrollTop = Math.max(0, ziel); });
}

function setzeBalken(knopf, x, g) {
  const hoehe = Math.max(20, (x.bis - x.von) * g.H / 60);
  knopf.style.top = ((x.von - g.vonStd * 60) * g.H / 60) + "px";
  knopf.style.height = hoehe + "px";
  if (hoehe < 44) knopf.classList.add("kurz");
  if (hoehe >= 74) knopf.classList.add("hoch");
  knopf.style.insetInlineStart = "calc(" + (x.versatz || 0) + "% + 2px)";
  knopf.style.width = "calc(" + (x.anteil || 100) + "% - 4px)";
}

function balkenFarbe(e) {
  if (e.typ === "task") return "var(--gruen)";
  return farbeVon(e) || "var(--akzent)";
}

/* Ein Balken für einen echten Eintrag */
function eintragsBalken(e, tag, g, zeigName) {
  const meins = e.ownerId === nutzer.uid;
  const erledigt = erledigtAm(e, tag);
  const b = el("button", "balken" + (meins ? "" : " fremd") + (erledigt ? " erledigt" : ""));
  b.type = "button";
  b.style.background = balkenFarbe(e);

  const zr = zeitraum(e);
  b.appendChild(el("b", null, e.titel));
  const unten = [];
  if (zr) unten.push(ausMinuten(zr.von) + "–" + ausMinuten(zr.bis));
  if (zeigName && !meins) unten.push(vorname(e.ownerId));
  if (zeigName && meins && (e.zugewiesen || []).length) {
    unten.push((e.zugewiesen || []).map(vorname).join(", "));
  }
  if (e.ort) unten.push(e.ort);
  if (unten.length) b.appendChild(el("small", null, unten.join(" · ")));

  b.addEventListener("click", () => {
    if (meins) oeffneEintrag(e, tag); else zeigeFremd(e, tag);
  });
  return b;
}

/* Fremder Eintrag: nur ansehen, und wenn er mir zugewiesen ist, antworten */
function zeigeFremd(e, tag) {
  const mir = (e.zugewiesen || []).includes(nutzer.uid);
  const zr = zeitraum(e);
  const zeilen = [
    e.titel,
    zr ? ausMinuten(zr.von) + " – " + ausMinuten(zr.bis) : "",
    t("vonPerson", { name: vorname(e.ownerId) }),
    e.ort || "", e.notiz || ""
  ].filter(Boolean);
  if (!mir) { alert(zeilen.join("\n")); return; }
  const jetzt = (e.zusagen || {})[nutzer.uid] || "";
  if (confirm(zeilen.join("\n") + "\n\n" +
      (jetzt === "ja" ? "" : t("zZusagen") + "?"))) {
    antworte(e, jetzt === "ja" ? "nein" : "ja");
  }
}

/* ---------- Tagesplan ---------- */

function maleTag(box) {
  const tag = anker;
  const k = kreisVon(planKreis);

  box.appendChild(kreisWahlLeiste());

  // Offene Aufgaben aus der Vergangenheit. Die dürfen nicht untergehen,
  // nur weil ihr Tag vorbei ist.
  const frueher = filter === "termin" ? [] : meineEintraege.filter((e) =>
    e.typ === "task" && !istSerie(e) && e.status === "offen" &&
    e.datum < tag && e.ownerId === nutzer.uid)
    .sort((a, b) => (a.frist || "9999").localeCompare(b.frist || "9999"));

  if (frueher.length) {
    box.appendChild(trenner(t("aOffenFrueher"), true));
    const z = el("div", "ohneZeit");
    frueher.forEach((e) => z.appendChild(aufgabenChip(e, e.datum, true)));
    box.appendChild(z);
  }

  // Aufgaben ohne Uhrzeit stehen als Streifen über dem Plan
  const ohne = sortiert(anTag(tag).filter((e) => !e.start));
  if (ohne.length) {
    const z = el("div", "ohneZeit");
    ohne.forEach((e) => z.appendChild(aufgabenChip(e, tag)));
    box.appendChild(z);
  }

  if (k && istExklusiv(k)) { maleSlotPlan(box, tag, k); return; }
  malePersonenPlan(box, tag, k);
}

/* Ein Streifen für etwas ohne feste Uhrzeit. Der Haken sitzt gleich
   mit drauf, damit man Aufgaben ohne Umweg abhaken kann. */
function aufgabenChip(e, tag, mitDatum) {
  const meins = e.ownerId === nutzer.uid;
  const erledigt = erledigtAm(e, tag);
  const c = el("div", "chip" + (erledigt ? " erledigt" : ""));

  if (e.typ === "task" && meins) {
    const h = el("button", "haken" + (erledigt ? " an" : ""), erledigt ? "✓" : "");
    h.type = "button";
    h.style.width = "20px"; h.style.height = "20px"; h.style.fontSize = "12px";
    h.setAttribute("aria-label", t("abhaken"));
    h.addEventListener("click", (ev) => { ev.stopPropagation(); hakenUmschalten(e, tag); });
    c.appendChild(h);
  } else {
    const p = el("span", "kreisPunkt");
    p.style.background = balkenFarbe(e);
    c.appendChild(p);
  }

  c.appendChild(el("span", null, e.titel));
  if (mitDatum) {
    const tage = e.frist ? tageBis(e.frist, heute()) : null;
    c.appendChild(el("small", null,
      tage !== null && tage < 0 ? t("fristSpaet", { n: Math.abs(tage) })
                                : kurzDatum(e.datum)));
  }
  c.addEventListener("click", () => {
    if (meins) oeffneEintrag(e, tag); else zeigeFremd(e, tag);
  });
  return c;
}

/* Auswahl, wessen Plan gezeigt wird */
function kreisWahlLeiste() {
  const z = el("div", "ohneZeit");
  const mach = (id, text) => {
    const b = el("button", "chip");
    b.type = "button";
    if (planKreis === id) { b.style.borderColor = "var(--akzent)"; b.style.color = "var(--akzent)"; }
    if (id) {
      const p = el("span", "kreisPunkt");
      p.style.background = (kreisVon(id) || {}).farbe || "var(--text3)";
      b.appendChild(p);
    }
    b.appendChild(el("span", null, text));
    b.addEventListener("click", () => { planKreis = id; merke("planKreis", id); zeichne(); });
    z.appendChild(b);
  };
  mach("", t("planIch"));
  meineKreise.forEach((k) => mach(k.id, k.name));
  return z;
}

/* Fenster des Tages bestimmen */
function tagFenster(tag, k, stuecke) {
  let von = TAG_VON_STD * 60, bis = TAG_BIS_STD * 60;
  const az = zeitenAnTag(k, tag);
  if (az.length) {
    von = az[0].von;
    bis = az[az.length - 1].bis;
  }
  stuecke.forEach((x) => { von = Math.min(von, x.von); bis = Math.max(bis, x.bis); });
  von = Math.max(0, Math.floor(von / 60) * 60);
  bis = Math.min(24 * 60, Math.ceil(bis / 60) * 60);
  if (bis - von < 4 * 60) bis = Math.min(24 * 60, von + 4 * 60);
  return { vonStd: von / 60, bisStd: bis / 60 };
}

function malePersonenPlan(box, tag, k) {
  // Welche Personen bekommen eine Spalte
  let leute;
  if (k) {
    leute = icheSeheDurch(k).filter((u) => u !== nutzer.uid);
    leute = [nutzer.uid, ...leute];
  } else {
    const dabei = new Set([nutzer.uid]);
    anTag(tag).forEach((e) => dabei.add(e.ownerId));
    belegtFremd.forEach((x) => { if (laeuftAnTag(x, tag)) dabei.add(x.ownerId); });
    leute = [...dabei];
  }

  // Stücke je Person einsammeln
  const jePerson = new Map();
  const alleStuecke = [];
  leute.forEach((u) => jePerson.set(u, []));

  anTag(tag).forEach((e) => {
    const zr = zeitraum(e);
    if (!zr) return;
    const wer = new Set([e.ownerId, ...(e.zugewiesen || [])]);
    wer.forEach((u) => {
      if (!jePerson.has(u)) return;
      if (u !== e.ownerId && (e.zusagen || {})[u] === "nein") return;
      jePerson.get(u).push({ ...zr, e });
      alleStuecke.push(zr);
    });
  });

  // Belegte Zeiten anderer, die ich nicht im Klartext sehe
  const schonDa = new Set();
  jePerson.forEach((l) => l.forEach((x) => schonDa.add(x.e.id)));
  belegtFremd.forEach((x) => {
    if (!laeuftAnTag(x, tag)) return;
    if (!jePerson.has(x.ownerId)) return;
    if (schonDa.has(x.id) || (x.vonEintrag && schonDa.has(x.vonEintrag))) return;
    const zr = zeitraum(x);
    if (!zr) return;
    jePerson.get(x.ownerId).push({ ...zr, belegt: true });
    alleStuecke.push(zr);
  });

  // Personen ohne irgendetwas fliegen raus, meine Spalte bleibt immer
  if (!k) leute = leute.filter((u) => u === nutzer.uid || jePerson.get(u).length);

  const f = tagFenster(tag, k, alleStuecke);
  const koepfe = leute.map((u) => {
    const kopf = el("div", "planName");
    const av = el("div", "avatar");
    const info = alleNutzer[u] || {};
    if (info.photoURL) { const i = el("img"); i.src = info.photoURL; i.alt = ""; av.appendChild(i); }
    else av.textContent = (info.name || "?").slice(0, 1).toUpperCase();
    av.style.width = "22px"; av.style.height = "22px"; av.style.fontSize = "10px";
    kopf.appendChild(av);
    kopf.appendChild(el("span", null, u === nutzer.uid ? t("planIch") : (info.name || t("kUnbekannt"))));
    return kopf;
  });

  const g = planGeruest(box, koepfe, f.vonStd, f.bisStd, leute.length <= 3);

  leute.forEach((u, i) => {
    const spalte = g.spalten[i];
    const stuecke = verteile(jePerson.get(u));
    stuecke.forEach((x) => {
      let b;
      if (x.belegt) {
        b = el("div", "balken belegt");
        b.appendChild(el("b", null, t("planBelegt")));
        b.appendChild(el("small", null, ausMinuten(x.von) + "–" + ausMinuten(x.bis)));
      } else {
        b = eintragsBalken(x.e, tag, g, u !== nutzer.uid || (x.e.zugewiesen || []).length > 0);
      }
      setzeBalken(b, x, g);
      spalte.appendChild(b);
    });
    if (!stuecke.length) spalte.classList.add("frei");
  });

  if (tag === heute()) jetztLinie(g);
  rolleZu(g, tag === heute() ? jetztMinuten()
            : (alleStuecke.length ? Math.min(...alleStuecke.map((x) => x.von)) : null));
  if (!leute.length) box.appendChild(el("div", "leer", t("planNiemand")));
}

/* Exklusiver Kreis: eine gemeinsame Spur mit festen Zeitfenstern */
function maleSlotPlan(box, tag, k) {
  const fenster = raster(k, tag);
  const belegteSlots = slots.filter((s) => s.kreisId === k.id && s.datum === tag);
  const eintraege = anTag(tag).filter((e) => (e.kreisIds || []).includes(k.id));

  const stuecke = [];
  fenster.forEach((f) => stuecke.push(f));
  eintraege.forEach((e) => { const zr = zeitraum(e); if (zr) stuecke.push(zr); });

  const f = tagFenster(tag, k, stuecke);
  const kopf = el("div", "planName");
  const p = el("span", "kreisPunkt");
  p.style.background = k.farbe;
  kopf.appendChild(p);
  kopf.appendChild(el("span", null, k.name));
  const frei = fenster.filter((x) =>
    !belegteSlots.some((s) => minuten(s.start) === x.von)).length;
  kopf.appendChild(el("span", "klein2", t("slFrei", { n: frei })));

  const g = planGeruest(box, [kopf], f.vonStd, f.bisStd, true);
  const spalte = g.spalten[0];

  // Erst die freien Fenster als gestrichelte Flächen
  fenster.forEach((x) => {
    const genommen = belegteSlots.find((s) => minuten(s.start) === x.von);
    if (genommen) return;
    const b = el("button", "balken slot");
    b.type = "button";
    b.textContent = ausMinuten(x.von);
    b.title = t("planBuchen");
    setzeBalken(b, { ...x, versatz: 0, anteil: 100 }, g);
    b.addEventListener("click", () => buchen(k, tag, x));
    spalte.appendChild(b);
  });

  // Dann die vergebenen
  const sichtbar = new Set(eintraege.map((e) => minuten(e.start)));
  verteile(eintraege.map((e) => ({ ...zeitraum(e), e })).filter((x) => x.von !== undefined))
    .forEach((x) => {
      const b = eintragsBalken(x.e, tag, g, true);
      setzeBalken(b, x, g);
      spalte.appendChild(b);
    });

  belegteSlots.forEach((s) => {
    const von = minuten(s.start);
    if (sichtbar.has(von)) return;          // sehe ich schon im Klartext
    const bis = von + (Number(s.dauer) || 60);
    const b = el("div", "balken belegt");
    b.appendChild(el("b", null, t("planVergeben")));
    b.appendChild(el("small", null, ausMinuten(von) + "–" + ausMinuten(bis)));
    setzeBalken(b, { von, bis, versatz: 0, anteil: 100 }, g);
    spalte.appendChild(b);
  });

  if (tag === heute()) jetztLinie(g);
  rolleZu(g, tag === heute() ? jetztMinuten()
            : (fenster.length ? fenster[0].von : null));
  if (!fenster.length && !eintraege.length) {
    box.appendChild(el("div", "leer", t("kZeitKeine")));
  }
}

function jetztLinie(g) {
  const m = jetztMinuten();
  if (m < g.vonStd * 60 || m > g.vonStd * 60 + g.hoehe / g.H * 60) return;
  const i = el("div", "planJetzt");
  i.style.top = ((m - g.vonStd * 60) * g.H / 60) + "px";
  g.feld.appendChild(i);
}

/* ---------- Ein Zeitfenster nehmen ---------- */

async function buchen(k, tag, fenster) {
  const art = (k.arten && k.arten[0]) || { name: k.name, dauer: fenster.bis - fenster.von };
  const kennung = slotKennung(k.id, tag, fenster.von);
  try {
    // Anlegen gelingt nur, wenn es das Fenster noch nicht gibt.
    // Das entscheidet die Datenbank, nicht die App.
    await setDoc(doc(db, "slots", kennung), {
      kreisId: k.id, datum: tag,
      start: ausMinuten(fenster.von),
      dauer: fenster.bis - fenster.von,
      uid: nutzer.uid,
      erstelltAm: serverTimestamp()
    });
  } catch (e) {
    alert(t("slBelegt"));
    return;
  }

  try {
    const daten = {
      ownerId: nutzer.uid,
      typ: "termin",
      titel: art.name || k.name,
      datum: tag,
      start: ausMinuten(fenster.von),
      ende:  ausMinuten(fenster.bis),
      dauer: fenster.bis - fenster.von,
      frist: "", ort: "", notiz: "",
      wiederholung: "einmal",
      kreisIds: [k.id],
      zugewiesen: [], zusagen: {},
      sichtbarFuer: sichtbarFuerListe([k.id], []),
      slotId: kennung,
      status: "",
      suchtext: (art.name || k.name).toLowerCase(),
      erstelltAm: serverTimestamp()
    };
    const ref = await addDoc(collection(db, "eintraege"), daten);
    await setDoc(doc(db, "belegt", ref.id), {
      ownerId: nutzer.uid, typ: "termin", datum: tag,
      start: daten.start, ende: daten.ende, dauer: daten.dauer,
      wiederholung: "einmal", sichtbarFuer: belegtFuerListe()
    });
  } catch (e) {
    await deleteDoc(doc(db, "slots", kennung)).catch(() => {});
    alert(t("eSpeichern", { code: e.code || e.message }));
  }
}

/* ---------- Wochenplan ---------- */

function maleWoche(box) {
  const mo = montagVon(anker);
  const tage = [];
  for (let i = 0; i < 7; i++) tage.push(plus(mo, i));

  const jeTag = new Map(), alle = [];
  const ohne = [];
  tage.forEach((tg) => {
    const l = [];
    anTag(tg).forEach((e) => {
      const zr = zeitraum(e);
      if (!zr) { ohne.push({ tg, e }); return; }
      l.push({ ...zr, e });
      alle.push(zr);
    });
    jeTag.set(tg, l);
  });

  const f = tagFenster(anker, kreisVon(planKreis), alle);
  const koepfe = tage.map((tg, i) => {
    const d = ausText(tg);
    const kopf = el("div", "planName" + (tg === heute() ? " heute" : ""));
    kopf.appendChild(el("span", null, liste("kurzTage")[i]));
    kopf.appendChild(el("span", "klein2 ltr", `${d.getDate()}.${d.getMonth() + 1}.`));
    return kopf;
  });

  const g = planGeruest(box, koepfe, f.vonStd, f.bisStd, false);

  tage.forEach((tg, i) => {
    const spalte = g.spalten[i];
    if (istFeiertag(tg)) spalte.style.background = "var(--flaeche2)";
    verteile(jeTag.get(tg)).forEach((x) => {
      const b = eintragsBalken(x.e, tg, g, true);
      setzeBalken(b, x, g);
      spalte.appendChild(b);
    });
    spalte.addEventListener("dblclick", () => {
      anker = tg; ansicht = "tag";
      [...$("nav").children].forEach((x) => x.classList.toggle("an", x.dataset.v === "tag"));
      merke("ansicht", "tag"); zeichne();
    });
  });

  rolleZu(g, alle.length ? Math.min(...alle.map((x) => x.von)) : null);

  // Waagerecht so rollen, dass der heutige Tag im Bild ist
  const heutIndex = tage.indexOf(heute());
  if (heutIndex >= 0 && g.rolle) {
    const sp = g.spalten[heutIndex];
    requestAnimationFrame(() => {
      const links = sp.offsetLeft - 46 - 6;
      if (links > 0) g.rolle.scrollLeft = istRTL() ? -links : links;
    });
  }

  if (ohne.length) {
    box.appendChild(trenner(t("planGanzerTag")));
    const z = el("div", "ohneZeit");
    ohne.forEach(({ tg, e }) => {
      const c = el("button", "chip" + (erledigtAm(e, tg) ? " erledigt" : ""));
      c.type = "button";
      const p = el("span", "kreisPunkt");
      p.style.background = balkenFarbe(e);
      c.appendChild(p);
      c.appendChild(el("span", null, liste("kurzTage")[wochentag(tg)] + " · " + e.titel));
      c.addEventListener("click", () => {
        if (e.ownerId === nutzer.uid) oeffneEintrag(e, tg); else zeigeFremd(e, tg);
      });
      z.appendChild(c);
    });
    box.appendChild(z);
  }
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

    const l = sortiert(anTag(tag));
    const streifen = el("div", "streifen");
    l.slice(0, 3).forEach((e) => {
      const i2 = el("i", e.typ === "task" ? "task" : "");
      i2.style.background = balkenFarbe(e);
      streifen.appendChild(i2);
    });
    z.appendChild(streifen);
    if (l.length > 3) z.appendChild(el("div", "mehr ltr", "+" + (l.length - 3)));

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
  if (!l.length) { box.appendChild(el("div", "leer", t("nichtsGeplant"))); return; }
  const w = el("div");
  w.style.cssText = "display:flex;flex-direction:column;gap:8px";
  l.forEach((e) => w.appendChild(zeile(e, gewaehlt)));
  box.appendChild(w);
}

/* ---------- Aufgaben ---------- */

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
  const abschnitt = (schl, l, warn) => {
    if (!l.length) return;
    box.appendChild(trenner(t(schl), warn));
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
    box.appendChild(trenner(tagTitel(tg) + (tg === heute() ? " · " + t("heute") : "")));
    l.forEach((e) => box.appendChild(zeile(e, tg)));
  }
  if (leer) box.appendChild(leerKasten("○", t("nichts30")));
}

/* ===================================================================
   EINE ZEILE (Liste und Aufgaben)
   =================================================================== */

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

async function antworte(e, wert) {
  try {
    await updateDoc(doc(db, "eintraege", e.id), { ["zusagen." + nutzer.uid]: wert });
    await addDoc(collection(db, "nachrichten"), {
      anUid: e.ownerId, vonUid: nutzer.uid, vonName: meinName(),
      art: wert === "ja" ? "zusage" : "absage",
      text: e.titel, eintragId: e.id, gelesen: false,
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
  box.appendChild(ja); box.appendChild(nein);
  return box;
}

function zusageStand(e) {
  const wer = e.zugewiesen || [];
  if (!wer.length) return null;
  const z = e.zusagen || {};
  const ja = wer.filter((u) => z[u] === "ja").length;
  const offen = wer.filter((u) => !z[u]).length;
  const text = offen === 0 && ja === wer.length
    ? t("zAlleZu") : t("zUebersicht", { zu: ja, alle: wer.length });
  return el("span", "marke" + (offen ? " bald" : " gut"), text);
}

function zeile(e, tag, zeigeDatum) {
  const meins = e.ownerId === nutzer.uid;
  const erledigt = erledigtAm(e, tag);
  const faellig = e.typ === "task" && !erledigt && e.frist && e.frist < heute();
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
  if (e.ort) zusatz.push(e.ort);
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
    weg.addEventListener("click", () => loescheEintrag(e));
    wrap.appendChild(weg);
  }
  return wrap;
}

async function loescheEintrag(e) {
  const frage = istSerie(e) ? t("eSerieLoeschen", { titel: e.titel }) : t("eLoeschenFrage");
  if (!confirm(frage)) return;
  try {
    const b = writeBatch(db);
    b.delete(doc(db, "eintraege", e.id));
    b.delete(doc(db, "belegt", e.id));
    if (e.slotId) b.delete(doc(db, "slots", e.slotId));
    await b.commit();
  } catch (err) { alert(t("eSpeichern", { code: err.code || err.message })); }
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
  const box = $("buehne");
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
      zeigeArtenWahl();
    });
    box.appendChild(b);
  });
  zeigeArtenWahl();
}

/* Terminarten der gewählten Kreise als Knöpfe */
function zeigeArtenWahl() {
  const box = $("artenWahl");
  box.innerHTML = "";
  const arten = [];
  meineKreise.filter((k) => gewaehlteKreise.includes(k.id)).forEach((k) => {
    (k.arten || []).forEach((a) => arten.push({ ...a, kreis: k }));
  });
  $("artenBlock").classList.toggle("versteckt", !arten.length);
  arten.forEach((a) => {
    const b = el("button", "person");
    b.type = "button";
    const p = el("span", "kreisPunkt");
    p.style.background = a.kreis.farbe;
    b.appendChild(p);
    b.appendChild(el("span", null, `${a.name} · ${a.dauer} min`));
    b.addEventListener("click", () => {
      $("fTitel").value = a.name;
      vorgabeDauer = Number(a.dauer) || 0;
      const s = minuten($("fStart").value);
      if (s !== null && vorgabeDauer) $("fEnde").value = ausMinuten(s + vorgabeDauer);
      [...box.children].forEach((x) => x.classList.toggle("an", x === b));
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
                 info.name || t("kUnbekannt"));
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
  bearbeiteId = e ? e.id : null;
  bearbeiteTag = tag || anker;
  vorgabeDauer = e ? (Number(e.dauer) || 0) : 0;
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

  $("fBis").value = s ? (s.bis || "") : "";
  $("fFeiertage").checked = s ? !!s.ohneFeiertage : true;
  $("fFerien").checked    = s ? !!s.ohneFerien    : false;

  gewaehlteKreise   = e ? [...(e.kreisIds   || [])] : (planKreis ? [planKreis] : []);
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
      wiederholung: "serie", serie: { ...e.serie, ausnahmen: l },
      sichtbarFuer: belegtFuerListe()
    }, { merge: true });
    await b.commit();
    $("dlgEintrag").close();
  } catch (err) {
    $("formFehler").textContent = t("eSpeichern", { code: err.code || err.message });
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

  const kreisIds = [...gewaehlteKreise];
  const zugewiesen = [...gewaehltePersonen];
  const alt = bearbeiteId ? meineEintraege.find((x) => x.id === bearbeiteId) : null;

  const zusagen = {};
  if (alt && alt.zusagen) {
    zugewiesen.forEach((u) => { if (alt.zusagen[u]) zusagen[u] = alt.zusagen[u]; });
  }

  let dauer = vorgabeDauer;
  if (typ === "termin" && start && ende) dauer = minuten(ende) - minuten(start);

  const daten = {
    ownerId: nutzer.uid,
    typ, titel, datum,
    start: start || "",
    ende:  typ === "termin" ? (ende || "") : "",
    dauer: dauer > 0 ? dauer : 0,
    frist: typ === "task" ? (frist || "") : "",
    ort, notiz, wiederholung, kreisIds, zugewiesen, zusagen,
    sichtbarFuer: sichtbarFuerListe(kreisIds, zugewiesen),
    suchtext: [titel, notiz, ort].join(" ").toLowerCase().trim()
  };

  const schatten = {
    ownerId: nutzer.uid, typ, datum,
    start: start || "",
    ende: typ === "termin" ? (ende || "") : "",
    dauer: daten.dauer, wiederholung,
    sichtbarFuer: belegtFuerListe()
  };

  if (wiederholung === "serie") {
    const s = {
      bis,
      wochentage: [...gewaehlteTage].sort((a, b) => a - b),
      ausnahmen: alt && alt.serie && Array.isArray(alt.serie.ausnahmen) ? alt.serie.ausnahmen : [],
      ohneFeiertage: $("fFeiertage").checked,
      ohneFerien: $("fFerien").checked
    };
    daten.serie = s; schatten.serie = s;
  }

  // In einem exklusiven Kreis muss das Zeitfenster reserviert werden,
  // damit nicht zwei Leute dieselbe Stunde bekommen.
  const exk = meineKreise.find((k) => kreisIds.includes(k.id) && istExklusiv(k));
  let neuerSlot = null;
  if (exk && typ === "termin" && start && wiederholung === "einmal") {
    const kennung = slotKennung(exk.id, datum, minuten(start));
    if (!alt || alt.slotId !== kennung) {
      try {
        await setDoc(doc(db, "slots", kennung), {
          kreisId: exk.id, datum, start,
          dauer: daten.dauer || 60, uid: nutzer.uid,
          erstelltAm: serverTimestamp()
        });
        neuerSlot = kennung;
        daten.slotId = kennung;
      } catch (err) {
        $("formFehler").textContent = t("slBelegt");
        return;
      }
    }
  }

  try {
    let id = bearbeiteId;
    if (bearbeiteId) {
      const b = writeBatch(db);
      b.set(doc(db, "eintraege", bearbeiteId), daten, { merge: true });
      b.set(doc(db, "belegt", bearbeiteId), schatten, { merge: true });
      if (neuerSlot && alt && alt.slotId && alt.slotId !== neuerSlot) {
        b.delete(doc(db, "slots", alt.slotId));
      }
      await b.commit();
    } else {
      daten.erstelltAm = serverTimestamp();
      if (typ === "task") {
        daten.status = "offen";
        if (wiederholung === "serie") daten.erledigtAn = [];
      } else daten.status = "";
      const ref = await addDoc(collection(db, "eintraege"), daten);
      id = ref.id;
      await setDoc(doc(db, "belegt", ref.id), schatten);
      if (kreisIds.length) meldeGeteilt(titel, kreisIds, ref.id);
    }

    const vorher = alt ? (alt.zugewiesen || []) : [];
    const neuDazu = zugewiesen.filter((u) => !vorher.includes(u));
    if (neuDazu.length) meldeZugewiesen(titel, neuDazu, id);

    $("dlgEintrag").close();
    if (wiederholung === "einmal" && datum !== anker && ansicht === "tag") {
      anker = datum; zeichne();
    }
  } catch (e) {
    if (neuerSlot) await deleteDoc(doc(db, "slots", neuerSlot)).catch(() => {});
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
function setzeBelegung(b) {
  neueBelegung = b;
  $("belParallel").classList.toggle("an", b === "parallel");
  $("belExklusiv").classList.toggle("an", b === "exklusiv");
}
$("artKreis").addEventListener("click", () => setzeArt("kreis"));
$("artStern").addEventListener("click", () => setzeArt("stern"));
$("belParallel").addEventListener("click", () => setzeBelegung("parallel"));
$("belExklusiv").addEventListener("click", () => setzeBelegung("exklusiv"));

$("kreiseBtn").addEventListener("click", () => { zeigeKreise(); $("dlgKreise").showModal(); });
$("kreiseZu").addEventListener("click", () => $("dlgKreise").close());
$("kreiseZu2").addEventListener("click", () => $("dlgKreise").close());

function zeigeKreise() {
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
    kopf.appendChild(el("span", "rolle",
      (stern ? t("kArtStern") : t("kArtKreis")) + " · " +
      (istExklusiv(k) ? t("kExklusiv") : t("kParallel"))));

    if (verwalter) {
      const eb = el("button", "klein", t("kEinstellungen"));
      eb.type = "button";
      eb.addEventListener("click", () => oeffneEinstellungen(k));
      kopf.appendChild(eb);

      const b = el("button", "klein gut", t("kEinladen"));
      b.type = "button";
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

    // Im Stern sieht ein einfaches Mitglied nur die Verwalter
    const zeigeUids = stern && !verwalter ? (k.verwalter || []) : (k.mitglieder || []);

    zeigeUids.forEach((uid) => {
      const info = (k.info || {})[uid] || alleNutzer[uid] || {};
      const z = el("div", "mitglied");
      const av = el("div", "avatar");
      if (info.photoURL) { const i = el("img"); i.src = info.photoURL; i.alt = ""; av.appendChild(i); }
      else av.textContent = (info.name || "?").slice(0, 1).toUpperCase();
      z.appendChild(av);

      const txt = el("div");
      txt.style.flexGrow = "1";
      txt.appendChild(el("div", null,
        (info.name || t("kUnbekannt")) + (uid === nutzer.uid ? " " + t("kDu") : "")));
      // Die E-Mail sieht nur der Verwalter, und jeder seine eigene
      if (info.email && (verwalter || uid === nutzer.uid)) {
        txt.appendChild(el("div", "mail", info.email));
      }
      z.appendChild(txt);

      if ((k.verwalter || []).includes(uid)) z.appendChild(el("span", "rolle", t("kVerwalter")));

      if (uid !== nutzer.uid) {
        const nb = el("button", "klein", t("kNachricht"));
        nb.type = "button";
        nb.addEventListener("click", () => oeffneSchreiben(uid, info.name));
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
              verwalter: (k.verwalter || []).filter((u) => u !== uid),
              info: info2
            });
            await deleteDoc(doc(db, "kreisinfo", k.id + "_" + uid)).catch(() => {});
          } catch (e) { alert(t("eSpeichern", { code: e.code || e.message })); }
        });
        z.appendChild(wb);
      }
      karte.appendChild(z);
    });

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
            verwalter: (k.verwalter || []).filter((u) => u !== nutzer.uid),
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
      name, farbe: neueFarbe, art: neueArt, belegung: neueBelegung,
      arten: [], zeiten: [],
      erstellerId: nutzer.uid,
      mitglieder: [nutzer.uid], verwalter: [nutzer.uid],
      info: { [nutzer.uid]: meinSteckbrief() },
      erstelltAm: serverTimestamp()
    });
    $("kName").value = "";
  } catch (e) {
    $("kreisFehler").textContent = t("eSpeichern", { code: e.code || e.message });
  }
});

/* ---------- Kreis einstellen ---------- */

function baueZeitTage() {
  const box = $("eZeitTage");
  if (!box) return;
  box.innerHTML = "";
  liste("kurzTage").forEach((name, i) => {
    const b = el("button", "tagKnopf" + (einstTage.includes(i) ? " an" : ""), name);
    b.type = "button"; b.dataset.tag = i;
    b.addEventListener("click", () => {
      const k = einstTage.indexOf(i);
      if (k >= 0) einstTage.splice(k, 1); else einstTage.push(i);
      b.classList.toggle("an", k < 0);
    });
    box.appendChild(b);
  });
}

function oeffneEinstellungen(k) {
  einstKreis = k;
  einstArten = (k.arten || []).map((a) => ({ ...a }));
  einstZeiten = (k.zeiten || []).map((z) => ({ ...z, tage: [...(z.tage || [])] }));
  einstBelegung = istExklusiv(k) ? "exklusiv" : "parallel";
  einstTage = [0, 1, 2, 3, 4];
  $("einstUnter").textContent = k.name;
  $("einstFehler").textContent = "";
  $("einstGut").textContent = "";
  setzeEinstBelegung(einstBelegung);
  baueZeitTage();
  zeigeArtenListe();
  zeigeZeitenListe();
  $("dlgKreisEinst").showModal();
}
function setzeEinstBelegung(b) {
  einstBelegung = b;
  $("eBelParallel").classList.toggle("an", b === "parallel");
  $("eBelExklusiv").classList.toggle("an", b === "exklusiv");
}
$("eBelParallel").addEventListener("click", () => setzeEinstBelegung("parallel"));
$("eBelExklusiv").addEventListener("click", () => setzeEinstBelegung("exklusiv"));
$("einstZu").addEventListener("click", () => $("dlgKreisEinst").close());

function zeigeArtenListe() {
  const box = $("artenListe");
  box.innerHTML = "";
  if (!einstArten.length) { box.appendChild(el("div", "hinweis", t("kArtKeine"))); return; }
  einstArten.forEach((a, i) => {
    const z = el("div", "zeile2");
    const w = el("div", "wachs");
    w.appendChild(el("div", null, a.name));
    w.appendChild(el("small", null, a.dauer + " min"));
    z.appendChild(w);
    const wb = el("button", "klein gefahr", "×");
    wb.type = "button";
    wb.addEventListener("click", () => { einstArten.splice(i, 1); zeigeArtenListe(); });
    z.appendChild(wb);
    box.appendChild(z);
  });
}
$("artHinzu").addEventListener("click", () => {
  const name = $("eArtName").value.trim();
  const dauer = Number($("eArtDauer").value);
  if (!name || !(dauer > 0)) { $("einstFehler").textContent = t("kDauerFehlt"); return; }
  $("einstFehler").textContent = "";
  einstArten.push({ name, dauer });
  $("eArtName").value = "";
  zeigeArtenListe();
});

function zeigeZeitenListe() {
  const box = $("zeitenListe");
  box.innerHTML = "";
  if (!einstZeiten.length) { box.appendChild(el("div", "hinweis", t("kZeitKeine"))); return; }
  const K = liste("kurzTage");
  einstZeiten.forEach((z2, i) => {
    const z = el("div", "zeile2");
    const w = el("div", "wachs");
    w.appendChild(el("div", null, (z2.tage || []).map((x) => K[x]).join(", ")));
    w.appendChild(el("small", null, z2.von + " – " + z2.bis));
    z.appendChild(w);
    const wb = el("button", "klein gefahr", "×");
    wb.type = "button";
    wb.addEventListener("click", () => { einstZeiten.splice(i, 1); zeigeZeitenListe(); });
    z.appendChild(wb);
    box.appendChild(z);
  });
}
$("zeitHinzu").addEventListener("click", () => {
  const von = $("eZeitVon").value, bis = $("eZeitBis").value;
  if (!einstTage.length || !von || !bis || bis <= von) {
    $("einstFehler").textContent = t("kZeitFehlt"); return;
  }
  $("einstFehler").textContent = "";
  einstZeiten.push({ tage: [...einstTage].sort((a, b) => a - b), von, bis });
  zeigeZeitenListe();
});

$("einstSpeichern").addEventListener("click", async () => {
  if (!einstKreis) return;
  $("einstFehler").textContent = "";
  try {
    await updateDoc(doc(db, "kreise", einstKreis.id), {
      belegung: einstBelegung,
      arten: einstArten,
      zeiten: einstZeiten
    });
    $("einstGut").textContent = t("kGespeichert");
    setTimeout(() => $("dlgKreisEinst").close(), 700);
  } catch (e) {
    $("einstFehler").textContent = t("eSpeichern", { code: e.code || e.message });
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
      kreisId: einladenKreis.id, kreisName: einladenKreis.name, email: mail,
      vonUid: nutzer.uid, vonName: meinName(),
      alsVerwalter: $("eVerwalter").checked,
      erstelltAm: serverTimestamp()
    });
    $("einladenGut").textContent = t("eiErfolg", { mail });
    $("eMail").value = "";
    await ladeOffeneEinladungen();
  } catch (e) {
    $("einladenFehler").textContent = t("eSpeichern", { code: e.code || e.message });
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
      anUid: schreibenAnUid, vonUid: nutzer.uid, vonName: meinName(),
      art: "nachricht", text, gelesen: false, erstelltAm: serverTimestamp()
    });
    $("schreibenGut").textContent = t("sGesendet");
    $("sText").value = "";
    setTimeout(() => $("dlgSchreiben").close(), 800);
  } catch (e) {
    $("schreibenFehler").textContent = t("eSpeichern", { code: e.code || e.message });
  }
});

async function meldeGeteilt(titel, kreisIds, eintragId) {
  const empfaenger = new Set();
  meineKreise.filter((k) => kreisIds.includes(k.id))
             .forEach((k) => siehtMichDurch(k).forEach((u) => {
               if (u !== nutzer.uid) empfaenger.add(u);
             }));
  if (!empfaenger.size) return;
  const namen = meineKreise.filter((k) => kreisIds.includes(k.id)).map((k) => k.name).join(", ");
  try {
    for (const uid of empfaenger) {
      await addDoc(collection(db, "nachrichten"), {
        anUid: uid, vonUid: nutzer.uid, vonName: meinName(),
        art: "geteilt", text: titel, kreisName: namen,
        eintragId: eintragId || "", gelesen: false, erstelltAm: serverTimestamp()
      });
    }
  } catch (e) { console.warn("Hinweis:", e.code); }
}

async function meldeZugewiesen(titel, uids, eintragId) {
  try {
    for (const uid of uids) {
      await addDoc(collection(db, "nachrichten"), {
        anUid: uid, vonUid: nutzer.uid, vonName: meinName(),
        art: "zuweisung", text: titel,
        eintragId: eintragId || "", gelesen: false, erstelltAm: serverTimestamp()
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
  if (min < 1) return t("nGerade");
  if (min < 60) return t("nVorMin", { n: min });
  if (min < 1440) return t("nVorStd", { n: Math.round(min / 60) });
  return `${d.getDate()}.${d.getMonth() + 1}.`;
}

function postText(n) {
  if (n.art === "geteilt") return t("nHatGeteilt", { titel: n.text, kreis: n.kreisName || "—" });
  if (n.art === "zuweisung") return t("nHatZugewiesen", { titel: n.text });
  if (n.art === "zusage")    return t("nHatZugesagt",   { titel: n.text });
  if (n.art === "absage")    return t("nHatAbgesagt",   { titel: n.text });
  return n.text;
}

function zeigePost() {
  const box = $("postListe");
  box.innerHTML = "";
  if (!nachrichten.length) { box.appendChild(el("div", "leer", t("nKeine"))); return; }

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
      a.addEventListener("click", () => { $("dlgPost").close(); oeffneSchreiben(n.vonUid, n.vonName); });
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
  if (!box) return;
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
    const b = el("button", "person", info.name || t("kUnbekannt"));
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
      query(collection(db, "belegt"), where("sichtbarFuer", "array-contains", nutzer.uid)));
    belegt = snap.docs.map((d) => d.data()).filter((x) => wer.includes(x.ownerId));
  } catch (e) {
    $("findenFehler").textContent = t("ladeFehler", { code: e.code || e.message });
    erg.innerHTML = "";
    return;
  }

  const luecken = freieFenster(belegt, von, bis, frueh, spaet, findenDauer);
  erg.innerHTML = "";
  if (!luecken.length) { erg.appendChild(el("div", "hinweis", t("tfKeine"))); return; }

  erg.appendChild(el("div", "hinweis", t("tfAlleFrei", { namen: wer.map(vorname).join(", ") })));

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
      $("fEnde").value = ausMinuten(Math.min(l.von + findenDauer, l.bis));
      gewaehlteKreise = meineKreise
        .filter((k) => findenPersonenWahl.every((u) => (k.mitglieder || []).includes(u)))
        .slice(0, 1).map((k) => k.id);
      gewaehltePersonen = [...findenPersonenWahl];
      zeigeTeilenWahl();
      zeigeZuweisenWahl();
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
      const zr = zeitraum(e);
      if (!zr) return;                        // Aufgabe ohne Uhrzeit blockiert nicht
      blocks.push([zr.von, Math.max(zr.bis, zr.von + 15)]);
    });
    blocks.sort((x, y) => x[0] - y[0]);

    const dicht = [];
    blocks.forEach(([a, z]) => {
      if (dicht.length && a <= dicht[dicht.length - 1][1]) {
        dicht[dicht.length - 1][1] = Math.max(dicht[dicht.length - 1][1], z);
      } else dicht.push([a, z]);
    });

    let zeiger = frueh;
    dicht.forEach(([a, z]) => {
      if (a > zeiger && a - zeiger >= dauer) raus.push({ tag, von: zeiger, bis: Math.min(a, spaet) });
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
  $("michName").textContent = meinName();
  $("betriebBtn").classList.toggle("versteckt", !istBetreiber());
  $("dlgMich").showModal();
});
$("michZu").addEventListener("click", () => $("dlgMich").close());

function kachel(zahl2, text, warn) {
  const k = el("div", "kachel" + (warn ? " warn" : ""));
  k.appendChild(el("b", null, String(zahl2)));
  k.appendChild(el("span", null, text));
  return k;
}

function zeigeMeineZahlen() {
  const box = $("meineZahlen");
  box.innerHTML = "";
  const h = heute();
  const meins = meineEintraege.filter((e) => e.ownerId === nutzer.uid);
  const termine = meins.filter((e) => e.typ === "termin");
  const tasks = meins.filter((e) => e.typ === "task");
  const offen = tasks.filter((e) => !istSerie(e) && e.status !== "erledigt");
  const spaet = offen.filter((e) => e.frist && e.frist < h);
  const serien = meins.filter(istSerie);
  const geteilt = meins.filter((e) => (e.kreisIds || []).length);

  box.appendChild(kachel(termine.length, t("koTermine")));
  box.appendChild(kachel(offen.length, t("koOffen")));
  box.appendChild(kachel(spaet.length, t("koUeberfaellig"), spaet.length > 0));
  box.appendChild(kachel(serien.length, t("koSerien")));
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
  const tab = $("betriebTabelle"), zb = $("betriebZahlen"), kb = $("betriebKreise");
  $("betriebFehler").textContent = "";
  tab.innerHTML = ""; zb.innerHTML = ""; kb.innerHTML = "";

  try {
    const snap = await getDocs(collection(db, "users"));
    const reihen = snap.docs.map((d) => ({ uid: d.id, ...d.data() }))
      .sort((a, b) => (b.zuletzt?.seconds || 0) - (a.zuletzt?.seconds || 0));

    // E-Mails stehen getrennt, damit Mitglieder sie nicht lesen können
    const mails = {};
    try {
      const ps = await getDocs(collection(db, "users_privat"));
      ps.docs.forEach((d) => { mails[d.id] = (d.data() || {}).email || ""; });
    } catch (e) { console.warn("users_privat:", e.code); }

    const jetzt = Date.now();
    let aktiv7 = 0, gesperrt = 0;

    const kopf = el("tr");
    [t("bName"), t("bMail"), t("bZuletzt"), t("bStatus"), t("bDarfKreise")]
      .forEach((x) => kopf.appendChild(el("th", null, x)));
    tab.appendChild(kopf);

    reihen.forEach((u) => {
      const tr = el("tr");
      tr.appendChild(el("td", null, u.name || "—"));
      tr.appendChild(el("td", "n", mails[u.uid] || "—"));

      let z = "—";
      if (u.zuletzt?.seconds) {
        const d = new Date(u.zuletzt.seconds * 1000);
        if (jetzt - d.getTime() < 7 * 86400000) aktiv7++;
        z = `${d.getDate()}.${d.getMonth() + 1}.${String(d.getFullYear()).slice(2)}`;
      }
      const tdZ = el("td", "n");
      tdZ.appendChild(el("span", "ltr", z));
      tr.appendChild(tdZ);

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
        txt.appendChild(el("div", null, k.name + " · " +
          (istStern(k) ? t("kArtStern") : t("kArtKreis")) + " · " +
          (istExklusiv(k) ? t("kExklusiv") : t("kParallel"))));
        txt.appendChild(el("div", "mail", (k.mitglieder || []).length + " " + t("bPersonen")));
        z.appendChild(txt);
        const warte = (offeneEinladungen[k.id] || []).length;
        if (warte) z.appendChild(el("span", "rolle", t("bOffen", { n: warte })));
        kb.appendChild(z);
      });
    }
  } catch (e) {
    $("betriebFehler").textContent = t("bFehler", { code: e.code || e.message });
  }
}

/* ===================================================================
   START
   =================================================================== */

planKreis = gemerkt("planKreis") || "";
wendeSpracheAn(gemerkt("sprache") || spracheRaten());

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch((e) => console.log("SW:", e));
  });
}
