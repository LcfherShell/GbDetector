const fs = require("fs");
const fspromises =  require('fs/promises');
const path = require("path");
const readline = require("readline");
const axios = require("axios");
const open = require("open");
const figlet = require("figlet");

const isElectron = process.versions && process.versions.electron;
const isCLI = !isElectron;

let GB, isRunning = false;
try {
  GB = require("./");
  if (isCLI) showBanner();
} catch (error) {
  console.error("Failed to load Gambling Detector module:", error.message);
  process.exit(1);
}

// Configuration options
const CONFIG = {
  deletionDelay: 2000, // Delay between deletions in milliseconds (2 seconds)
  notificationDuration: 3500, // Duration for notifications in milliseconds
  commentFetchLimit: 100, // Number of comments to fetch at once
  sensitivityLevel: 2, // Default sensitivity level for gambling detection
  minScoreForDeletion: 1.6 // Minimum score to trigger deletion
};

function showBanner() {
  console.log(figlet.textSync("GbDetector", { font: "Standard" }));
}


function addLog(message, color = "default") {
  const time = new Date().toLocaleTimeString();
  const logContainer = document.getElementById("log");
  if (!logContainer) {
    showNotification("Error: Log container not found!", "error");
    return;
  }

  const colorMap = {
    green: "#22c55e",
    red: "#ef4444",
    orange: "#fcd548",
    default: "#a5f3fc"
  };

  const emojiMap = {
    green: "✓",
    red: "❌",
    orange: "⚠️",
    default: "ℹ"
  };

  const logEntry = document.createElement("div");
  const safeColor = colorMap[color] || colorMap.default;
  const emoji = emojiMap[color] || emojiMap.default;

  logEntry.innerHTML = `
    <span style="color: #64748b;">[${time}]</span> 
    <span style="color: ${safeColor};">${emoji} ${message}</span>
  `;

  logContainer.appendChild(logEntry);
  logContainer.scrollTop = logContainer.scrollHeight;
}
function log(message, color="default") {
  if (isCLI) {
    console.log(message);
  } else {
    const logContainer = document.getElementById("log");
    if (logContainer) {
      addLog(message, color);
    } else {
      showNotification("Error: Log element not found!", "error");
    }
    console.log(message);
  }
}

function bestLog(message, color="default") {
  !isCLI ? setTimeout(() => log(message, color), 3520) : log(message, color);
};

function showNotification(message, type = 'success') {
  const notification = document.getElementById('notification');
  const notificationText = document.getElementById('notification-text');
  
  // Set the icon based on notification type
  const iconElement = notification.querySelector('i');
  if (iconElement) {
    if (type === 'success') {
      iconElement.className = 'fas fa-check-circle';
    } else if (type === 'error') {
      iconElement.className = 'fas fa-exclamation-circle';
    } else {
      iconElement.className = 'fas fa-info-circle';
    }
  }
  
  notificationText.textContent = message;
  notification.className = `notification ${type}`;
  
  // Show with animation
  notification.style.display = 'flex';
  
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);

  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.style.display = 'none';
    }, 300);
  }, 3500);
}

function updateStatus(message, color = "black") {
  if (isCLI) {
    console.log(message);
  } else {
    const hiddenlog = document.getElementById("hidden-log");
    hiddenlog.innerText = `${color.match(/red|orange/gi)? "0": "$"}`;
    const timer = new Date().toLocaleTimeString();

    if (color === "red") showNotification(`[${timer}] ${message}`, "error");
    else if (color === "gray") showNotification(`[${timer}] ${message}`, "nothing");
    else if (color === "blue") showNotification(`[${timer}] ${message}`, "info");
    else if (color === "orange") showNotification(`[${timer}] ${message}`, "warning");
    else showNotification(`[${timer}] ${message}`, "success");

    
  }
}

