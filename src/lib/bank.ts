import type { AppState, BankAction } from "./types";

/** Pure reducer for the mock banking app. Returns the same object when nothing changes. */
export function applyAction(s: AppState, a: BankAction): AppState {
  switch (a.type) {
    case "nav":
      return s.screen === a.screen ? s : { ...s, screen: a.screen };
    case "payee":
      return { ...s, payee: a.name };
    case "amount":
      return { ...s, amount: a.value };
    case "continue":
      return s.payee && s.amount ? { ...s, screen: "confirm", smsShown: false } : s;
    case "sms":
      return s.screen === "confirm" ? { ...s, smsShown: true } : s;
    case "confirm":
      return s.smsShown ? { ...s, screen: "success" } : s;
    case "done":
      return { ...s, screen: "home", payee: null, amount: null, smsShown: false };
    case "toggle":
      return { ...s, [a.key]: !s[a.key] };
  }
}

export const fmtUSD = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });
