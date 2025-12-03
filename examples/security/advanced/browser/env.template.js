(function () {
  const origin = window.location.origin;
  const redirectUri = `${origin}/`;
  const oauthBase = `${origin}/oauth`;
  const welcomeBase = `${origin}/fame/v1/welcome`;
  const caBase = `${origin}/fame/v1/ca`;
  const trustBundleUrl = `${origin}/.well-known/naylence/trust-bundle.json`;

  window.__ENV__ = {
    FAME_LOG_LEVEL: "info",
    FAME_SHOW_ENVELOPES: "false",
    FAME_SECURITY_PROFILE: "strict-overlay",
    FAME_TRUST_BUNDLE_ALLOW_HTTP: "true",
    FAME_ADMISSION_PROFILE: "welcome-pkce",
    FAME_ADMISSION_SERVICE_URL: `${welcomeBase}/hello`,
    FAME_ADMISSION_TOKEN_URL: `${oauthBase}/token`,
    FAME_ADMISSION_AUTHORIZE_URL: `${oauthBase}/authorize`,
    FAME_ADMISSION_REDIRECT_URL: redirectUri,
    FAME_ADMISSION_CLIENT_ID: "${FAME_ADMISSION_CLIENT_ID}",
    FAME_JWKS_URL: `${origin}/fame/welcome/.well-known/jwks.json`,
    FAME_JWT_AUDIENCE: "fame.fabric",
    FAME_JWT_TRUSTED_ISSUER: "https://welcome",
    FAME_JWT_ALGORITHM: "EdDSA",
    FAME_CA_SERVICE_URL: caBase,
    FAME_CA_CERTS: trustBundleUrl,
    FAME_CA_ALLOW_TOFU: "true",
    FAME_PLUGINS: "@naylence/runtime,@naylence/advanced-security"
  };
})();
