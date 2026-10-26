const contextEl = document.getElementById("context");
const extractBtn = document.getElementById("extract-btn");
const saveBtn = document.getElementById("save-btn");
const clearBtn = document.getElementById("clear-btn");
const statusEl = document.getElementById("status");
const previewEl = document.getElementById("preview");
const headingsListEl = document.getElementById("headings-list");
const savedListEl = document.getElementById("saved-list");

let currentTab = null;
let lastExtracted = null;

function setStatus(msg, type = "") {
    statusEl.textContent = msg;
    statusEl.className = "status" + (type ? ` ${type}` : "");
}

function isWikipedia(url) {
    try {
        const u = new URL(url);
        return u.hostname.endsWith("wikipedia.org");
    } catch {
        return false;
    }
}

async function getActiveTab() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    return tabs[0] || null;
}

async function extractFromPage() {
    if (!currentTab?.id) return;

    setStatus("Extracting…");
    extractBtn.disabled = true;

    try {
        const response = await chrome.tabs.sendMessage(currentTab.id, {
            type: "EXTRACT_HEADINGS",
        });

        if (!response?.ok) {
            throw new Error(response?.error || "No response from content script");
        }

        lastExtracted = response.data;
        renderPreview(lastExtracted);
        saveBtn.disabled = false;
        setStatus(`Found ${lastExtracted.headings.length} headings`, "success");
    } catch (err) {
        console.error(err);
        setStatus("Extract failed. Open a Wikipedia article and try again.", "error");
        lastExtracted = null;
        saveBtn.disabled = true;
        previewEl.classList.add("hidden");
    } finally {
        extractBtn.disabled = false;
    }
}

function renderPreview(data) {
    headingsListEl.innerHTML = "";

    if (!data.headings.length) {
        headingsListEl.innerHTML = "<li class='empty'>No headings found</li>";
    } else {
        data.headings.forEach((h) => {
            const li = document.createElement("li");
            li.className = `level-${h.level}`;
            li.textContent = h.text;
            headingsListEl.appendChild(li);
        });
    }

    previewEl.classList.remove("hidden");
}

async function saveResult() {
    if (!lastExtracted) return;

    saveBtn.disabled = true;
    setStatus("Saving…");

    try {
        const response = await chrome.runtime.sendMessage({
            type: "SAVE_RESEARCH",
            data: lastExtracted,
        });

        if (!response?.ok) {
            throw new Error(response?.error || "Save failed");
        }

        let msg = `Saved (${response.count} items)`;
        if (response.api && !response.api.ok) {
            msg += " · API unreachable (expected for example.com)";
        } else if (response.api?.ok) {
            msg += " · sent to API";
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
        const response = await chrome.runtime.sendMessage({ type: "GET_RESEARCH" });
        const items = response?.items || [];

        savedListEl.innerHTML = "";

        if (!items.length) {
            savedListEl.innerHTML = '<li class="empty">No saved items yet</li>';
            return;
        }

        items.forEach((item) => {
            const li = document.createElement("li");
            const count = item.headings?.length ?? 0;
            li.innerHTML = `
        <div class="item-title" title="${escapeHtml(item.title)}">${escapeHtml(item.title)}</div>
        <div class="item-meta">${count} headings · ${formatDate(item.savedAt)}</div>
      `;
            savedListEl.appendChild(li);
        });
    } catch (err) {
        savedListEl.innerHTML = '<li class="empty">Could not load saved items</li>';
    }
}

async function clearAll() {
    await chrome.runtime.sendMessage({ type: "CLEAR_RESEARCH" });
    setStatus("Cleared", "success");
    await loadSaved();
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

    const url = currentTab.url || "";
    contextEl.textContent = currentTab.title || url;
    contextEl.title = url;

    if (isWikipedia(url)) {
        extractBtn.disabled = false;
        setStatus("Wikipedia page detected");
    } else {
        extractBtn.disabled = true;
        saveBtn.disabled = true;
        setStatus("Open a Wikipedia page to extract headings", "error");
    }

    await loadSaved();
}

extractBtn.addEventListener("click", extractFromPage);
saveBtn.addEventListener("click", saveResult);
clearBtn.addEventListener("click", clearAll);

init();