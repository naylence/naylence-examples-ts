(function () {
  const origin = window.location.origin;
  const redirectUri = `${origin}/`;
  const oauthBase = `${origin}/oauth`;
  const wsBase = origin.replace(/^http/, "ws");

  window.__ENV__ = {
    FAME_LOG_LEVEL: "debug",
    FAME_ADMISSION_PROFILE: "direct-pkce",
    FAME_DIRECT_ADMISSION_URL: `${wsBase}/fame/v1/attach/ws/downstream`,
    FAME_ADMISSION_TOKEN_URL: `${oauthBase}/token`,
    FAME_ADMISSION_AUTHORIZE_URL: `${oauthBase}/authorize`,
    FAME_ADMISSION_REDIRECT_URL: redirectUri,
    FAME_ADMISSION_CLIENT_ID: "${FAME_ADMISSION_CLIENT_ID}",
    FAME_JWT_AUDIENCE: "fame.fabric",
    FAME_JWT_TRUSTED_ISSUER: "https://oauth2-server",
    FAME_JWT_ALGORITHM: "EdDSA"
  };
})();
