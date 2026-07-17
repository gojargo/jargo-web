"use client";

import React from "react";
import { useJargoConnection, useJargoMicToggle } from "./hooks";

export interface MicButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> {
  /** Override the label for each state. */
  labels?: { mute?: string; unmute?: string };
  /** Enable even when disconnected (default: disabled until connected). */
  alwaysEnabled?: boolean;
}

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

/** Toggles the microphone, reflecting the muted/live state. */
export function MicButton({
  labels,
  className,
  disabled,
  alwaysEnabled = false,
  ...rest
}: MicButtonProps) {
  const { enabled, toggle } = useJargoMicToggle();
  const { isConnected } = useJargoConnection();
  const l = { mute: "Mute", unmute: "Unmute", ...labels };

  return (
    <button
      type="button"
      className={cx("jargo-btn", "jargo-btn--ghost", className)}
      onClick={toggle}
      disabled={disabled || (!alwaysEnabled && !isConnected)}
      // Pressed = muted (the toggle is "active" when the mic is off).
      aria-pressed={!enabled}
      data-muted={!enabled}
      {...rest}
    >
      <MicIcon muted={!enabled} />
      {enabled ? l.mute : l.unmute}
    </button>
  );
}

function MicIcon({ muted }: { muted: boolean }) {
  return (
    <svg
      className="jargo-mic-icon"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <line x1="12" y1="18" x2="12" y2="21" />
      {muted && <line x1="3" y1="3" x2="21" y2="21" />}
    </svg>
  );
}
