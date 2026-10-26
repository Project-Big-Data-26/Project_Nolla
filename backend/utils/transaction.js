const mongoose = require("mongoose");

let supportPromise = null;

// Transaksi hanya tersedia pada replica set (termasuk Atlas) atau sharded cluster.
const supportsTransactions = () => {
  supportPromise ??= mongoose.connection.db
    .admin()
    .command({ hello: 1 })
    .then((hello) => Boolean(hello.setName) || hello.msg === "isdbgrid")
    .catch((error) => {
      supportPromise = null;
      throw error;
    });
  return supportPromise;
};

class TransactionAbort extends Error {
  constructor(statusCode, message, data) {
    super(message);
    this.statusCode = statusCode;
    this.data = data;
  }
}

// fn menerima ClientSession, atau null bila topologi tidak mendukung transaksi.
// fn bisa dipanggil ulang oleh driver saat transient error; jangan ada efek di luar database.
const withOptionalTransaction = async (fn) => {
  if (!(await supportsTransactions())) return fn(null);

  const dbSession = await mongoose.startSession();
  try {
    let result;
    await dbSession.withTransaction(async () => {
      result = await fn(dbSession);
    });
    return result;
  } finally {
    await dbSession.endSession();
  }
};

const isDuplicateKeyError = (error) => error?.code === 11000;

module.exports = {
  TransactionAbort,
  isDuplicateKeyError,
  supportsTransactions,
  withOptionalTransaction,
};
