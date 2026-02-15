# @ngrok/remark-mdx-github-alerts

Remark plugin that transforms GitHub-style alert blockquotes into MDX JSX elements, allowing consumers to render them with any component via the MDX provider.

## Why

GitHub Flavored Markdown supports [alert blockquotes](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax#alerts) for highlighting important information. This plugin lets you use the same syntax in MDX and render alerts with your own React components.

## What

Transforms:

```md
> [!NOTE]
> Some informational text
```

Into the equivalent of:

```jsx
<GithubAlert type="note">Some informational text</GithubAlert>
```

Supported alert types: `NOTE`, `TIP`, `IMPORTANT`, `WARNING`, `CAUTION` (case-insensitive).

## Installation

| package manager | command                                         |
| --------------- | ----------------------------------------------- |
| npm             | npm install -DE @ngrok/remark-mdx-github-alerts |
| pnpm            | pnpm add -DE @ngrok/remark-mdx-github-alerts    |
| bun             | bun add -DE @ngrok/remark-mdx-github-alerts     |
| yarn            | yarn add -DE @ngrok/remark-mdx-github-alerts    |

## Configuration

### With `@mdx-js/rollup` (Vite, Rollup)

```ts
import mdx from "@mdx-js/rollup";
import { remarkGithubAlerts } from "@ngrok/remark-mdx-github-alerts";

export default {
	plugins: [
		mdx({
			remarkPlugins: [remarkGithubAlerts],
		}),
	],
};
```

### With `@mdx-js/mdx` (compile API)

```ts
import { compile } from "@mdx-js/mdx";
import { remarkGithubAlerts } from "@ngrok/remark-mdx-github-alerts";

const result = await compile(mdxSource, {
	remarkPlugins: [remarkGithubAlerts],
});
```

## How it works

The plugin operates at the **mdast (Markdown AST)** level, running as a remark transform before MDX converts to HTML (hast).

1. **Walk the tree** — uses `unist-util-visit` to traverse all `blockquote` nodes.
2. **Detect alert markers** — checks if the first text node matches `[!NOTE]`, `[!TIP]`, `[!IMPORTANT]`, `[!WARNING]`, or `[!CAUTION]`.
3. **Transform to JSX** — replaces the blockquote with an `mdxJsxFlowElement` node (`<GithubAlert type="...">`) containing the remaining content.

The marker text is stripped and any content following it (on the same line or subsequent lines) is preserved as children of the JSX element.

## API

### `remarkGithubAlerts()`

Returns a remark transformer function. No options are needed — all alert blockquotes are processed automatically.

Provide a `GithubAlert` component via your MDX provider to control rendering.

## License

MIT
