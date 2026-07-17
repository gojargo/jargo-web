"use client";

import React, { useContext, useEffect, useRef } from "react";
import { Orb as OrbEngine, type OrbOptions } from "@gojargo/jargo-ui";
import { JargoClientContext } from "./context";

export interface OrbProps extends OrbOptions {
  /** Square size in CSS px when width/height aren't given. Default 220. */
  size?: number;
  /** Explicit CSS width (number = px). Falls back to `size`. */
  width?: number | string;
  /** Explicit CSS height (number = px). Falls back to `size`. */
  height?: number | string;
  className?: string;
  style?: React.CSSProperties;
  /**
   * When inside a <JargoClientProvider>, drive the orb from the bot's audio.
   * Ignored if `level` is provided. Default true.
   */
  reactToBot?: boolean;
  /** Manually drive the level (0..1). Overrides audio reactivity when set. */
  level?: number;
  /** Pause the animation. Default false. */
  paused?: boolean;
}

const px = (v: number | string) => (typeof v === "number" ? `${v}px` : v);

/**
 * React wrapper around the framework-agnostic {@link OrbEngine} from
 * `@gojargo/jargo-client-js`: an animated orb of moving lines. Drop it inside a
 * <JargoClientProvider> and it reacts to the bot's voice automatically; use it
 * standalone by passing a `level`, or just let it idle.
 */
export function Orb({
  size = 220,
  width,
  height,
  className,
  style,
  reactToBot = true,
  level,
  paused = false,
  ...options
}: OrbProps) {
  const client = useContext(JargoClientContext);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const orbRef = useRef<OrbEngine | null>(null);

  // Latest options, read once at construction time.
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Create the orb once for the element's lifetime.
  useEffect(() => {
    if (!canvasRef.current) return;
    const orb = new OrbEngine(canvasRef.current, optionsRef.current);
    orbRef.current = orb;
    return () => {
      orb.destroy();
      orbRef.current = null;
    };
  }, []);

  // Apply option changes (colors, reactivity, …). Serialized so array/object
  // props are compared by value, not identity.
  useEffect(() => {
    orbRef.current?.setOptions(options);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(options)]);

  // Play/pause.
  useEffect(() => {
    const orb = orbRef.current;
    if (!orb) return;
    if (paused) orb.stop();
    else orb.start();
  }, [paused]);

  // Manual level drive.
  useEffect(() => {
    if (level !== undefined) orbRef.current?.setLevel(level);
  }, [level]);

  // Audio-reactive drive from the connected bot (when no manual level is set).
  useEffect(() => {
    const orb = orbRef.current;
    if (!orb || !client || !reactToBot || level !== undefined) return;
    orb.attachStream(client.remoteStream);
    const off = client.on("remoteTrack", (stream) => orb.attachStream(stream));
    return () => {
      off();
      orb.attachStream(null);
    };
  }, [client, reactToBot, level]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        display: "block",
        width: px(width ?? size),
        height: px(height ?? size),
        ...style,
      }}
    />
  );
}
