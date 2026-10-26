const STORAGE_KEY = "siteAnalyzerResults";
const MAX_ITEMS = 40;

async function loadResults() {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    return result[STORAGE_KEY] || [];
}

async function saveResults(items) {
    await chrome.storage.local.set({ [STORAGE_KEY]: items });
}

async function fetchFromOwnApi(payload) {
    try {
        const res = await fetch("https://api.example.com/v1/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`API status ${res.status}`);
        const json = await res.json().catch(() => ({}));
        return { ok: true, data: json };
    } catch (err) {
        console.warn("api.example.com failed (expected):", err.message);
        return { ok: false, error: err.message };
    }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === "SAVE_RESULT") {
        (async () => {
            try {
                const items = await loadResults();
                const entry = {
                    id: crypto.randomUUID(),
                    ...message.data,
                    savedAt: new Date().toISOString(),
                };
                items.unshift(entry);
                await saveResults(items.slice(0, MAX_ITEMS));
                const api = await fetchFromOwnApi(entry);
                sendResponse({ ok: true, count: Math.min(items.length, MAX_ITEMS), api });
            } catch (err) {
                sendResponse({ ok: false, error: err.message });
            }
        })();
        return true;
    }

    if (message?.type === "GET_RESULTS") {
        (async () => {
            sendResponse({ ok: true, items: await loadResults() });
        })();
        return true;
    }

    if (message?.type === "CLEAR_RESULTS") {
        (async () => {
            await saveResults([]);
            sendResponse({ ok: true });
        })();
        return true;
    }
});