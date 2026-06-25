import dotenv from "dotenv";

/**
 * Dev-only: serve /api/auth-sso via Vite middleware (same as Vercel serverless)
 */
export default function vitePluginSsoApi() {
  return {
    name: "vite-plugin-sso-api",
    configureServer(server) {
      dotenv.config();

      server.middlewares.use("/api/auth-sso", async (req, res, next) => {
        if (req.method === "OPTIONS") {
          res.writeHead(200, {
            "Access-Control-Allow-Origin": req.headers.origin || "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          });
          res.end();
          return;
        }

        if (req.method !== "POST") {
          return next();
        }

        try {
          const chunks = [];
          for await (const chunk of req) chunks.push(chunk);
          const body = JSON.parse(Buffer.concat(chunks).toString() || "{}");

          const { exchangeSsoCredentials } = await import("../api/_lib/ssoExchange.js");
          const result = await exchangeSsoCredentials(body);

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(result));
        } catch (err) {
          const message = err instanceof Error ? err.message : "SSO gagal";
          console.error("[dev/api/auth-sso]", message);
          res.writeHead(401, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: message }));
        }
      });
    },
  };
}
