"use client";

import React, { useEffect, useRef } from "react";
import { useJargoTranscript, type TranscriptMessage } from "./hooks";
import { Message } from "./Message";

export interface TranscriptProps {
  className?: string;
  /** Shown when there are no messages yet. */
  emptyLabel?: React.ReactNode;
  /** Auto-scroll to the newest message. Default true. */
  autoScroll?: boolean;
  /** Override the role labels on each bubble. */
  roleLabels?: { user?: string; agent?: string };
  /** Provide messages yourself instead of the built-in {@link useJargoTranscript}. */
  messages?: TranscriptMessage[];
}

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

/**
 * An auto-scrolling container that renders the conversation. By default it
 * builds the message list from client events via {@link useJargoTranscript}
 * (so it must be inside a `<JargoClientProvider>`); pass `messages` to control
 * it yourself (works standalone). Announces new lines to screen readers via an
 * `aria-live` region.
 */
export function Transcript({ messages, ...props }: TranscriptProps) {
  // Controlled: render given messages, no client subscription (no provider needed).
  // Uncontrolled: subscribe via the hook. The branch is stable per usage.
  return messages ? (
    <TranscriptView {...props} messages={messages} />
  ) : (
    <LiveTranscript {...props} />
  );
}

function LiveTranscript(props: Omit<TranscriptProps, "messages">) {
  const { messages } = useJargoTranscript();
  return <TranscriptView {...props} messages={messages} />;
}

function TranscriptView({
  className,
  emptyLabel = "No messages yet.",
  autoScroll = true,
  roleLabels,
  messages,
}: Omit<TranscriptProps, "messages"> & { messages: TranscriptMessage[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && ref.current) {
      ref.current.scrollTo({ top: ref.current.scrollHeight });
    }
  }, [messages, autoScroll]);

  return (
    <div
      className={cx("jargo-transcript", className)}
      ref={ref}
      role="log"
      aria-live="polite"
      aria-relevant="additions text"
    >
      {messages.length === 0 ? (
        <p className="jargo-transcript__empty">{emptyLabel}</p>
      ) : (
        messages.map((m) => (
          <Message
            key={m.id}
            role={m.role}
            label={roleLabels?.[m.role]}
            streaming={!m.final}
          >
            {m.text}
          </Message>
        ))
      )}
    </div>
  );
}
