import { Router, Request, Response } from 'express';
import { openapiSpec } from '../config/openapi';

const router = Router();

// Машиночитаемая спецификация
router.get('/openapi.json', (_req: Request, res: Response) => {
  res.json(openapiSpec);
});

// Swagger UI (CDN, без серверных зависимостей)
router.get('/docs', (_req: Request, res: Response) => {
  res.type('html').send(`<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>ODR API — Swagger UI</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  <style>body{margin:0}.topbar{display:none}</style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js" crossorigin></script>
  <script>
    window.onload = function () {
      window.ui = SwaggerUIBundle({
        url: '/api/openapi.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [SwaggerUIBundle.presets.apis],
      });
    };
  </script>
</body>
</html>`);
});

export default router;
