"use client";

import React from "react";
import type { TransportState } from "@gojargo/jargo-client-js";
import { useJargoTransportState } from "./hooks";

export interface ConnectionStatusProps {
  /** Override the label for any transport state. */
  labels?: Partial<Record<TransportState, string>>;
  className?: string;
}

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

const DEFAULT_LABELS: Record<TransportState, string> = {
  disconnected: "Offline",
  connecting: "Connecting…",
  connected: "Connected",
  ready: "Live",
  error: "Error",
};

/** A small badge that reflects the current connection state. */
export function ConnectionStatus({ labels, className }: ConnectionStatusProps) {
  const state = useJargoTransportState();
  const text = labels?.[state] ?? DEFAULT_LABELS[state];
  return (
    <span
      className={cx("jargo-status", `jargo-status--${state}`, className)}
      data-state={state}
      role="status"
    >
      <span className="jargo-status__dot" aria-hidden="true" />
      {text}
    </span>
  );
}
