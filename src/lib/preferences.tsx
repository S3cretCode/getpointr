"use client";

import { createContext, useContext, useEffect, useSyncExternalStore, type ReactNode } from "react";
import { Moon, Sun } from "lucide-react";

export type ThemeMode = "dark" | "light";
export type TextScale = "normal" | "large" | "xl";

type StoredPrefs = { theme: ThemeMode; textScale: TextScale };

const STORAGE_KEY = "gp-ui-prefs-v1";
const DEFAULT_PREFS: StoredPrefs = { theme: "dark", textScale: "normal" };

let cachedRaw: string | null = null;
let cachedPrefs: StoredPrefs = DEFAULT_PREFS;
const listeners = new Set<() => void>();

function readSnapshot(): StoredPrefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === cachedRaw) return cachedPrefs;
    cachedRaw = raw;
    if (!raw) {
      cachedPrefs = DEFAULT_PREFS;
      return cachedPrefs;
    }
    const parsed = JSON.parse(raw) as Partial<StoredPrefs>;
    const theme: ThemeMode = parsed.theme === "light" ? "light" : "dark";
    const textScale: TextScale =
      parsed.textScale === "large" || parsed.textScale === "xl" ? parsed.textScale : "normal";
    cachedPrefs = { theme, textScale };
    return cachedPrefs;
  } catch {
    return DEFAULT_PREFS;
  }
}

function getServerSnapshot(): StoredPrefs {
  return DEFAULT_PREFS;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) cb();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

function writePrefs(next: StoredPrefs) {
  cachedPrefs = next;
  try {
    const raw = JSON.stringify(next);
    cachedRaw = raw;
    localStorage.setItem(STORAGE_KEY, raw);
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

type PrefsValue = {
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  toggleTheme: () => void;
  textScale: TextScale;
  setTextScale: (s: TextScale) => void;
};

const PrefsContext = createContext<PrefsValue>({
  theme: "dark",
  setTheme: () => {},
  toggleTheme: () => {},
  textScale: "normal",
  setTextScale: () => {},
});

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const { theme, textScale } = useSyncExternalStore(subscribe, readSnapshot, getServerSnapshot);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.dataset.textScale = textScale;
  }, [theme, textScale]);

  const setTheme = (t: ThemeMode) => writePrefs({ theme: t, textScale });
  const toggleTheme = () => writePrefs({ theme: theme === "dark" ? "light" : "dark", textScale });
  const setTextScale = (s: TextScale) => writePrefs({ theme, textScale: s });

  return (
    <PrefsContext.Provider value={{ theme, setTheme, toggleTheme, textScale, setTextScale }}>
      {children}
    </PrefsContext.Provider>
  );
}

export function usePreferences() {
  return useContext(PrefsContext);
}

const SCALES: { id: TextScale; short: string; label: string }[] = [
  { id: "normal", short: "A", label: "Standard text size" },
  { id: "large", short: "A+", label: "Large text size" },
  { id: "xl", short: "A++", label: "Extra large text size" },
];

/** Compact theme + text-size toolbar pill used across Landing, Helper, and Host headers. */
export function AppearanceBar({ compact = false }: { compact?: boolean }) {
  const { theme, toggleTheme, textScale, setTextScale } = usePreferences();
  return (
    <div className="inline-flex items-center gap-1 rounded-xl border border-gp-border bg-gp-card p-1">
      <div className="inline-flex items-center gap-0.5" role="group" aria-label="Text size">
        {SCALES.map((s) => {
          const active = textScale === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setTextScale(s.id)}
              aria-label={s.label}
              aria-pressed={active}
              className={`h-7 cursor-pointer rounded-lg px-2 text-[12px] font-bold transition-colors ${
                active
                  ? "bg-laser text-white shadow-xs"
                  : "text-gp-muted hover:bg-gp-hover hover:text-gp-text"
              }`}
            >
              {s.short}
            </button>
          );
        })}
      </div>
      <span className="h-4 w-px bg-gp-border" aria-hidden="true" />
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        className="inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-lg px-2 text-[12px] font-semibold text-gp-sub transition-colors hover:bg-gp-hover hover:text-gp-text"
      >
        {theme === "dark" ? (
          <Sun className="h-3.5 w-3.5 text-gp-accent" />
        ) : (
          <Moon className="h-3.5 w-3.5 text-gp-accent" />
        )}
        {!compact && <span>{theme === "dark" ? "Light" : "Dark"}</span>}
      </button>
    </div>
  );
}
