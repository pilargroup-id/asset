const path = require('path');
const dotenv = require('dotenv');

const envFile = process.env.NODE_ENV === 'production' ? '.env' : '.env.local';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

function required(name) {
  const value = process.env[name];
  if (!value || String(value).trim() === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return String(value).trim();
}

function numberEnv(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value)) throw new Error(`Environment variable ${name} must be numeric`);
  return value;
}

function boolEnv(name, fallback = false) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  return String(raw).toLowerCase() === 'true';
}

const config = {
  app: {
    name: process.env.APP_NAME || 'asset',
    slug: process.env.APP_SLUG || 'asset',
    port: numberEnv('APP_PORT', 3000),
    env: process.env.NODE_ENV || 'development',
  },
  auth: {
    jwtSecret: required('JWT_SECRET'),
    pilargroupUrl: (process.env.PILARGROUP_URL || 'https://pilargroup.id').replace(/\/$/, ''),
    meTimeoutMs: numberEnv('AUTH_ME_TIMEOUT_MS', 10000),
  },
  directory: {
    internalSecret: process.env.INTERNAL_SYNC_SECRET || '',
    basePath: process.env.PILARGROUP_DIRECTORY_BASE_PATH || '/api/internal/directory',
    timeoutMs: numberEnv('DIRECTORY_TIMEOUT_MS', 10000),
  },
  cors: { origin: process.env.CORS_ORIGIN || 'http://localhost:5173' },
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: numberEnv('DB_PORT', 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || '',
    connectionLimit: numberEnv('DB_CONNECTION_LIMIT', 10),
  },
  import: {
    maxFileMb: numberEnv('IMPORT_MAX_FILE_MB', 20),
    previewTtlMinutes: numberEnv('IMPORT_PREVIEW_TTL_MINUTES', 60),
  },
  consumable: {
    allowNegativeStock: boolEnv('ALLOW_NEGATIVE_CONSUMABLE_STOCK', false),
  },
  dev: {
    authEnabled: boolEnv('DEV_AUTH_ENABLED', false),
    authUsername: process.env.DEV_AUTH_USERNAME || '',
    authPassword: process.env.DEV_AUTH_PASSWORD || '',
  },
};

if (config.app.env === 'development' && config.dev.authEnabled) {
  if (!config.dev.authUsername || !config.dev.authPassword) {
    throw new Error('DEV_AUTH_ENABLED=true but DEV_AUTH_USERNAME or DEV_AUTH_PASSWORD is missing');
  }
}

module.exports = config;