async function getUserInput() {
  if (isCLI) {
    return new Promise((resolve) => {
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      rl.question("Enter Platform (instagram/facebook/youtube): ", (platform) => {
        rl.question("Enter Media/Post/Video ID: ", (id) => {
          rl.close();
          resolve({ platform: platform.trim().toLowerCase(), id: id.trim() });
        });
      });
    });
  } else {
    return Promise.resolve({
      platform: document.getElementById("platform").value.trim().toLowerCase(),
      id: document.getElementById("mediaId").value.trim(),
    });
  }
}

function findCredentialFile(basePath, platform) {
  try {
    const files = fs.readdirSync(basePath);
    for (const file of files) {
      const lower = file.toLowerCase();
      if (lower.includes(platform) && lower.includes("credential") && lower.endsWith(".json")) {
        return path.join(basePath, file);
      }
    }
  } catch (error) {
    bestLog(`Error scanning directory: ${error.message}`, "red");
  }
  return null;
}

function getCredentialPaths(platform) {
  const basePath = process.cwd();
  const platforms = ["instagram", "facebook", "youtube"];
  const result = {};

  const searchPlatforms = platform ? [platform] : platforms;
  for (const key of searchPlatforms) {
    const defaultPath = path.join(basePath, `${key}_credentials.json`);
    if (fs.existsSync(defaultPath)) {
      result[key] = defaultPath;
    } else {
      result[key] = findCredentialFile(basePath, key) || null;
    }
  }

  return result;
}

/**
 * Appends a new line to a file, creating it if necessary, and trimming old lines if maxLines is exceeded.
 * @param {string} filePath - Path to the file
 * @param {string} message - Message to append (a line)
 * @param {number} maxLines - Maximum number of lines to keep
 */
function appendLineWithLimit(filePath, message, maxLines = 28) {
  try {
    const newLine = `${message}\n`;
    let lines = [];

    // Check and read existing file if available
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      lines = content.split('\n').filter(Boolean); // remove empty lines
    } else {
      // Create the file if it doesn't exist
      fs.writeFileSync(filePath, '', 'utf8');
      console.log(`📁 File created: ${filePath}`);
    }

    // Append and trim
    lines.push(message);
    if (lines.length > maxLines) {
      lines = lines.slice(-maxLines); // keep only last maxLines
    }

    // Write updated content
    fs.writeFileSync(filePath, lines.join('\n') + '\n', 'utf8');
    console.log(`✅ Line added. Total lines: ${lines.length}`);
    
  } catch (err) {
    updateStatus('Error to write history', 'red');
    console.error(`❌ Error while writing to ${filePath}:`, err.message);
  }
}

function start() {
  if (isRunning) {
    updateStatus("Process already running. Please wait or reject current operation.", "orange");
    return;
  }
  
  isRunning = true;
  updateStatus("Starting moderation process...", "blue");

  getUserInput()
    .then(({ platform, id }) => {
      if (!id || id.trim() === "") {
        bestLog("Media/Post/Video ID cannot be empty.", "red");
        updateStatus("Error: ID cannot be empty!", "red");
        isRunning = false;
        return;
      }
      
      if (!["instagram", "facebook", "youtube"].includes(platform)) {
        bestLog("Unsupported platform. Please select instagram, facebook, or youtube.", "red");
        updateStatus("Error: Unsupported platform selected!", "red");
        isRunning = false;
        return;
      }

      const credentialPath = getCredentialPaths(platform)[platform];
      if (!credentialPath) {
        bestLog(`No credentials found for ${platform}.`, "red");
        updateStatus(`Error: No credentials found for ${platform}.`, "red");
        isRunning = false;
        return;
      }

      fs.readFile(credentialPath, "utf8", (err, content) => {
        if (err) {
          bestLog(`Failed to read credentials: ${err.message}`, "red");
          updateStatus(`Error: Failed to read credentials`, "red");
          isRunning = false;
          return;
        }

        try {
          const credentials = JSON.parse(content);
          authorize(platform, credentials, id, deleteAllComments);
        } catch (jsonError) {
          bestLog(`Invalid credentials format: ${jsonError.message}`, "red");
          updateStatus(`Error: Invalid credentials format`, "red");
          isRunning = false;
        }
      });
    })
    .catch((error) => {
      bestLog(`Unexpected error: ${error.message}`, "red");
      updateStatus(`Error: ${error.message}`, "red");
      isRunning = false;
    });
}

