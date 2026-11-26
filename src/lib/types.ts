export type Role = "host" | "helper";

export type Screen = "home" | "transfer" | "confirm" | "success" | "settings";

export type AppState = {
  screen: Screen;
  payee: string | null;
  amount: number | null;
  smsShown: boolean;
  faceId: boolean;
  alerts: boolean;
  cardLocked: boolean;
};

export const INITIAL_STATE: AppState = {
  screen: "home",
  payee: null,
  amount: null,
  smsShown: false,
  faceId: true,
  alerts: true,
  cardLocked: false,
};

export type Tool = "ring" | "arrow" | "step";

export type Marker = {
  id: string;
  x: number; // logical px inside the 390-wide stage
  y: number;
  tool: Tool;
  step?: number;
  done?: boolean;
};

export type Pt = { x: number; y: number };

/** Everything that travels over the realtime channel. Metadata only, never pixels. */
export type RoomEvent =
  | { type: "markers"; markers: Marker[] } // helper -> host (full list, idempotent)
  | { type: "laser"; x: number; y: number } // helper -> host (live drag point)
  | { type: "laser-end"; path?: Pt[] } // helper -> host (completed laser gesture)
  | { type: "say"; id: string; text: string } // helper -> host caption
  | { type: "shield"; on: boolean } // helper -> host
  | { type: "mandatory-shield"; locked: boolean } // host -> helper (locks helper shield on)
  | { type: "prefs-open"; open: boolean } // host -> helper (blurs helper mirror while open)
  | { type: "state"; state: AppState } // host -> helper (mirror sync)
  | { type: "viewport"; h: number } // host -> helper (logical height)
  | { type: "tap"; x: number; y: number } // host -> helper (where the owner tapped)
  | { type: "done"; id: string } // host -> helper (owner tapped a marker)
  | { type: "sync" } // either side asks the other to resend its data
  | { type: "end" };

export type BankAction =
  | { type: "nav"; screen: Screen }
  | { type: "payee"; name: string }
  | { type: "amount"; value: number }
  | { type: "continue" }
  | { type: "sms" }
  | { type: "confirm" }
  | { type: "done" }
  | { type: "toggle"; key: "faceId" | "alerts" | "cardLocked" };

export const HELPER_NAME = "Alex's Laptop";
export const HELPER_SHORT = "Alex";
export const OWNER_NAME = "Margaret";

export const SCREEN_LABEL: Record<Screen, string> = {
  home: "Home",
  transfer: "Send money",
  confirm: "Review transfer",
  success: "Transfer sent",
  settings: "Settings",
};
