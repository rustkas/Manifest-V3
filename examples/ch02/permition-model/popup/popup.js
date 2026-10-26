const noteEl = document.getElementById("note");
const pageTitleEl = document.getElementById("page-title");
const pageUrlEl = document.getElementById("page-url");
const statusEl = document.getElementById("status");
const saveBtn = document.getElementById("save-btn");
const clearBtn = document.getElementById("clear-btn");
const bookmarkBtn = document.getElementById("bookmark-btn");
const bookmarkHint = document.getElementById("bookmark-hint");

let currentTab = null; // { id, url, title }

function setStatus(message, type = "") {
    statusEl.textContent = message;
    statusEl.className = "status" + (type ? ` ${type}` : "");
}

function storageKey(url) {
    // Normalize a bit so trailing slash differences don't create duplicate notes
    try {
        const u = new URL(url);
        u.hash = "";
        return `note:${u.href}`;
    } catch {
        return `note:${url}`;
    }
}

async function getActiveTab() {
    // activeTab is granted when the user opens the popup
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    return tabs[0] || null;
}

async function loadNote(url) {
    const key = storageKey(url);
    const result = await chrome.storage.local.get(key);
    return result[key] || "";
}

async function saveNote(url, text) {
    const key = storageKey(url);
    if (text.trim() === "") {
        await chrome.storage.local.remove(key);
    } else {
        await chrome.storage.local.set({ [key]: text });
    }
}

async function hasBookmarksPermission() {
    return chrome.permissions.contains({ permissions: ["bookmarks"] });
}

async function requestBookmarksPermission() {
    return chrome.permissions.request({ permissions: ["bookmarks"] });
}

async function updateBookmarkButtonState() {
    const granted = await hasBookmarksPermission();
    bookmarkBtn.disabled = false;
    if (granted) {
        bookmarkBtn.textContent = "Save to bookmarks";
        bookmarkHint.textContent = "Bookmarks permission already granted";
    } else {
        bookmarkBtn.textContent = "Save to bookmarks…";
        bookmarkHint.textContent = "Will ask for optional “bookmarks” permission";
    }
}

async function init() {
    try {
        currentTab = await getActiveTab();

        if (!currentTab || !currentTab.url) {
            pageTitleEl.textContent = "No active tab";
            pageUrlEl.textContent = "";
            noteEl.disabled = true;
            saveBtn.disabled = true;
            clearBtn.disabled = true;
            bookmarkBtn.disabled = true;
            setStatus("Cannot read current tab", "error");
            return;
        }

        // Restricted pages (chrome://, edge://, about:, etc.) often have no useful URL
        const url = currentTab.url;
        if (
            url.startsWith("chrome://") ||
            url.startsWith("edge://") ||
            url.startsWith("about:") ||
            url.startsWith("chrome-extension://") ||
            url.startsWith("devtools://")
        ) {
            pageTitleEl.textContent = "Restricted page";
            pageUrlEl.textContent = url;
            noteEl.disabled = true;
            saveBtn.disabled = true;
            clearBtn.disabled = true;
            bookmarkBtn.disabled = true;
            setStatus("Notes are not available on browser internal pages", "error");
            return;
        }

        pageTitleEl.textContent = currentTab.title || "(no title)";
        pageTitleEl.title = currentTab.title || "";
        pageUrlEl.textContent = url;
        pageUrlEl.title = url;

        const existing = await loadNote(url);
        noteEl.value = existing;

        if (existing) {
            setStatus("Loaded saved note");
        } else {
            setStatus("No note yet for this page");
        }

        await updateBookmarkButtonState();
    } catch (err) {
        console.error(err);
        setStatus("Failed to initialize: " + err.message, "error");
    }
}

saveBtn.addEventListener("click", async () => {
    if (!currentTab?.url) return;

    try {
        await saveNote(currentTab.url, noteEl.value);
        setStatus("Note saved", "success");
    } catch (err) {
        setStatus("Save failed: " + err.message, "error");
    }
});

clearBtn.addEventListener("click", async () => {
    if (!currentTab?.url) return;

    noteEl.value = "";
    try {
        await saveNote(currentTab.url, "");
        setStatus("Note cleared", "success");
    } catch (err) {
        setStatus("Clear failed: " + err.message, "error");
    }
});

bookmarkBtn.addEventListener("click", async () => {
    if (!currentTab?.url) return;

    try {
        const alreadyGranted = await hasBookmarksPermission();

        if (!alreadyGranted) {
            const granted = await requestBookmarksPermission();
            if (!granted) {
                setStatus("Bookmarks permission denied", "error");
                return;
            }
            await updateBookmarkButtonState();
        }

        // Create a bookmark in the "Other bookmarks" folder (parentId omitted = default)
        await chrome.bookmarks.create({
            title: currentTab.title || currentTab.url,
            url: currentTab.url,
        });

        setStatus("Page added to bookmarks", "success");
    } catch (err) {
        console.error(err);
        setStatus("Bookmark failed: " + err.message, "error");
    }
});

init();