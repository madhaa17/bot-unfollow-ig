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

    browser = await puppeteer.launch({
      headless: false,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      userDataDir: sessionDir,
      protocolTimeout: 300000, // 5 minutes timeout instead of default 180s
      slowMo: 50, // Add small delay between actions for stability
    });
    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    );

    log("📱 Navigating to Instagram...");
    await page.goto("https://www.instagram.com/", {
      waitUntil: "networkidle2",
    });

    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Check if already logged in
    try {
      const isLoggedIn =
        (await page.$('svg[aria-label="Home"]')) ||
        (await page.$('img[alt*="profile picture"]')) ||
        (await page.$('a[href*="/' + username + '/"]'));

      if (isLoggedIn) {
        log("✅ Already logged in! Using saved session.");
      } else {
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

      // Try to resume from temporary progress
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
      const maxScrollAttempts = listType === "following" ? 150 : 100; // More attempts for following lists
      const maxConsecutiveNoNew = 20; // More patience for large lists
      let lastScrollHeight = 0;

      // Set page timeout for this specific operation
      await page.setDefaultTimeout(60000); // 1 minute per operation
      await page.setDefaultNavigationTimeout(60000);

      // Initial wait for page to load completely
      log(`⏳ ${listType}: Waiting for initial page load...`);
      await new Promise((resolve) => setTimeout(resolve, 5000));

      while (
        scrollAttempts < maxScrollAttempts &&
        consecutiveNoNewUsers < maxConsecutiveNoNew
      ) {
        scrollAttempts++;

        // Wait for content to load before extracting
        await new Promise((resolve) => setTimeout(resolve, 2000));

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
              setTimeout(() => reject(new Error("Extraction timeout")), 30000) // 30 second timeout per extraction
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

        if (newCount === 0) {
          consecutiveNoNewUsers++;
          log(
            `📊 ${listType}: Scroll ${scrollAttempts} - No new users found (${consecutiveNoNewUsers}/${maxConsecutiveNoNew}) - Total: ${usernames.size}`
          );
        } else {
          consecutiveNoNewUsers = 0; // Reset counter when we find new users
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

        // Enhanced scrolling with multiple strategies
        const scrollSuccess = await Promise.race([
          page.evaluate(() => {
            console.log("🔄 Starting aggressive scroll operation...");
            let scrolled = false;
            let maxScrolled = 0;

            // Strategy 1: Try all possible scroll containers
            const allSelectors = [
              'div[role="dialog"]',
              'div[role="dialog"] > div',
              'div[role="dialog"] > div > div',
              'div[role="dialog"] > div > div > div',
              'div[role="dialog"] div[style*="overflow"]',
              'div[role="dialog"] div[style*="height"]',
              'div[role="dialog"] div[style*="max-height"]',
              'div[role="dialog"] div[style*="overflow-y"]',
              'div[role="dialog"] div[style*="overflow-x"]',
              'div[role="dialog"] div[class*="scroll"]',
              'div[role="dialog"] div[class*="_aano"]',
              'div[role="dialog"] div[class*="_ab8w"]',
            ];

            console.log(`Trying ${allSelectors.length} scroll strategies...`);

            for (let selector of allSelectors) {
              const containers = document.querySelectorAll(selector);
              console.log(
                `Selector "${selector}" found ${containers.length} containers`
              );

              for (let container of containers) {
                if (container.scrollHeight > container.clientHeight) {
                  console.log(
                    `   Container scrollable: ${container.scrollHeight} > ${container.clientHeight}`
                  );
                  const beforeScroll = container.scrollTop;

                  // Try multiple scroll amounts
                  for (let amount of [500, 800, 1000, 1500]) {
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

            console.log(
              `🔄 Scroll operation completed. Success: ${scrolled}, maxScrolled: ${maxScrolled}`
            );
            return maxScrolled;
          }),
          new Promise(
            (_, reject) =>
              setTimeout(() => reject(new Error("Scroll timeout")), 15000) // Increased timeout
          ),
        ]).catch((error) => {
          console.log(`⚠️ Scroll timeout, continuing...`);
          return 0;
        });

        // Quick end detection
        const isAtEnd = await Promise.race([
          page.evaluate(() => {
            const dialog = document.querySelector('div[role="dialog"]');
            if (!dialog) return false;

            // Simple end detection
            const textContent = dialog.textContent.toLowerCase();
            return (
              textContent.includes("no more suggestions") ||
              textContent.includes("end of list") ||
              textContent.includes("you have seen all")
            );
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("End detection timeout")), 5000)
          ),
        ]).catch(() => false);

        if (isAtEnd) {
          log(`📊 ${listType}: Detected end of list`);
          break;
        }

        // Progressive wait times - shorter for better performance
        let waitTime =
          scrollAttempts < 20 ? 1500 : scrollAttempts < 50 ? 2000 : 2500;
        await new Promise((resolve) => setTimeout(resolve, waitTime));

        // Save progress periodically for large lists
        if (scrollAttempts % 25 === 0) {
          log(
            `📊 ${listType}: Progress check - ${usernames.size} users found after ${scrollAttempts} scrolls`
          );

          // Save intermediate results for following list (in case of crash)
          if (listType === "following") {
            try {
              const tempFile = path.join(sessionDir, `${listType}_temp.json`);
              fs.writeFileSync(
                tempFile,
                JSON.stringify([...usernames], null, 2)
              );
              log(`💾 Saved intermediate progress to ${tempFile}`);
            } catch (e) {
              log(`⚠️ Could not save intermediate progress`);
            }
          }
        }
      }

      log(
        `✅ Finished extracting ${listType}: ${usernames.size} total users found after ${scrollAttempts} scroll attempts`
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
    await page.goto(`https://www.instagram.com/${username}/`, {
      waitUntil: "networkidle2",
    });
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
    log("🔍 Filtering out mutual accounts and own account...");
    const nonMutualAccounts = [];
    const mutualAccounts = [];
    const alreadyCheckedAccounts = [];

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

    // Step 4: Unfollow non-mutual accounts
    log("🎯 Step 4: Starting unfollow process...");

    let unfollowed = 0;
    let processed = 0;

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
    log(`   • Total checked accounts: ${checkedAccounts.size}`);
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
