// const corsOptions = {
//   origin: function (origin, callback) {
//     const allowedOrigins = [
//       process.env.FRONTEND_URL || "http://localhost:3000",
//       "http://192.168.1.9:3000", // 👈 thêm IP local của bạn vào đây
//     ];

//     // Cho phép requests không có origin (như Postman, mobile apps)
//     if (!origin) return callback(null, true);

//     if (allowedOrigins.includes(origin)) {
//       callback(null, true);
//     } else {
//       console.log("❌ Blocked by CORS:", origin); // debug dễ thấy
//       callback(new Error("Not allowed by CORS"));
//     }
//   },
//   credentials: true,
//   methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//   allowedHeaders: [
//     "Content-Type",
//     "Authorization",
//     "X-Requested-With",
//     "Accept",
//   ],
// };

// module.exports = corsOptions;

// backend/config/cors.js
// Robust CORS config: handles unresolved ${...}, localhost, 127.0.0.1, IP LAN, and dev mode.

const dotenv = require("dotenv");
const dotenvExpand = require("dotenv-expand");
dotenvExpand.expand(dotenv.config()); // ensure env vars expanded if dotenv-expand installed

// helper to resolve a possibly unreplaced template like "http://${HOST_IP}:3000"
function resolveMaybeTemplate(val) {
  if (!val) return null;
  if (val.includes("${") || val.includes("${")) return null; // can't resolve here
  return val;
}

// compute frontend URLs
const envFrontend = resolveMaybeTemplate(process.env.FRONTEND_URL);
const envHost = process.env.HOST_IP || "127.0.0.1";
const envFrontendPort = process.env.FRONTEND_PORT || "3000";

// final resolved fallback values
const resolvedFrontend = envFrontend || `http://${envHost}:${envFrontendPort}`;
const localhostUrls = ["http://localhost:3000", "http://127.0.0.1:3000"];

// also include explicit LAN IP if provided
const lanUrl = process.env.HOST_IP
  ? `http://${process.env.HOST_IP}:${envFrontendPort}`
  : null;

// build allowed origins set (deduplicated)
const allowedOriginsSet = new Set(
  [resolvedFrontend, ...localhostUrls, lanUrl].filter(Boolean)
);

// OPTIONAL: in development allow any origin (uncomment if you prefer)
const isDev = (process.env.NODE_ENV || "development") === "development";
// if you want to allow all in dev uncomment next line:
// if (isDev) allowedOriginsSet.add("*");

const allowedOrigins = Array.from(allowedOriginsSet);

console.log("🔧 CORS allowed origins:", allowedOrigins);

const corsOptions = {
  origin: function (origin, callback) {
    // allow requests with no origin (e.g., curl, Postman, native mobile)
    if (!origin) return callback(null, true);

    // allow everything in dev mode (safer: enable only if you understand risk)
    if (isDev && allowedOrigins.includes("*")) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // additional friendly match: if origin host equals HOST_IP:PORT
    try {
      const url = new URL(origin);
      const hostOrigin = `${url.protocol}//${url.hostname}:${url.port || "80"}`;
      if (allowedOrigins.includes(hostOrigin)) {
        return callback(null, true);
      }
    } catch (e) {
      // ignore parse error
    }

    console.log("❌ Blocked by CORS:", origin);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
  ],
};

module.exports = corsOptions;
