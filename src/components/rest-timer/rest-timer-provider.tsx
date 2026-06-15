"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { vibrate } from "@/lib/utils";

export type RestTimerStatus = "idle" | "running" | "completed";

interface RestTimerContextValue {
  status: RestTimerStatus;
  /** Configured length of the current/last timer, in seconds */
  duration: number;
  /** Seconds remaining while running (0 when completed/idle) */
  remaining: number;
  start: (seconds: number) => void;
  addSeconds: (delta: number) => void;
  stop: () => void;
  dismiss: () => void;
  panelOpen: boolean;
  setPanelOpen: (open: boolean) => void;
}

const RestTimerContext = createContext<RestTimerContextValue | null>(null);

export function useRestTimer() {
  const ctx = useContext(RestTimerContext);
  if (!ctx)
    throw new Error("useRestTimer must be used within a RestTimerProvider");
  return ctx;
}

const STORAGE_KEY = "rest-timer:v1";

export function formatRemaining(seconds: number): string {
  const s = Math.max(0, seconds);
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${m}:${ss.toString().padStart(2, "0")}`;
}

export function RestTimerProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<RestTimerStatus>("idle");
  const [duration, setDuration] = useState(90);
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [panelOpen, setPanelOpen] = useState(false);
  const audioRef = useRef<AudioContext | null>(null);

  // Restore an in-flight timer after a reload / fresh mount
  useEffect(() => {
    const raw =
      typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (!raw) return;
    try {
      const saved = JSON.parse(raw) as { duration?: number; endsAt?: number };
      if (typeof saved.duration === "number") setDuration(saved.duration);
      if (typeof saved.endsAt === "number") {
        const rem = Math.round((saved.endsAt - Date.now()) / 1000);
        if (rem > 0) {
          setEndsAt(saved.endsAt);
          setRemaining(rem);
          setStatus("running");
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // Ensure / resume an AudioContext during a user gesture so the end chime
  // is allowed to play later (mobile autoplay policies).
  const primeAudio = useCallback(() => {
    try {
      if (!audioRef.current) {
        const Ctor =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        audioRef.current = new Ctor();
      }
      if (audioRef.current.state === "suspended") void audioRef.current.resume();
    } catch {
      /* audio unsupported — silently ignore */
    }
  }, []);

  const chime = useCallback(() => {
    const ctx = audioRef.current;
    if (!ctx) return;
    try {
      const tone = (freq: number, at: number, dur: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.value = freq;
        const t = ctx.currentTime + at;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.35, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        osc.start(t);
        osc.stop(t + dur + 0.02);
      };
      tone(880, 0, 0.16);
      tone(880, 0.22, 0.16);
      tone(1174, 0.44, 0.34);
    } catch {
      /* ignore */
    }
  }, []);

  // Tick loop
  useEffect(() => {
    if (status !== "running" || endsAt == null) return;
    const tick = () => {
      const rem = Math.round((endsAt - Date.now()) / 1000);
      if (rem <= 0) {
        setRemaining(0);
        setEndsAt(null);
        setStatus("completed");
        vibrate([220, 120, 220, 120, 360]);
        chime();
      } else {
        setRemaining(rem);
      }
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [status, endsAt, chime]);

  // Persist a running timer so navigation/reload keeps the countdown
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (status === "running" && endsAt != null) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ duration, endsAt }));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [status, endsAt, duration]);

  const start = useCallback(
    (seconds: number) => {
      if (seconds <= 0) return;
      primeAudio();
      setDuration(seconds);
      setEndsAt(Date.now() + seconds * 1000);
      setRemaining(seconds);
      setStatus("running");
      setPanelOpen(false);
      vibrate(30);
    },
    [primeAudio]
  );

  const addSeconds = useCallback((delta: number) => {
    // The tick effect recomputes `remaining` as soon as `endsAt` changes.
    setEndsAt((prev) => {
      const base = prev && prev > Date.now() ? prev : Date.now();
      return Math.max(Date.now() + 1000, base + delta * 1000);
    });
    setStatus("running");
  }, []);

  const stop = useCallback(() => {
    setStatus("idle");
    setEndsAt(null);
    setRemaining(0);
  }, []);

  return (
    <RestTimerContext.Provider
      value={{
        status,
        duration,
        remaining,
        start,
        addSeconds,
        stop,
        dismiss: stop,
        panelOpen,
        setPanelOpen,
      }}
    >
      {children}
    </RestTimerContext.Provider>
  );
}
