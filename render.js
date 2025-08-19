document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("bot-form");
  const logContainer = document.getElementById("log-container");
  const logStatus = document.querySelector(".log-status");

  // Stats elements
  const followersCount = document.getElementById("followers-count");
  const followingCount = document.getElementById("following-count");
  const processedCount = document.getElementById("processed-count");
  const unfollowedCount = document.getElementById("unfollowed-count");

  let stats = {
    followers: 0,
    following: 0,
    processed: 0,
    unfollowed: 0,
  };

  // Clear log container and show initial message
  logContainer.innerHTML = `
    <div class="initial-message">
      🤖 Bot is ready to start...<br>
      📝 Logs will appear here in real-time<br>
      🚀 Click "Start Bot" to begin
    </div>
  `;

  // Update stats display
  function updateStats() {
    followersCount.textContent = stats.followers || "-";
    followingCount.textContent = stats.following || "-";
    processedCount.textContent = stats.processed || "-";
    unfollowedCount.textContent = stats.unfollowed || "-";
  }

  // Parse stats from log messages
  function extractStatsFromLog(log) {
    // Extract followers count
    const followersMatch =
      log.match(/Total followers:\s*(\d+)/i) ||
      log.match(/Followers collected:\s*(\d+)/i);
    if (followersMatch) {
      stats.followers = parseInt(followersMatch[1]);
    }

    // Extract following count
    const followingMatch =
      log.match(/Total following:\s*(\d+)/i) ||
      log.match(/Following collected:\s*(\d+)/i);
    if (followingMatch) {
      stats.following = parseInt(followingMatch[1]);
    }

    // Extract processed count
    const processedMatch =
      log.match(/Processing\s+(\d+)\/\d+:/i) ||
      log.match(/Accounts processed:\s*(\d+)/i);
    if (processedMatch) {
      stats.processed = parseInt(processedMatch[1]);
    }

    // Extract unfollowed count
    const unfollowedMatch =
      log.match(/Successfully unfollowed.*\((\d+)\/\d+\)/i) ||
      log.match(/Accounts unfollowed:\s*(\d+)/i);
    if (unfollowedMatch) {
      stats.unfollowed = parseInt(unfollowedMatch[1]);
    }

    updateStats();
  }

  // Update status indicator
  function updateStatus(status, color = "#28a745") {
    logStatus.textContent = status;
    logStatus.style.background = color;
  }

  // Enhanced log formatter with better text handling
  function formatLog(log) {
    // Clean the log text - remove extra whitespace and HTML-like content
    let cleanLog = log
      .replace(/\s+/g, " ") // Replace multiple spaces with single space
      .replace(/[{}]+/g, "") // Remove curly braces
      .replace(/,"[^"]*":\[[^\]]*\]/g, "") // Remove JSON-like content
      .replace(/,\s*"[^"]*":/g, "") // Remove JSON keys
      .trim();

    // If log is too long and looks like HTML/JSON, truncate it
    if (
      cleanLog.length > 200 &&
      (cleanLog.includes("html") || cleanLog.includes('"require"'))
    ) {
      cleanLog = cleanLog.substring(0, 100) + "... [content truncated]";
    }

    // Add timestamp
    const now = new Date();
    const timestamp = now.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    // Color coding based on log type
    let color = "#58a6ff"; // Default blue

    if (cleanLog.includes("🚀") || cleanLog.includes("Starting")) {
      color = "#7c3aed";
    } else if (
      cleanLog.includes("✅") ||
      cleanLog.includes("Successfully") ||
      cleanLog.includes("completed")
    ) {
      color = "#10b981";
    } else if (
      cleanLog.includes("❌") ||
      cleanLog.includes("Error") ||
      cleanLog.includes("Failed") ||
      cleanLog.includes("Fatal")
    ) {
      color = "#ef4444";
    } else if (
      cleanLog.includes("⚠️") ||
      cleanLog.includes("Warning") ||
      cleanLog.includes("Could not find")
    ) {
      color = "#f59e0b";
    } else if (
      cleanLog.includes("📊") ||
      cleanLog.includes("Analysis") ||
      cleanLog.includes("Statistics")
    ) {
      color = "#8b5cf6";
    } else if (
      cleanLog.includes("🔍") ||
      cleanLog.includes("Processing") ||
      cleanLog.includes("Searching")
    ) {
      color = "#06b6d4";
    } else if (
      cleanLog.includes("💾") ||
      cleanLog.includes("Saved") ||
      cleanLog.includes("Session")
    ) {
      color = "#059669";
    } else if (
      cleanLog.includes("🎯") ||
      cleanLog.includes("Found") ||
      cleanLog.includes("Preview")
    ) {
      color = "#3b82f6";
    }

    return `<span style="color: #6b7280; font-size: 11px;">[${timestamp}]</span> <span style="color: ${color};">${cleanLog}</span>`;
  }

  // Enhanced log function with better handling
  function addLog(log) {
    // Skip empty or very short logs
    if (!log || log.trim().length < 3) return;

    // Clear initial message on first real log
    if (logContainer.innerHTML.includes("initial-message")) {
      logContainer.innerHTML = "";
    }

    // Extract stats from log
    extractStatsFromLog(log);

    // Add formatted log
    const formattedLog = formatLog(log);

    // Create log entry element
    const logEntry = document.createElement("div");
    logEntry.innerHTML = formattedLog;
    logEntry.style.marginBottom = "4px";
    logEntry.style.wordBreak = "break-word";

    logContainer.appendChild(logEntry);

    // Limit log entries to prevent memory issues
    const logEntries = logContainer.children;
    if (logEntries.length > 200) {
      logContainer.removeChild(logEntries[0]);
    }

    // Auto scroll to bottom
    logContainer.scrollTop = logContainer.scrollHeight;

    // Update status based on log content
    if (log.includes("Starting") || log.includes("🚀")) {
      updateStatus("RUNNING", "#17a2b8");
    } else if (
      log.includes("completed") ||
      log.includes("finished") ||
      log.includes("🎉")
    ) {
      updateStatus("COMPLETED", "#28a745");
    } else if (
      log.includes("Error") ||
      log.includes("Fatal") ||
      log.includes("❌")
    ) {
      updateStatus("ERROR", "#dc3545");
    } else if (log.includes("Extracting") || log.includes("Step")) {
      updateStatus("EXTRACTING", "#6f42c1");
    } else if (log.includes("Processing") || log.includes("🔍")) {
      updateStatus("PROCESSING", "#fd7e14");
    }
  }

  // Start Bot
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const limitUnfollow = parseInt(document.getElementById("limit").value, 10);

    // Reset stats
    stats = { followers: 0, following: 0, processed: 0, unfollowed: 0 };
    updateStats();
    updateStatus("STARTING", "#ffc107");

    // Clear previous logs
    logContainer.innerHTML = "";

    addLog(
      `🚀 Starting unfollow bot for ${username} (limit ${limitUnfollow})...`
    );

    // Disable form during execution
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = "🔄 Running...";
    submitButton.disabled = true;

    // Disable inputs
    form.querySelectorAll("input").forEach((input) => (input.disabled = true));

    try {
      const result = await window.botAPI.startBot(
        username,
        password,
        limitUnfollow
      );

      if (result.status === "success") {
        addLog(
          `✅ Bot finished successfully. Unfollowed ${result.unfollowed} accounts.`
        );
        updateStatus("COMPLETED", "#28a745");
      } else {
        addLog(`❌ Error: ${result.message}`);
        updateStatus("ERROR", "#dc3545");
      }
    } catch (error) {
      addLog(`❌ Unexpected error: ${error.message}`);
      updateStatus("ERROR", "#dc3545");
    } finally {
      // Re-enable form
      submitButton.textContent = originalText;
      submitButton.disabled = false;
      form
        .querySelectorAll("input")
        .forEach((input) => (input.disabled = false));
    }
  });

  // Listen for Logs from Main Process
  window.botAPI.onBotLog((log) => {
    addLog(log);
  });

  // Initialize stats display
  updateStats();
});
