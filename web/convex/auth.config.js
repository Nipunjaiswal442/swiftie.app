// Firebase Auth OIDC configuration for Convex
// Convex will validate Firebase ID tokens from this project
export default {
  providers: [
    {
      domain: "https://securetoken.google.com/swiftie-d0ea0",
      applicationID: "swiftie-d0ea0",
    },
  ],
};
