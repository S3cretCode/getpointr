"use client";

import { createContext, useContext, type ReactNode } from "react";
import {
  ArrowDownToLine,
  ArrowLeftRight,
  Bell,
  Check,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  House,
  Landmark,
  Lock,
  MessageSquare,
  Plus,
  Receipt,
  Send,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import { fmtUSD } from "@/lib/bank";
import { HELPER_NAME, type AppState, type BankAction, type Screen } from "@/lib/types";

/** When true, every <Sensitive> value is blurred (helper's view with Privacy Shield on). */
export const ShieldContext = createContext(false);

export function Sensitive({
  children,
  className = "",
  compact = false,
}: {
  children: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  const shielded = useContext(ShieldContext);
  return (
    <span className={`relative inline-flex items-center ${className}`}>
      <span className={shielded ? "select-none blur-[6px]" : ""}>{children}</span>
      {shielded && !compact && (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex items-center gap-1 rounded-full bg-slate-900/90 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
            <Lock className="h-2.5 w-2.5" />
            Hidden
          </span>
        </span>
      )}
    </span>
  );
}

const PAYEES = [
  { name: "Mom", initials: "M", color: "bg-rose-600" },
  { name: "David", initials: "D", color: "bg-sky-600" },
  { name: "Sarah", initials: "S", color: "bg-amber-600" },
];
const AMOUNTS = [20, 50, 100, 250];
const CODE = "482913";

type Act = (a: BankAction) => void;

function Tap({
  guide,
  onClick,
  className = "",
  disabled,
  children,
  label,
}: {
  guide?: string;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  children: ReactNode;
  label?: string;
}) {
  return (
    <button
      type="button"
      data-guide={guide}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`cursor-pointer transition-[transform,background-color,box-shadow] duration-150 active:scale-[0.97] disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}

export default function MockBankApp({ state, onAction }: { state: AppState; onAction?: Act }) {
  const act: Act = (a) => onAction?.(a);
  return (
    <div
      style={{ fontSize: 16 }}
      className={`flex h-full w-full flex-col bg-slate-50 text-slate-950 ${onAction ? "" : "pointer-events-none"}`}
    >
      <Header />
      <div className="relative flex-1 overflow-hidden">
        {state.screen === "home" && <HomeScreen act={act} />}
        {state.screen === "transfer" && <TransferScreen state={state} act={act} />}
        {state.screen === "confirm" && <ConfirmScreen state={state} act={act} />}
        {state.screen === "success" && <SuccessScreen state={state} act={act} />}
        {state.screen === "settings" && <SettingsScreen state={state} act={act} />}
      </div>
      <TabBar screen={state.screen} act={act} />
    </div>
  );
}

function Header() {
  return (
    <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4">
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-teal-700 text-white">
          <Landmark className="h-[18px] w-[18px]" />
        </span>
        <div className="leading-tight">
          <div className="text-[15px] font-bold tracking-tight text-slate-950">Harbor</div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">
            Credit Union
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="relative text-slate-700">
          <Bell className="h-5 w-5" />
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
        </span>
        <span className="grid h-8 w-8 place-items-center rounded-full bg-slate-200 text-[12px] font-bold text-slate-800">
          MK
        </span>
      </div>
    </div>
  );
}

function HomeScreen({ act }: { act: Act }) {
  const actions = [
    { label: "Send money", icon: Send, guide: "send", onClick: () => act({ type: "nav", screen: "transfer" }) },
    { label: "Deposit", icon: ArrowDownToLine, guide: "deposit" },
    { label: "Pay bills", icon: Receipt, guide: "bills" },
    { label: "Security", icon: ShieldCheck, guide: "security", onClick: () => act({ type: "nav", screen: "settings" }) },
  ];
  const activity = [
    { name: "Grocery Outlet", date: "Today", amt: "-$64.20", tone: "text-slate-900" },
    { name: "Social Security", date: "Nov 22", amt: "+$1,912.00", tone: "text-emerald-700" },
    { name: "Comcast", date: "Nov 20", amt: "-$89.99", tone: "text-slate-900" },
  ];
  return (
    <div className="flex h-full flex-col gap-4 px-4 pb-4 pt-3">
      <div>
        <p className="text-[13px] font-medium text-slate-600">Good evening,</p>
        <h1 className="text-[22px] font-bold tracking-tight text-slate-950">Margaret</h1>
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-[#0E5A6E] to-[#08283B] p-4 text-white shadow-lg shadow-teal-950/20">
        <div className="flex items-center justify-between text-[12px] font-medium text-teal-50">
          <span>Everyday Checking</span>
          <Sensitive compact>••4821</Sensitive>
        </div>
        <div className="mt-2 text-[30px] font-bold tracking-tight" data-guide="balance">
          <Sensitive>$5,240.18</Sensitive>
        </div>
        <div className="text-[12px] text-teal-100">Available balance</div>
        <div className="mt-3 flex items-center justify-between rounded-xl bg-white/15 px-3 py-2 text-[12px] font-medium">
          <span>Savings ••7730</span>
          <Sensitive className="font-bold">$12,903.55</Sensitive>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {actions.map(({ label, icon: Icon, guide, onClick }) => (
          <Tap
            key={label}
            guide={guide}
            onClick={onClick}
            className="flex flex-col items-center gap-1.5 rounded-2xl bg-white py-3 text-[11px] font-semibold text-slate-800 shadow-xs ring-1 ring-slate-200"
          >
            <span className="grid h-9 w-9 place-items-center rounded-full bg-teal-50 text-teal-800">
              <Icon className="h-[18px] w-[18px]" />
            </span>
            {label}
          </Tap>
        ))}
      </div>

      <div className="rounded-2xl bg-white p-3 shadow-xs ring-1 ring-slate-200">
        <div className="mb-1 flex items-center justify-between px-1">
          <span className="text-[13px] font-bold text-slate-900">Recent activity</span>
          <span className="text-[12px] font-semibold text-teal-800">See all</span>
        </div>
        {activity.map((a) => (
          <div key={a.name} className="flex items-center gap-3 px-1 py-2">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-[13px] font-bold text-slate-700">
              {a.name[0]}
            </span>
            <div className="leading-tight">
              <div className="text-[14px] font-semibold text-slate-900">{a.name}</div>
              <div className="text-[12px] font-medium text-slate-600">{a.date}</div>
            </div>
            <Sensitive className={`ml-auto text-[14px] font-bold ${a.tone}`} compact>
              {a.amt}
            </Sensitive>
          </div>
        ))}
      </div>
    </div>
  );
}

function BackTitle({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="flex items-center gap-1">
      <Tap
        guide="back"
        onClick={onBack}
        label="Back"
        className="-ml-2 grid h-10 w-10 place-items-center rounded-full text-slate-800 hover:bg-slate-200/70"
      >
        <ChevronLeft className="h-6 w-6" />
      </Tap>
      <h2 className="text-[18px] font-bold tracking-tight text-slate-950">{title}</h2>
    </div>
  );
}

function TransferScreen({ state, act }: { state: AppState; act: Act }) {
  const ready = !!state.payee && !!state.amount;
  return (
    <div className="flex h-full flex-col px-4 pb-4 pt-2">
      <BackTitle title="Send money" onBack={() => act({ type: "nav", screen: "home" })} />

      <div className="mt-2 rounded-2xl bg-white px-4 py-3 text-[13px] ring-1 ring-slate-200">
        <div className="text-[12px] font-medium text-slate-600">From</div>
        <div className="flex items-center justify-between font-semibold text-slate-900">
          <span>
            Everyday Checking <Sensitive compact>••4821</Sensitive>
          </span>
          <Sensitive compact>$5,240.18</Sensitive>
        </div>
      </div>

      <div className="mt-4 text-[13px] font-bold text-slate-900">Send to</div>
      <div className="mt-2 flex gap-2">
        {PAYEES.map((p) => {
          const selected = state.payee === p.name;
          return (
            <Tap
              key={p.name}
              guide={`payee-${p.name.toLowerCase()}`}
              onClick={() => act({ type: "payee", name: p.name })}
              className="flex w-[72px] flex-col items-center gap-1.5"
            >
              <span
                className={`grid h-14 w-14 place-items-center rounded-full text-[19px] font-bold text-white ${p.color} ${
                  selected ? "ring-4 ring-teal-600 ring-offset-2" : ""
                }`}
              >
                {selected ? <Check className="h-6 w-6" strokeWidth={3} /> : p.initials}
              </span>
              <span className={`text-[12px] ${selected ? "font-bold text-teal-900" : "font-medium text-slate-700"}`}>
                {p.name}
              </span>
            </Tap>
          );
        })}
        <div className="flex w-[72px] flex-col items-center gap-1.5">
          <span className="grid h-14 w-14 place-items-center rounded-full border-2 border-dashed border-slate-300 text-slate-500">
            <Plus className="h-5 w-5" />
          </span>
          <span className="text-[12px] font-medium text-slate-600">New</span>
        </div>
      </div>

      <div className="mt-5 text-center">
        <div className="text-[12px] font-semibold text-slate-600">Amount</div>
        <div className="text-[42px] font-bold leading-tight tracking-tight text-slate-950">
          {state.amount ? fmtUSD(state.amount) : "$0.00"}
        </div>
      </div>
      <div className="mt-2 grid grid-cols-4 gap-2">
        {AMOUNTS.map((a) => {
          const selected = state.amount === a;
          return (
            <Tap
              key={a}
              guide={`amt-${a}`}
              onClick={() => act({ type: "amount", value: a })}
              className={`rounded-xl py-2.5 text-[15px] font-bold ring-1 ${
                selected ? "bg-teal-700 text-white ring-teal-700" : "bg-white text-slate-900 ring-slate-300"
              }`}
            >
              ${a}
            </Tap>
          );
        })}
      </div>

      <div className="mt-auto pt-4">
        <Tap
          guide="continue"
          disabled={!ready}
          onClick={() => act({ type: "continue" })}
          className="w-full rounded-2xl bg-teal-700 py-3.5 text-[16px] font-bold text-white shadow-md shadow-teal-900/20 disabled:bg-slate-300 disabled:text-slate-600 disabled:shadow-none"
        >
          Continue
        </Tap>
      </div>
    </div>
  );
}

function ConfirmScreen({ state, act }: { state: AppState; act: Act }) {
  const payee = PAYEES.find((p) => p.name === state.payee) ?? PAYEES[0];
  return (
    <div className="relative flex h-full flex-col px-4 pb-4 pt-2">
      {state.smsShown && (
        <div
          data-guide="sms"
          className="gp-drop absolute inset-x-2 top-2 z-10 rounded-2xl bg-white p-3 shadow-xl ring-1 ring-slate-300"
        >
          <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
            <span className="grid h-5 w-5 place-items-center rounded-md bg-green-600 text-white">
              <MessageSquare className="h-3 w-3" />
            </span>
            MESSAGES
            <span className="ml-auto">now</span>
          </div>
          <p className="mt-1 text-[13px] leading-snug text-slate-900">
            <span className="font-bold">Harbor CU:</span> Your verification code is{" "}
            <Sensitive className="font-bold">{CODE}</Sensitive>. Never share this code with anyone.
          </p>
        </div>
      )}

      <BackTitle title="Review transfer" onBack={() => act({ type: "nav", screen: "transfer" })} />

      <div className="mt-2 divide-y divide-slate-200 rounded-2xl bg-white px-4 text-[14px] ring-1 ring-slate-200">
        <div className="flex items-center justify-between py-3">
          <span className="font-medium text-slate-600">To</span>
          <span className="flex items-center gap-2 font-semibold text-slate-900">
            <span className={`grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold text-white ${payee.color}`}>
              {payee.initials}
            </span>
            {payee.name}
          </span>
        </div>
        <div className="flex items-center justify-between py-3">
          <span className="font-medium text-slate-600">Amount</span>
          <span className="text-[16px] font-bold text-slate-950">{fmtUSD(state.amount ?? 0)}</span>
        </div>
        <div className="flex items-center justify-between py-3">
          <span className="font-medium text-slate-600">From</span>
          <span className="font-semibold text-slate-900">
            Checking <Sensitive compact>••4821</Sensitive>
          </span>
        </div>
        <div className="flex items-center justify-between py-3">
          <span className="font-medium text-slate-600">Arrives</span>
          <span className="font-semibold text-slate-900">Instantly</span>
        </div>
      </div>

      <div className="mt-4 text-[13px] font-bold text-slate-900">Verification code</div>
      <div className="mt-2 flex gap-2" data-guide="code">
        {CODE.split("").map((d, i) => (
          <span
            key={i}
            className="grid h-12 flex-1 place-items-center rounded-xl bg-white text-[20px] font-bold text-slate-950 ring-1 ring-slate-300"
          >
            {state.smsShown ? <Sensitive compact>{d}</Sensitive> : <span className="h-0.5 w-3 bg-slate-400" />}
          </span>
        ))}
      </div>
      <p className="mt-3 flex gap-2 rounded-xl bg-amber-50 p-3 text-[12px] font-medium leading-snug text-amber-950 ring-1 ring-amber-300">
        <ShieldCheck className="h-4 w-4 shrink-0 text-amber-700" />
        Harbor will never call or text asking you to read this code aloud.
      </p>

      <div className="mt-auto pt-4">
        <Tap
          guide="confirm"
          disabled={!state.smsShown}
          onClick={() => act({ type: "confirm" })}
          className="w-full rounded-2xl bg-teal-700 py-3.5 text-[16px] font-bold text-white shadow-md shadow-teal-900/20 disabled:bg-slate-300 disabled:text-slate-600 disabled:shadow-none"
        >
          {state.smsShown ? "Confirm & send" : "Waiting for code..."}
        </Tap>
      </div>
    </div>
  );
}

function SuccessScreen({ state, act }: { state: AppState; act: Act }) {
  return (
    <div className="flex h-full flex-col items-center px-6 pb-4 pt-10 text-center">
      <span className="gp-pop grid h-20 w-20 place-items-center rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-600/30">
        <Check className="h-10 w-10" strokeWidth={3} />
      </span>
      <h2 className="mt-5 text-[24px] font-bold tracking-tight text-slate-950">
        {fmtUSD(state.amount ?? 0)} sent to {state.payee ?? "Mom"}
      </h2>
      <p className="mt-1 text-[14px] font-medium text-slate-600">It is on its way and will arrive instantly.</p>
      <div className="mt-4 rounded-xl bg-white px-4 py-2 text-[12px] font-semibold text-slate-700 ring-1 ring-slate-200">
        Reference #HC-20931
      </div>
      <div className="mt-auto w-full">
        <Tap
          guide="done"
          onClick={() => act({ type: "done" })}
          className="w-full rounded-2xl bg-teal-700 py-3.5 text-[16px] font-bold text-white"
        >
          Done
        </Tap>
      </div>
    </div>
  );
}

function Switch({ on, guide, onClick, label }: { on: boolean; guide: string; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      data-guide={guide}
      onClick={onClick}
      className={`relative h-7 w-12 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ${
        on ? "bg-teal-600" : "bg-slate-300"
      }`}
    >
      <span
        className={`absolute left-0 top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform duration-200 ${
          on ? "translate-x-[22px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function SettingsScreen({ state, act }: { state: AppState; act: Act }) {
  const toggles = [
    { key: "faceId" as const, label: "Face ID sign-in", hint: "Unlock with your face" },
    { key: "alerts" as const, label: "Transaction alerts", hint: "Text me for every purchase" },
    { key: "cardLocked" as const, label: "Lock debit card", hint: "Pause all card payments" },
  ];
  return (
    <div className="flex h-full flex-col gap-3 px-4 pb-4 pt-3">
      <h2 className="text-[20px] font-bold tracking-tight text-slate-950">Settings</h2>
      <div className="flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-slate-200">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-slate-200 text-[14px] font-bold text-slate-800">
          MK
        </span>
        <div className="leading-tight">
          <div className="text-[15px] font-bold text-slate-950">Margaret Kim</div>
          <div className="text-[12px] font-medium text-slate-600">Member since 1998</div>
        </div>
      </div>
      <div className="divide-y divide-slate-200 rounded-2xl bg-white px-4 ring-1 ring-slate-200">
        {toggles.map((t) => (
          <div key={t.key} className="flex items-center gap-3 py-3">
            <div className="flex-1 leading-tight">
              <div className="text-[14px] font-semibold text-slate-900">{t.label}</div>
              <div className="text-[12px] font-medium text-slate-600">{t.hint}</div>
            </div>
            <Switch
              on={state[t.key]}
              label={t.label}
              guide={`toggle-${t.key.toLowerCase()}`}
              onClick={() => act({ type: "toggle", key: t.key })}
            />
          </div>
        ))}
        <div className="flex items-center gap-3 py-3">
          <div className="flex-1 leading-tight">
            <div className="text-[14px] font-semibold text-slate-900">Password</div>
            <Sensitive className="text-[12px] font-medium text-slate-700" compact>
              Harbor!Mk1998
            </Sensitive>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-500" />
        </div>
        <div className="flex items-center gap-3 py-3">
          <Users className="h-5 w-5 text-teal-700" />
          <div className="flex-1 leading-tight">
            <div className="text-[14px] font-semibold text-slate-900">Trusted Circle</div>
            <div className="text-[12px] font-medium text-slate-600">{HELPER_NAME} · paired in person</div>
          </div>
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
        </div>
      </div>
    </div>
  );
}

function TabBar({ screen, act }: { screen: Screen; act: Act }) {
  const tabs = [
    { label: "Home", icon: House, target: "home" as Screen, active: screen === "home" || screen === "success" },
    { label: "Transfer", icon: ArrowLeftRight, target: "transfer" as Screen, active: screen === "transfer" || screen === "confirm" },
    { label: "Cards", icon: CreditCard, target: null, active: false },
    { label: "Settings", icon: Settings, target: "settings" as Screen, active: screen === "settings" },
  ];
  return (
    <div className="flex h-16 shrink-0 items-stretch justify-around border-t border-slate-200 bg-white px-2">
      {tabs.map(({ label, icon: Icon, target, active }) => (
        <Tap
          key={label}
          guide={`tab-${label.toLowerCase()}`}
          onClick={target ? () => act({ type: "nav", screen: target }) : undefined}
          className={`flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-semibold ${
            active ? "text-teal-800" : "text-slate-600"
          }`}
        >
          <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.5 : 2} />
          {label}
        </Tap>
      ))}
    </div>
  );
}
