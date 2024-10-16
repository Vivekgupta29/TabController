document.getElementById("loadTabs").addEventListener("click", () => {
  chrome.runtime.sendMessage({ action: "loadTabs" });
});

document.getElementById("startScroll").addEventListener("click", () => {
  // Send a message to the active tab to start scrolling
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length > 0) {
      chrome.tabs.sendMessage(tabs[0].id, { action: "startScroll" });
    }
  });
});

document.getElementById("stopScroll").addEventListener("click", () => {
  // Send a message to the active tab to stop scrolling
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length > 0) {
      chrome.tabs.sendMessage(tabs[0].id, { action: "stopScroll" });
    }
  });
});

document.getElementById("Optionspage").addEventListener("click", () => {
  // Navigate to the options page
  chrome.runtime.openOptionsPage();
});
