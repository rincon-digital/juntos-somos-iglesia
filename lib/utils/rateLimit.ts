import { headers } from "next/headers";

export interface RateLimitConfig {
  maxAttempts?: number; // Por defecto: 5 intentos fallidos
  blockDurationMs?: number; // Por defecto: 3 minutos (180,000 ms)
  windowMs?: number; // Ventana para reiniciar intentos si no fue bloqueado (15 min)
}

interface AttemptRecord {
  attempts: number;
  firstAttemptAt: number;
  blockedUntil: number | null;
}

export interface RateLimitStatus {
  blocked: boolean;
  remainingSeconds: number;
  remainingAttempts: number;
  message?: string;
}

const DEFAULT_MAX_ATTEMPTS = 5;
const DEFAULT_BLOCK_DURATION_MS = 3 * 60 * 1000; // 3 minutos
const DEFAULT_WINDOW_MS = 15 * 60 * 1000; // 15 minutos

// Persistimos el mapa en globalThis para que sobreviva a recargas en desarrollo (HMR)
declare global {
  var rateLimitStoreGlobal: Map<string, AttemptRecord> | undefined;
}

const rateLimitStore: Map<string, AttemptRecord> =
  globalThis.rateLimitStoreGlobal ?? new Map<string, AttemptRecord>();

if (process.env.NODE_ENV !== "production") {
  globalThis.rateLimitStoreGlobal = rateLimitStore;
}

/**
 * Obtiene la IP del cliente desde las cabeceras de la petición en Next.js
 */
export async function getClientIp(): Promise<string> {
  try {
    const headerStore = await headers();
    const forwardedFor = headerStore.get("x-forwarded-for");
    if (forwardedFor) {
      return forwardedFor.split(",")[0].trim();
    }
    const realIp = headerStore.get("x-real-ip");
    if (realIp) {
      return realIp.trim();
    }
    return "local-client";
  } catch {
    return "local-client";
  }
}

/**
 * Formatea segundos restantes en un texto legible (ej. "2m 30s" o "45s")
 */
export function formatRemainingTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0) {
    return secs > 0 ? `${mins}m ${secs}s` : `${mins} min`;
  }
  return `${secs}s`;
}

function getKeys(action: string, ip: string, identifier?: string): string[] {
  const cleanAction = action.trim().toLowerCase();
  const keys = [`${cleanAction}:ip:${ip}`];
  if (identifier && identifier.trim()) {
    keys.push(`${cleanAction}:id:${identifier.trim().toLowerCase()}`);
  }
  return keys;
}

function cleanExpiredRecord(
  key: string,
  now: number,
  windowMs: number,
): AttemptRecord | undefined {
  const record = rateLimitStore.get(key);
  if (!record) return undefined;

  // Si estaba bloqueado y ya pasó el tiempo de bloqueo, limpiamos el registro
  if (record.blockedUntil && now >= record.blockedUntil) {
    rateLimitStore.delete(key);
    return undefined;
  }

  // Si no estaba bloqueado pero expiró la ventana de intentos, reiniciamos
  if (!record.blockedUntil && now - record.firstAttemptAt >= windowMs) {
    rateLimitStore.delete(key);
    return undefined;
  }

  return record;
}

/**
 * Verifica si una acción se encuentra bloqueada antes de procesarla.
 */
export async function checkRateLimit(
  action: string,
  identifier?: string,
  config?: RateLimitConfig,
): Promise<RateLimitStatus> {
  const maxAttempts = config?.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const windowMs = config?.windowMs ?? DEFAULT_WINDOW_MS;
  const now = Date.now();
  const ip = await getClientIp();
  const keys = getKeys(action, ip, identifier);

  let maxBlockedUntil = 0;
  let maxCurrentAttempts = 0;

  for (const key of keys) {
    const record = cleanExpiredRecord(key, now, windowMs);
    if (!record) continue;

    if (record.blockedUntil && record.blockedUntil > now) {
      if (record.blockedUntil > maxBlockedUntil) {
        maxBlockedUntil = record.blockedUntil;
      }
    }
    if (record.attempts > maxCurrentAttempts) {
      maxCurrentAttempts = record.attempts;
    }
  }

  if (maxBlockedUntil > now) {
    const remainingSeconds = Math.ceil((maxBlockedUntil - now) / 1000);
    return {
      blocked: true,
      remainingSeconds,
      remainingAttempts: 0,
      message: `Demasiados intentos fallidos. Por seguridad, intenta nuevamente en ${formatRemainingTime(remainingSeconds)}.`,
    };
  }

  return {
    blocked: false,
    remainingSeconds: 0,
    remainingAttempts: Math.max(0, maxAttempts - maxCurrentAttempts),
  };
}

/**
 * Registra un intento fallido. Al alcanzar 5 intentos fallidos, bloquea la petición por 3 minutos.
 */
export async function recordFailedAttempt(
  action: string,
  identifier?: string,
  config?: RateLimitConfig,
): Promise<RateLimitStatus> {
  const maxAttempts = config?.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const blockDurationMs = config?.blockDurationMs ?? DEFAULT_BLOCK_DURATION_MS;
  const windowMs = config?.windowMs ?? DEFAULT_WINDOW_MS;
  const now = Date.now();
  const ip = await getClientIp();
  const keys = getKeys(action, ip, identifier);

  let highestAttempts = 0;
  let blockedUntilTimestamp: number | null = null;

  for (const key of keys) {
    const existing = cleanExpiredRecord(key, now, windowMs);
    const updatedAttempts = (existing?.attempts ?? 0) + 1;
    const isNowBlocked = updatedAttempts >= maxAttempts;
    const blockedUntil = isNowBlocked
      ? existing?.blockedUntil && existing.blockedUntil > now
        ? existing.blockedUntil
        : now + blockDurationMs
      : null;

    rateLimitStore.set(key, {
      attempts: updatedAttempts,
      firstAttemptAt: existing?.firstAttemptAt ?? now,
      blockedUntil,
    });

    if (updatedAttempts > highestAttempts) {
      highestAttempts = updatedAttempts;
    }
    if (blockedUntil && (!blockedUntilTimestamp || blockedUntil > blockedUntilTimestamp)) {
      blockedUntilTimestamp = blockedUntil;
    }
  }

  if (blockedUntilTimestamp && blockedUntilTimestamp > now) {
    const remainingSeconds = Math.ceil((blockedUntilTimestamp - now) / 1000);
    return {
      blocked: true,
      remainingSeconds,
      remainingAttempts: 0,
      message: `Has alcanzado los ${maxAttempts} intentos fallidos. Petición bloqueada durante ${formatRemainingTime(remainingSeconds)}.`,
    };
  }

  const remainingAttempts = Math.max(0, maxAttempts - highestAttempts);
  return {
    blocked: false,
    remainingSeconds: 0,
    remainingAttempts,
  };
}

/**
 * Limpia el contador de intentos fallidos cuando la operación es exitosa.
 */
export async function clearRateLimit(
  action: string,
  identifier?: string,
): Promise<void> {
  const ip = await getClientIp();
  const keys = getKeys(action, ip, identifier);
  for (const key of keys) {
    rateLimitStore.delete(key);
  }
}
