const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function setupProxy(app) {
  const target = process.env.API_PROXY || 'http://localhost:5000';

  app.use(
    '/api',
    createProxyMiddleware({
      target,
      changeOrigin: true,
      ws: false
    })
  );
};
