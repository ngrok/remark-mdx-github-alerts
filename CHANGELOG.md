# @ngrok/remark-mdx-github-alerts

## 0.1.1

### Patch Changes

- [#1](https://github.com/ngrok/remark-mdx-github-alerts/pull/1) [`d333491`](https://github.com/ngrok/remark-mdx-github-alerts/commit/d333491f6efb711aad9e7a59f98075387e6eeecb) Thanks [@cody-dot-js](https://github.com/cody-dot-js)! - Transform an alert that is nested in another alert. Before, the inner `[!TYPE]` marker stayed in the output as text. GitHub does not render a nested alert, so the README now lists the differences from GitHub.
  
  Remove the whitespace after the marker for each line ending. Before, a CRLF line ending and the space before text on the marker line stayed in the output.
  
  Move `@types/mdast` to `dependencies`, because the published types import `Root` from `mdast`.
  
  Fix the README examples: the export is `remarkMdxGithubAlerts`, not `remarkGithubAlerts`.
  
  Update `unist-util-visit` to 5.2.0.
