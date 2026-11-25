import type { Root } from "mdast";
import type { MdxJsxFlowElement } from "mdast-util-mdx-jsx";

import { visit } from "unist-util-visit";

// Why `\s*`: it removes the spaces and the line ending (LF or CRLF) after the marker in one step.
const alertMarker = /^\[!(?<type>note|tip|important|warning|caution)\]\s*/iu;

/**
 * Remark plugin that transforms GitHub-style alert blockquotes into MDX JSX
 * elements, allowing consumers to render them with any component via the MDX
 * provider.
 *
 * Transforms:
 * ```md
 * > [!NOTE]
 * > Some informational text
 * ```
 *
 * Into the equivalent of:
 * ```jsx
 * <GithubAlert type="note">Some informational text</GithubAlert>
 * ```
 */
function remarkMdxGithubAlerts(): (tree: Root) => undefined {
	return (tree) => {
		visit(tree, "blockquote", (node, index, parent) => {
			const [paragraph] = node.children;
			if (index == null || parent == null || paragraph?.type !== "paragraph") {
				return;
			}
			const [marker, next] = paragraph.children;
			if (marker?.type !== "text") {
				return;
			}
			const match = alertMarker.exec(marker.value);
			const type = match?.groups?.type;
			if (match == null || type == null) {
				return;
			}

			const rest = marker.value.slice(match[0].length);
			if (rest === "") {
				// Why: a hard break (`[!NOTE]` and two spaces) ends the marker line as a node.
				paragraph.children.splice(0, next?.type === "break" ? 2 : 1);
			} else {
				marker.value = rest;
			}
			if (paragraph.children.length === 0) {
				node.children.shift();
			}

			// Why the same `children` array: `visit` walks it next, so a nested alert replaces
			// itself in the output tree.
			const alert: MdxJsxFlowElement = {
				type: "mdxJsxFlowElement",
				name: "GithubAlert",
				attributes: [{ type: "mdxJsxAttribute", name: "type", value: type.toLowerCase() }],
				children: node.children,
				position: node.position,
			};
			parent.children[index] = alert;
		});
	};
}

export { remarkMdxGithubAlerts };
