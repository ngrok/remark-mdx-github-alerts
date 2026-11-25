import { compile } from "@mdx-js/mdx";
import { describe, expect, it } from "vitest";

import { remarkMdxGithubAlerts } from "./index.js";

async function mdxToJsx(md: string): Promise<string> {
	const result = await compile(md, {
		remarkPlugins: [remarkMdxGithubAlerts],
		jsx: true,
	});
	return String(result);
}

/** Extract the JSX return from the _createMdxContent function. */
function extractJsxBody(compiled: string): string {
	return /return\s+(?<body>.*);?\s*\n\}/u.exec(compiled)?.groups?.body ?? "";
}

describe("remarkMdxGithubAlerts", () => {
	it.each(["NOTE", "TIP", "IMPORTANT", "WARNING", "CAUTION"])(
		"transforms [!%s] blockquote into <GithubAlert>",
		async (type) => {
			const md = `> [!${type}]\n> Some text`;
			const body = extractJsxBody(await mdxToJsx(md));
			expect(body).toContain(`<GithubAlert type="${type.toLowerCase()}">`);
			expect(body).toContain("Some text");
			expect(body).not.toContain(`[!${type}]`);
		},
	);

	it("is case-insensitive for alert type", async () => {
		const body = extractJsxBody(await mdxToJsx("> [!note]\n> Hello"));
		expect(body).toContain('<GithubAlert type="note">');
	});

	it("preserves content after the marker on the same line", async () => {
		const body = extractJsxBody(await mdxToJsx("> [!TIP]\n> First line\n> Second line"));
		expect(body).toContain("First line");
		expect(body).toContain("Second line");
	});

	it("handles marker with no body text", async () => {
		const body = extractJsxBody(await mdxToJsx("> [!NOTE]"));
		expect(body).toContain('<GithubAlert type="note"');
		expect(body).not.toContain("[!NOTE]");
	});

	it("handles multiple paragraphs in a blockquote", async () => {
		const md = `> [!WARNING]\n> Paragraph one\n>\n> Paragraph two`;
		const body = extractJsxBody(await mdxToJsx(md));
		expect(body).toContain('<GithubAlert type="warning">');
		expect(body).toContain("Paragraph one");
		expect(body).toContain("Paragraph two");
	});

	it("does not transform a regular blockquote", async () => {
		const body = extractJsxBody(await mdxToJsx("> Just a quote"));
		expect(body).not.toContain("GithubAlert");
		expect(body).toContain("Just a quote");
	});

	it("does not transform a blockquote with an unknown alert type", async () => {
		const body = extractJsxBody(await mdxToJsx("> [!UNKNOWN]\n> Text"));
		expect(body).not.toContain("GithubAlert");
	});

	it("handles inline formatting in the alert body", async () => {
		const md = `> [!NOTE]\n> Some **bold** and *italic* text`;
		const body = extractJsxBody(await mdxToJsx(md));
		expect(body).toContain('<GithubAlert type="note">');
		expect(body).toContain("bold");
		expect(body).toContain("italic");
	});

	it("transforms multiple alerts in the same document", async () => {
		const md = `> [!NOTE]\n> Note text\n\n> [!WARNING]\n> Warning text`;
		const body = extractJsxBody(await mdxToJsx(md));
		expect(body).toContain('<GithubAlert type="note">');
		expect(body).toContain('<GithubAlert type="warning">');
	});

	it("transforms an alert nested in another alert", async () => {
		const md = `> [!NOTE]\n> Outer\n>\n> > [!TIP]\n> > Inner`;
		const body = extractJsxBody(await mdxToJsx(md));
		expect(body).toContain('<GithubAlert type="note">');
		expect(body).toContain('<GithubAlert type="tip">');
		expect(body).not.toContain("[!TIP]");
	});

	it.each([
		["a CRLF line ending", "> [!NOTE]\r\n> Some text", String.raw`{"Some text"}`],
		["text on the marker line", "> [!NOTE] Some\n> text", String.raw`{"Some\ntext"}`],
	])("removes the whitespace after the marker with %s", async (_name, md, text) => {
		const body = extractJsxBody(await mdxToJsx(md));
		expect(body).toContain(`<_components.p>${text}</_components.p>`);
	});

	it("handles a link inside the alert body", async () => {
		const md = `> [!TIP]\n> Check [this link](https://example.com)`;
		const body = extractJsxBody(await mdxToJsx(md));
		expect(body).toContain('<GithubAlert type="tip">');
		expect(body).toContain("https://example.com");
	});
});
