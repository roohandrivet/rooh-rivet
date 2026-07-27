"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  Clock3,
  LogOut,
  ShieldAlert,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

const INACTIVITY_LIMIT_MS = 30 * 60 * 1000;
const WARNING_DURATION_MS = 60 * 1000;
const ACTIVITY_THROTTLE_MS = 1000;

const LAST_ACTIVITY_KEY =
  "rooh-rivet-admin-last-activity";

export default function AdminAutoLogout() {
  const router = useRouter();

  const [secondsRemaining, setSecondsRemaining] =
    useState<number | null>(null);

  const lastActivityRef = useRef<number>(
    Date.now()
  );

  const lastStorageWriteRef = useRef<number>(0);
  const signingOutRef = useRef(false);

  const signOut = useCallback(async () => {
    if (signingOutRef.current) {
      return;
    }

    signingOutRef.current = true;
    setSecondsRemaining(null);

    window.localStorage.removeItem(
      LAST_ACTIVITY_KEY
    );

    try {
      await supabase.auth.signOut({
        scope: "local",
      });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }, [router]);

  const recordActivity = useCallback(() => {
    if (signingOutRef.current) {
      return;
    }

    const now = Date.now();

    lastActivityRef.current = now;
    setSecondsRemaining(null);

    if (
      now - lastStorageWriteRef.current <
      ACTIVITY_THROTTLE_MS
    ) {
      return;
    }

    lastStorageWriteRef.current = now;

    window.localStorage.setItem(
      LAST_ACTIVITY_KEY,
      String(now)
    );
  }, []);

  useEffect(() => {
    const storedActivity =
      window.localStorage.getItem(
        LAST_ACTIVITY_KEY
      );

    const parsedStoredActivity =
      storedActivity === null
        ? Number.NaN
        : Number(storedActivity);

    const now = Date.now();

    if (
      Number.isFinite(parsedStoredActivity) &&
      parsedStoredActivity > 0 &&
      now - parsedStoredActivity <
        INACTIVITY_LIMIT_MS
    ) {
      lastActivityRef.current =
        parsedStoredActivity;
    } else {
      lastActivityRef.current = now;

      window.localStorage.setItem(
        LAST_ACTIVITY_KEY,
        String(now)
      );
    }

    lastStorageWriteRef.current =
      lastActivityRef.current;

    function checkInactivity() {
      if (signingOutRef.current) {
        return;
      }

      const currentTime = Date.now();

      const inactiveDuration =
        currentTime -
        lastActivityRef.current;

      const remainingTime =
        INACTIVITY_LIMIT_MS -
        inactiveDuration;

      if (remainingTime <= 0) {
        void signOut();
        return;
      }

      if (
        remainingTime <=
        WARNING_DURATION_MS
      ) {
        setSecondsRemaining(
          Math.max(
            1,
            Math.ceil(
              remainingTime / 1000
            )
          )
        );
      } else {
        setSecondsRemaining(null);
      }
    }

    function handleStorage(
      event: StorageEvent
    ) {
      if (
        event.key !==
          LAST_ACTIVITY_KEY ||
        event.newValue === null
      ) {
        return;
      }

      const timestamp = Number(
        event.newValue
      );

      if (
        !Number.isFinite(timestamp) ||
        timestamp <= 0
      ) {
        return;
      }

      lastActivityRef.current =
        timestamp;

      setSecondsRemaining(null);
    }

    function handleVisibilityChange() {
      if (
        document.visibilityState ===
        "visible"
      ) {
        checkInactivity();
      }
    }

    const activityEvents: Array<
      keyof WindowEventMap
    > = [
      "click",
      "keydown",
      "mousemove",
      "pointerdown",
      "scroll",
      "touchstart",
    ];

    activityEvents.forEach(
      (eventName) => {
        window.addEventListener(
          eventName,
          recordActivity,
          {
            passive: true,
          }
        );
      }
    );

    window.addEventListener(
      "focus",
      recordActivity
    );

    window.addEventListener(
      "storage",
      handleStorage
    );

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    const intervalId =
      window.setInterval(
        checkInactivity,
        1000
      );

    checkInactivity();

    return () => {
      activityEvents.forEach(
        (eventName) => {
          window.removeEventListener(
            eventName,
            recordActivity
          );
        }
      );

      window.removeEventListener(
        "focus",
        recordActivity
      );

      window.removeEventListener(
        "storage",
        handleStorage
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );

      window.clearInterval(
        intervalId
      );
    };
  }, [recordActivity, signOut]);

  if (secondsRemaining === null) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#2D1818]/60 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-session-title"
      aria-describedby="admin-session-description"
    >
      <div className="w-full max-w-md rounded-3xl border border-[#E8DDD3] bg-white p-7 shadow-2xl">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F8F4EF] text-[#5A2D2D]">
          <ShieldAlert
            className="h-7 w-7"
            strokeWidth={1.7}
          />
        </div>

        <h2
          id="admin-session-title"
          className="font-serif text-2xl font-semibold text-[#4B2E2E]"
        >
          Your admin session is expiring
        </h2>

        <p
          id="admin-session-description"
          className="mt-3 text-sm leading-6 text-[#8B6B5B]"
        >
          You have been inactive. For
          security, you will automatically
          be signed out of the admin panel.
        </p>

        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-[#E8DDD3] bg-[#F8F4EF] px-4 py-3">
          <Clock3 className="h-5 w-5 shrink-0 text-[#5A2D2D]" />

          <p className="text-sm font-medium text-[#4B2E2E]">
            Signing out in{" "}
            <span className="font-bold">
              {secondsRemaining}
            </span>{" "}
            second
            {secondsRemaining === 1
              ? ""
              : "s"}
          </p>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => {
              void signOut();
            }}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#D8C7BC] bg-white px-4 py-3 text-sm font-semibold text-[#5A2D2D] transition hover:bg-[#F8F4EF] focus:outline-none focus:ring-2 focus:ring-[#5A2D2D]/30"
          >
            <LogOut className="h-4 w-4" />
            Sign out now
          </button>

          <button
            type="button"
            onClick={recordActivity}
            autoFocus
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#5A2D2D] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#4B2525] focus:outline-none focus:ring-2 focus:ring-[#5A2D2D]/30 focus:ring-offset-2"
          >
            Stay signed in
          </button>
        </div>
      </div>
    </div>
  );
}