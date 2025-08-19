document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("bot-form");
  const logContainer = document.getElementById("log-container");

  // Utility log ke UI
  function addLog(log) {
    logContainer.innerHTML += log + "<br>";
    logContainer.scrollTop = logContainer.scrollHeight;
  }

  // 📌 Start Bot
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const limitUnfollow = parseInt(document.getElementById("limit").value, 10);

    addLog(
      `🚀 Starting unfollow bot for ${username} (limit ${limitUnfollow})...`
    );

    const result = await window.botAPI.startBot(
      username,
      password,
      limitUnfollow
    );

    if (result.status === "success") {
      addLog(
        `✅ Bot finished successfully. Unfollowed ${result.unfollowed} accounts.`
      );
    } else {
      addLog(`❌ Error: ${result.message}`);
    }
  });

  // 📌 Listen for Logs dari Main
  window.botAPI.onBotLog((log) => {
    addLog(log);
  });
});
