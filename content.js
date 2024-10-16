let scrollingIntervalId; // Declare this globally to keep track of the interval ID

// Function to scroll the frame or window based on stored settings
function scrollFrame(frameClass, scrollStep) {
  const frame = document.querySelector(frameClass);

  if (frame && frame !== "window") {
    const totalHeight = frame.scrollHeight;
    const currentPosition = frame.scrollTop + frame.clientHeight;

    if (currentPosition + scrollStep < totalHeight - 100) {
      frame.scrollBy({
        top: scrollStep,
        left: 0,
        behavior: "smooth",
      });
    } else {
      frame.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth",
      });
      // Send a message to background.js to switch tabs
      chrome.runtime.sendMessage({ action: "switchTab" });
    }
  } else {
    // If the frame doesn't exist, scroll the window instead
    const totalHeight = document.body.scrollHeight;
    const currentPosition = window.scrollY + window.innerHeight;

    if (currentPosition + scrollStep < totalHeight - 100) {
      window.scrollBy({
        top: scrollStep,
        left: 0,
        behavior: "smooth",
      });
    } else {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth",
      });
      // Send a message to background.js to switch tabs
      chrome.runtime.sendMessage({ action: "switchTab" });
    }
  }
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "scrollFrame") {
    const frameClass = message.className;

    // Get the scrollStep and interval from storage
    chrome.storage.sync.get(["scrollPixels", "intervalTime"], (result) => {
      const scrollStep = result.scrollPixels || 550; // Default to 550 if not found
      const interval = result.intervalTime || 20000; // Default to 20 seconds if not found

      // Start scrolling at the specified interval
      scrollingIntervalId = setInterval(() => {
        scrollFrame(frameClass, scrollStep);
      }, interval);
    });
  } else if (message.action === "stopScrolling") {
    if (scrollingIntervalId) {
      clearInterval(scrollingIntervalId); // Clear the interval to stop scrolling
      scrollingIntervalId = null; // Reset the interval ID
      console.log("Scrolling stopped.");
    }
  }
});
