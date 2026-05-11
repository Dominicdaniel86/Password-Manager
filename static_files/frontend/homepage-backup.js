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
    const tokens = await response.json(); // JSON-Answer
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
    console.error("Fehler beim Laden der Items:", err);
  }
}

