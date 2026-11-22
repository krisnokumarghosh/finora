import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

export const hashPin = (pin: string) => {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(pin, salt, 32).toString("hex")}`;
};

export const verifyPin = (pin: string, stored: string) => {
  const [salt, hash] = stored.split(":");
  return timingSafeEqual(scryptSync(pin, salt, 32), Buffer.from(hash, "hex"));
};