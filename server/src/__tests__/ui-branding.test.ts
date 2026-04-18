import { describe, expect, it } from "vitest";
import {
  applyUiBranding,
  getWorktreeUiBranding,
  isWorktreeUiBrandingEnabled,
  renderFaviconLinks,
  renderRuntimeBrandingMeta,
} from "../ui-branding.js";

const TEMPLATE = `<!doctype html>
<head>
    <!-- PROACTIVA_RUNTIME_BRANDING_START -->
    <!-- PROACTIVA_RUNTIME_BRANDING_END -->
    <!-- PROACTIVA_FAVICON_START -->
    <link rel="icon" href="/favicon.ico" sizes="48x48" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
    <!-- PROACTIVA_FAVICON_END -->
</head>`;

describe("ui branding", () => {
  it("detects worktree mode from PROACTIVA_IN_WORKTREE", () => {
    expect(isWorktreeUiBrandingEnabled({ PROACTIVA_IN_WORKTREE: "true" })).toBe(true);
    expect(isWorktreeUiBrandingEnabled({ PROACTIVA_IN_WORKTREE: "1" })).toBe(true);
    expect(isWorktreeUiBrandingEnabled({ PROACTIVA_IN_WORKTREE: "false" })).toBe(false);
  });

  it("resolves name, color, and text color for worktree branding", () => {
    const branding = getWorktreeUiBranding({
      PROACTIVA_IN_WORKTREE: "true",
      PROACTIVA_WORKTREE_NAME: "proactiva-pr-432",
      PROACTIVA_WORKTREE_COLOR: "#4f86f7",
    });

    expect(branding.enabled).toBe(true);
    expect(branding.name).toBe("proactiva-pr-432");
    expect(branding.color).toBe("#4f86f7");
    expect(branding.textColor).toMatch(/^#[0-9a-f]{6}$/);
    expect(branding.faviconHref).toContain("data:image/svg+xml,");
  });

  it("renders a dynamic worktree favicon when enabled", () => {
    const links = renderFaviconLinks(
      getWorktreeUiBranding({
        PROACTIVA_IN_WORKTREE: "true",
        PROACTIVA_WORKTREE_NAME: "proactiva-pr-432",
        PROACTIVA_WORKTREE_COLOR: "#4f86f7",
      }),
    );
    expect(links).toContain("data:image/svg+xml,");
    expect(links).toContain('rel="shortcut icon"');
  });

  it("renders runtime branding metadata for the ui", () => {
    const meta = renderRuntimeBrandingMeta(
      getWorktreeUiBranding({
        PROACTIVA_IN_WORKTREE: "true",
        PROACTIVA_WORKTREE_NAME: "proactiva-pr-432",
        PROACTIVA_WORKTREE_COLOR: "#4f86f7",
      }),
    );
    expect(meta).toContain('name="proactiva-worktree-name"');
    expect(meta).toContain('content="proactiva-pr-432"');
    expect(meta).toContain('name="proactiva-worktree-color"');
  });

  it("rewrites the favicon and runtime branding blocks for worktree instances only", () => {
    const branded = applyUiBranding(TEMPLATE, {
      PROACTIVA_IN_WORKTREE: "true",
      PROACTIVA_WORKTREE_NAME: "proactiva-pr-432",
      PROACTIVA_WORKTREE_COLOR: "#4f86f7",
    });
    expect(branded).toContain("data:image/svg+xml,");
    expect(branded).toContain('name="proactiva-worktree-name"');
    expect(branded).not.toContain('href="/favicon.svg"');

    const defaultHtml = applyUiBranding(TEMPLATE, {});
    expect(defaultHtml).toContain('href="/favicon.svg"');
    expect(defaultHtml).not.toContain('name="proactiva-worktree-name"');
  });
});
