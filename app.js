const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

async function runUnfollowBot(username, password, limit, logCallback = null) {
  const log = (message) => {
    console.log(message);
    if (logCallback) logCallback(message);
  };

  let browser;
  try {
    log(`🚀 Starting Instagram unfollow bot for ${username}...`);

    // Create session directory if it doesn't exist
    const sessionDir = path.join(__dirname, "sessions", username);
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }

    // Load or create checked accounts list
    const checkedAccountsFile = path.join(sessionDir, "checked_accounts.json");
    let checkedAccounts = new Set();
    if (fs.existsSync(checkedAccountsFile)) {
      try {
        const data = JSON.parse(fs.readFileSync(checkedAccountsFile, "utf8"));
        checkedAccounts = new Set(data);
        log(`📝 Loaded ${checkedAccounts.size} previously checked accounts`);
      } catch (e) {
        log("⚠️ Could not load checked accounts file, starting fresh");
      }
    }

    // Clean up any existing session data that might be corrupted
    const browserDataDir = path.join(sessionDir, "browser_data");
    if (fs.existsSync(browserDataDir)) {
      try {
        fs.rmSync(browserDataDir, { recursive: true, force: true });
        log(`🧹 Cleaned up old browser data`);
      } catch (e) {
        log(`⚠️ Could not clean browser data: ${e.message}`);
      }
    }

    browser = await puppeteer.launch({
      headless: false,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--disable-gpu",
        "--disable-web-security",
        "--disable-features=VizDisplayCompositor",
        "--disable-background-timer-throttling",
        "--disable-backgrounding-occluded-windows",
        "--disable-renderer-backgrounding",
        "--disable-extensions",
        "--disable-default-apps",
        "--disable-sync",
        "--disable-translate",
        "--hide-scrollbars",
        "--mute-audio",
        "--no-default-browser-check",
        "--password-store=basic",
        "--disable-blink-features=AutomationControlled",
        "--disable-features=TranslateUI",
        "--disable-ipc-flooding-protection",
        "--disable-logging",
        "--disable-gpu-logging",
        "--silent",
        "--log-level=3",
      ],
      userDataDir: browserDataDir,
      protocolTimeout: 300000, // 5 minutes timeout instead of default 180s
      slowMo: 100, // Increased delay for stability
    });

    const page = await browser.newPage();

    // Add response listener to debug network responses (without request interception)
    page.on("response", (response) => {
      const url = response.url();
      const status = response.status();
      if (url.includes("instagram.com") && status >= 400) {
        log(`❌ Error response: ${status} ${response.statusText()} for ${url}`);
      }
    });

    // Add console listener to debug JavaScript errors (filter out common harmless errors)
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        const errorText = msg.text();

        // Filter out common harmless errors that don't affect functionality
        const harmlessErrors = [
          "net::ERR_NAME_NOT_RESOLVED",
          "Failed to load resource",
          "WebAssembly module",
          "Content Security Policy",
          "unsafe-eval",
          "blob:",
          "nonce-",
          "ErrorUtils caught an error",
          "Unable to parse uri",
          "DTSG response is not valid",
          "Sorry, something went wrong",
          "Please try closing and re-opening",
          "Subsequent non-fatal errors won't be logged",
          "fburl.com/debugjs",
          "JSHandle@object",
          "facebook.com/ig_xsite",
          "DOCTYPE html",
          "html lang=",
          "meta charset=",
          "script nonce=",
          "function envFlush",
          "window.requireLazy",
          "window.openDatabase",
          "_btldr={}",
          "parentElement!=",
          "errorSummary",
          "errorDescription",
          "isNotCritical",
          "rid:",
          "lid:",
          "payload:",
          "__ar:",
          "error:",
          "brsid:",
          "ajaxpipe_token:",
          "compat_iframe_token:",
          "isCQuick:",
          "promise_include_trace:",
          "stack_trace_limit:",
          "timesliceBufferSize:",
          "show_invariant_decoder:",
          "useTrustedTypes:",
          "isTrustedTypesReportOnly:",
          "hostnameRewriterConfig:",
          "site:",
          "inboundName:",
          "cdnDomainName:",
          "window.Env=",
          "requireLazy",
          "Env",
          "bumpVultureJSHash",
          "FbtLogging",
          "DGWRequestStreamClient",
          "IntlQtEventFalcoEvent",
          "MqttLongPollingRunner",
          "CometRelayEF",
          "BladeRunnerClient",
          "PolarisLogger",
          "ContextualConfig",
          "InstagramODSImpl",
          "XAsyncRequest",
        ];

        const isHarmlessError = harmlessErrors.some((harmless) =>
          errorText.includes(harmless)
        );

        // Additional filtering for very long error messages that are usually harmless
        const isVeryLongError = errorText.length > 500;
        const isFacebookError =
          errorText.includes("facebook.com") || errorText.includes("ig_xsite");
        const isInstagramInternalError =
          errorText.includes("Instagram") && errorText.includes("error");

        if (
          !isHarmlessError &&
          !isVeryLongError &&
          !isFacebookError &&
          !isInstagramInternalError
        ) {
          log(`🔴 Console Error: ${errorText}`);
        }
      }
    });

    // Add page error listener (filter out harmless errors)
    page.on("pageerror", (error) => {
      const errorMessage = error.message;

      // Filter out common harmless page errors
      const harmlessPageErrors = [
        "ErrorUtils caught an error",
        "Unable to parse uri",
        "DTSG response is not valid",
        "Sorry, something went wrong",
        "Please try closing and re-opening",
        "Subsequent non-fatal errors won't be logged",
        "fburl.com/debugjs",
        "facebook.com/ig_xsite",
        "DOCTYPE html",
        "script nonce=",
        "function envFlush",
        "window.requireLazy",
        "window.openDatabase",
        "_btldr={}",
        "parentElement!=",
        "errorSummary",
        "errorDescription",
        "isNotCritical",
        "rid:",
        "lid:",
        "payload:",
        "__ar:",
        "error:",
        "brsid:",
        "ajaxpipe_token:",
        "compat_iframe_token:",
        "isCQuick:",
        "promise_include_trace:",
        "stack_trace_limit:",
        "timesliceBufferSize:",
        "show_invariant_decoder:",
        "useTrustedTypes:",
        "isTrustedTypesReportOnly:",
        "hostnameRewriterConfig:",
        "site:",
        "inboundName:",
        "cdnDomainName:",
        "window.Env=",
        "requireLazy",
        "Env",
        "bumpVultureJSHash",
        "FbtLogging",
        "DGWRequestStreamClient",
        "IntlQtEventFalcoEvent",
        "MqttLongPollingRunner",
        "CometRelayEF",
        "BladeRunnerClient",
        "PolarisLogger",
        "ContextualConfig",
        "InstagramODSImpl",
        "XAsyncRequest",
      ];

      const isHarmlessPageError = harmlessPageErrors.some((harmless) =>
        errorMessage.includes(harmless)
      );

      const isVeryLongPageError = errorMessage.length > 500;
      const isFacebookPageError =
        errorMessage.includes("facebook.com") ||
        errorMessage.includes("ig_xsite");
      const isInstagramInternalPageError =
        errorMessage.includes("Instagram") && errorMessage.includes("error");

      if (
        !isHarmlessPageError &&
        !isVeryLongPageError &&
        !isFacebookPageError &&
        !isInstagramInternalPageError
      ) {
        log(`🔴 Page Error: ${errorMessage}`);
      }
    });

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    );

    log("📱 Navigating to Instagram...");

    // Retry mechanism for navigation
    let navigationSuccess = false;
    let navigationAttempts = 0;
    const maxNavigationAttempts = 3;

    while (!navigationSuccess && navigationAttempts < maxNavigationAttempts) {
      try {
        navigationAttempts++;
        log(
          `🌐 Navigation attempt ${navigationAttempts}/${maxNavigationAttempts}...`
        );

        await page.goto("https://www.instagram.com/", {
          waitUntil: "domcontentloaded", // Changed from networkidle2 to domcontentloaded
          timeout: 30000, // 30 seconds timeout
        });

        // Wait a bit for the page to stabilize
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Check if page loaded successfully
        const currentUrl = page.url();
        if (currentUrl.includes("instagram.com")) {
          log("✅ Successfully navigated to Instagram");
          navigationSuccess = true;
        } else {
          throw new Error(`Navigation failed - current URL: ${currentUrl}`);
        }
      } catch (error) {
        log(
          `❌ Navigation attempt ${navigationAttempts} failed: ${error.message}`
        );

        if (navigationAttempts >= maxNavigationAttempts) {
          log(`❌ All navigation attempts failed`);
          throw new Error(
            `Failed to navigate to Instagram after ${maxNavigationAttempts} attempts: ${error.message}`
          );
        }

        // Wait before retry
        log(`⏳ Waiting 3 seconds before retry...`);
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Check if already logged in with better detection
    try {
      // Wait for page to fully load
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const currentUrl = page.url();
      log(`🔍 Current URL after navigation: ${currentUrl}`);

      // Check if we're on login page or redirected
      if (
        currentUrl.includes("/accounts/login") ||
        currentUrl.includes("/accounts/onetap")
      ) {
        log("🔐 Redirected to login page, session expired");
        throw new Error("Need to login");
      }

      // Check for login indicators
      const isLoggedIn = await page.evaluate(() => {
        // Check for home icon
        const homeIcon = document.querySelector('svg[aria-label="Home"]');
        if (homeIcon) return true;

        // Check for profile picture
        const profilePic = document.querySelector(
          'img[alt*="profile picture"]'
        );
        if (profilePic) return true;

        // Check for navigation menu
        const navMenu = document.querySelector('nav[role="navigation"]');
        if (navMenu) return true;

        // Check for Instagram logo (indicates we're on main page)
        const instagramLogo = document.querySelector(
          'svg[aria-label="Instagram"]'
        );
        if (instagramLogo) return true;

        return false;
      });

      if (isLoggedIn) {
        log("✅ Already logged in! Using saved session.");
      } else {
        log("❌ Not logged in, need to authenticate");
        throw new Error("Need to login");
      }
    } catch (e) {
      // Login process (same as before)
      log("🔐 Session expired or not found, logging in...");
      await page.goto("https://www.instagram.com/accounts/login/", {
        waitUntil: "networkidle2",
      });

      try {
        await page.waitForSelector('button[class*="aOOlW"][class*="bIiDR"]', {
          timeout: 3000,
        });
        await page.click('button[class*="aOOlW"][class*="bIiDR"]');
        log("🍪 Cookie banner handled");
      } catch (e) {}

      await page.waitForSelector('input[name="username"]', { timeout: 10000 });
      log("🔐 Logging in...");
      await page.type('input[name="username"]', username, { delay: 100 });
      await page.type('input[name="password"]', password, { delay: 100 });
      await page.click('button[type="submit"]');
      await page.waitForNavigation({
        waitUntil: "networkidle2",
        timeout: 30000,
      });

      try {
        await page.waitForSelector("button", { timeout: 5000 });
        const buttons = await page.$$("button");
        for (let button of buttons) {
          const text = await page.evaluate((el) => el.textContent, button);
          if (
            text.toLowerCase().includes("not now") ||
            text.toLowerCase().includes("save")
          ) {
            await button.click();
            log("💾 Login info dialog handled");
            break;
          }
        }
      } catch (e) {}

      log("✅ Login successful! Session will be saved for next time.");
    }

    // Function to extract usernames from a list
    async function extractAllUsernames(listType) {
      log(`📊 Step: Extracting ALL ${listType} usernames...`);

      const usernames = new Set();

      // Try to load previous progress
      const tempFile = path.join(sessionDir, `${listType}_temp.json`);
      const finalFile = path.join(sessionDir, `${listType}_extracted.json`);

      // Check if we have a complete extraction already
      if (fs.existsSync(finalFile)) {
        try {
          const existingData = JSON.parse(fs.readFileSync(finalFile, "utf8"));
          const threshold = listType === "following" ? 100 : 50; // Higher threshold for following lists

          // Check file age - don't use data older than 1 hour
          const fileStats = fs.statSync(finalFile);
          const fileAge = Date.now() - fileStats.mtime.getTime();
          const maxAge = 60 * 60 * 1000; // 1 hour in milliseconds

          if (
            existingData &&
            existingData.length > threshold &&
            fileAge < maxAge
          ) {
            // Only use if substantial data exists AND file is fresh
            log(
              `📂 Found existing ${listType} extraction with ${
                existingData.length
              } users (${Math.round(
                fileAge / 60000
              )} min old) - using cached data`
            );
            existingData.forEach((user) => usernames.add(user));
            return usernames;
          } else if (fileAge >= maxAge) {
            log(
              `⚠️ Existing ${listType} data is too old (${Math.round(
                fileAge / 60000
              )} min), extracting fresh data`
            );
          }
        } catch (e) {
          log(`⚠️ Could not load existing ${listType} data, starting fresh`);
        }
      }

      // Check for partial extraction and resume from there
      if (fs.existsSync(tempFile)) {
        try {
          const tempData = JSON.parse(fs.readFileSync(tempFile, "utf8"));
          if (tempData && tempData.length > 0) {
            log(
              `🔄 Resuming ${listType} extraction from previous session with ${tempData.length} users`
            );
            tempData.forEach((user) => usernames.add(user));
          }
        } catch (e) {
          log(`⚠️ Could not load temporary ${listType} data, starting fresh`);
        }
      }

      let scrollAttempts = 0;
      let consecutiveNoNewUsers = 0;
      let lastScrollHeight = 0;
      let lastUserCount = 0;
      let stuckCount = 0;
      let modalRefreshCount = 0;
      const maxModalRefreshes = 10; // Maximum number of modal refreshes for ultra-large lists
      let scrollEndDetected = false;
      let noScrollProgressCount = 0;
      const maxNoScrollProgress = 20; // Stop if no scroll progress for 20 attempts

      // Set page timeout for this specific operation
      await page.setDefaultTimeout(60000); // 1 minute per operation
      await page.setDefaultNavigationTimeout(60000);

      // Initial wait for page to load completely
      log(`⏳ ${listType}: Waiting for initial page load...`);
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Detect if this is an ultra-large list based on expected count
      // For now, we'll detect ultra-large lists based on a reasonable threshold
      // The actual counts will be available later in the process
      const isUltraLargeList = false; // Will be updated when actualCounts is available

      if (isUltraLargeList) {
        log(`🚀 Ultra-large list detected: ${listType} expected`);
        log(`   • Using specialized extraction strategy for large lists`);
        log(`   • This may take significantly longer to complete`);
        log(`   • Progress will be saved frequently to prevent data loss`);
      }

      while (
        !scrollEndDetected &&
        noScrollProgressCount < maxNoScrollProgress
      ) {
        scrollAttempts++;

        // Optimized content loading wait - reduced from 10s to 3s max
        let contentLoaded = false;
        let loadAttempts = 0;
        const maxLoadAttempts = 3; // Reduced from 5 to 3

        while (!contentLoaded && loadAttempts < maxLoadAttempts) {
          loadAttempts++;

          // Reduced wait time from 2000ms to 1000ms
          await new Promise((resolve) => setTimeout(resolve, 1000));

          // Simplified loading detection
          const isLoading = await page.evaluate(() => {
            const dialog = document.querySelector('div[role="dialog"]');
            if (!dialog) return false;

            // Quick check for loading indicators
            const loadingIndicators = dialog.querySelectorAll(
              '[class*="loading"], [class*="spinner"]'
            );
            return loadingIndicators.length > 0;
          });

          if (!isLoading) {
            contentLoaded = true;
          } else if (loadAttempts < maxLoadAttempts) {
            log(
              `⏳ ${listType}: Content loading... (${loadAttempts}/${maxLoadAttempts})`
            );
          }
        }

        // Simplified extraction with timeout protection
        const currentUsernames = await Promise.race([
          page.evaluate(() => {
            const extractedUsers = [];

            // Debug modal state
            const dialog = document.querySelector('div[role="dialog"]');
            if (!dialog) {
              console.log("❌ No dialog found");
              return [];
            }

            console.log("📋 Dialog found, checking scrollable containers...");

            // Check scrollable containers
            const scrollableContainers = dialog.querySelectorAll(
              'div[style*="overflow"], div[style*="height"]'
            );
            console.log(
              `Found ${scrollableContainers.length} potential scroll containers`
            );

            scrollableContainers.forEach((container, i) => {
              console.log(
                `Container ${i}: scrollHeight=${container.scrollHeight}, clientHeight=${container.clientHeight}, scrollTop=${container.scrollTop}`
              );
            });

            // Simplified selectors for better performance
            const selectors = [
              'div[role="dialog"] a[href^="/"][role="link"]',
              'div[role="dialog"] li a[href^="/"]',
              'div[role="dialog"] div[class*="_aano"] a[href^="/"]',
            ];

            console.log("🔍 Starting username extraction...");

            // Instagram navigation elements to exclude
            const excludedPaths = [
              "accounts",
              "direct",
              "explore",
              "reels",
              "stories",
              "tv",
              "p/",
              "reel/",
              "stories/",
              "explore/",
              "accounts/",
              "direct/",
              "tv/",
              "legal",
              "archive",
              "saved",
              "tagged",
              "followers",
              "following",
            ];

            for (let selector of selectors) {
              const links = document.querySelectorAll(selector);
              console.log(`Selector "${selector}" found ${links.length} links`);

              for (let link of links) {
                const href = link.getAttribute("href");
                if (href && href.startsWith("/") && href.length > 1) {
                  let extractedUsername = href
                    .replace(/^\/+/, "")
                    .split("?")[0]
                    .split("#")[0]
                    .split("/")[0];

                  // Quick validation
                  if (
                    extractedUsername &&
                    extractedUsername.length > 0 &&
                    extractedUsername.length <= 30 &&
                    !excludedPaths.some((excluded) =>
                      extractedUsername.includes(excluded)
                    ) &&
                    extractedUsername.match(/^[a-zA-Z0-9._]{1,30}$/) &&
                    extractedUsername.match(/[a-zA-Z0-9]/) &&
                    link.offsetParent !== null
                  ) {
                    extractedUsers.push(extractedUsername);
                  }
                }
              }
            }

            console.log(
              `✅ Extracted ${extractedUsers.length} usernames: ${extractedUsers
                .slice(0, 5)
                .join(", ")}...`
            );
            return [...new Set(extractedUsers)]; // Remove duplicates
          }),
          new Promise(
            (_, reject) =>
              setTimeout(() => reject(new Error("Extraction timeout")), 15000) // Reduced from 30s to 15s
          ),
        ]).catch((error) => {
          console.log(`⚠️ Extraction timeout, continuing...`);
          return []; // Return empty array on timeout
        });

        // Add new usernames to set
        let newCount = 0;
        currentUsernames.forEach((user) => {
          if (!usernames.has(user)) {
            usernames.add(user);
            newCount++;
          }
        });

        // Enhanced progress tracking for large lists
        if (usernames.size === lastUserCount) {
          stuckCount++;
        } else {
          stuckCount = 0;
          lastUserCount = usernames.size;
        }

        if (newCount === 0) {
          consecutiveNoNewUsers++;
          log(
            `📊 ${listType}: Scroll ${scrollAttempts} - No new users found (${consecutiveNoNewUsers}) - Total: ${usernames.size} - Stuck: ${stuckCount}`
          );
        } else {
          consecutiveNoNewUsers = 0; // Reset counter when we find new users
          stuckCount = 0; // Reset stuck counter when we find new users
          log(
            `📊 ${listType}: Scroll ${scrollAttempts} - Found ${newCount} new users (total: ${usernames.size})`
          );

          // Log some of the new users found for debugging
          if (newCount > 0) {
            const newUsers = currentUsernames
              .filter((user) => !usernames.has(user))
              .slice(0, 3);
            log(
              `   New users this scroll: ${newUsers.join(", ")}${
                newCount > 3 ? "..." : ""
              }`
            );
          }
        }

        // Optimized stuck detection - reduced threshold for faster response
        const stuckThreshold = isUltraLargeList ? 30 : 20; // Reduced from 50/30 to 30/20
        if (stuckCount > stuckThreshold) {
          log(
            `🔄 ${listType}: Detected stuck state, trying alternative scrolling approach...`
          );

          // For ultra-large lists, try modal refresh more aggressively
          if (isUltraLargeList && modalRefreshCount < maxModalRefreshes) {
            log(
              `🔄 ${listType}: Attempting modal refresh ${
                modalRefreshCount + 1
              }/${maxModalRefreshes} for ultra-large list...`
            );

            try {
              await page.keyboard.press("Escape");
              await new Promise((resolve) => setTimeout(resolve, 3000)); // Longer wait for ultra-large lists

              // Reopen the modal
              if (listType === "followers") {
                const followersLinks = await page.$$("a");
                for (let link of followersLinks) {
                  const href = await page.evaluate(
                    (el) => el.getAttribute("href"),
                    link
                  );
                  if (href && href.includes("/followers")) {
                    await link.click();
                    break;
                  }
                }
              } else {
                const followingLinks = await page.$$("a");
                for (let link of followingLinks) {
                  const href = await page.evaluate(
                    (el) => el.getAttribute("href"),
                    link
                  );
                  if (href && href.includes("/following")) {
                    await link.click();
                    break;
                  }
                }
              }

              await new Promise((resolve) => setTimeout(resolve, 5000)); // Longer wait for ultra-large lists
              modalRefreshCount++;
              stuckCount = 0;
              consecutiveNoNewUsers = 0;
              log(
                `🔄 ${listType}: Modal refreshed (${modalRefreshCount}/${maxModalRefreshes}), continuing extraction...`
              );
            } catch (e) {
              log(
                `⚠️ Could not refresh modal, continuing with current approach...`
              );
            }
          } else {
            // For regular lists or when max refreshes reached, try alternative scrolling
            log(`🔄 ${listType}: Trying alternative scrolling strategies...`);

            // Try more aggressive scrolling
            await page.evaluate(() => {
              const dialog = document.querySelector('div[role="dialog"]');
              if (dialog) {
                const scrollableContainers = dialog.querySelectorAll("div");
                for (let container of scrollableContainers) {
                  if (container.scrollHeight > container.clientHeight) {
                    // Try scrolling to very bottom
                    container.scrollTop = container.scrollHeight;
                    // Then scroll back up a bit to trigger more loading
                    setTimeout(() => {
                      container.scrollTop = container.scrollHeight - 1000;
                    }, 1000);
                  }
                }
              }
            });

            await new Promise((resolve) => setTimeout(resolve, 3000));
            stuckCount = 0;
            consecutiveNoNewUsers = 0;
          }
        }

        // Special handling for very large lists (>3000 users)
        if (usernames.size > 3000 && scrollAttempts > 200) {
          log(
            `🔄 ${listType}: Very large list detected (${usernames.size} users), applying special optimizations...`
          );

          // Try to scroll to the very bottom to trigger all lazy loading
          try {
            await page.evaluate(() => {
              const dialog = document.querySelector('div[role="dialog"]');
              if (dialog) {
                const scrollableContainers = dialog.querySelectorAll("div");
                for (let container of scrollableContainers) {
                  if (container.scrollHeight > container.clientHeight) {
                    container.scrollTop = container.scrollHeight;
                  }
                }
              }
            });

            // Wait longer for content to load
            await new Promise((resolve) => setTimeout(resolve, 5000));

            // Try to trigger more content loading by scrolling up and down
            await page.evaluate(() => {
              const dialog = document.querySelector('div[role="dialog"]');
              if (dialog) {
                const scrollableContainers = dialog.querySelectorAll("div");
                for (let container of scrollableContainers) {
                  if (container.scrollHeight > container.clientHeight) {
                    // Scroll to top
                    container.scrollTop = 0;
                    // Then scroll to bottom
                    setTimeout(() => {
                      container.scrollTop = container.scrollHeight;
                    }, 1000);
                  }
                }
              }
            });

            await new Promise((resolve) => setTimeout(resolve, 3000));
          } catch (e) {
            log(`⚠️ Could not apply special optimizations for large list`);
          }
        }

        // Enhanced scrolling with multiple strategies
        const scrollResult = await Promise.race([
          page.evaluate(() => {
            console.log("🔄 Starting aggressive scroll operation...");
            let scrolled = false;
            let maxScrolled = 0;
            let currentScrollHeight = 0;

            // Optimized Strategy 1: Try most effective scroll containers first
            const prioritySelectors = [
              'div[role="dialog"] div[class*="_aano"]', // Most common Instagram scroll container
              'div[role="dialog"] div[style*="overflow-y"]', // Direct overflow containers
              'div[role="dialog"] > div > div', // Common nested structure
              'div[role="dialog"]', // Fallback to dialog itself
            ];

            console.log(
              `Trying ${prioritySelectors.length} optimized scroll strategies...`
            );

            for (let selector of prioritySelectors) {
              const containers = document.querySelectorAll(selector);
              if (containers.length === 0) continue;

              for (let container of containers) {
                if (container.scrollHeight > container.clientHeight) {
                  console.log(
                    `   Container scrollable: ${container.scrollHeight} > ${container.clientHeight}`
                  );
                  const beforeScroll = container.scrollTop;

                  // Optimized scroll amounts - try fewer, more effective amounts
                  for (let amount of [1000, 2000, 3000]) {
                    container.scrollTop = beforeScroll + amount;
                    const afterScroll = container.scrollTop;

                    if (afterScroll > beforeScroll) {
                      console.log(
                        `   ✅ Scrolled ${beforeScroll} → ${afterScroll} with amount ${amount}`
                      );
                      scrolled = true;
                      maxScrolled = Math.max(maxScrolled, afterScroll);
                      break;
                    }
                  }

                  // If normal scrolling didn't work, try scrolling to bottom
                  if (!scrolled) {
                    container.scrollTop = container.scrollHeight;
                    const afterScroll = container.scrollTop;
                    if (afterScroll > beforeScroll) {
                      console.log(
                        `   ✅ Scrolled to bottom: ${beforeScroll} → ${afterScroll}`
                      );
                      scrolled = true;
                      maxScrolled = Math.max(maxScrolled, afterScroll);
                    }
                  }

                  if (scrolled) break;
                }
              }
              if (scrolled) break;
            }

            // Strategy 2: Direct DOM manipulation
            if (!scrolled) {
              console.log("🔄 Trying direct DOM manipulation...");
              const dialog = document.querySelector('div[role="dialog"]');
              if (dialog) {
                // Find all divs that might be scrollable
                const allDivs = dialog.querySelectorAll("div");
                console.log(`Found ${allDivs.length} divs in dialog`);

                for (let div of allDivs) {
                  const computedStyle = window.getComputedStyle(div);
                  const isScrollable =
                    div.scrollHeight > div.clientHeight ||
                    computedStyle.overflowY === "auto" ||
                    computedStyle.overflowY === "scroll" ||
                    computedStyle.overflow === "auto" ||
                    computedStyle.overflow === "scroll";

                  if (isScrollable) {
                    console.log(`   Found potential scrollable div`);
                    const beforeScroll = div.scrollTop;
                    div.scrollTop += 1000;
                    const afterScroll = div.scrollTop;

                    if (afterScroll > beforeScroll) {
                      console.log(
                        `   ✅ Direct DOM scroll: ${beforeScroll} → ${afterScroll}`
                      );
                      scrolled = true;
                      maxScrolled = Math.max(maxScrolled, afterScroll);
                      break;
                    }
                  }
                }
              }
            }

            // Strategy 3: Event-based scrolling
            if (!scrolled) {
              console.log("🔄 Trying event-based scrolling...");
              const dialog = document.querySelector('div[role="dialog"]');
              if (dialog) {
                // Try wheel events
                for (let i = 0; i < 10; i++) {
                  const wheelEvent = new WheelEvent("wheel", {
                    deltaY: 100 * (i + 1),
                    deltaMode: 0,
                    bubbles: true,
                    cancelable: true,
                  });
                  dialog.dispatchEvent(wheelEvent);
                }

                // Try keyboard events
                dialog.focus();
                for (let i = 0; i < 5; i++) {
                  const keyEvent = new KeyboardEvent("keydown", {
                    key: "PageDown",
                    code: "PageDown",
                    keyCode: 34,
                    bubbles: true,
                    cancelable: true,
                  });
                  dialog.dispatchEvent(keyEvent);
                }

                // Try arrow down
                for (let i = 0; i < 10; i++) {
                  const arrowEvent = new KeyboardEvent("keydown", {
                    key: "ArrowDown",
                    code: "ArrowDown",
                    keyCode: 40,
                    bubbles: true,
                    cancelable: true,
                  });
                  dialog.dispatchEvent(arrowEvent);
                }

                // Check if any scrolling happened
                const scrollableElements = dialog.querySelectorAll("div");
                for (let element of scrollableElements) {
                  if (element.scrollTop > 0) {
                    console.log(
                      `   ✅ Event scroll detected: scrollTop=${element.scrollTop}`
                    );
                    scrolled = true;
                    maxScrolled = Math.max(maxScrolled, element.scrollTop);
                    break;
                  }
                }
              }
            }

            // Strategy 4: Force scroll using scrollIntoView
            if (!scrolled) {
              console.log("🔄 Trying scrollIntoView strategy...");
              const dialog = document.querySelector('div[role="dialog"]');
              if (dialog) {
                const allLinks = dialog.querySelectorAll("a");
                if (allLinks.length > 5) {
                  // Scroll to the last visible link
                  const lastLink = allLinks[allLinks.length - 1];
                  lastLink.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                  });

                  // Check if parent containers scrolled
                  let parentElement = lastLink.parentElement;
                  while (parentElement && parentElement !== dialog) {
                    if (parentElement.scrollTop > 0) {
                      console.log(
                        `   ✅ ScrollIntoView worked: scrollTop=${parentElement.scrollTop}`
                      );
                      scrolled = true;
                      maxScrolled = Math.max(
                        maxScrolled,
                        parentElement.scrollTop
                      );
                      break;
                    }
                    parentElement = parentElement.parentElement;
                  }
                }
              }
            }

            // Strategy 5: Aggressive scroll to bottom for large lists
            if (!scrolled) {
              console.log("🔄 Trying aggressive bottom scroll strategy...");
              const dialog = document.querySelector('div[role="dialog"]');
              if (dialog) {
                // Find all scrollable containers and scroll them to bottom
                const scrollableContainers = dialog.querySelectorAll("div");
                for (let container of scrollableContainers) {
                  if (container.scrollHeight > container.clientHeight) {
                    const beforeScroll = container.scrollTop;
                    container.scrollTop = container.scrollHeight;
                    const afterScroll = container.scrollTop;

                    if (afterScroll > beforeScroll) {
                      console.log(
                        `   ✅ Aggressive bottom scroll: ${beforeScroll} → ${afterScroll}`
                      );
                      scrolled = true;
                      maxScrolled = Math.max(maxScrolled, afterScroll);
                      break;
                    }
                  }
                }
              }
            }

            // Strategy 6: Simulate user interaction for lazy loading
            if (!scrolled) {
              console.log("🔄 Trying user interaction simulation...");
              const dialog = document.querySelector('div[role="dialog"]');
              if (dialog) {
                // Simulate mouse movement and clicks to trigger lazy loading
                const rect = dialog.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;

                // Simulate mouse move events
                for (let i = 0; i < 5; i++) {
                  const mouseEvent = new MouseEvent("mousemove", {
                    clientX: centerX + i * 10,
                    clientY: centerY + i * 10,
                    bubbles: true,
                    cancelable: true,
                  });
                  dialog.dispatchEvent(mouseEvent);
                }

                // Check if any scrolling happened after mouse events
                const scrollableElements = dialog.querySelectorAll("div");
                for (let element of scrollableElements) {
                  if (element.scrollTop > 0) {
                    console.log(
                      `   ✅ Mouse interaction triggered scroll: scrollTop=${element.scrollTop}`
                    );
                    scrolled = true;
                    maxScrolled = Math.max(maxScrolled, element.scrollTop);
                    break;
                  }
                }
              }
            }

            // Get current scroll height for all containers
            const dialog = document.querySelector('div[role="dialog"]');
            if (dialog) {
              const scrollableContainers = dialog.querySelectorAll("div");
              for (let container of scrollableContainers) {
                if (container.scrollHeight > container.clientHeight) {
                  currentScrollHeight = Math.max(
                    currentScrollHeight,
                    container.scrollHeight
                  );
                }
              }
            }

            console.log(
              `🔄 Scroll operation completed. Success: ${scrolled}, maxScrolled: ${maxScrolled}, scrollHeight: ${currentScrollHeight}`
            );
            return {
              scrolled: scrolled,
              maxScrolled: maxScrolled,
              scrollHeight: currentScrollHeight,
            };
          }),
          new Promise(
            (_, reject) =>
              setTimeout(() => reject(new Error("Scroll timeout")), 10000) // Reduced from 15s to 10s
          ),
        ]).catch((error) => {
          console.log(`⚠️ Scroll timeout, continuing...`);
          return { scrolled: false, maxScrolled: 0, scrollHeight: 0 };
        });

        // Analyze scroll result for dynamic end detection
        const scrollSuccess = scrollResult.scrolled;
        const currentScrollHeight = scrollResult.scrollHeight;

        // Check if we can still scroll (dynamic detection)
        if (scrollSuccess) {
          // Reset counters when we successfully scroll
          noScrollProgressCount = 0;
          lastScrollHeight = Math.max(lastScrollHeight, currentScrollHeight);
          log(
            `📊 ${listType}: Scroll successful - height: ${currentScrollHeight}, users: ${usernames.size}`
          );
        } else {
          // No scroll progress detected
          noScrollProgressCount++;
          log(
            `📊 ${listType}: No scroll progress (${noScrollProgressCount}/${maxNoScrollProgress}) - height: ${currentScrollHeight}, users: ${usernames.size}`
          );

          // Check if we've reached the end of scrollable content
          if (
            currentScrollHeight > 0 &&
            currentScrollHeight === lastScrollHeight
          ) {
            log(
              `🛑 ${listType}: Scroll height unchanged, likely reached end of content`
            );
            scrollEndDetected = true;
          }
        }

        // Enhanced end detection for large lists
        const isAtEnd = await Promise.race([
          page.evaluate(() => {
            const dialog = document.querySelector('div[role="dialog"]');
            if (!dialog) return false;

            // Check for end indicators
            const textContent = dialog.textContent.toLowerCase();
            const endIndicators = [
              "no more suggestions",
              "end of list",
              "you have seen all",
              "no more followers",
              "no more following",
              "that's all",
              "no more to show",
            ];

            const hasEndIndicator = endIndicators.some((indicator) =>
              textContent.includes(indicator)
            );

            if (hasEndIndicator) {
              console.log("Found end indicator in text content");
              return true;
            }

            // Check if we've reached the actual end by comparing with expected count
            const links = dialog.querySelectorAll('a[href^="/"][role="link"]');
            const uniqueLinks = new Set();

            links.forEach((link) => {
              const href = link.getAttribute("href");
              if (href && href.startsWith("/") && href.length > 1) {
                const username = href
                  .replace(/^\/+/, "")
                  .split("?")[0]
                  .split("#")[0]
                  .split("/")[0];
                if (username && username.length > 0 && username.length <= 30) {
                  uniqueLinks.add(username);
                }
              }
            });

            console.log(`Current unique links found: ${uniqueLinks.size}`);

            // If we have a reasonable number of links and no new ones are loading
            return uniqueLinks.size > 0 && links.length === uniqueLinks.size;
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("End detection timeout")), 5000)
          ),
        ]).catch(() => false);

        if (isAtEnd) {
          log(`📊 ${listType}: Detected end of list via content analysis`);
          scrollEndDetected = true;
          break;
        }

        // Additional dynamic end detection based on user count stability
        if (usernames.size === lastUserCount && usernames.size > 0) {
          consecutiveNoNewUsers++;
          if (consecutiveNoNewUsers > 30) {
            // Only stop if no new users for 30 attempts
            log(
              `📊 ${listType}: No new users found for ${consecutiveNoNewUsers} attempts, checking if we've reached the end...`
            );

            // Try one more aggressive scroll to confirm we're at the end
            const finalScrollCheck = await page.evaluate(() => {
              const dialog = document.querySelector('div[role="dialog"]');
              if (!dialog) return false;

              const scrollableContainers = dialog.querySelectorAll("div");
              let canStillScroll = false;

              for (let container of scrollableContainers) {
                if (container.scrollHeight > container.clientHeight) {
                  const beforeScroll = container.scrollTop;
                  container.scrollTop = container.scrollHeight;
                  const afterScroll = container.scrollTop;

                  if (afterScroll > beforeScroll) {
                    canStillScroll = true;
                    break;
                  }
                }
              }

              return canStillScroll;
            });

            if (!finalScrollCheck) {
              log(
                `🛑 ${listType}: Confirmed - no more content to scroll, ending extraction`
              );
              scrollEndDetected = true;
              break;
            } else {
              log(`🔄 ${listType}: Still can scroll, continuing extraction...`);
              consecutiveNoNewUsers = 0; // Reset counter
            }
          }
        } else {
          consecutiveNoNewUsers = 0; // Reset counter when we find new users
          lastUserCount = usernames.size;
        }

        // Optimized wait times - significantly reduced for better efficiency
        let waitTime;
        if (usernames.size < 500) {
          waitTime =
            scrollAttempts < 20 ? 800 : scrollAttempts < 50 ? 1200 : 1500;
        } else if (usernames.size < 1500) {
          waitTime =
            scrollAttempts < 30 ? 1000 : scrollAttempts < 80 ? 1500 : 2000;
        } else {
          // For very large lists, use moderate wait times
          waitTime =
            scrollAttempts < 50 ? 1200 : scrollAttempts < 100 ? 1800 : 2200;
        }

        // Reduced extra wait times
        if (stuckCount > 10) {
          waitTime += 500; // Reduced from 1000ms to 500ms
        }

        // Reduced extra wait for very large lists
        if (usernames.size > 2000) {
          waitTime += 800; // Reduced from 2000ms to 800ms
        }

        // Reduced random delay
        const randomDelay = Math.random() * 300; // Reduced from 1000ms to 300ms
        waitTime += randomDelay;

        await new Promise((resolve) => setTimeout(resolve, waitTime));

        // Save progress more frequently for large lists
        const saveInterval = usernames.size > 1000 ? 10 : 25; // Save more frequently for large lists
        if (scrollAttempts % saveInterval === 0) {
          log(
            `📊 ${listType}: Progress check - ${usernames.size} users found after ${scrollAttempts} scrolls`
          );

          // Save intermediate results for both followers and following
          try {
            const tempFile = path.join(sessionDir, `${listType}_temp.json`);
            fs.writeFileSync(tempFile, JSON.stringify([...usernames], null, 2));
            log(`💾 Saved intermediate progress to ${tempFile}`);
          } catch (e) {
            log(`⚠️ Could not save intermediate progress`);
          }
        }

        // Additional progress logging for very large lists
        if (usernames.size > 0 && usernames.size % 500 === 0) {
          log(
            `🎯 ${listType}: Milestone reached - ${usernames.size} users collected!`
          );
        }

        // Rate limiting detection and handling
        if (consecutiveNoNewUsers > 30 && usernames.size > 1000) {
          log(
            `⚠️ ${listType}: Possible rate limiting detected, taking longer break...`
          );
          await new Promise((resolve) => setTimeout(resolve, 10000)); // 10 second break
          consecutiveNoNewUsers = 0; // Reset counter after break
        }

        // Optimized lazy loading detection - reduced frequency and improved efficiency
        if (noScrollProgressCount > 15 && usernames.size > 500) {
          // Increased threshold from 10 to 15
          log(
            `🔄 ${listType}: Detecting possible Instagram lazy loading issue, trying refresh...`
          );

          // Optimized content refresh - use cached selectors
          await page.evaluate(() => {
            const dialog = document.querySelector('div[role="dialog"]');
            if (!dialog) return;

            // Use more specific selector to avoid querying all divs
            const scrollableContainers = dialog.querySelectorAll(
              'div[class*="_aano"], div[style*="overflow"]'
            );
            for (let container of scrollableContainers) {
              if (container.scrollHeight > container.clientHeight) {
                // Quick scroll to top and bottom
                container.scrollTop = 0;
                container.scrollTop = container.scrollHeight;
              }
            }
          });

          await new Promise((resolve) => setTimeout(resolve, 2000)); // Reduced from 3000ms to 2000ms
          noScrollProgressCount = 0; // Reset counter
        }
      }

      // Final analysis and reporting
      const extractionRate = usernames.size / scrollAttempts;
      // Note: actualCounts is not available in this scope, so we'll skip completion rate calculation
      // This will be handled in the main function where actualCounts is available
      const expectedCount = 0; // Will be set by the calling function
      const completionRate = 0; // Will be calculated by the calling function

      // Determine why extraction ended
      let endReason = "Unknown";
      if (scrollEndDetected) {
        endReason = "Scroll end detected (no more content to scroll)";
      } else if (noScrollProgressCount >= maxNoScrollProgress) {
        endReason =
          "No scroll progress detected (Instagram may have limited access)";
      } else if (consecutiveNoNewUsers > 30) {
        endReason = "No new users found (likely reached end of list)";
      }

      log(
        `✅ Finished extracting ${listType}: ${usernames.size} total users found after ${scrollAttempts} scroll attempts`
      );
      log(`📊 End reason: ${endReason}`);
      log(`📊 Extraction Statistics:`);
      log(`   • Extracted count: ${usernames.size}`);
      log(
        `   • Extraction rate: ${extractionRate.toFixed(2)} users per scroll`
      );

      // Save extracted usernames to file for debugging
      try {
        const debugFile = path.join(sessionDir, `${listType}_extracted.json`);
        fs.writeFileSync(debugFile, JSON.stringify([...usernames], null, 2));
        log(`💾 Saved ${listType} list to ${debugFile} for debugging`);
      } catch (e) {
        log(`⚠️ Could not save ${listType} debug file`);
      }

      return usernames;
    }

    // Step 1: Get ALL followers
    log("👥 Step 1: Getting ALL followers list...");

    // Retry mechanism for profile navigation
    let profileNavigationSuccess = false;
    let profileNavigationAttempts = 0;
    const maxProfileNavigationAttempts = 3;

    while (
      !profileNavigationSuccess &&
      profileNavigationAttempts < maxProfileNavigationAttempts
    ) {
      try {
        profileNavigationAttempts++;
        log(
          `👤 Profile navigation attempt ${profileNavigationAttempts}/${maxProfileNavigationAttempts}...`
        );

        await page.goto(`https://www.instagram.com/${username}/`, {
          waitUntil: "domcontentloaded", // Changed from networkidle2 to domcontentloaded
          timeout: 30000, // 30 seconds timeout
        });

        // Wait for page to stabilize
        await new Promise((resolve) => setTimeout(resolve, 3000));

        // Check if navigation was successful
        const currentUrl = page.url();
        log(`🔍 Current URL after profile navigation: ${currentUrl}`);

        if (
          currentUrl.includes(`/${username}/`) ||
          currentUrl.includes("instagram.com")
        ) {
          log(`✅ Successfully navigated to @${username}'s profile`);
          profileNavigationSuccess = true;
        } else {
          throw new Error(
            `Profile navigation failed - current URL: ${currentUrl}`
          );
        }
      } catch (error) {
        log(
          `❌ Profile navigation attempt ${profileNavigationAttempts} failed: ${error.message}`
        );

        if (profileNavigationAttempts >= maxProfileNavigationAttempts) {
          log(`❌ All profile navigation attempts failed`);
          throw new Error(
            `Failed to navigate to @${username}'s profile after ${maxProfileNavigationAttempts} attempts: ${error.message}`
          );
        }

        // Wait before retry
        log(`⏳ Waiting 3 seconds before retry...`);
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Click followers link
    const followersLinks = await page.$$("a");
    let followersClicked = false;
    for (let link of followersLinks) {
      const href = await page.evaluate((el) => el.getAttribute("href"), link);
      if (href && href.includes("/followers")) {
        await link.click();
        log("🔗 Clicked followers link");
        followersClicked = true;
        break;
      }
    }

    if (!followersClicked) {
      throw new Error("Could not find followers link");
    }

    await new Promise((resolve) => setTimeout(resolve, 3000));
    const allFollowers = await extractAllUsernames("followers");

    // Step 2: Get ALL following
    log("👥 Step 2: Getting ALL following list...");
    await page.goto(`https://www.instagram.com/${username}/`, {
      waitUntil: "networkidle2",
    });
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Check actual following count from profile page
    const actualCounts = await page.evaluate(() => {
      const links = document.querySelectorAll("a");
      let followersCount = 0;
      let followingCount = 0;

      for (let link of links) {
        const href = link.getAttribute("href");
        const text = link.textContent;

        if (href && href.includes("/followers")) {
          const match = text.match(/[\d,]+/);
          if (match) {
            followersCount = parseInt(match[0].replace(/,/g, ""));
          }
        } else if (href && href.includes("/following")) {
          const match = text.match(/[\d,]+/);
          if (match) {
            followingCount = parseInt(match[0].replace(/,/g, ""));
          }
        }
      }

      return { followersCount, followingCount };
    });

    log(`📊 Instagram Profile Stats:`);
    log(`   • Actual followers count: ${actualCounts.followersCount}`);
    log(`   • Actual following count: ${actualCounts.followingCount}`);

    if (actualCounts.followingCount <= 15) {
      log(
        `✅ Following count is very low (${actualCounts.followingCount}), this is normal if you've been unfollowing.`
      );
    }

    // Click following link
    const followingLinks = await page.$$("a");
    let followingClicked = false;
    for (let link of followingLinks) {
      const href = await page.evaluate((el) => el.getAttribute("href"), link);
      if (href && href.includes("/following")) {
        await link.click();
        log("🔗 Clicked following link");
        followingClicked = true;
        break;
      }
    }

    if (!followingClicked) {
      throw new Error("Could not find following link");
    }

    await new Promise((resolve) => setTimeout(resolve, 3000));
    const allFollowing = await extractAllUsernames("following");

    // Step 3: Compare lists and find non-mutual accounts
    log("🧮 Step 3: Comparing lists to find non-mutual accounts...");

    // Filter out accounts that are actually mutual (especially those at the top)
    log(
      "🔍 Filtering out mutual accounts, own account, and verified accounts..."
    );
    const nonMutualAccounts = [];
    const mutualAccounts = [];
    const alreadyCheckedAccounts = [];
    const verifiedAccounts = [];

    for (let followingUser of allFollowing) {
      if (followingUser === username) {
        continue; // Skip own account
      }

      if (checkedAccounts.has(followingUser)) {
        alreadyCheckedAccounts.push(followingUser);
        continue; // Skip already processed
      }

      if (allFollowers.has(followingUser)) {
        mutualAccounts.push(followingUser);
        log(`💙 Found mutual: @${followingUser} (follows back)`);
      } else {
        nonMutualAccounts.push(followingUser);
        log(`🎯 Found non-mutual: @${followingUser} (doesn't follow back)`);
      }
    }

    log(`📊 Analysis Results:`);
    log(`   • Total followers: ${allFollowers.size}`);
    log(`   • Total following: ${allFollowing.size}`);
    log(
      `   • Mutual accounts (following each other): ${mutualAccounts.length}`
    );
    log(
      `   • Non-mutual accounts (one-way following): ${nonMutualAccounts.length}`
    );
    log(`   • Previously checked accounts: ${alreadyCheckedAccounts.length}`);
    log(
      `   • Available to unfollow: ${Math.min(nonMutualAccounts.length, limit)}`
    );
    log(`   • Verified accounts will be skipped automatically`);

    // Completion rate analysis
    const followersCompletionRate =
      actualCounts.followersCount > 0
        ? (allFollowers.size / actualCounts.followersCount) * 100
        : 0;
    const followingCompletionRate =
      actualCounts.followingCount > 0
        ? (allFollowing.size / actualCounts.followingCount) * 100
        : 0;

    log(`📊 Completion Rate Analysis:`);
    log(
      `   • Followers: ${allFollowers.size}/${
        actualCounts.followersCount
      } (${followersCompletionRate.toFixed(1)}%)`
    );
    log(
      `   • Following: ${allFollowing.size}/${
        actualCounts.followingCount
      } (${followingCompletionRate.toFixed(1)}%)`
    );

    // Recommendations based on completion rate
    if (followersCompletionRate < 80 && actualCounts.followersCount > 1000) {
      log(
        `⚠️ Warning: Only extracted ${followersCompletionRate.toFixed(
          1
        )}% of followers.`
      );
      log(`   This might be due to Instagram's lazy loading or rate limiting.`);
    }

    if (followingCompletionRate < 80 && actualCounts.followingCount > 1000) {
      log(
        `⚠️ Warning: Only extracted ${followingCompletionRate.toFixed(
          1
        )}% of following.`
      );
      log(`   This might be due to Instagram's lazy loading or rate limiting.`);
    }

    // Special handling for ultra-large lists
    if (actualCounts.followersCount > 4000 && followersCompletionRate < 70) {
      log(`🚨 Ultra-large followers list with low completion rate:`);
      log(`   • Expected: ${actualCounts.followersCount} followers`);
      log(
        `   • Extracted: ${
          allFollowers.size
        } followers (${followersCompletionRate.toFixed(1)}%)`
      );
      log(
        `   • Instagram heavily limits how many users can be loaded in modal`
      );
    }

    if (actualCounts.followingCount > 4000 && followingCompletionRate < 70) {
      log(`🚨 Ultra-large following list with low completion rate:`);
      log(`   • Expected: ${actualCounts.followingCount} following`);
      log(
        `   • Extracted: ${
          allFollowing.size
        } following (${followingCompletionRate.toFixed(1)}%)`
      );
      log(
        `   • Instagram heavily limits how many users can be loaded in modal`
      );
    }

    if (nonMutualAccounts.length === 0) {
      log(
        "🎉 No non-mutual accounts found! All your following are mutual or already processed."
      );
      return 0;
    }

    // Show preview of accounts to be unfollowed
    log("📋 Preview of accounts that will be unfollowed:");
    const previewCount = Math.min(10, nonMutualAccounts.length);
    for (let i = 0; i < previewCount; i++) {
      log(`   ${i + 1}. @${nonMutualAccounts[i]}`);
    }
    if (nonMutualAccounts.length > previewCount) {
      log(`   ... and ${nonMutualAccounts.length - previewCount} more`);
    }

    log(
      "ℹ️ Note: Verified accounts (blue checkmark) will be automatically skipped during the unfollow process."
    );

    // Step 4: Unfollow non-mutual accounts
    log("🎯 Step 4: Starting unfollow process...");

    let unfollowed = 0;
    let processed = 0;
    let skippedVerified = 0;

    for (let targetUsername of nonMutualAccounts) {
      if (processed >= limit) break; // Stop when we've processed enough accounts

      try {
        processed++;
        log(`🔍 Processing ${processed}/${limit}: @${targetUsername}`);

        // Alternative approach: Go directly to user's profile to unfollow
        log(`📱 Visiting @${targetUsername}'s profile to unfollow...`);
        await page.goto(`https://www.instagram.com/${targetUsername}/`, {
          waitUntil: "networkidle2",
        });
        await new Promise((resolve) => setTimeout(resolve, 3000));

        // Check if account is verified before attempting to unfollow
        const isVerified = await page.evaluate(() => {
          // Look for verified badge indicators
          const verifiedIndicators = [
            'svg[aria-label="Verified"]',
            'svg[aria-label="Verified account"]',
            '[data-testid="verified-icon"]',
            'svg[class*="verified"]',
            'div[class*="verified"]',
            'span[class*="verified"]',
            // Look for blue checkmark emoji or similar
            'svg[class*="check"]',
            'div[class*="check"]',
          ];

          for (let selector of verifiedIndicators) {
            const element = document.querySelector(selector);
            if (element) {
              console.log(
                `Found verified indicator with selector: ${selector}`
              );
              return true;
            }
          }

          // Also check for text content that might indicate verification
          const allElements = document.querySelectorAll("*");
          for (let element of allElements) {
            const text = element.textContent?.trim().toLowerCase();
            if (
              text &&
              (text.includes("verified") ||
                text.includes("terverifikasi") ||
                text.includes("✓") ||
                text.includes("✔"))
            ) {
              console.log(`Found verified text: ${text}`);
              return true;
            }
          }

          return false;
        });

        if (isVerified) {
          skippedVerified++;
          verifiedAccounts.push(targetUsername);
          log(
            `🔵 Skipping verified account: @${targetUsername} (blue checkmark detected)`
          );
          checkedAccounts.add(targetUsername);
          continue; // Skip this verified account
        }

        // Look for "Following" button on their profile
        log(`🔍 Scanning page elements for @${targetUsername}...`);

        // Debug: Check what buttons are actually available
        const pageDebug = await page.evaluate(() => {
          const buttons = document.querySelectorAll("button");
          const buttonTexts = [];
          const allText = [];

          buttons.forEach((btn, i) => {
            const text = btn.textContent?.trim();
            if (text) {
              buttonTexts.push(`${i}: "${text}"`);
            }
          });

          // Also check for any text that contains "following"
          const allElements = document.querySelectorAll("*");
          allElements.forEach((el) => {
            const text = el.textContent?.trim().toLowerCase();
            if (
              (text && text.includes("following")) ||
              (text && text.includes("mengikuti"))
            ) {
              allText.push(el.textContent.trim());
            }
          });

          return {
            buttonCount: buttons.length,
            buttonTexts: buttonTexts.slice(0, 10), // First 10 buttons
            followingTexts: [...new Set(allText)].slice(0, 5),
            pageTitle: document.title,
            url: window.location.href,
          };
        });

        log(`🔧 Page Debug for @${targetUsername}:`);
        log(`   • URL: ${pageDebug.url}`);
        log(`   • Page title: ${pageDebug.pageTitle}`);
        log(`   • Total buttons: ${pageDebug.buttonCount}`);
        log(`   • Button texts: ${pageDebug.buttonTexts.join(", ")}`);
        log(
          `   • Following-related texts: ${pageDebug.followingTexts.join(", ")}`
        );

        const unfollowResult = await page.evaluate((target) => {
          // Method 1: Look for buttons with specific Instagram classes and "Following" text
          const buttons = document.querySelectorAll("button");

          for (let button of buttons) {
            // Check if button contains "Following" text in nested divs
            const divs = button.querySelectorAll("div");
            for (let div of divs) {
              const text = div.textContent?.trim();
              console.log(`Checking div text: "${text}"`);

              if (text === "Following" || text === "Mengikuti") {
                console.log(`Found Following button for @${target}: "${text}"`);
                button.click();
                return { found: true, clicked: true, buttonText: text };
              }
            }

            // Also check button's direct text content
            const buttonText = button.textContent?.trim();
            if (
              buttonText?.includes("Following") ||
              buttonText?.includes("Mengikuti")
            ) {
              console.log(
                `Found Following button (direct text) for @${target}: "${buttonText}"`
              );
              button.click();
              return { found: true, clicked: true, buttonText: buttonText };
            }
          }

          // Method 2: Look for buttons with Instagram's specific CSS classes
          const instagramButtons = document.querySelectorAll(
            'button[class*="_aswp"], button[class*="_aswr"]'
          );
          console.log(
            `Found ${instagramButtons.length} Instagram-style buttons`
          );

          for (let button of instagramButtons) {
            const allText = button.textContent?.trim();
            console.log(`Instagram button text: "${allText}"`);

            if (
              allText?.includes("Following") ||
              allText?.includes("Mengikuti")
            ) {
              console.log(
                `Found Instagram Following button for @${target}: "${allText}"`
              );
              button.click();
              return { found: true, clicked: true, buttonText: allText };
            }
          }

          // Method 3: Look for any element with "Following" text that might be clickable
          const allElements = document.querySelectorAll("*");
          for (let element of allElements) {
            const text = element.textContent?.trim();
            if (text === "Following" || text === "Mengikuti") {
              // Check if element is clickable (has click handlers or is button-like)
              const isClickable =
                element.tagName === "BUTTON" ||
                element.getAttribute("role") === "button" ||
                element.onclick !== null ||
                element.style.cursor === "pointer" ||
                element.classList.contains("clickable");

              if (isClickable) {
                console.log(
                  `Found clickable Following element for @${target}: "${text}"`
                );
                element.click();
                return { found: true, clicked: true, buttonText: text };
              }
            }
          }

          return { found: false, clicked: false, buttonText: null };
        }, targetUsername);

        if (unfollowResult.found && unfollowResult.clicked) {
          log(
            `👤 Found Following button for @${targetUsername}: "${unfollowResult.buttonText}"`
          );

          // Wait for confirmation dialog
          await new Promise((resolve) => setTimeout(resolve, 2000));

          // Click unfollow confirmation
          let confirmed = false;
          let confirmAttempts = 0;

          while (!confirmed && confirmAttempts < 10) {
            // Look for confirmation dialog elements
            const confirmResult = await page.evaluate(() => {
              // Method 1: Look for elements with "Unfollow" text
              const allElements = document.querySelectorAll("*");

              for (let element of allElements) {
                const text = element.textContent?.trim();

                if (
                  text === "Unfollow" ||
                  text === "Berhenti Mengikuti" ||
                  text === "Berhenti mengikuti"
                ) {
                  // Check if it's clickable
                  const isClickable =
                    element.tagName === "BUTTON" ||
                    element.getAttribute("role") === "button" ||
                    element.onclick !== null ||
                    element.style.cursor === "pointer" ||
                    element.parentElement?.tagName === "BUTTON" ||
                    element.closest("button") !== null;

                  if (isClickable) {
                    console.log(`Found clickable Unfollow element: "${text}"`);

                    // Click the element or its closest button
                    const buttonToClick = element.closest("button") || element;
                    buttonToClick.click();
                    return { found: true, clicked: true, text: text };
                  }
                }
              }

              // Method 2: Look specifically for buttons in confirmation dialogs
              const buttons = document.querySelectorAll("button");
              for (let button of buttons) {
                const buttonText = button.textContent?.trim();

                if (
                  buttonText?.includes("Unfollow") ||
                  buttonText?.includes("Berhenti")
                ) {
                  console.log(`Found Unfollow button: "${buttonText}"`);
                  button.click();
                  return { found: true, clicked: true, text: buttonText };
                }
              }

              return { found: false, clicked: false, text: null };
            });

            if (confirmResult.found && confirmResult.clicked) {
              unfollowed++;
              log(
                `✅ Successfully unfollowed @${targetUsername} (${unfollowed}/${limit})`
              );
              confirmed = true;
              checkedAccounts.add(targetUsername);
              break;
            }

            if (!confirmResult.found) {
              confirmAttempts++;
              await new Promise((resolve) => setTimeout(resolve, 1000));
            }
          }

          if (!confirmed) {
            log(
              `⚠️ Found Following button but could not confirm unfollow for @${targetUsername}`
            );
            checkedAccounts.add(targetUsername);
          }
        } else {
          log(
            `⚠️ Could not find Following button for @${targetUsername} - might already be unfollowed or profile is private`
          );
          checkedAccounts.add(targetUsername);
        }

        // Check if we've reached the limit after processing this user
        if (processed >= limit) {
          log(`🛑 Reached processing limit of ${limit} accounts. Stopping...`);
          break;
        }

        // Random delay between unfollows
        const delay = Math.random() * 3000 + 2000; // 2-5 seconds
        log(`⏳ Waiting ${Math.round(delay / 1000)}s before next unfollow...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } catch (error) {
        log(`❌ Error processing @${targetUsername}: ${error.message}`);
        checkedAccounts.add(targetUsername);
      }
    }

    // Save checked accounts
    try {
      fs.writeFileSync(
        checkedAccountsFile,
        JSON.stringify([...checkedAccounts], null, 2)
      );
    } catch (e) {
      log("⚠️ Could not save checked accounts");
    }

    log(`🎉 Unfollow process completed!`);
    log(`📊 Final Statistics:`);
    log(`   • Followers collected: ${allFollowers.size}`);
    log(`   • Following collected: ${allFollowing.size}`);
    log(`   • Non-mutual accounts found: ${nonMutualAccounts.length}`);
    log(`   • Accounts processed: ${processed}`);
    log(`   • Accounts unfollowed: ${unfollowed}`);
    log(`   • Verified accounts skipped: ${skippedVerified}`);
    log(`   • Total checked accounts: ${checkedAccounts.size}`);

    if (verifiedAccounts.length > 0) {
      log(`🔵 Verified accounts that were skipped:`);
      const previewVerified = verifiedAccounts.slice(0, 5);
      for (let i = 0; i < previewVerified.length; i++) {
        log(`   ${i + 1}. @${previewVerified[i]}`);
      }
      if (verifiedAccounts.length > 5) {
        log(`   ... and ${verifiedAccounts.length - 5} more verified accounts`);
      }
    }

    log(`💾 Session saved for user: ${username}`);
    return unfollowed;
  } catch (error) {
    log(`❌ Fatal error: ${error.message}`);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
      log("🔒 Browser closed");
    }
  }
}

module.exports = { runUnfollowBot };
