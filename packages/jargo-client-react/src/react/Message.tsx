"use client";

import React from "react";

export interface MessageProps {
  role: "user" | "agent";
  children: React.ReactNode;
  /** Override the role label (default "You" / "Assistant"). */
  label?: string;
  /** Marks a still-streaming line (adds a data-attribute hook for styling). */
  streaming?: boolean;
  className?: string;
}

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

/** A single conversation line (a user or agent bubble). */
export function Message({
  role,
  children,
  label,
  streaming,
  className,
}: MessageProps) {
  return (
    <div
      className={cx("jargo-msg", `jargo-msg--${role}`, className)}
      data-role={role}
      data-streaming={streaming || undefined}
    >
      <span className="jargo-msg__role">
        {label ?? (role === "user" ? "You" : "Assistant")}
      </span>
      <span className="jargo-msg__text">{children}</span>
    </div>
  );
}
