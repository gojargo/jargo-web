"use client";

import React from "react";
import { useJargoConnection } from "./hooks";

export interface ConnectButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> {
  /** Override the label shown in each state. */
  labels?: { idle?: string; connecting?: string; connected?: string };
}

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

/**
 * The primary call-to-action: starts the conversation (connect) when idle and
 * ends it (disconnect) when live, reflecting the connection state.
 */
export function ConnectButton({
  labels,
  className,
  disabled,
  ...rest
}: ConnectButtonProps) {
  const { connect, disconnect, isConnected, isConnecting } =
    useJargoConnection();
  const l = {
    idle: "Start conversation",
    connecting: "Connecting…",
    connected: "End conversation",
    ...labels,
  };
  const state = isConnected ? "connected" : isConnecting ? "connecting" : "idle";
  const text = l[state];

  return (
    <button
      type="button"
      className={cx(
        "jargo-btn",
        isConnected ? "jargo-btn--danger" : "jargo-btn--primary",
        className,
      )}
      data-state={state}
      onClick={isConnected ? disconnect : connect}
      disabled={disabled || isConnecting}
      aria-busy={isConnecting || undefined}
      {...rest}
    >
      {isConnecting && <span className="jargo-spinner" aria-hidden="true" />}
      {text}
    </button>
  );
}
