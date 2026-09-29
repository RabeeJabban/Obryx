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

const WOCHENTAGE = ["Sonntag","Montag","Dienstag","Mittwoch",
                    "Donnerstag","Freitag","Samstag"];
const KURZTAGE   = ["So","Mo","Di","Mi","Do","Fr","Sa"];
const MONATE = ["Januar","Februar","März","April","Mai","Juni","Juli",
                "August","September","Oktober","November","Dezember"];

// Datum als YYYY-MM-DD in LOKALER Zeit.
// toISOString() waere falsch: das rechnet nach UTC um und verschiebt
// abends den Tag um eins nach vorn.
function alsText(d) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const t = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${t}`;
}
function ausText(s) {
  const [j, m, t] = s.split("-").map(Number);
  return new Date(j, m - 1, t);
}
function tageBis(zieltext, vontext) {
  const ms = ausText(zieltext) - ausText(vontext);
  return Math.round(ms / 86400000);
}

let aktiverTag = alsText(new Date());
let nutzer     = null;
let stopTag    = null;   // beendet den Listener fuer den aktiven Tag
let stopOffen  = null;   // beendet den Listener fuer alte offene Aufgaben
let bearbeiteId = null;
let typ        = "termin";
let sucheAn    = false;
let alleCache  = null;   // fuer die Suche einmal geladene Eintraege

// ---------- Anmeldung ----------
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
  if (stopTag)   { stopTag();   stopTag = null; }
  if (stopOffen) { stopOffen(); stopOffen = null; }
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
  zeigeTag();

  // Profil anlegen, falls es noch nicht existiert
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

// ---------- Datum blaettern ----------
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

// ---------- Tagesansicht ----------
let tagesEintraege = [];
let alteOffene     = [];

function zeigeTag() {
  const d = ausText(aktiverTag);
  $("tagLang").textContent =
    `${WOCHENTAGE[d.getDay()]}, ${d.getDate()}. ${MONATE[d.getMonth()]}`;

  const heute = alsText(new Date());
  $("tagHinweis").textContent =
    aktiverTag === heute ? "Heute" : (aktiverTag < heute ? "Vergangen" : "");

  if (stopTag)   { stopTag();   stopTag = null; }
  if (stopOffen) { stopOffen(); stopOffen = null; }
  if (!nutzer) return;

  // Abfrage 1: alles an diesem Tag
  stopTag = onSnapshot(
    query(
      collection(db, "eintraege"),
      where("ownerId", "==", nutzer.uid),
      where("datum", "==", aktiverTag),
      orderBy("start")
    ),
    (snap) => {
      tagesEintraege = snap.docs.map((x) => ({ id: x.id, ...x.data() }));
      maleTag();
    },
    (e) => zeigeLadefehler(e)
  );

  // Abfrage 2: offene Aufgaben aus der Vergangenheit
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
      alteOffene = snap.docs.map((x) => ({ id: x.id, ...x.data() }));
      maleTag();
    },
    (e) => zeigeLadefehler(e)
  );
}

function zeigeLadefehler(e) {
  console.error(e);
  $("liste").innerHTML =
    '<div class="leer">Konnte nicht laden. Drücke F12 und schau in die ' +
    'Konsole – dort steht meist ein Link zum Anlegen des Index.</div>';
}

function maleTag() {
  if (sucheAn) return;
  const box = $("liste");
  box.innerHTML = "";

  const termine = tagesEintraege.filter((e) => e.typ === "termin");
  const tasks   = tagesEintraege.filter((e) => e.typ === "task");

  if (!termine.length && !tasks.length && !alteOffene.length) {
    box.innerHTML = '<div class="leer">Nichts eingetragen für diesen Tag.</div>';
    return;
  }

  if (alteOffene.length) {
    box.appendChild(trenner("Noch offen von früher", true));
    alteOffene.forEach((e) => box.appendChild(zeile(e, true)));
  }
  if (termine.length) {
    box.appendChild(trenner("Termine"));
    termine.forEach((e) => box.appendChild(zeile(e)));
  }
  if (tasks.length) {
    box.appendChild(trenner("Aufgaben"));
    // faellige zuerst
    tasks.sort((a, b) => (a.frist || "9999") .localeCompare(b.frist || "9999"));
    tasks.forEach((e) => box.appendChild(zeile(e)));
  }
}

function trenner(text, warn) {
  const d = document.createElement("div");
  d.className = "trenner" + (warn ? " warn" : "");
  d.textContent = text;
  return d;
}

// ---------- eine Zeile ----------
function fristMarke(e) {
  if (e.typ !== "task" || !e.frist) return null;

  const heute = alsText(new Date());
  const tage  = tageBis(e.frist, heute);
  const d     = ausText(e.frist);
  const datum = `${KURZTAGE[d.getDay()]}, ${d.getDate()}.${d.getMonth() + 1}.`;

  let text, klasse;
  if (e.status === "erledigt")  { text = "Frist war " + datum; klasse = ""; }
  else if (tage < 0)  { text = Math.abs(tage) + " Tage überfällig"; klasse = " spaet"; }
  else if (tage === 0) { text = "Heute fällig";                     klasse = " jetzt"; }
  else if (tage === 1) { text = "Morgen fällig";                    klasse = " bald"; }
  else if (tage <= 3)  { text = "In " + tage + " Tagen fällig";     klasse = " bald"; }
  else                 { text = "Frist " + datum;                   klasse = ""; }

  const s = document.createElement("span");
  s.className = "marke" + klasse;
  s.textContent = text;
  return s;
}

function zeile(e, zeigeDatum) {
  const heute = alsText(new Date());
  const ueberfaellig =
    e.typ === "task" && e.status === "offen" && e.frist && e.frist < heute;

  const wrap = document.createElement("div");
  wrap.className = "eintrag"
    + (e.status === "erledigt" ? " erledigt" : "")
    + (ueberfaellig ? " faellig" : "");

  if (e.typ === "task") {
    const h = document.createElement("button");
    h.className = "haken" + (e.status === "erledigt" ? " an" : "");
    h.type = "button";
    h.setAttribute("aria-label", "Aufgabe abhaken");
    h.textContent = e.status === "erledigt" ? "✓" : "";
    h.addEventListener("click", () =>
      updateDoc(doc(db, "eintraege", e.id), {
        status: e.status === "erledigt" ? "offen" : "erledigt"
      })
    );
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
  inhalt.appendChild(t);

  const zusatz = [];
  if (zeigeDatum) {
    const d = ausText(e.datum);
    zusatz.push(`${KURZTAGE[d.getDay()]}, ${d.getDate()}.${d.getMonth() + 1}.`);
  }
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

  const marke = fristMarke(e);
  if (marke) inhalt.appendChild(marke);

  inhalt.addEventListener("click", () => oeffneFormular(e));
  wrap.appendChild(inhalt);

  const weg = document.createElement("button");
  weg.className = "weg";
  weg.type = "button";
  weg.setAttribute("aria-label", "Löschen");
  weg.textContent = "×";
  weg.addEventListener("click", async () => {
    if (!confirm("Diesen Eintrag löschen?")) return;
    await deleteDoc(doc(db, "eintraege", e.id));
    alleCache = null;
    if (sucheAn) sucheAusfuehren();
  });
  wrap.appendChild(weg);

  return wrap;
}

// ---------- Suche ----------
$("sucheBtn").addEventListener("click", () => {
  sucheAn = true;
  $("suchleiste").classList.remove("versteckt");
  $("datumsleiste").classList.add("versteckt");
  $("sucheFeld").value = "";
  $("sucheFeld").focus();
  $("liste").innerHTML =
    '<div class="leer">Tippe mindestens zwei Zeichen.</div>';
});

$("sucheZu").addEventListener("click", schliesseSuche);

function schliesseSuche() {
  sucheAn = false;
  $("suchleiste").classList.add("versteckt");
  $("datumsleiste").classList.remove("versteckt");
  maleTag();
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
    zeigeLadefehler(e);
    return;
  }

  // Falls sich das Suchwort waehrend des Ladens geaendert hat
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
  treffer.forEach((e) => box.appendChild(zeile(e, true)));
}

// ---------- Formular ----------
function setzeTyp(neu) {
  typ = neu;
  $("typTermin").classList.toggle("aktiv", neu === "termin");
  $("typTask").classList.toggle("aktiv", neu === "task");

  $("endeFeld").classList.toggle("versteckt", neu !== "termin");
  $("fristFeld").classList.toggle("versteckt", neu !== "task");

  $("lblDatum").textContent = neu === "termin" ? "Datum" : "Geplant am";
  $("lblStart").textContent = neu === "termin" ? "Von" : "Uhrzeit (optional)";
}
$("typTermin").addEventListener("click", () => setzeTyp("termin"));
$("typTask").addEventListener("click", () => setzeTyp("task"));

function naechsteStunde() {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  if (d.getHours() < 8)  d.setHours(8);
  if (d.getHours() > 23) d.setHours(23);
  return String(d.getHours()).padStart(2, "0") + ":00";
}

function oeffneFormular(e) {
  $("formFehler").textContent = "";
  bearbeiteId = e ? e.id : null;
  $("dlgTitel").textContent = e ? "Eintrag bearbeiten" : "Neuer Eintrag";

  setzeTyp(e ? e.typ : "termin");
  $("fTitel").value = e ? e.titel : "";
  $("fDatum").value = e ? e.datum : aktiverTag;
  $("fStart").value = e ? (e.start || "") : naechsteStunde();
  $("fEnde").value  = e ? (e.ende  || "") : "";
  $("fFrist").value = e ? (e.frist || "") : "";
  $("fOrt").value   = e ? (e.ort   || "") : "";
  $("fNotiz").value = e ? (e.notiz || "") : "";

  $("dlg").showModal();
}

$("neuBtn").addEventListener("click", () => oeffneFormular(null));
$("abbrechen").addEventListener("click", () => $("dlg").close());

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
    $("formFehler").textContent =
      "Die Frist liegt vor dem geplanten Tag. Bitte prüfen.";
    return;
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
    suchtext: (titel + " " + notiz + " " + ort).toLowerCase()
  };

  try {
    if (bearbeiteId) {
      // wiederholung und status bleiben unangetastet
      await updateDoc(doc(db, "eintraege", bearbeiteId), daten);
    } else {
      daten.wiederholung = "einmal";
      daten.status = typ === "task" ? "offen" : "";
      daten.erstelltAm = serverTimestamp();
      await addDoc(collection(db, "eintraege"), daten);
    }

    alleCache = null;
    $("dlg").close();

    if (sucheAn) {
      sucheAusfuehren();
    } else if (datum !== aktiverTag) {
      aktiverTag = datum;
      zeigeTag();
    }
  } catch (e) {
    $("formFehler").textContent = "Speichern fehlgeschlagen: " + e.code;
    console.error(e);
  }
});
