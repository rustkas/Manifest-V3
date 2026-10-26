/**
 * Content Script — runs only on https://*.wikipedia.org/*
 * Extracts page headings and sends them to the extension.
 */

function extractHeadings() {
    const headings = [];

    const mainTitle = document.querySelector("#firstHeading, h1#firstHeading, .mw-page-title-main");
    if (mainTitle) {
        headings.push({
            level: 1,
            text: mainTitle.textContent.trim(),
        });
    }

    document.querySelectorAll(".mw-headline, h2, h3").forEach((el) => {
        const text = el.textContent.trim();
        if (!text) return;
        if (el.closest(".mw-editsection")) return;

        let level = 2;
        if (el.tagName === "H3" || el.closest("h3")) level = 3;
        if (el.tagName === "H2" || el.closest("h2")) level = 2;

        if (headings.some((h) => h.text === text && h.level === 1)) return;

        headings.push({ level, text });
    });

    const seen = new Set();
    return headings.filter((h) => {
        const key = `${h.level}:${h.text}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function getPageInfo() {
    return {
        title: document.title.replace(" - Wikipedia", "").trim(),
        url: location.href,
        headings: extractHeadings(),
        extractedAt: new Date().toISOString(),
    };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === "EXTRACT_HEADINGS") {
        try {
            const data = getPageInfo();
            sendResponse({ ok: true, data });
        } catch (err) {
            sendResponse({ ok: false, error: err.message });
        }
        return true;
    }
});

chrome.runtime.sendMessage({ type: "CONTENT_READY", url: location.href }).catch(() => { });