function authorize(platform, credentials, id, callback) {
  const { access_token, api_key } = credentials;
  
  if (!access_token && !api_key) {
    bestLog("Missing access token or API key.", "red");
    updateStatus("Error: Missing credentials.", "red");
    isRunning = false;
    return;
  }
  callback(platform, access_token || api_key, id);
}

// Promise-based delay function
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchComments(platform, token, mediaId) {
  try {
    if (platform === "instagram" || platform === "facebook") {
      const { data } = await axios.get(`https://graph.facebook.com/v22.0/${mediaId}/comments`, {
        params: { access_token: token, fields: "id,message", limit: CONFIG.commentFetchLimit },
      });
      return data.data.map((c) => ({ id: c.id, text: c.message || "" }));
    } else if (platform === "youtube") {
      const { data } = await axios.get(`https://youtube.googleapis.com/youtube/v3/commentThreads`, {
        params: { part: "snippet", videoId: mediaId, key: token, maxResults: CONFIG.commentFetchLimit },
      });
      return data.items.map((c) => ({
        id: c.id,
        text: c.snippet.topLevelComment.snippet.textDisplay || "",
      }));
    }
    return [];
  } catch (error) {
    const errorMsg = error.response 
      ? `${error.response.status}: ${JSON.stringify(error.response.data)}`
      : error.message;
    bestLog(`Error fetching comments: ${errorMsg}`, "red");
    throw new Error(`Failed to fetch comments: ${errorMsg}`);
  }
}

async function deleteComment(platform, token, commentId) {
  try {
    if (platform === "instagram" || platform === "facebook") {
      await axios.delete(`https://graph.facebook.com/v22.0/${commentId}`, {
        params: { access_token: token },
      });
    } else if (platform === "youtube") {
      await axios.post(`https://youtube.googleapis.com/youtube/v3/comments/setModerationStatus`, null, {
        params: { id: commentId, moderationStatus: "rejected", key: token },
      });
    }
    return true;
  } catch (error) {
    const errorMsg = error.response 
      ? `${error.response.status}: ${JSON.stringify(error.response.data)}`
      : error.message;
    bestLog(`Failed to delete comment ${commentId}: ${errorMsg}`, "red");
    return false;
  }
}

