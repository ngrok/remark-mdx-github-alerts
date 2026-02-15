import type { Blockquote, Paragraph, PhrasingContent, Root } from "mdast";
import type { MdxJsxFlowElement } from "mdast-util-mdx-jsx";

import { visit } from "unist-util-visit";

const alertRegex = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i;

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
function remarkMdxGithubAlerts() {
	return (tree: Root) => {
		visit(tree, "blockquote", (node: Blockquote, index, parent) => {
			if (index === undefined || !parent) {
				return;
			}

			const firstChild = node.children[0];
			if (!firstChild || firstChild.type !== "paragraph") {
				return;
			}

			const firstInline = firstChild.children[0];
			if (!firstInline || firstInline.type !== "text") {
				return;
			}

			const match = alertRegex.exec(firstInline.value);
			if (!match) {
				return;
			}

			const alertType = match[1]?.toLowerCase();
			if (!alertType) {
				return;
			}

			// Strip the [!TYPE] marker and rebuild the first paragraph's children.
			// The marker text may be followed by a newline within the same text node
			// (e.g. `[!NOTE]\nSome text`) or by a separate `break` node in the AST.
			const textAfterMarker = firstInline.value.slice(match[0].length);
			let remainingChildren: Array<PhrasingContent>;

			if (textAfterMarker.includes("\n")) {
				// The newline is embedded in the text node — strip the marker and
				// any leading newlines, keep the rest of the text node + siblings.
				remainingChildren = [
					{ ...firstInline, value: textAfterMarker.replace(/^\n+/, "") },
					...firstChild.children.slice(1),
				];
			} else {
				// The newline is represented as a separate `break` AST node (or
				// there is no newline at all). Skip the marker text node and any
				// immediately following `break` node.
				const siblings = firstChild.children.slice(1);
				if (siblings[0]?.type === "break") {
					remainingChildren = siblings.slice(1);
				} else {
					remainingChildren = siblings;
				}

				// If there was non-newline text after the marker (e.g. trailing
				// whitespace that isn't meaningful), only keep it if non-empty after
				// trimming.
				const trimmed = textAfterMarker.trim();
				if (trimmed.length > 0) {
					remainingChildren = [{ ...firstInline, value: trimmed }, ...remainingChildren];
				}
			}

			// Build the children for the JSX element
			const children = [...node.children];

			if (remainingChildren.length > 0) {
				const updatedParagraph: Paragraph = {
					...firstChild,
					children: remainingChildren,
				};
				children[0] = updatedParagraph;
			} else {
				// The first paragraph only contained the marker — remove it entirely
				children.shift();
			}

			const jsxNode: MdxJsxFlowElement = {
				type: "mdxJsxFlowElement",
				name: "GithubAlert",
				attributes: [
					{
						type: "mdxJsxAttribute",
						name: "type",
						value: alertType,
					},
				],
				children,
			};

			parent.children[index] = jsxNode as unknown as Blockquote;
		});
	};
}

export { remarkMdxGithubAlerts };
