const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const config = require('../config');

const STORAGE_DIR = path.resolve(__dirname, '../../storage/import-previews');
const TOKEN_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function ensureDir() {
  await fs.mkdir(STORAGE_DIR, { recursive: true });
}

function ttlMs() {
  return config.import.previewTtlMinutes * 60 * 1000;
}

function assertToken(token) {
  if (!TOKEN_RE.test(String(token || ''))) return false;
  return true;
}

function filePath(token) {
  if (!assertToken(token)) return null;
  return path.join(STORAGE_DIR, `${token}.json`);
}

async function save(payload) {
  await ensureDir();
  const token = crypto.randomUUID();
  const createdAt = Date.now();
  const record = {
    ...payload,
    token,
    created_at: new Date(createdAt).toISOString(),
    expires_at: new Date(createdAt + ttlMs()).toISOString(),
  };
  await fs.writeFile(filePath(token), JSON.stringify(record), 'utf8');
  return record;
}

async function get(token) {
  await ensureDir();
  const target = filePath(token);
  if (!target) return null;
  let record;
  try {
    record = JSON.parse(await fs.readFile(target, 'utf8'));
  } catch {
    return null;
  }
  if (!record?.expires_at || Date.parse(record.expires_at) <= Date.now()) {
    await remove(token);
    return null;
  }
  return record;
}

async function remove(token) {
  const target = filePath(token);
  if (!target) return;
  try {
    await fs.unlink(target);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

async function cleanupExpired() {
  await ensureDir();
  const files = await fs.readdir(STORAGE_DIR);
  await Promise.all(files.filter((name) => name.endsWith('.json')).map(async (name) => {
    try {
      const full = path.join(STORAGE_DIR, name);
      const record = JSON.parse(await fs.readFile(full, 'utf8'));
      if (!record?.expires_at || Date.parse(record.expires_at) <= Date.now()) await fs.unlink(full);
    } catch {
      // Ignore malformed temporary files; they are not business records.
    }
  }));
}

module.exports = { save, get, remove, cleanupExpired, STORAGE_DIR };