async function deleteAllComments(platform, token, mediaId) {
  bestLog(`Fetching comments from ${platform}, ID: ${mediaId}`);
  updateStatus(`Fetching comments...`, "blue");

  const detectionConfig = {
    sensitivityLevel: CONFIG.sensitivityLevel,
    includeAnalysis: true,
    detectRepetition: true,
    detectUrlPatterns: true,
    detectEvasionTechniques: true,
    detectContextualIndicators: true,
    extractContactInfo: true,
    debug: false,
    ...GB.GamblingDetector.getLanguagePatterns("all"),
  };

  try {
    const comments = await fetchComments(platform, token, mediaId);

    if (!comments.length) {
      updateStatus("No comments found.", "gray");
      bestLog("No comments found.");
      isRunning = false;
      return;
    }

    
    updateStatus(`Analyzing ${comments.length} comments...`, "blue");
    bestLog(`Found ${comments.length} comments. Analyzing...`);
    let deletedCount = 0;
    let analyzedCount = 0;

    for (const comment of comments) {
      // Check if operation was cancelled
      if (!isRunning) {
        updateStatus("Operation cancelled.", "red");
        bestLog("Operation cancelled by user.", "red");
        return;
      }

      if (!comment.text.trim()) {
        analyzedCount++;
        continue;
      }

      const result = GB.GamblingDetector.detect(comment.text, detectionConfig);

      let score = 0;
      score += result.isGambling ? 1 : Math.random() * (0.3 - 0.2) + 0.21;
      score += /high|medium/i.test(result.confidence || "") ? 1 : Math.random() * (0.5 - 0.2) + 0.3;
      score += result.checkpoint > 0.6 ? 0.5 : 0.5;

      analyzedCount++;
      
      // Update progress periodically
      if (analyzedCount % 10 === 0) {
        updateStatus(`Progress: ${analyzedCount}/${comments.length} comments analyzed...`, "blue");
      }

      if (score > CONFIG.minScoreForDeletion) {
        const truncatedText = comment.text.length > 50 ? 
          `${comment.text.substring(0, 50)}...` : comment.text;
        log(`Detected gambling comment: "${truncatedText}"`, 'orange');
        updateStatus(`Detected gambling comment...`, "orange");

        const deleted = await deleteComment(platform, token, comment.id);
        if (deleted) {
          deletedCount++;
          log(`Comment deleted successfully. (${deletedCount} total)`, 'green');
        }
        
        // Add delay between deletions to avoid rate limiting
        await delay(CONFIG.deletionDelay);
      }
    }

    bestLog(`Process completed. Deleted ${deletedCount} out of ${comments.length} comments.`, "green");
    const time = new Date().toLocaleTimeString();
    updateStatus(`[${time}] Completed: ${deletedCount}/${comments.length} deleted.`, "green");
    appendLineWithLimit(path.join(`${process.cwd()}`, 'history.txt'), `[${time}] Platform: ${platform} | Video ID: ${mediaId}` , 28);
  } catch (error) {
    const errorMsg = error.response ? `${error.response.status}: ${JSON.stringify(error.response.data)}` : error.message;
    
    bestLog(`Error during comment processing: ${errorMsg}`, "red");
    updateStatus(`Error: ${errorMsg}`, "red");
  } finally {
    isRunning = false;
  }
}

function reject() {
  if (!isRunning) {
    bestLog('No moderation is currently running.', "red");
    updateStatus("Nothing to reject.", "gray");
    return;
  }
  isRunning = false;
  bestLog('Moderation has been rejected by user.', "red");
  updateStatus("Moderation rejected.", "red");
}

async function loadHistory() {
  try {
    const filepath = path.join(process.cwd(), 'history.txt');
    const fileContent = await fspromises.readFile(filepath, 'utf8');
    const lines = fileContent.trim().split('\n').filter(Boolean);

    const history = lines.map((line) => {
      const match = line.match(/Platform:\s*(.+?)\s*\|\s*Video ID:\s*(.+)/);
      if (!match) return null;

      const [, platform, id] = match;
      return { platform: platform.trim(), id: id.trim() };
    }).filter(Boolean); // Filter out failed matches

    const output = history.length
      ? JSON.stringify({ history }, null, 2)
      : 'nodata';

    document.getElementById('historylog').innerText = output;
    return history.length > 0 ? 1 : 0;

  } catch (error) {
    console.error('❌ Failed to load history:', error);
    document.getElementById('historylog').innerText = 'nodata';
    updateStatus('Failed to load history', 'red');
    return 0;
  }
}


async function initElectronUI() {
  if (isCLI) return;

  const startBtn = document.getElementById("startButton");
  const rejectBtn = document.getElementById("rejectButton");
  const mediaInput = document.getElementById("mediaId");
  const historyBTN = document.getElementById("historyButton");
  if (!startBtn || !rejectBtn || !mediaInput) {
    console.warn("⚠️ Required UI elements not found.");
    return;
  }

  startBtn.addEventListener("click", async () => {
    if (!isRunning) start();
  });

  rejectBtn.addEventListener("click", async () => {
    reject();
  });

  historyBTN.addEventListener("click", async () => {
    setTimeout(async () => await  loadHistory(), 2000);
  });
  
  mediaInput.addEventListener("keypress", async (e) => {
    if (e.key === "Enter" && !isRunning) start();
  });

  
}


if (isCLI) {
  start();
} else {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initElectronUI);
  } else {
    initElectronUI();
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { start, reject };
  }
}