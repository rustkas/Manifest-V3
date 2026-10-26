/**
 * Service Worker
 * - Receives extracted data
 * - Saves to chrome.storage
 * - Optionally posts to own API[](https://api.example.com)
 */

const STORAGE_KEY = "researchItems";

async function loadItems() {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    return result[STORAGE_KEY] || [];
}

async function saveItems(items) {
    await chrome.storage.local.set({ [STORAGE_KEY]: items });
}

async function sendToApi(payload) {
    try {
        const response = await fetch("https://api.example.com/research", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(`API responded with ${response.status}`);
        }

        return { ok: true };
    } catch (err) {
        console.warn("API request failed (expected for example.com):", err.message);
        return { ok: false, error: err.message };
    }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type === "SAVE_RESEARCH") {
        (async () => {
            try {
                const items = await loadItems();
                const entry = {
                    id: crypto.randomUUID(),
                    ...message.data,
                    savedAt: new Date().toISOString(),
                };
                items.unshift(entry);

                const trimmed = items.slice(0, 50);
                await saveItems(trimmed);

                const apiResult = await sendToApi(entry);

                sendResponse({
                    ok: true,
                    count: trimmed.length,
                    api: apiResult,
                });
            } catch (err) {
                sendResponse({ ok: false, error: err.message });
            }
        })();
        return true;
    }

    if (message?.type === "GET_RESEARCH") {
        (async () => {
            const items = await loadItems();
            sendResponse({ ok: true, items });
        })();
        return true;
    }

    if (message?.type === "CLEAR_RESEARCH") {
        (async () => {
            await saveItems([]);
            sendResponse({ ok: true });
        })();
        return true;
    }
});