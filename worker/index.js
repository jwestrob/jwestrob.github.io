/**
 * Sites/Cloudflare Worker entry point for the otherwise static website.
 *
 * Static assets are served by the platform binding. Keeping this adapter tiny
 * preserves the GitHub Pages source while producing the Worker-compatible
 * artifact required for an owner-only Sites preview.
 */
const worker = {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    const headers = new Headers(response.headers);
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    headers.set("X-Frame-Options", "SAMEORIGIN");
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
};

export default worker;
