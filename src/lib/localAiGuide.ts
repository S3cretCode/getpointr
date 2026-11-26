import type { AppState, Screen, Tool } from "./types";

export type LocalGoal =
  | { kind: "send_money"; payee: "Mom" | "David" | "Sarah"; amount: 20 | 50 | 100 | 250 }
  | { kind: "toggle_setting"; setting: "cardLocked" | "faceId" | "alerts"; desired: boolean; label: string }
  | { kind: "show_balance" }
  | { kind: "show_security" }
  | { kind: "scam_check" };

export type LocalAiStep = {
  target: string | null;
  tool: Tool;
  caption: string;
  done: boolean;
  /** Sanitized snapshot showing how Privacy Shield masks personal values before Local AI processes the screen. */
  sanitizedContext: string;
};

const VALID_AMOUNTS: (20 | 50 | 100 | 250)[] = [20, 50, 100, 250];

function closestAmount(raw: number): 20 | 50 | 100 | 250 {
  return VALID_AMOUNTS.reduce((best, cur) => (Math.abs(cur - raw) < Math.abs(best - raw) ? cur : best), 50);
}

/**
 * Deterministic 100% client-side intent parser.
 * Runs locally in browser memory with zero network requests and zero cloud APIs.
 */
export function parseLocalRequest(input: string): { goal: LocalGoal; summary: string } {
  const q = input.toLowerCase().trim();

  if (/(scam|code|otp|password|someone called|stranger|share)/.test(q)) {
    return {
      goal: { kind: "scam_check" },
      summary: "Safety & scam protection check",
    };
  }

  if (/(lock|freeze|pause|stop|block).*(card|debit)|debit card/.test(q)) {
    const unlock = /unlock|unfreeze|enable/.test(q);
    return {
      goal: {
        kind: "toggle_setting",
        setting: "cardLocked",
        desired: !unlock,
        label: unlock ? "Unlock debit card" : "Lock debit card",
      },
      summary: unlock ? "Unlock your debit card" : "Lock your debit card",
    };
  }

  if (/face\s*id|biometric|face/.test(q)) {
    const off = /off|disable/.test(q);
    return {
      goal: {
        kind: "toggle_setting",
        setting: "faceId",
        desired: !off,
        label: off ? "Turn off Face ID" : "Turn on Face ID",
      },
      summary: off ? "Turn off Face ID sign-in" : "Turn on Face ID sign-in",
    };
  }

  if (/alert|notification|text me/.test(q)) {
    const off = /off|disable|stop/.test(q);
    return {
      goal: {
        kind: "toggle_setting",
        setting: "alerts",
        desired: !off,
        label: off ? "Turn off alerts" : "Turn on transaction alerts",
      },
      summary: off ? "Turn off transaction alerts" : "Turn on transaction alerts",
    };
  }

  if (/balance|checking|savings|how much|activity|recent/.test(q)) {
    return {
      goal: { kind: "show_balance" },
      summary: "Find your account balance & activity",
    };
  }

  if (/setting|security|trusted circle/.test(q) && !/send|pay|transfer/.test(q)) {
    return {
      goal: { kind: "show_security" },
      summary: "Open Security & Trusted Circle settings",
    };
  }

  // Default / transfer parser ("send $100 to Sarah", "pay David", "transfer money", etc.)
  let payee: "Mom" | "David" | "Sarah" = "Mom";
  if (/david|son|brother/.test(q)) payee = "David";
  else if (/sarah|daughter|sister/.test(q)) payee = "Sarah";

  const numMatch = q.match(/\$?\s*(\d{1,4})/);
  const amount = numMatch ? closestAmount(Number(numMatch[1])) : 50;

  return {
    goal: { kind: "send_money", payee, amount },
    summary: `Send $${amount} to ${payee}`,
  };
}

/** Builds a sanitized DOM/state summary that proves Local AI obeys Privacy Shield. */
export function buildSanitizedSummary(state: AppState, shielded: boolean): string {
  const bal = shielded ? "[HIDDEN]" : "$5,240.18";
  const acct = shielded ? "[HIDDEN]" : "••4821";
  const otp = state.smsShown ? (shielded ? "[HIDDEN]" : "482913") : "none";
  return `screen=${state.screen} | acct=${acct} | balance=${bal} | 2fa=${otp}`;
}

