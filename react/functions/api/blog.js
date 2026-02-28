// Blog API endpoints for Cloudflare Workers
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;

  // GET /api/blog - list all blog posts
  if (url.pathname === "/api/blog" && method === "GET") {
    const result = await env.DB.prepare("SELECT * FROM blog_posts ORDER BY created_at DESC").all();
    return new Response(JSON.stringify(result.results), {
      headers: { "Content-Type": "application/json" }
    });
  }

  // POST /api/blog - create a new blog post
  if (url.pathname === "/api/blog" && method === "POST") {
    const data = await request.json();
    const { title, message, image_url, attachment_url } = data;
    if (!title || !message) {
      return new Response(JSON.stringify({ error: "Title and message required" }), { status: 400 });
    }
    const stmt = env.DB.prepare(
      "INSERT INTO blog_posts (title, message, image_url, attachment_url) VALUES (?, ?, ?, ?)"
    );
    await stmt.bind(title, message, image_url || null, attachment_url || null).run();
    return new Response(JSON.stringify({ success: true }), { status: 201 });
  }

  // GET /api/blog/:id - get a single blog post
  const blogIdMatch = url.pathname.match(/^\/api\/blog\/(\d+)$/);
  if (blogIdMatch && method === "GET") {
    const id = blogIdMatch[1];
    const result = await env.DB.prepare("SELECT * FROM blog_posts WHERE id = ?").bind(id).first();
    if (!result) {
      return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
    }
    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" }
    });
  }

  // DELETE /api/blog/:id - delete a blog post
  if (blogIdMatch && method === "DELETE") {
    const id = blogIdMatch[1];
    await env.DB.prepare("DELETE FROM blog_posts WHERE id = ?").bind(id).run();
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  }

  return new Response("Not found", { status: 404 });
}
