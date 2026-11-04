const crypto = require("crypto");
const Langganan = require("../models/Langganan");
const Payment = require("../models/Payment");
const User = require("../models/User");
const { getPlanByCode, isPremiumFeatureEnabled } = require("../config/premiumPlans");
const { getStoredEntitlement } = require("../services/entitlement");

const sendError = (res, statusCode, code, message) =>
  res.status(statusCode).json({ statusCode, success: false, code, message });

const isMidtransConfigured = () =>
  Boolean(
    String(process.env.MIDTRANS_SERVER_KEY || "").trim() &&
      String(process.env.MIDTRANS_MERCHANT_ID || "").trim() &&
      String(process.env.MIDTRANS_CLIENT_KEY || "").trim(),
  );

const createCheckout = async (req, res) => {
  if (!isPremiumFeatureEnabled()) {
    return sendError(res, 409, "FEATURE_DISABLED", "Fitur paket sedang nonaktif.");
  }
  if (!isMidtransConfigured()) {
    return sendError(res, 503, "PAYMENT_NOT_CONFIGURED", "Pembayaran belum dikonfigurasi.");
  }

  const { package: packageCode } = req.body || {};
  const plan = getPlanByCode(packageCode);
  if (!plan) {
    return sendError(res, 400, "INVALID_PACKAGE", "Paket yang dipilih tidak tersedia.");
  }

  let paymentRecord = null;
  try {
    const user = await User.findById(req.user.id).select("name email").lean();
    if (!user) return sendError(res, 404, "USER_NOT_FOUND", "Akun tidak ditemukan.");

    const entitlement = await getStoredEntitlement(user._id);
    if (entitlement.package) {
      return res.status(409).json({
        statusCode: 409,
        success: false,
        code: "PACKAGE_ALREADY_ACTIVE",
        message: "Paket Premium Anda masih aktif. Pembelian paket baru tersedia setelah masa aktif berakhir.",
        data: { package: entitlement.package, active_until: entitlement.active_until },
      });
    }

    const safeUserId = String(user._id).slice(-10);
    const orderId = `nolla-${safeUserId}-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
    const payment = await Payment.create({
      order_id: orderId,
      user_id: user._id,
      package: plan.code,
      duration_days: plan.duration_days,
      amount: plan.final_price,
      status: "creating",
    });
    paymentRecord = payment;

    const serverKey = String(process.env.MIDTRANS_SERVER_KEY || "").trim();
    const isProduction = String(process.env.MIDTRANS_IS_PRODUCTION || "")
      .trim()
      .toLowerCase() === "true";
    const endpoint = isProduction
      ? "https://app.midtrans.com/snap/v1/transactions"
      : "https://app.sandbox.midtrans.com/snap/v1/transactions";
    const snapJsUrl = isProduction
      ? "https://app.midtrans.com/snap/snap.js"
      : "https://app.sandbox.midtrans.com/snap/snap.js";
    const auth = Buffer.from(`${serverKey}:`).toString("base64");
    const firstName = String(user.name || "Siswa").trim().split(/\s+/)[0].slice(0, 50);
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        transaction_details: { order_id: orderId, gross_amount: plan.final_price },
        item_details: [{
          id: plan.code,
          price: plan.final_price,
          quantity: 1,
          name: plan.name.slice(0, 50),
        }],
        customer_details: { first_name: firstName, email: user.email },
      }),
      signal: AbortSignal.timeout(15000),
    });
    const responseText = await response.text();
    let result = {};
    try {
      result = responseText ? JSON.parse(responseText) : {};
    } catch {
      result = {};
    }

    if (!response.ok || !result.token || !result.redirect_url) {
      await Payment.updateOne({ _id: payment._id }, { $set: { status: "failed" } });
      const providerMessage = Array.isArray(result.error_messages)
        ? result.error_messages.join("; ")
        : result.status_message || result.message || responseText || "Respons kosong/tidak dikenali";
      console.error("Midtrans Snap checkout gagal:", {
        status: response.status,
        environment: isProduction ? "production" : "sandbox",
        providerMessage: String(providerMessage).replace(/[\r\n]+/g, " ").slice(0, 500),
      });
      return sendError(res, 502, "PAYMENT_PROVIDER_ERROR", "Halaman pembayaran gagal dibuat. Silakan coba lagi.");
    }

    await Payment.updateOne(
      { _id: payment._id },
      { $set: { status: "pending", snap_token: result.token, redirect_url: result.redirect_url } },
    );
    return res.status(201).json({
      statusCode: 201,
      success: true,
      message: "Checkout berhasil dibuat.",
      data: {
        order_id: orderId,
        snap_token: result.token,
        client_key: String(process.env.MIDTRANS_CLIENT_KEY || "").trim(),
        snap_js_url: snapJsUrl,
      },
    });
  } catch (error) {
    if (paymentRecord) {
      await Payment.updateOne(
        { _id: paymentRecord._id, status: "creating" },
        { $set: { status: "failed" } },
      ).catch(() => {});
    }
    console.error("Create payment checkout error:", error.message);
    return sendError(res, 502, "PAYMENT_PROVIDER_ERROR", "Tidak dapat menghubungi layanan pembayaran. Silakan coba lagi.");
  }
};

const getMyPayment = async (req, res) => {
  try {
    let payment = await Payment.findOne({ order_id: req.params.orderId, user_id: req.user.id });
    if (!payment) return sendError(res, 404, "PAYMENT_NOT_FOUND", "Transaksi tidak ditemukan.");

    // Recover settled payments when Midtrans webhook delivery is delayed/rejected.
    if (payment.status === "pending") {
      try {
        const status = await getMidtransTransactionStatus(payment.order_id);
        const merchantId = String(process.env.MIDTRANS_MERCHANT_ID || "").trim();
        if (statusApiConfirmsPayment(status, payment, merchantId)) {
          await applyPaidPayment({
            ...payment.toObject(),
            paid_at: status.settlement_time ? new Date(status.settlement_time) : new Date(),
            midtrans_transaction_id: status.transaction_id,
            payment_type: status.payment_type,
          });
          payment = await Payment.findById(payment._id);
        }
      } catch (statusError) {
        console.warn("Midtrans status reconciliation deferred:", statusError.message);
      }
    }

    return res.status(200).json({
      statusCode: 200,
      success: true,
      data: {
        order_id: payment.order_id,
        package: payment.package,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        created_at: payment.created_at,
        paid_at: payment.paid_at,
      },
    });
  } catch (error) {
    console.error("Get payment status error:", error.message);
    return sendError(res, 500, "INTERNAL_ERROR", "Gagal mengambil status pembayaran.");
  }
};

const notificationMatches = (notification, serverKey) => {
  const expected = crypto
    .createHash("sha512")
    .update(`${notification.order_id}${notification.status_code}${notification.gross_amount}${serverKey}`)
    .digest("hex");
  const supplied = String(notification.signature_key || "");
  if (!/^[a-f\d]{128}$/i.test(supplied)) return false;
  return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(supplied, "hex"));
};

const getMidtransTransactionStatus = async (orderId) => {
  const isProduction = String(process.env.MIDTRANS_IS_PRODUCTION || "")
    .trim()
    .toLowerCase() === "true";
  const baseUrl = isProduction
    ? "https://api.midtrans.com"
    : "https://api.sandbox.midtrans.com";
  const serverKey = String(process.env.MIDTRANS_SERVER_KEY || "").trim();
  if (!serverKey) throw new Error("Midtrans Server Key belum dikonfigurasi.");

  const response = await fetch(`${baseUrl}/v2/${encodeURIComponent(orderId)}/status`, {
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${Buffer.from(`${serverKey}:`).toString("base64")}`,
    },
    signal: AbortSignal.timeout(10000),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Midtrans Get Status API HTTP ${response.status}.`);
  return body;
};

const statusApiConfirmsPayment = (status, payment, merchantId) =>
  status?.order_id === payment.order_id &&
  Number(status.gross_amount) === payment.amount &&
  (!status.currency || String(status.currency).toUpperCase() === "IDR") &&
  (!status.merchant_id || status.merchant_id === merchantId) &&
  String(status.status_code) === "200" &&
  ["settlement", "capture"].includes(String(status.transaction_status).toLowerCase()) &&
  String(status.fraud_status || "accept").toLowerCase() === "accept";

const applyPaidPayment = async (payment) => {
  const now = new Date();
  const existing = await Langganan.findOne({ payment_order_id: payment.order_id }).select("_id").lean();
  if (!existing) {
    const priorPeriods = await Langganan.find({ user_id: payment.user_id, cancelled_at: null })
      .select("ends_at")
      .lean();
    const latestEnd = priorPeriods.reduce((latest, period) => {
      const end = new Date(period.ends_at);
      return end > latest ? end : latest;
    }, now);
    const startsAt = latestEnd > now ? latestEnd : now;
    const endsAt = new Date(startsAt.getTime() + payment.duration_days * 24 * 60 * 60 * 1000);
    try {
      await Langganan.create({
        user_id: payment.user_id,
        source: "payment",
        package: payment.package,
        payment_order_id: payment.order_id,
        starts_at: startsAt,
        ends_at: endsAt,
      });
    } catch (error) {
      if (error.code !== 11000) throw error;
    }
  }
  await Payment.updateOne(
    { _id: payment._id },
    {
      $set: {
        status: "paid",
        paid_at: payment.paid_at || now,
        midtrans_transaction_id: payment.midtrans_transaction_id || null,
        payment_type: payment.payment_type || null,
        last_notification_at: now,
      },
    },
  );
};

const handleMidtransNotification = async (req, res) => {
  const notification = req.body || {};
  const serverKey = String(process.env.MIDTRANS_SERVER_KEY || "").trim();
  const merchantId = String(process.env.MIDTRANS_MERCHANT_ID || "").trim();
  if (notification.merchant_id !== merchantId) {
    return sendError(res, 401, "INVALID_MERCHANT", "Merchant ID notifikasi tidak cocok.");
  }

  try {
    let payment = await Payment.findOne({ order_id: notification.order_id });
    if (!payment) {
      if (!serverKey || !notificationMatches(notification, serverKey)) {
        return sendError(res, 401, "INVALID_SIGNATURE", "Signature notifikasi tidak valid.");
      }
      // Midtrans retries 4xx responses. Signed test notifications or events for
      // orders outside this app have no local payment to update, so acknowledge
      // receipt with 200 and do not grant entitlement.
      console.warn("Midtrans notification ignored: local order not found.", {
        order_id: String(notification.order_id || "").slice(0, 80),
      });
      return res.status(200).json({ success: true, received: true, ignored: "unknown_order" });
    }
    let trustedNotification = notification;
    if (!serverKey || !notificationMatches(notification, serverKey)) {
      // Authenticate the transaction independently with Midtrans before
      // accepting a webhook whose signature does not match the configured key.
      const status = await getMidtransTransactionStatus(payment.order_id);
      if (!statusApiConfirmsPayment(status, payment, merchantId)) {
        return sendError(res, 401, "INVALID_SIGNATURE", "Signature notifikasi tidak valid.");
      }
      trustedNotification = status;
      console.warn("Midtrans notification verified by Get Status API:", {
        order_id: payment.order_id,
      });
    }

    const currency = trustedNotification.currency || notification.currency;
    if (Number(trustedNotification.gross_amount) !== payment.amount || String(currency || "").toUpperCase() !== "IDR") {
      return sendError(res, 400, "PAYMENT_AMOUNT_MISMATCH", "Nilai transaksi tidak cocok.");
    }

    const status = String(trustedNotification.transaction_status || "").toLowerCase();
    const fraudStatus = String(trustedNotification.fraud_status || "accept").toLowerCase();
    if (
      String(notification.status_code) === "200" &&
      (status === "settlement" || status === "capture") &&
      fraudStatus === "accept"
    ) {
      await applyPaidPayment({
        ...payment.toObject(),
        paid_at: trustedNotification.settlement_time ? new Date(trustedNotification.settlement_time) : new Date(),
        midtrans_transaction_id: trustedNotification.transaction_id,
        payment_type: trustedNotification.payment_type,
      });
      return res.status(200).json({ success: true });
    }

    const nextStatus = {
      pending: "pending",
      expire: "expired",
      cancel: "cancelled",
      deny: "failed",
      failure: "failed",
      refund: "refunded",
      partial_refund: "refunded",
    }[status];
    if (nextStatus && (payment.status !== "paid" || nextStatus === "refunded")) {
      payment.status = nextStatus;
      payment.midtrans_transaction_id = trustedNotification.transaction_id || payment.midtrans_transaction_id;
      payment.payment_type = trustedNotification.payment_type || payment.payment_type;
      payment.last_notification_at = new Date();
      await payment.save();
    }
    if (nextStatus === "refunded") {
      await Langganan.updateOne(
        { payment_order_id: payment.order_id, cancelled_at: null },
        { $set: { cancelled_at: new Date() } },
      );
    }
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Midtrans notification processing error:", error.message);
    return sendError(res, 500, "NOTIFICATION_PROCESSING_FAILED", "Notifikasi pembayaran gagal diproses.");
  }
};

module.exports = { createCheckout, getMyPayment, handleMidtransNotification };
