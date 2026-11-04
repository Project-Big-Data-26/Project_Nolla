let snapScriptPromise = null;

const loadSnapScript = ({ clientKey, scriptUrl }) => {
  if (window.snap?.pay) return Promise.resolve(window.snap);
  if (snapScriptPromise) return snapScriptPromise;
  if (!clientKey || !scriptUrl) {
    return Promise.reject(new Error("Konfigurasi Snap belum lengkap."));
  }

  snapScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById("midtrans-snap-script");
    const script = existingScript || document.createElement("script");
    script.id = "midtrans-snap-script";
    script.src = scriptUrl;
    script.setAttribute("data-client-key", clientKey);
    script.async = true;

    script.addEventListener("load", () => {
      if (window.snap?.pay) resolve(window.snap);
      else reject(new Error("Snap gagal dimuat."));
    }, { once: true });
    script.addEventListener("error", () => reject(new Error("Tidak dapat memuat Snap.")), { once: true });

    if (!existingScript) document.head.appendChild(script);
  }).catch((error) => {
    snapScriptPromise = null;
    document.getElementById("midtrans-snap-script")?.remove();
    throw error;
  });

  return snapScriptPromise;
};

export const openSnapCheckout = async (checkout, callbacks) => {
  if (!checkout?.snap_token) throw new Error("Token pembayaran tidak tersedia.");
  const snap = await loadSnapScript({
    clientKey: checkout.client_key,
    scriptUrl: checkout.snap_js_url,
  });
  snap.pay(checkout.snap_token, callbacks);
};
