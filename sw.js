/* Orbyx – Service Worker
 *
 * Aufgabe: die App startet auch ohne Netz und laesst sich auf dem
 * Homescreen installieren.
 *
 * Bewusst einfach gehalten:
 *   - Die eigenen Dateien kommen zuerst aus dem Cache, werden aber im
 *     Hintergrund erneuert (stale-while-revalidate).
 *   - Firebase und Google laufen NIE ueber den Cache. Termine muessen
 *     aktuell sein, und Firestore bringt seinen eigenen Zwischenspeicher
 *     mit.
 *
 * WICHTIG: Nach JEDER Aenderung an index.html, app.js oder i18n.js die
 * Zahl in VERSION erhoehen. Sonst zeigen schon installierte Handys
 * weiter die alte Fassung, egal was auf dem Server liegt.
 */

const VERSION = "orbyx-5";
const DATEIEN = [
  "./",
  "./index.html",
  "./app.js",
  "./i18n.js",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", (ev) => {
  ev.waitUntil(
    caches.open(VERSION)
      .then((c) => c.addAll(DATEIEN))
      .then(() => self.skipWaiting())
      .catch((e) => console.log("SW install:", e))
  );
});

self.addEventListener("activate", (ev) => {
  ev.waitUntil(
    caches.keys()
      .then((namen) => Promise.all(
        namen.filter((n) => n !== VERSION).map((n) => caches.delete(n))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (ev) => {
  const url = new URL(ev.request.url);

  // Nur eigene Dateien, nur normale Abrufe
  if (ev.request.method !== "GET") return;
  if (url.origin !== self.location.origin) return;

  ev.respondWith(
    caches.match(ev.request).then((treffer) => {
      const ausNetz = fetch(ev.request).then((antwort) => {
        if (antwort && antwort.status === 200) {
          const kopie = antwort.clone();
          caches.open(VERSION).then((c) => c.put(ev.request, kopie));
        }
        return antwort;
      }).catch(() => treffer);

      return treffer || ausNetz;
    })
  );
});

/* Die App fragt beim Tippen auf das Symbol nach, welche Fassung hier
   eingebaut ist. So steht die Zahl nur an EINER Stelle, naemlich oben. */
self.addEventListener("message", (ev) => {
  if (ev.data === "fassung" && ev.ports && ev.ports[0]) {
    ev.ports[0].postMessage({ fassung: VERSION });
  }
});
