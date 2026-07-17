# @gojargo/jargo-elements

**Web components** for jargo — the framework-agnostic path for Angular, Svelte,
Solid, or plain HTML. Built on [`@gojargo/jargo-ui`](../jargo-ui) (visual +
theme) and [`@gojargo/jargo-client-js`](../jargo-client-js) (the client).

- **`<jargo-orb>`** — the Orb (no client needed).
- **`<jargo-connect-button>`**, **`<jargo-mic-button>`**, **`<jargo-status>`**,
  **`<jargo-transcript>`** — client-driven; they read a client set via
  `setJargoClient()`.

Part of the [`jargo-web`](https://github.com/gojargo/jargo-web) monorepo.

## Install

```bash
npm install @gojargo/jargo-elements
```

## Usage

Register the elements, import the theme, set a client, then use them in markup:

```html
<script type="module">
  import { setJargoClient } from "@gojargo/jargo-elements";
  import "@gojargo/jargo-elements/define";
  import "@gojargo/jargo-ui/theme.css";
  import { JargoClient } from "@gojargo/jargo-client-js";

  setJargoClient(new JargoClient({ baseUrl: "https://jargo.example.com" }));
</script>

<jargo-status></jargo-status>
<jargo-orb colors="aurora"></jargo-orb>
<jargo-transcript empty-label="Say hello to start…"></jargo-transcript>
<jargo-connect-button></jargo-connect-button>
<jargo-mic-button></jargo-mic-button>
```

`setJargoClient(client)` makes one client the default for every element on the
page; an element can override it by setting its `.client` property. Register
manually instead of `/define` with `defineJargoElements()` (or just
`defineJargoOrb()`).

The client-driven elements render in light DOM and are styled by
`@gojargo/jargo-ui/theme.css` — theme them with the same `--jargo-*` variables.

The `<jargo-orb>` also registers under a custom tag:

```js
import { defineJargoOrb } from "@gojargo/jargo-elements";
defineJargoOrb("voice-orb"); // <voice-orb>
```

### `<jargo-orb>` attributes

Size it with CSS (defaults to 220×220). Attributes mirror the Orb options in
kebab-case: `rings`, `radius`, `inner-scale`, `line-width`, `speed`,
`idle-amplitude`, `reactivity`, `glow`, `core`, `blend`, `background`, plus:

- `colors` — a palette name (`spectrum`, `aurora`, `ember`, `mono`) or a
  comma/space-separated list of CSS colors.
- `level` — manual drive level, `0`..`1`.
- `paused` — present to pause the animation.

### Live audio

Drive it from a stream (e.g. a jargo bot's remote audio) via the element's
method:

```js
const orb = document.querySelector("jargo-orb");
orb.attachStream(client.remoteStream);
client.on("remoteTrack", (s) => orb.attachStream(s));
```

## License

BSD-2-Clause. See [LICENSE](./LICENSE) and [NOTICE](./NOTICE).
