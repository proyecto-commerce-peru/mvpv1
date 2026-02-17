import { NextResponse } from "next/server";

export async function GET() {
  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Seller Bot API Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  <style>
    body { margin: 0; }
    .docs-toolbar {
      font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      padding: 10px 16px;
      background: #111827;
      color: #f9fafb;
      display: flex;
      gap: 10px;
      align-items: center;
      position: sticky;
      top: 0;
      z-index: 999;
    }
    .docs-toolbar button {
      border: 1px solid #374151;
      background: #1f2937;
      color: #f9fafb;
      border-radius: 6px;
      padding: 6px 10px;
      cursor: pointer;
    }
    .docs-toolbar code {
      background: #1f2937;
      padding: 2px 6px;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="docs-toolbar">
    <strong>Session Auto Auth</strong>
    <span>Login/register guarda token y tenant automaticamente para siguientes requests.</span>
    <button id="clear-session">Limpiar Sesion</button>
    <span id="session-state"></span>
  </div>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    const TOKEN_KEY = 'sellerbot_docs_access_token';
    const TENANT_KEY = 'sellerbot_docs_tenant_id';

    function getPath(url) {
      try {
        return new URL(url, window.location.origin).pathname;
      } catch {
        return '';
      }
    }

    function isAuthEndpoint(pathname) {
      return [
        '/api/v1/auth/login',
        '/api/v1/auth/register',
        '/api/v1/auth/magic-link/verify'
      ].includes(pathname);
    }

    function updateSessionBadge() {
      const token = localStorage.getItem(TOKEN_KEY);
      const tenant = localStorage.getItem(TENANT_KEY);
      const el = document.getElementById('session-state');
      if (!el) return;

      if (!token) {
        el.innerHTML = 'Estado: <code>sin token</code>';
        return;
      }

      const shortToken = token.length > 20 ? token.slice(0, 20) + '...' : token;
      el.innerHTML = 'Estado: token <code>' + shortToken + '</code> tenant <code>' + (tenant || '-') + '</code>';
    }

    const ui = SwaggerUIBundle({
      url: '/api/openapi.json',
      dom_id: '#swagger-ui',
      persistAuthorization: true,
      requestInterceptor: (req) => {
        const token = localStorage.getItem(TOKEN_KEY);
        const tenant = localStorage.getItem(TENANT_KEY);

        req.headers = req.headers || {};

        if (token && !req.headers.authorization && !req.headers.Authorization) {
          req.headers.authorization = 'Bearer ' + token;
        }

        if (tenant && !req.headers['x-tenant-id'] && !req.headers['X-Tenant-Id']) {
          req.headers['x-tenant-id'] = tenant;
        }

        const path = getPath(req.url);
        if (path.startsWith('/api/v1/auth/')) {
          const sentTenant = req.headers['x-tenant-id'] || req.headers['X-Tenant-Id'];
          if (sentTenant) {
            localStorage.setItem(TENANT_KEY, sentTenant);
          }
        }

        return req;
      },
      responseInterceptor: (res) => {
        const path = getPath(res.url || '');
        if (!isAuthEndpoint(path)) {
          return res;
        }

        const token = res?.obj?.data?.access_token;
        if (token && typeof token === 'string') {
          localStorage.setItem(TOKEN_KEY, token);
        }

        updateSessionBadge();
        return res;
      },
      onComplete: () => {
        updateSessionBadge();
      },
    });

    window.ui = ui;

    const clearBtn = document.getElementById('clear-session');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(TENANT_KEY);
        updateSessionBadge();
        alert('Sesion Swagger limpiada');
      });
    }
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
    },
  });
}