/** Computes the exact visual cue for the current screen given the active Local AI goal. */
export function nextLocalAiStep(goal: LocalGoal, state: AppState, shielded: boolean): LocalAiStep {
  const sanitizedContext = buildSanitizedSummary(state, shielded);

  if (goal.kind === "scam_check") {
    const target = state.screen === "settings" ? null : "tab-settings";
    return {
      target,
      tool: "ring",
      caption:
        "Local AI Safety Check: Never read verification codes or passwords aloud. Privacy Shield keeps them blurred automatically.",
      done: state.screen === "settings",
      sanitizedContext,
    };
  }

  if (goal.kind === "show_balance") {
    if (state.screen !== "home") {
      return {
        target: "tab-home",
        tool: "arrow",
        caption: "Local AI: Tap Home on the bottom bar to view your accounts.",
        done: false,
        sanitizedContext,
      };
    }
    return {
      target: "balance",
      tool: "ring",
      caption: shielded
        ? "Local AI: Your balance is right here on your card (masked to [HIDDEN] for helpers and Local AI)."
        : "Local AI: Your Everyday Checking balance is shown right here on the top card.",
      done: true,
      sanitizedContext,
    };
  }

  if (goal.kind === "show_security") {
    if (state.screen !== "settings") {
      const target = state.screen === "home" ? "security" : "tab-settings";
      return {
        target,
        tool: "arrow",
        caption: "Local AI: Tap Security / Settings where the arrow is pointing.",
        done: false,
        sanitizedContext,
      };
    }
    return {
      target: "toggle-cardlocked",
      tool: "ring",
      caption: "Local AI: Here are your security controls and Trusted Circle pairing.",
      done: true,
      sanitizedContext,
    };
  }

  if (goal.kind === "toggle_setting") {
    if (state.screen !== "settings") {
      const target = state.screen === "home" ? "security" : "tab-settings";
      return {
        target,
        tool: "arrow",
        caption: `Local AI: To ${goal.label.toLowerCase()}, first open Settings where I am pointing.`,
        done: false,
        sanitizedContext,
      };
    }
    const currentVal = state[goal.setting];
    const guideId = `toggle-${goal.setting.toLowerCase()}`;
    if (currentVal !== goal.desired) {
      return {
        target: guideId,
        tool: "ring",
        caption: `Local AI: Tap the switch next to “${goal.label}” right inside the pulsing ring.`,
        done: false,
        sanitizedContext,
      };
    }
    return {
      target: null,
      tool: "ring",
      caption: `Local AI: Done! “${goal.label}” is now updated, and you made every tap yourself.`,
      done: true,
      sanitizedContext,
    };
  }

  // goal.kind === "send_money"
  const screen: Screen = state.screen;
  if (screen === "home" || screen === "settings") {
    const target = screen === "home" ? "send" : "tab-transfer";
    return {
      target,
      tool: "arrow",
      caption: `Local AI: Let's send $${goal.amount} to ${goal.payee}. Tap “${screen === "home" ? "Send money" : "Transfer"}” where the arrow points.`,
      done: false,
      sanitizedContext,
    };
  }
  if (screen === "transfer") {
    if (state.payee !== goal.payee) {
      return {
        target: `payee-${goal.payee.toLowerCase()}`,
        tool: "ring",
        caption: `Local AI: Step 1 of 3. Tap “${goal.payee}” under Send to.`,
        done: false,
        sanitizedContext,
      };
    }
    if (state.amount !== goal.amount) {
      return {
        target: `amt-${goal.amount}`,
        tool: "ring",
        caption: `Local AI: Step 2 of 3. Tap “$${goal.amount}” to choose the amount.`,
        done: false,
        sanitizedContext,
      };
    }
    return {
      target: "continue",
      tool: "arrow",
      caption: "Local AI: Step 3 of 3. Everything matches, so tap “Continue”.",
      done: false,
      sanitizedContext,
    };
  }
  if (screen === "confirm") {
    if (!state.smsShown) {
      return {
        target: null,
        tool: "ring",
        caption: "Local AI: Waiting a moment for your bank's verification code...",
        done: false,
        sanitizedContext,
      };
    }
    return {
      target: "confirm",
      tool: "arrow",
      caption:
        "Local AI: Your 2FA code stays blurred to [HIDDEN]. Review the details and tap “Confirm & send”.",
      done: false,
      sanitizedContext,
    };
  }
  return {
    target: null,
    tool: "ring",
    caption: `Local AI: Success! $${goal.amount} sent to ${goal.payee} with 100% on-device guidance and zero remote control.`,
    done: true,
    sanitizedContext,
  };
}

export const LOCAL_AI_SUGGESTIONS = [
  "Send $100 to Sarah",
  "Send $50 to Mom",
  "Lock my debit card",
  "Where is my checking balance?",
  "Turn off transaction alerts",
  "Someone asked for my 6-digit code",
];
