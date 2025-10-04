const fs = require('fs');
const path = require('path');
const os = require('os');
const sqlite3 = require('sqlite3').verbose();

class BrowserTracker {
  constructor() {
    this.homeDir = os.homedir();
    this.currentSite = null;
    this.historyCache = [];
  }

  // Get Chrome history path
  getChromeHistoryPath() {
    if (process.platform === 'darwin') {
      return path.join(this.homeDir, 'Library/Application Support/Google/Chrome/Default/History');
    } else if (process.platform === 'win32') {
      return path.join(this.homeDir, 'AppData/Local/Google/Chrome/User Data/Default/History');
    } else {
      return path.join(this.homeDir, '.config/google-chrome/Default/History');
    }
  }

  // Get Safari history path (macOS only)
  getSafariHistoryPath() {
    if (process.platform === 'darwin') {
      return path.join(this.homeDir, 'Library/Safari/History.db');
    }
    return null;
  }

  // Get Firefox history path
  getFirefoxHistoryPath() {
    let firefoxDir;
    if (process.platform === 'darwin') {
      firefoxDir = path.join(this.homeDir, 'Library/Application Support/Firefox/Profiles');
    } else if (process.platform === 'win32') {
      firefoxDir = path.join(this.homeDir, 'AppData/Roaming/Mozilla/Firefox/Profiles');
    } else {
      firefoxDir = path.join(this.homeDir, '.mozilla/firefox');
    }

    try {
      const profiles = fs.readdirSync(firefoxDir);
      const defaultProfile = profiles.find(p => p.includes('default'));
      if (defaultProfile) {
        return path.join(firefoxDir, defaultProfile, 'places.sqlite');
      }
    } catch (err) {
      console.error('Firefox profile not found:', err.message);
    }
    return null;
  }

  // Copy database to temp location (required because browsers lock the DB)
  copyDatabase(source) {
    const tempPath = path.join(os.tmpdir(), `browser-history-${Date.now()}.db`);
    try {
      fs.copyFileSync(source, tempPath);
      return tempPath;
    } catch (err) {
      // Silently fail - permissions issue
      return null;
    }
  }

  // Get recent Chrome/Chromium history
  async getChromeHistory(limit = 10) {
    return new Promise((resolve, reject) => {
      const historyPath = this.getChromeHistoryPath();

      if (!fs.existsSync(historyPath)) {
        return resolve([]);
      }

      const tempDb = this.copyDatabase(historyPath);
      if (!tempDb) {
        return resolve([]);
      }

      const db = new sqlite3.Database(tempDb, sqlite3.OPEN_READONLY, (err) => {
        if (err) {
          return resolve([]);
        }
      });

      const query = `
        SELECT url, title, last_visit_time, visit_count
        FROM urls
        ORDER BY last_visit_time DESC
        LIMIT ?
      `;

      db.all(query, [limit], (err, rows) => {
        db.close();
        fs.unlinkSync(tempDb); // Clean up temp file

        if (err) {
          return resolve([]);
        }

        const history = rows.map(row => ({
          url: row.url,
          title: row.title,
          timestamp: this.chromeTimeToDate(row.last_visit_time),
          visitCount: row.visit_count
        }));

        resolve(history);
      });
    });
  }

  // Get recent Safari history (macOS only)
  async getSafariHistory(limit = 10) {
    return new Promise((resolve, reject) => {
      const historyPath = this.getSafariHistoryPath();

      if (!historyPath || !fs.existsSync(historyPath)) {
        return resolve([]);
      }

      const tempDb = this.copyDatabase(historyPath);
      if (!tempDb) {
        return resolve([]);
      }

      const db = new sqlite3.Database(tempDb, sqlite3.OPEN_READONLY, (err) => {
        if (err) {
          return resolve([]);
        }
      });

      const query = `
        SELECT url, title, visit_time, visit_count
        FROM history_visits
        INNER JOIN history_items ON history_visits.history_item = history_items.id
        ORDER BY visit_time DESC
        LIMIT ?
      `;

      db.all(query, [limit], (err, rows) => {
        db.close();
        fs.unlinkSync(tempDb); // Clean up temp file

        if (err) {
          return resolve([]);
        }

        const history = rows.map(row => ({
          url: row.url,
          title: row.title,
          timestamp: new Date(row.visit_time * 1000 + Date.parse('2001-01-01')),
          visitCount: row.visit_count
        }));

        resolve(history);
      });
    });
  }

  // Convert Chrome timestamp to JavaScript Date
  chromeTimeToDate(chromeTime) {
    // Chrome timestamps are microseconds since 1601-01-01
    const windowsEpoch = new Date('1601-01-01T00:00:00Z').getTime();
    const unixEpoch = new Date('1970-01-01T00:00:00Z').getTime();
    const epochDifference = unixEpoch - windowsEpoch;

    return new Date(chromeTime / 1000 - epochDifference);
  }

  // Get current active browser tab (requires additional permissions/tools)
  async getCurrentTab() {
    // This is a placeholder - actual implementation would require:
    // - macOS: Use AppleScript or Accessibility API
    // - Windows: Use Win32 API
    // - Linux: Use wmctrl or xdotool

    // For now, get the most recent history item
    const chromeHistory = await this.getChromeHistory(1);
    const safariHistory = await this.getSafariHistory(1);

    const allHistory = [...chromeHistory, ...safariHistory]
      .sort((a, b) => b.timestamp - a.timestamp);

    if (allHistory.length > 0) {
      this.currentSite = {
        url: allHistory[0].url,
        title: allHistory[0].title,
        domain: new URL(allHistory[0].url).hostname
      };
      return this.currentSite;
    }

    return null;
  }

  // Categorize URL
  categorizeUrl(url) {
    const categories = [];
    const urlLower = url.toLowerCase();

    if (urlLower.includes('github') || urlLower.includes('stackoverflow') ||
        urlLower.includes('gitlab') || urlLower.includes('bitbucket')) {
      categories.push('Coding');
    }
    if (urlLower.includes('youtube') || urlLower.includes('vimeo') ||
        urlLower.includes('twitch')) {
      categories.push('Video');
    }
    if (urlLower.includes('twitter') || urlLower.includes('facebook') ||
        urlLower.includes('instagram') || urlLower.includes('reddit')) {
      categories.push('Social');
    }
    if (urlLower.includes('news') || urlLower.includes('cnn') ||
        urlLower.includes('bbc') || urlLower.includes('nytimes')) {
      categories.push('News');
    }
    if (urlLower.includes('steam') || urlLower.includes('gaming') ||
        urlLower.includes('twitch')) {
      categories.push('Gaming');
    }
    if (urlLower.includes('amazon') || urlLower.includes('shop') ||
        urlLower.includes('ebay')) {
      categories.push('Shopping');
    }
    if (urlLower.includes('docs') || urlLower.includes('documentation') ||
        urlLower.includes('wiki')) {
      categories.push('Docs');
    }

    return categories.length > 0 ? categories : ['Other'];
  }

  // Get browsing summary
  async getBrowsingSummary(limit = 50) {
    const history = await this.getChromeHistory(limit);
    const categories = new Set();

    history.forEach(item => {
      const itemCategories = this.categorizeUrl(item.url);
      itemCategories.forEach(cat => categories.add(cat));
    });

    return {
      categories: Array.from(categories),
      topSites: history.slice(0, 5).map(h => ({
        domain: new URL(h.url).hostname,
        title: h.title,
        visitCount: h.visitCount
      }))
    };
  }
}

module.exports = BrowserTracker;
