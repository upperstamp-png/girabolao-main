self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Listener para receber as notificações Push
self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const payload = event.data.json();
    const title = payload.title || "Bolão Copa 2026";
    const options = {
      body: payload.body || "",
      icon: "/favicon.ico", // fallback favicon
      badge: "/favicon.ico",
      data: {
        url: payload.url || "/",
        notification_id: payload.notification_id
      },
      tag: payload.tag || payload.notification_id || "general_push",
      renotify: true,
      requireInteraction: true, // a notificação fica visível até o usuário interagir
      vibrate: [200, 100, 200]
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
      // Tenta achar uma aba aberta com a mesma origem e focar nela
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          return client.focus().then((focusedClient) => {
            if ("navigate" in focusedClient) {
              return focusedClient.navigate(urlToOpen);
            }
          });
        }
      }
      // Se não achar aba ativa, abre uma nova
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
