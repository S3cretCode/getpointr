import { customAlphabet } from "nanoid";

// No 0/O/1/I so codes are easy to read aloud or type.
const roomAlphabet = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);

export const newRoomId = () => roomAlphabet();

export const normalizeRoom = (raw: string) =>
  raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);

/** Demo "pairing fingerprint": SHA-256 of the room, shown like a key fingerprint. */
export async function fingerprint(room: string): Promise<string> {
  const data = new TextEncoder().encode(`getpointr:trusted-circle:${room}`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  const hex = Array.from(new Uint8Array(hash))
    .slice(0, 8)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
  return hex.match(/.{4}/g)!.join(" · ");
}
