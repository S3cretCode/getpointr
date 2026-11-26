"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Role, RoomEvent } from "./types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * "supabase": phone ↔ laptop over Supabase Realtime (Broadcast + Presence).
 * "local":    no keys configured → tabs of the same browser talk via BroadcastChannel.
 */
export const realtimeMode: "supabase" | "local" =
  SUPABASE_URL && SUPABASE_KEY ? "supabase" : "local";

let client: SupabaseClient | null = null;
function getClient() {
  if (!client) {
    client = createClient(SUPABASE_URL!, SUPABASE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
      realtime: { params: { eventsPerSecond: 40 } },
    });
  }
  return client;
}

export type ConnStatus = "connecting" | "live" | "error";
export type SendFn = (e: RoomEvent) => void;

/**
 * Joins a GetPointr room. Handlers are kept in refs, so callers can pass
 * fresh closures every render without resubscribing.
 */
export function useRoom(
  room: string,
  role: Role,
  onEvent: (e: RoomEvent, send: SendFn) => void,
  onPeer?: (present: boolean, send: SendFn) => void,
) {
  const eventRef = useRef(onEvent);
  const peerCbRef = useRef(onPeer);
  useEffect(() => {
    eventRef.current = onEvent;
    peerCbRef.current = onPeer;
  });

  const sendRef = useRef<SendFn>(() => {});
  const lastPeer = useRef(false);
  const [peer, setPeer] = useState(false);
  const [remoteStatus, setRemoteStatus] = useState<ConnStatus>("connecting");

  useEffect(() => {
    if (!room) return;
    const emit: SendFn = (ev) => sendRef.current(ev);

    const updatePeer = (v: boolean) => {
      if (lastPeer.current === v) return;
      lastPeer.current = v;
      setPeer(v);
      peerCbRef.current?.(v, emit);
    };

    let cleanup: () => void;

    if (realtimeMode === "supabase") {
      const sb = getClient();
      const ch = sb.channel(`gp-${room}`, {
        config: {
          broadcast: { self: false, ack: false },
          presence: { key: `${role}-${Math.random().toString(36).slice(2, 8)}` },
        },
      });
      ch.on("broadcast", { event: "e" }, ({ payload }) => eventRef.current(payload as RoomEvent, emit));
      ch.on("presence", { event: "sync" }, () => {
        const state = ch.presenceState<{ role: Role }>();
        updatePeer(Object.values(state).flat().some((p) => p.role !== role));
      });
      ch.subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          setRemoteStatus("live");
          await ch.track({ role, at: Date.now() });
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setRemoteStatus("error");
        }
      });
      sendRef.current = (e) => {
        void ch.send({ type: "broadcast", event: "e", payload: e });
      };
      cleanup = () => {
        void sb.removeChannel(ch);
      };
    } else {
      const bc = new BroadcastChannel(`gp-${room}`);
      let lastSeen = 0;
      bc.onmessage = (m) => {
        const d = m.data;
        if (d && typeof d === "object" && "hb" in d) {
          if (d.hb !== role) {
            lastSeen = Date.now();
            updatePeer(true);
          }
          return;
        }
        eventRef.current(d as RoomEvent, emit);
      };
      const beat = () => bc.postMessage({ hb: role });
      beat();
      const iv = setInterval(() => {
        beat();
        if (lastSeen && Date.now() - lastSeen > 4000) updatePeer(false);
      }, 1500);
      sendRef.current = (e) => bc.postMessage(e);
      cleanup = () => {
        clearInterval(iv);
        bc.close();
      };
    }

    return () => {
      sendRef.current = () => {};
      lastPeer.current = false;
      cleanup();
    };
  }, [room, role]);

  const send = useCallback<SendFn>((e) => sendRef.current(e), []);
  const status: ConnStatus = realtimeMode === "local" ? "live" : remoteStatus;
  return { send, peer, status, mode: realtimeMode };
}
