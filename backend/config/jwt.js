const jwtConfig = {
  secret:
    process.env.JWT_SECRET ||
    "autism_support_secret_key_2023_change_this_in_production",
  expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  issuer: process.env.JWT_ISSUER || "autism-support-api",
  audience: process.env.JWT_AUDIENCE || "autism-support-app",
};

module.exports = jwtConfig;
