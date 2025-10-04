// Authentication script
const SUPABASE_URL = 'https://rlhajpxbevywdurchyxq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ih8X9Pid8TBDBngnbx48rw_90hstEfL';

// Custom storage adapter using Chrome storage API
const chromeStorageAdapter = {
  getItem: async (key) => {
    return new Promise((resolve) => {
      chrome.storage.local.get([key], (result) => {
        resolve(result[key] || null);
      });
    });
  },
  setItem: async (key, value) => {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: value }, () => {
        resolve();
      });
    });
  },
  removeItem: async (key) => {
    return new Promise((resolve) => {
      chrome.storage.local.remove([key], () => {
        resolve();
      });
    });
  }
};

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: chromeStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});

const googleBtn = document.getElementById('google-btn');
const statusDiv = document.getElementById('status');

// Check if already authenticated
checkAuth();

async function checkAuth() {
  const { data: { user } } = await supabaseClient.auth.getUser();

  if (user) {
    showMessage('Already signed in! Redirecting...', 'success');
    setTimeout(() => {
      window.location.href = 'popup.html';
    }, 1000);
  }
}

// Google Sign In
googleBtn.addEventListener('click', async () => {
  showMessage('Redirecting to Google...', 'info');

  // Get Chrome's OAuth redirect URL
  const redirectUrl = chrome.identity.getRedirectURL();

  const { data, error } = await supabaseClient.auth.signInWithOAuth({
    provider: 'google',
    options: {
      skipBrowserRedirect: true,
      redirectTo: redirectUrl
    }
  });

  if (error) {
    showMessage(`Error: ${error.message}`, 'error');
  } else if (data.url) {
    // Use chrome.identity.launchWebAuthFlow for OAuth
    chrome.identity.launchWebAuthFlow(
      {
        url: data.url,
        interactive: true
      },
      async (callbackUrl) => {
        if (chrome.runtime.lastError) {
          showMessage(`Error: ${chrome.runtime.lastError.message}`, 'error');
          return;
        }

        if (callbackUrl) {
          // Extract tokens from redirect URL
          const hashParams = new URLSearchParams(new URL(callbackUrl).hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');

          if (accessToken && refreshToken) {
            // Set the session
            const { error: sessionError } = await supabaseClient.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });

            if (sessionError) {
              showMessage(`Error: ${sessionError.message}`, 'error');
            } else {
              showMessage('Signed in successfully!', 'success');
              setTimeout(() => {
                window.location.href = 'popup.html';
              }, 1000);
            }
          } else {
            showMessage('Authentication failed - no tokens received', 'error');
          }
        }
      }
    );
  }
});

function showMessage(message, type) {
  statusDiv.textContent = message;
  statusDiv.className = `message ${type}`;
  statusDiv.style.display = 'block';
}
