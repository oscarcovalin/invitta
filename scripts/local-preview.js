const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const port = Number(process.argv[2]) || 4173;
const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mp3": "audio/mpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml"
};

http.createServer((request, response) => {
  const urlPath = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
  const requested = urlPath === "/" ? "/index.html" : urlPath;
  const filePath = path.resolve(root, `.${requested}`);

  if (!filePath.startsWith(root)) {
    response.writeHead(403);
    return response.end("Forbidden");
  }

  fs.stat(filePath, (statError, stats) => {
    let target = filePath;
    if (!statError && stats.isDirectory()) target = path.join(filePath, "index.html");

    fs.readFile(target, (error, content) => {
      if (error) {
        response.writeHead(error.code === "ENOENT" ? 404 : 500);
        return response.end(error.code === "ENOENT" ? "Not found" : "Server error");
      }
      response.writeHead(200, {
        "Content-Type": mimeTypes[path.extname(target).toLowerCase()] || "application/octet-stream"
      });
      return response.end(content);
    });
  });
}).listen(port, "127.0.0.1", () => {
  console.log(`Invitta preview: http://127.0.0.1:${port}`);
});
