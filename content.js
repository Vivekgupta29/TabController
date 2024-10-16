let scrollingInterval;
let isScrolling = false; // Flag to track scrolling state
let currentTabIndex = 0; // Track the current tab index
let returningToTop = false; // Flag to track if scrolling back to the top

// Listen for messages from popup.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "startScroll") {
    startScrolling();
  } else if (message.action === "stopScroll") {
    stopScrolling();
  }
});

// Function to start scrolling
function startScrolling() {
  // Enable smooth scrolling behavior
  document.documentElement.style.scrollBehavior = "smooth";

  // Get scrollPixels and intervalTime from chrome.storage
  chrome.storage.local.get(
    ["scrollPixels", "intervalTime", "links"],
    (result) => {
      const scrollPixels = parseInt(result.scrollPixels) || 550; // Default to 550 if undefined
      const intervalTime = parseInt(result.intervalTime) || 2000; // Default to 2000 if undefined
      const links = result.links || []; // Get links from storage

      if (!isScrolling && links.length > 0) {
        // Check if already scrolling and links exist
        isScrolling = true; // Set flag to true
        returningToTop = false; // Reset the returning to top flag

        scrollingInterval = setInterval(() => {
          if (!returningToTop) {
            window.scrollBy(0, scrollPixels); // Scroll down by specified pixels

            // Check if the page has been fully scrolled
            if (
              window.innerHeight + window.scrollY >=
              document.body.offsetHeight
            ) {
              // Page is fully scrolled, switch to the top
              returningToTop = true; // Set the flag to indicate we're returning to the top
              window.scrollTo(0, 0); // Immediately scroll to the top
            }
          } else {
            // If returning to the top, check if we are there
            if (window.scrollY === 0) {
              // We're back at the top, switch to the next tab
              clearInterval(scrollingInterval); // Clear the interval
              isScrolling = false; // Reset the scrolling flag
              // Reset smooth scrolling behavior
              document.documentElement.style.scrollBehavior = "auto";
              switchToNextTab(links); // Switch to the next tab
            }
          }
        }, intervalTime); // Set the interval time for scrolling
      }
    }
  );
}

// Function to switch to the next tab in the links
// Function to switch to the next tab in the links
function switchToNextTab(links) {
  // Update the current tab index
  currentTabIndex = (currentTabIndex + 1) % links.length;

  console.log("Current Tab Index:", currentTabIndex);
  console.log("Link to open:", links[currentTabIndex]);

  // Attempt to switch to the next tab directly
  chrome.tabs.query({}, (tabs) => {
    const tabToSwitch = tabs.find((tab) => tab.url === links[currentTabIndex]);

    if (tabToSwitch) {
      // If the tab is already open, switch to it
      console.log("Switching to the active tab:", tabToSwitch.url);
      chrome.tabs.update(tabToSwitch.id, { active: true }, (tab) => {
        if (chrome.runtime.lastError) {
          console.error("Error switching to tab:", chrome.runtime.lastError);
        } else {
          console.log("Switched to tab:", tab);
        }
      });
    } else {
      // If not, open the link in a new tab
      console.log("Opening a new tab:", links[currentTabIndex]);
      chrome.tabs.create({ url: links[currentTabIndex] }, (tab) => {
        if (chrome.runtime.lastError) {
          console.error("Error opening new tab:", chrome.runtime.lastError);
        } else {
          console.log("Opened new tab:", tab);
        }
      });
    }
  });
}

// Function to stop scrolling
function stopScrolling() {
  isScrolling = false; // Reset the scrolling flag
  clearInterval(scrollingInterval); // Clear the scrolling interval
}
