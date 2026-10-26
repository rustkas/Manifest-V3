const pageInfoEl = document.getElementById("page-info");
const exportBtn = document.getElementById("export-btn");
const statusEl = document.getElementById("status");
const permissionBox = document.getElementById("permission-box");
const grantBtn = document.getElementById("grant-btn");
const denyBtn = document.getElementById("deny-btn");
const revokeBtn = document.getElementById("revoke-btn");

let currentTab = null;

function setStatus(message, type = "") {
    statusEl.textContent = message;
    statusEl.className = "status" + (type ? ` ${type}` : "");
}

function showPermissionBox(show) {
    permissionBox.classList.toggle("hidden", !show);
}

function originPattern(url) {
    try {
        const u = new URL(url);
        return `${u.origin}/*`;
    } catch {
        return null;
    }
}

async function getActiveTab() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    return tabs[0] || null;
}

async function hasHostPermission(origin) {
    if (!origin) return false;
    return chrome.permissions.contains({ origins: [origin] });
}

async function requestHostPermission(origin) {
    return chrome.permissions.request({ origins: [origin] });
}

async function removeHostPermission(origin) {
    return chrome.permissions.remove({ origins: [origin] });
}

async function updateRevokeVisibility() {
    if (!currentTab?.url) {
        revokeBtn.classList.add("hidden");
        return;
    }
    const origin = originPattern(currentTab.url);
    const granted = origin ? await hasHostPermission(origin) : false;
    revokeBtn.classList.toggle("hidden", !granted);
}

async function onExportClick() {
    if (!currentTab?.url) {
        setStatus("No active tab", "error");
        return;
    }

    const origin = originPattern(currentTab.url);
    if (!origin) {
        setStatus("Cannot determine page origin", "error");
        return;
    }

    if (
        currentTab.url.startsWith("chrome://") ||
        currentTab.url.startsWith("edge://") ||
        currentTab.url.startsWith("about:") ||
        currentTab.url.startsWith("chrome-extension://")
    ) {
        setStatus("Cannot export browser internal pages", "error");
        return;
    }

    const granted = await hasHostPermission(origin);

    if (granted) {
        showPermissionBox(false);
        await performExport();
    } else {
        showPermissionBox(true);
        setStatus("Host permission required for this site", "warning");
    }
}

async function onGrantClick() {
    const origin = originPattern(currentTab.url);
    if (!origin) return;

    try {
        const granted = await requestHostPermission(origin);

        if (granted) {
            showPermissionBox(false);
            setStatus("Permission granted", "success");
            await updateRevokeVisibility();
            await performExport();
        } else {
            setStatus("Permission denied by user", "error");
            showPermissionBox(false);
        }
    } catch (err) {
        console.error(err);
        setStatus("Request failed: " + err.message, "error");
    }
}

function onDenyClick() {
    showPermissionBox(false);
    setStatus("Export cancelled. Host access was not granted.", "error");
}

async function onRevokeClick() {
    const origin = originPattern(currentTab?.url);
    if (!origin) return;

    try {
        const removed = await removeHostPermission(origin);
        if (removed) {
            setStatus("Host permission removed for this site", "success");
            await updateRevokeVisibility();
        } else {
            setStatus("Could not remove permission", "error");
        }
    } catch (err) {
        setStatus("Revoke failed: " + err.message, "error");
    }
}

async function performExport() {
    exportBtn.disabled = true;
    setStatus("Exporting…");

    try {
        const results = await chrome.scripting.executeScript({
            target: { tabId: currentTab.id },
            func: () => {
                const title = document.title || "";
                const url = location.href;
                const text = (document.body?.innerText || "")
                    .replace(/\s+/g, " ")
                    .trim()
                    .slice(0, 2000);
                return { title, url, text };
            },
        });

        const data = results?.[0]?.result;
        if (!data) {
            throw new Error("Could not read page content");
        }

        const content = [
            "Universal Web Exporter",
            "======================",
            "",
            `Title: ${data.title}`,
            `URL:   ${data.url}`,
            `Date:  ${new Date().toISOString()}`,
            "",
            "----- Page excerpt -----",
            "",
            data.text || "(no text content)",
            "",
        ].join("\n");

        const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
        const blobUrl = URL.createObjectURL(blob);

        const safeTitle = (data.title || "page")
            .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
            .slice(0, 60);
        const filename = `export-${safeTitle}.txt`;

        await chrome.downloads.download({
            url: blobUrl,
            filename,
            saveAs: true,
        });

        setStatus("Export started (check downloads)", "success");
    } catch (err) {
        console.error(err);
        setStatus("Export failed: " + err.message, "error");
    } finally {
        exportBtn.disabled = false;
    }
}

async function init() {
    try {
        currentTab = await getActiveTab();

        if (!currentTab) {
            pageInfoEl.textContent = "No active tab";
            exportBtn.disabled = true;
            return;
        }

        pageInfoEl.textContent = currentTab.title || currentTab.url || "Unknown page";
        pageInfoEl.title = currentTab.url || "";

        await updateRevokeVisibility();
    } catch (err) {
        console.error(err);
        setStatus("Init error: " + err.message, "error");
    }
}

exportBtn.addEventListener("click", onExportClick);
grantBtn.addEventListener("click", onGrantClick);
denyBtn.addEventListener("click", onDenyClick);
revokeBtn.addEventListener("click", onRevokeClick);

init();