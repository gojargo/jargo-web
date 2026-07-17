# @gojargo/jargo-elements

**Web components** for jargo, built on
[`@gojargo/jargo-ui`](../jargo-ui). Today it ships `<jargo-orb>` — the Orb as a
native custom element, usable from plain HTML or any framework.

Part of the [`jargo-web`](https://github.com/gojargo/jargo-web) monorepo.

## Install

```bash
npm install @gojargo/jargo-elements
```

## Usage

Auto-register the elements, then use them in markup:

```html
<script type="module">
  import "@gojargo/jargo-elements/define";
</script>

<jargo-orb colors="aurora" rings="6" glow="20"></jargo-orb>
```

Or register manually (e.g. under a custom tag):

```js
import { defineJargoOrb } from "@gojargo/jargo-elements";
defineJargoOrb();            // <jargo-orb>
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
