/**
 * Automatic injection ONLY on example.com/articles/*
 */

function analyzeArticlePage() {
    const title =
        document.querySelector("h1")?.textContent?.trim() ||
        document.title ||
        "";

    const paragraphs = Array.from(document.querySelectorAll("p"))
        .map((p) => p.textContent.trim())
        .filter(Boolean);

    const links = Array.from(document.querySelectorAll("a[href]")).map((a) => ({
        text: a.textContent.trim().slice(0, 80),
        href: a.href,
    }));

    return {
        source: "example.com",
        title,
        url: location.href,
        paragraphCount: paragraphs.length,
        linkCount: links.length,
        excerpt: paragraphs.slice(0, 3).join(" ").slice(0, 400),
        analyzedAt: new Date().toISOString(),
    };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === "ANALYZE_ARTICLE") {
        try {
            sendResponse({ ok: true, data: analyzeArticlePage() });
        } catch (err) {
            sendResponse({ ok: false, error: err.message });
        }
        return true;
    }
});