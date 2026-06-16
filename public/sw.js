const CACHE_NAME = "bolao-copa-cache-v1";
const OFFLINE_URL = "/";

// Arquivos críticos a pré-cachear
const STATIC_ASSETS = [
  "/",
  "/manifest.webmanifest",
  "https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500;1,600;1,700;1,800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&display=swap",
  "https://img.icons8.com/color/192/trophy.png",
  "https://img.icons8.com/color/512/trophy.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => {
        return Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
          }),
        );
      })
      .then(() => self.clients.claim()),
  );
});

// Interceptar requisições (Modo Offline)
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Apenas intercepta requisições do tipo GET
  if (req.method !== "GET") return;

  // 1. Estratégia para chamadas à API do Supabase (dados em tempo real/tabelas)
  // Network-First com timeout curto. Se cair/offline, cai no Cache.
  if (url.hostname.includes("supabase.co") && url.pathname.includes("/rest/v1/")) {
    event.respondWith(networkFirstWithTimeout(req, 2500));
    return;
  }

  // 2. Estratégia Stale-While-Revalidate para assets estáticos e scripts locais
  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      const fetchPromise = fetch(req)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(req, networkResponse.clone());
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Ignora falhas de rede no background
        });

      return cachedResponse || fetchPromise;
    }),
  );
});

// Implementação de Network-First com tempo limite para chamadas de API
async function networkFirstWithTimeout(request, timeoutMs) {
  const cache = await caches.open(CACHE_NAME);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (response.status === 200 || response.status === 201) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    clearTimeout(timeoutId);
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    // Caso offline absoluto e sem cache, retorna response genérica offline
    return new Response(
      JSON.stringify({
        error: "Você está offline e estes dados não estão armazenados localmente.",
        offline: true,
      }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }
}

// ==========================================
// Listener para receber as notificações Push
// ==========================================
self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const payload = event.data.json();
    const title = payload.title || "Bolão Copa 2026";
    const isGoal = payload.type === "goal";

    const options = {
      body: payload.body || "",
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      data: {
        url: payload.url || "/",
        notification_id: payload.notification_id,
        type: payload.type || "general",
      },
      tag: payload.tag || payload.notification_id || "general_push",
      renotify: true,
      requireInteraction: isGoal,
      vibrate: isGoal ? [200, 100, 200, 100, 400] : [200, 100, 200],
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    console.error("Erro ao processar push event no service worker:", err);
  }
});

// Listener ao clicar na notificação
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          return client.focus().then((focusedClient) => {
            if ("navigate" in focusedClient) {
              return focusedClient.navigate(urlToOpen);
            }
          });
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    }),
  );
});
