import {
  defineComponent,
  h,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type PropType,
} from "vue";
import { Orb as OrbEngine, type OrbOptions } from "@gojargo/jargo-ui";
import { injectJargoClient } from "./context";

const px = (v: number | string) => (typeof v === "number" ? `${v}px` : v);

/**
 * `<Orb>` — Vue wrapper around the {@link OrbEngine} from `@gojargo/jargo-ui`.
 * When a client is provided (see `provideJargoClient`), it reacts to the bot's
 * audio automatically; otherwise pass a `level`, or let it idle.
 *
 *   <Orb :size="220" :options="{ colors: OrbPalettes.aurora }" />
 */
export const Orb = defineComponent({
  name: "JargoOrb",
  props: {
    /** Engine options (rings, colors, speed, glow, …). */
    options: { type: Object as PropType<OrbOptions>, default: () => ({}) },
    /** Square size in CSS px when width/height aren't given. Default 220. */
    size: { type: [Number, String], default: 220 },
    width: { type: [Number, String], default: undefined },
    height: { type: [Number, String], default: undefined },
    /** Manual drive level (0..1); overrides audio reactivity when set. */
    level: { type: Number, default: undefined },
    /** Drive from the provided client's bot audio. Default true. */
    reactToBot: { type: Boolean, default: true },
    /** Pause the animation. Default false. */
    paused: { type: Boolean, default: false },
  },
  setup(props) {
    const canvas = ref<HTMLCanvasElement | null>(null);
    const client = injectJargoClient();
    let orb: OrbEngine | null = null;
    let offRemote: (() => void) | undefined;

    onMounted(() => {
      if (!canvas.value) return;
      orb = new OrbEngine(canvas.value, props.options);
      if (props.level !== undefined) orb.setLevel(props.level);
      if (!props.paused) orb.start();

      if (client && props.reactToBot && props.level === undefined) {
        orb.attachStream(client.remoteStream);
        offRemote = client.on("remoteTrack", (s) => orb?.attachStream(s));
      }
    });

    watch(
      () => props.options,
      (o) => orb?.setOptions(o),
      { deep: true },
    );
    watch(
      () => props.level,
      (l) => {
        if (l !== undefined) orb?.setLevel(l);
      },
    );
    watch(
      () => props.paused,
      (p) => (p ? orb?.stop() : orb?.start()),
    );

    onBeforeUnmount(() => {
      offRemote?.();
      orb?.destroy();
      orb = null;
    });

    return () =>
      h("canvas", {
        ref: canvas,
        style: {
          display: "block",
          width: px(props.width ?? props.size),
          height: px(props.height ?? props.size),
        },
      });
  },
});
