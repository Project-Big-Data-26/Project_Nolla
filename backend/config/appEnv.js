// Environment aplikasi. Kosong = development; nilai tidak dikenal = gagal start.
// Fitur khusus staging (mis. pintu cek soal) hanya aktif bila APP_ENV=staging.
const APP_ENVS = ["development", "staging", "production"];

class AppEnvError extends Error {}

const getAppEnv = (env = process.env) => {
  const raw = env.APP_ENV;
  if (raw === undefined || String(raw).trim() === "") return "development";
  const value = String(raw).trim().toLowerCase();
  if (!APP_ENVS.includes(value)) {
    throw new AppEnvError(`- APP_ENV harus salah satu dari: ${APP_ENVS.join(", ")}`);
  }
  return value;
};

const isStagingEnv = (env = process.env) => getAppEnv(env) === "staging";

module.exports = { APP_ENVS, AppEnvError, getAppEnv, isStagingEnv };
