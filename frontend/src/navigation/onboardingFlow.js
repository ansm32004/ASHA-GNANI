// Remembers which onboarding screen to show when the navigator remounts.
// App.js remounts the navigator on every language change, which would
// otherwise send the user back to the splash screen mid-onboarding.
let startRoute = 'Splash';

export const getOnboardingStartRoute = () => startRoute;

export const setOnboardingStartRoute = (route) => {
  startRoute = route;
};
