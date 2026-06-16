import { callFn, type Identidade } from "./bolao";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Verifica se notificações push são suportadas pelo navegador e ambiente
 */
export function isPushSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "serviceWorker" in navigator && "PushManager" in window;
}

/**
 * Retorna o estado atual da permissão de notificação
 */
export function getNotificationPermissionState(): NotificationPermission {
  if (typeof window === "undefined" || !("Notification" in window)) return "default";
  return Notification.permission;
}

/**
 * Verifica se o app está rodando em modo standalone (PWA instalado) no iOS/Safari
 */
export function isIOSStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as any).standalone === true;
  return isIOS && isStandalone;
}

/**
 * Inscreve o navegador para receber notificações push
 */
export async function subscribeToPush(identidade: Identidade): Promise<PushSubscription | null> {
  if (!isPushSupported()) {
    throw new Error("Notificações push não são suportadas por este navegador.");
  }

  // 1. Solicita permissão
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Permissão para notificações não concedida.");
  }

  // 2. Registra o Service Worker (se não estiver registrado)
  const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });

  // Aguarda o SW ficar pronto com timeout
  await Promise.race([
    navigator.serviceWorker.ready,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout ao carregar Service Worker")), 8000),
    ),
  ]);

  // 3. Busca a chave pública VAPID do backend
  const { publicKey } = await callFn<{ publicKey: string }>("web-push", undefined, "GET");
  if (!publicKey) {
    throw new Error("Chave pública VAPID não configurada no backend.");
  }

  // 4. Inscreve a máquina no PushManager do browser
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }

  // 5. Envia a inscrição para salvar no banco do Supabase
  await callFn(
    "web-push",
    {
      action: "register",
      nome: identidade.nome,
      pin: identidade.pin,
      subscription: sub.toJSON(),
      user_agent: navigator.userAgent,
    },
    "POST",
  );

  return sub;
}

/**
 * Cancela a inscrição de push local e notifica o backend
 */
export async function unsubscribeFromPush(identidade: Identidade): Promise<void> {
  if (!isPushSupported()) return;

  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) return;

  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;

  // 1. Notifica o backend
  await callFn(
    "web-push",
    {
      action: "unregister",
      nome: identidade.nome,
      pin: identidade.pin,
      endpoint: sub.endpoint,
    },
    "POST",
  ).catch((err) => console.warn("Erro ao desregistrar no backend:", err));

  // 2. Cancela no browser
  await sub.unsubscribe();
}
