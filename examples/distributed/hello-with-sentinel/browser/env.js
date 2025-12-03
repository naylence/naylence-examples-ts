// Environment configuration for browser client
// These values are injected at runtime by the build process or server
window.__ENV__ = {
  FAME_DIRECT_ADMISSION_URL: "ws://localhost:8000/fame/v1/attach/ws/downstream",
  FAME_PLUGINS: "@naylence/runtime,@naylence/agent-sdk",
};
