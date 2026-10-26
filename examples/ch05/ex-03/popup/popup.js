const contextEl = document.getElementById("context");
const analyzeBtn = document.getElementById("analyze-btn");
const saveBtn = document.getElementById("save-btn");
const optionalBtn = document.getElementById("optional-btn");
const revokeBtn = document.getElementById("revoke-btn");
const clearBtn = document.getElementById("clear-btn");
const statusEl = document.getElementById("status");
const previewEl = document.getElementById("preview");
const previewTitle = document.getElementById("preview-title");
const previewMeta = document.getElementById("preview-meta");
const previewExcerpt = document.getElementById("preview-excerpt");
const savedListEl = document.getElementById("saved-list");

let currentTab = null;
let lastResult = null;

const OPTIONAL_ORIGINS = ["https://*.wikipedia.org/*"];

function setStatus(msg, type = "") {
    statusEl.textContent = msg;
    statusEl.className = "status" + (type ? ` ${type}` : "");
}

function isExampleArticles(url) {
    try {
        const u = new URL(url);
        const host = u.hostname === "example.com" || u.hostname === "www.example.com";
        return host && u.pathname.startsWith("/articles/");
    } catch {
        return false;
    }
}

function isWikipedia(url) {
    try {
        return new URL(url).hostname.endsWith("wikipedia.org");
    } catch {
        return false;
    }
}

async function getActiveTab() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    return tabs[0] || null;
}

async function hasOptionalPermission() {
    return chrome.permissions.contains({ origins: OPTIONAL_ORIGINS });
}

async function requestOptionalPermission() {
    return chrome.permissions.request({ origins: OPTIONAL_ORIGINS });
}

async function removeOptionalPermission() {
    return chrome.permissions.remove({ origins: OPTIONAL_ORIGINS });
}

async function updateRevokeVisibility() {
    const granted = await hasOptionalPermission();
    revokeBtn.classList.toggle("hidden", !granted);
}

/** Main path: content script already injected on /articles/ */
async function analyzeArticle() {
    if (!currentTab?.id) return;

    analyzeBtn.disabled = true;
    setStatus("Analyzing…");

    try {
        const response = await chrome.tabs.sendMessage(currentTab.id, {
            type: "ANALYZE_ARTICLE",
        });

        if (!response?.ok) {
            throw new Error(response?.error || "Content script did not respond");
        }

        lastResult = response.data;
        showPreview(lastResult);
        saveBtn.disabled = false;
        setStatus("Article analyzed", "success");
    } catch (err) {
        console.error(err);
        setStatus(
            "Failed. Open https://example.com/articles/… and reload the page.",
            "error"
        );
        lastResult = null;
        saveBtn.disabled = true;
        previewEl.classList.add("hidden");
    } finally {
        analyzeBtn.disabled = false;
    }
}

/**
 * Optional path: just-in-time host permission for Wikipedia,
 * then inject script via chrome.scripting (activeTab + optional host).
 */
async function analyzeOptionalSite() {
    if (!currentTab?.id || !currentTab.url) return;

    if (!isWikipedia(currentTab.url)) {
        setStatus("Open a Wikipedia page first, then use this button.", "warning");
        return;
    }

    // 1. Check / request optional host permission (just-in-time)
    let granted = await hasOptionalPermission();
    if (!granted) {
        setStatus("Requesting Wikipedia host permission…", "warning");
        granted = await requestOptionalPermission();
        if (!granted) {
            setStatus("Optional permission denied — feature unavailable.", "error");
            return;
        }
        await updateRevokeVisibility();
    }

    optionalBtn.disabled = true;
    setStatus("Analyzing Wikipedia page…");

    try {
        // 2. Inject a one-off function (no permanent content_script for optional host)
        const results = await chrome.scripting.executeScript({
            target: { tabId: currentTab.id },
            func: () => {
                const title =
                    document.querySelector("#firstHeading, h1")?.textContent?.trim() ||
                    document.title;
                const text = (document.body?.innerText || "")
                    .replace(/\s+/g, " ")
                    .trim()
                    .slice(0, 400);
                return {
                    source: "wikipedia.org",
                    title,
                    url: location.href,
                    paragraphCount: document.querySelectorAll("p").length,
                    linkCount: document.querySelectorAll("a[href]").length,
                    excerpt: text,
                    analyzedAt: new Date().toISOString(),
                };
            },
        });

        const data = results?.[0]?.result;
        if (!data) throw new Error("No data from page");

        lastResult = data;
        showPreview(lastResult);
        saveBtn.disabled = false;
        setStatus("Wikipedia page analyzed (optional host)", "success");
    } catch (err) {
        console.error(err);
        setStatus("Optional analyze failed: " + err.message, "error");
    } finally {
        optionalBtn.disabled = false;
    }
}

