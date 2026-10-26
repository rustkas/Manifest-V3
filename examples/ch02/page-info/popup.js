const titleElement = document.querySelector("#title");
const urlElement = document.querySelector("#url");

chrome.tabs.query(
    {
        active: true,
        currentWindow: true
    },
    (tabs) => {
        const tab = tabs[0];

        if (!tab) {
            titleElement.textContent = "Unknown";
            urlElement.textContent = "Unknown";
            return;
        }

        titleElement.textContent = tab.title ?? "Unknown";
        urlElement.textContent = tab.url ?? "Unknown";
    }
);
