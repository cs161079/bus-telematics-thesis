export const environment = {
  production: true,
  server: "https://uat.osses.gr/api/v1",
  auth_config: {
    redirect_url: "https://uat.osses.gr/portal/oauth/push-notification",
    end_session_redirect_url: "https://uat.osses.gr/portal/unoauth/home",
    silent_check_sso_url: window.location.origin + '/portal/assets/silent-check-sso.html'
  }
};