function showPreview(data) {
    previewTitle.textContent = data.title || "(no title)";
    previewMeta.textContent = `${data.source} · ${data.paragraphCount} paragraphs · ${data.linkCount} links`;
    previewExcerpt.textContent = data.excerpt || "";
    previewEl.classList.remove("hidden");
}

async function saveResult() {
    if (!lastResult) return;

    saveBtn.disabled = true;
    setStatus("Saving…");

    try {
        const response = await chrome.runtime.sendMessage({
            type: "SAVE_RESULT",
            data: lastResult,
        });

        if (!response?.ok) throw new Error(response?.error || "Save failed");

        let msg = `Saved (${response.count})`;
        if (response.api && !response.api.ok) {
            msg += " · API unreachable (expected)";
        } else if (response.api?.ok) {
            msg += " · API ok";
        }
        setStatus(msg, "success");
        await loadSaved();
    } catch (err) {
        setStatus("Save failed: " + err.message, "error");
    } finally {
        saveBtn.disabled = false;
    }
}

async function loadSaved() {
    try {
        const response = await chrome.runtime.sendMessage({ type: "GET_RESULTS" });
        const items = response?.items || [];
        savedListEl.innerHTML = "";

        if (!items.length) {
            savedListEl.innerHTML = '<li class="empty">No saved results yet</li>';
            return;
        }

        items.forEach((item) => {
            const li = document.createElement("li");
            li.innerHTML = `
        <div class="item-title">${escapeHtml(item.title || item.url || "Untitled")}</div>
        <div class="item-meta">${escapeHtml(item.source || "")} · ${formatDate(item.savedAt)}</div>
      `;
            savedListEl.appendChild(li);
        });
    } catch {
        savedListEl.innerHTML = '<li class="empty">Could not load results</li>';
    }
}

async function clearAll() {
    await chrome.runtime.sendMessage({ type: "CLEAR_RESULTS" });
    setStatus("Cleared", "success");
    await loadSaved();
}

async function revokeOptional() {
    const removed = await removeOptionalPermission();
    if (removed) {
        setStatus("Wikipedia host permission revoked", "success");
        await updateRevokeVisibility();
    }
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function formatDate(iso) {
    if (!iso) return "";
    try {
        return new Date(iso).toLocaleString();
    } catch {
        return iso;
    }
}

async function init() {
    currentTab = await getActiveTab();

    if (!currentTab) {
        contextEl.textContent = "No active tab";
        return;
    }

    contextEl.textContent = currentTab.title || currentTab.url || "";
    contextEl.title = currentTab.url || "";

    if (isExampleArticles(currentTab.url)) {
        analyzeBtn.disabled = false;
        setStatus("example.com/articles page detected");
    } else {
        analyzeBtn.disabled = true;
        setStatus("Open an example.com/articles/… page for the main feature");
    }

    await updateRevokeVisibility();
    await loadSaved();
}

analyzeBtn.addEventListener("click", analyzeArticle);
saveBtn.addEventListener("click", saveResult);
optionalBtn.addEventListener("click", analyzeOptionalSite);
revokeBtn.addEventListener("click", revokeOptional);
clearBtn.addEventListener("click", clearAll);

init();