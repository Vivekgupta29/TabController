let currentTabIndex = 0;

// Function to load links from storage and open them in new tabs or reload existing ones
function loadLinks() {
  chrome.storage.local.get("links", (result) => {
    const links = result.links || [];
    if (links.length === 0) {
      console.log("No links found in storage.");
      return;
    }

    // Open each link or reload if it's already open
    links.forEach((link) => {
      chrome.tabs.query({}, (tabs) => {
        const existingTab = tabs.find((tab) => tab.url === link);
        if (existingTab) {
          // If the tab is already open, reload it
          chrome.tabs.reload(existingTab.id);
        } else {
          // Otherwise, create a new tab
          chrome.tabs.create({ url: link });
        }
      });
    });
  });
}

// Message listener for actions from popup.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "loadTabs") {
    loadLinks();
  }
});

// In your background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "switchTab") {
    chrome.tabs.query({}, (tabs) => {
      const { url } = message;
      const tabToSwitch = tabs.find((tab) => tab.url === url);

      if (tabToSwitch) {
        // If the tab is already open, switch to it
        chrome.tabs.update(tabToSwitch.id, { active: true });
      } else {
        // If not, open the link in a new tab
        chrome.tabs.create({ url: url });
      }
    });
  }
});
