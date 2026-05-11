function login() {
  const domain = "https://us-east-1mykonc7ag.auth.us-east-1.amazoncognito.com";
  const clientId = "m44ooj0he619o3cj6a0hvk8qi";
  const redirectUri = "https://mis690.goinscyber.com/homepage.html";
  const url =
    `${domain}/oauth2/authorize` +
    `?response_type=code` +
    `&client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=openid`;
  window.location.href = url;
}
