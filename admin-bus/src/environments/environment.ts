export const environment = {
  production: false,
  server: "https://uat.osses.gr/api/v1",
  auth_config: {
    redirect_url: "http://localhost:4200/oauth/push-notification",
    end_session_redirect_url: "http://localhost:4200/unoauth/home",
    silent_check_sso_url: window.location.origin + '/assets/silent-check-sso.html'
  }
};
