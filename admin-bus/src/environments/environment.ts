export const environment = {
  production: false,
  server: "http://localhost:8083/api/v1",
  auth_config: {
    redirect_url: "http://localhost:4200/oauth/push-notification",
    end_session_redirect_url: "http://localhost:4200/unoauth/home"
  }
};
