async function exchangeCodeForTokens() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code"); // extract code from URL

  console.log("URL:", window.location.href);
  console.log("Code found:", code);
  console.log("Existing Token:", localStorage.getItem("idToken"));

  if (!code) {
    const existing = localStorage.getItem("idToken");
    if (!existing) {
      window.location.href = "/index.html";
    }
    return;
  }

  const domain = "https://us-east-1mykonc7ag.auth.us-east-1.amazoncognito.com";
  const clientId = "m44ooj0he619o3cj6a0hvk8qi";
  const clientSecret = "1js4ni62btqvo5dnlmibpirh5a1pmah274dcfdm31j9a6epv3qt";
  const redirectUri = "https://mis690.goinscyber.com/homepage.html";

  try {
        const response = await fetch(`${domain}/oauth2/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            grant_type: "authorization_code",
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            code: code
        })
        });

        console.log("Response Status:", response.status);
        const tokens = await response.json(); // JSON answer
        console.log("Token Response:", JSON.stringify(tokens));

        if (!tokens.id_token) {
            console.error("No id_token → redirect");
            window.location.href = "/index.html";
            return;
        }

        localStorage.setItem("idToken", tokens.id_token);
        localStorage.setItem("accessToken", tokens.access_token);
        localStorage.setItem("refreshToken", tokens.refresh_token);
        // Replace code in URL with clean homepage URL
        window.history.replaceState({}, "", "/homepage.html");
        console.log("Login successful ✅");

    } catch (err) {
        console.error("Error:", err);
        window.location.href = "/index.html";
    }
}

exchangeCodeForTokens();

async function getItems() {
    const token = localStorage.getItem("accessToken");

    if (!token) {
        window.location.href = "/index.html";
        return;
    }

    try {
        const response = await fetch("/api/items", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

    console.log("API status:", response.status);

    const body = await response.text();
    console.log("API body:", body);

    if (response.status === 401 || response.status === 403) {
        return;
    }

      return JSON.parse(body);
  } catch (err) {
      console.error("Error loading items:", err);
  }
}

async function renderItems() {
  const items = await getItems();
  const list = document.getElementById("entry-list");

  if (!items || items.length === 0) {
    list.innerHTML = `<p style="text-align:center; color: var(--text-muted, #888); padding: 1rem;">No passwords saved yet.</p>`;
    updateStats(0);
    return;
  }

  list.innerHTML = items.map(item => `
    <div class="entry" data-id="${item.id}">
      <div class="entry-icon" style="background:#555;">
        <span style="color:white; font-size:14px; font-weight:600;">
          ${item.title.charAt(0).toUpperCase()}
        </span>
      </div>
      <div class="entry-info">
        <div class="name">${item.title}</div>
        <div class="user">${item.username || ""}</div>
      </div>
      <svg class="chevron" width="14" height="14" viewBox="0 0 16 16" fill="none">
        <path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <button class="delete-btn" onclick="handleDelete(${item.id})">✕</button>
    </div>
  `).join("");

  updateStats(items.length);
}

function updateStats(total) {
    document.getElementById("stat-total").textContent = total;
}

async function handleDelete(itemId) {
    await deleteItem(itemId);
    await renderItems(); // refresh list after deletion
}



async function saveItem(title, username, password, url = null, notes = null) {

    const token = localStorage.getItem("accessToken");

    if (!token) {
        window.location.href = "/index.html";
        return;
    }

    try {
        const response = await fetch("/api/items", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ title, username, password, url, notes })
        });

        console.log("Save status:", response.status);

        const body = await response.text();
        console.log("Save response:", body);

        if (response.status === 401 || response.status === 403) {
        return;
        }
        return JSON.parse(body);
    } catch (err) {
        console.error("Error saving item:", err);
    }
}

async function deleteItem(itemId) {

    const token = localStorage.getItem("accessToken");
    if (!token) {
        window.location.href = "/index.html";
        return;
    }

    try {
        const response = await fetch(`/api/items/${itemId}`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${token}`
        }
        });

        console.log("Delete status:", response.status);

        const body = await response.text();
        console.log("Delete response:", body);
        if (response.status === 401 || response.status === 403) {
        return;
        }

        return JSON.parse(body);
    } catch (err) {
        console.error("Error deleting item:", err);
    }
}

function logout() {
    // Clear all tokens from local storage and redirect to login
    localStorage.removeItem("idToken");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    window.location.href = "/index.html";
}



function openModal() {
  document.getElementById("input-title").value = "";
  document.getElementById("input-username").value = "";
  document.getElementById("input-password").value = "";
  document.getElementById("input-url").value = "";
  document.getElementById("input-notes").value = "";
  document.getElementById("modal-error").style.display = "none";
  document.getElementById("add-panel").style.display = "block";
}

function closeModal() {
  document.getElementById("add-panel").style.display = "none";
}

async function handleSave() {
  const title    = document.getElementById("input-title").value.trim();
  const username = document.getElementById("input-username").value.trim();
  const password = document.getElementById("input-password").value.trim();
  const url      = document.getElementById("input-url").value.trim() || null;
  const notes    = document.getElementById("input-notes").value.trim() || null;

  if (!title || !username || !password) {
    document.getElementById("modal-error").style.display = "block";
    return;
  }

  await saveItem(title, username, password, url, notes);
  closeModal();
  await renderItems();
}