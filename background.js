let currentTabIndex = 0;
let activeTabId = null; // To store the ID of the currently active tab

chrome.tabs.onActivated.addListener((activeInfo) => {
  const newActiveTabId = activeInfo.tabId;

  // Stop scrolling in the previous tab if there is one
  if (activeTabId !== null && activeTabId !== newActiveTabId) {
    chrome.tabs.sendMessage(activeTabId, { action: "stopScrolling" });
  }

  // Update the active tab ID
  activeTabId = newActiveTabId;

  // Start scrolling in the new active tab
  chrome.tabs.sendMessage(newActiveTabId, {
    action: "scrollFrame",
    className: ".your-frame-class",
  });
});

function switchToTabIndex(tabIndex) {
  // Get the links array from chrome.storage.sync
  chrome.storage.sync.get("links", (result) => {
    const links = result.links || [];

    // Ensure the provided tabIndex is valid
    if (tabIndex < 0 || tabIndex >= links.length) {
      console.log("Invalid tab index.");
      return;
    }

    // Get the link at the specified index
    const targetLink = links[tabIndex].link;

    // Query all open tabs
    chrome.tabs.query({}, (tabs) => {
      // Check if the tab with the target URL is already open
      const existingTab = tabs.find((tab) => tab.url === targetLink);
      if (existingTab) {
        // If the tab is already open, switch to it
        chrome.tabs.update(existingTab.id, { active: true }, () => {
          console.log(`Switched to existing tab: ${targetLink}`);
        });
      } else {
        // If the tab is not open, create a new tab with the target link
        chrome.tabs.create({ url: targetLink }, (newTab) => {
          console.log(`Opened new tab: ${targetLink}`);
        });
      }
    });
  });
}

// Helper function to handle tab creation or reloading
function processTab(link, className) {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({}, (tabs) => {
      const existingTab = tabs.find((tab) => tab.url === link);

      if (existingTab) {
        // If the tab is already open, reload it
        chrome.tabs.reload(existingTab.id, () => {
          // Send a message to the content script to scroll
          chrome.tabs.sendMessage(existingTab.id, {
            action: "scrollFrame",
            className: className,
          });
          resolve();
        });
      } else {
        // Otherwise, create a new tab
        chrome.tabs.create({ url: link }, (newTab) => {
          // Wait for the tab to load, then send the message to scroll
          chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
            if (tabId === newTab.id && info.status === "complete") {
              // Send a message to the content script to scroll
              chrome.tabs.sendMessage(newTab.id, {
                action: "scrollFrame",
                className: className,
              });
              chrome.tabs.onUpdated.removeListener(listener);
              resolve();
            }
          });
        });
      }
    });
  });
}

// Update loadLinks to pass the class name from storage
function loadLinks() {
  chrome.storage.sync.get("links", async (result) => {
    const links = result.links || [];
    if (links.length === 0) {
      console.log("No links found in storage.");
      return;
    }

    try {
      // Process all links with Promises
      const tabPromises = links.map((linkObj) =>
        processTab(linkObj.link, linkObj.className)
      );

      // Wait for all tabs to be processed (either opened or reloaded)
      await Promise.all(tabPromises);

      // Switch to the target tab after all tabs are processed
      switchToTabIndex(currentTabIndex);
    } catch (error) {
      console.error("Error processing tabs:", error);
    }
  });
}

function switchTabs() {
  chrome.storage.local.get("links", (result) => {
    const links = result.links || [];
    if (links.length === 0) {
      console.log("No links found in storage.");
      return;
    }
    // Update the tab index
    if (currentTabIndex === links.length) {
      currentTabIndex = 0; // Loop back to the first tab
    } else {
      currentTabIndex += 1; // Move to the next tab
    }
    // Call switchToTab after updating currentTabIndex
    switchToTabIndex(currentTabIndex);
  });
}

let scrollingIntervalId; // Variable to hold the interval ID for scrolling

function startScrolling() {
  // Get the class name from storage
  switchToTabIndex(currentTabIndex);
  console.log(currentTabIndex);
  chrome.storage.sync.get(
    ["links", "scrollPixels", "intervalTime"],
    (result) => {
      const links = result.links || [];

      if (links.length === 0) {
        console.log("No links found in storage.");
        return;
      }

      // Get the current link and class name based on the currentTabIndex
      const currentLink = links[currentTabIndex];
      const frameClass = currentLink.className; // Default class if none is found

      // Send a message to the active tab to start scrolling
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length > 0) {
          const activeTab = tabs[0];
          chrome.tabs.sendMessage(activeTab.id, {
            action: "scrollFrame",
            className: frameClass,
          });
        }
      });

      console.log("Scrolling started with class:", frameClass);
    }
  );
}

function stopScrolling() {
  // Send a message to the active tab to stop scrolling
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length > 0) {
      const activeTab = tabs[0];
      chrome.tabs.sendMessage(activeTab.id, { action: "stopScrolling" });
    }
  });

  console.log("Scrolling stopped.");
}

// Message listener for actions from popup.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "loadTabs") {
    console.log("loadTabs Clicked");
    loadLinks();
  } else if (message.action === "switchTab") {
    console.log("switchtab Clicked");
    switchTabs();
  } else if (message.action === "start") {
    console.log("start Clicked");
    startScrolling();
  } else if (message.action === "stop") {
    console.log("stop Clicked");
    stopScrolling();
  }
});
