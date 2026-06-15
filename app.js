require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const chatRoutes = require('./routes/chat');

const app = express();

// MIDDLEWARES
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos do frontend (coloque seus HTMLs/CSS/JS na pasta /public)
app.use(express.static(path.join(__dirname, 'public')));

// ROTAS DA API
app.use('/api',          require('./routes/auth'));       // POST /api/login, POST /api/cadastro
app.use('/api/produtos', require('./routes/produtos'));   // GET/POST/PUT /api/produtos
app.use('/api/cupons',   require('./routes/cupons'));     // POST /api/cupons/validar
app.use('/api/pedidos',  require('./routes/pedidos'));    // POST /api/pedidos, GET /api/pedidos/cliente/:id
app.use('/api/trocas',   require('./routes/trocas'));     // POST /api/trocas (solicitar troca)
app.use('/api/clientes', require('./routes/clientes'));   // GET/PUT /api/clientes/:id, endereços, cartões
app.use('/api/admin',    require('./routes/admin'));      // Rotas administrativas
app.use('/api/chat', chatRoutes);                         // Rotas do chat

// HEALTH CHECK
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// FALLBACK: rotas não reconhecidas servem o index.html
app.get('*', (req, res, next) => {
  // Não redirecionar chamadas de API que não foram encontradas
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Rota não encontrada.' });
  }
  const indexPath = path.join(__dirname, 'public', 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) next();
  });
});

// HANDLER DE ERROS GLOBAL
app.use((err, req, res, _next) => {
  if (err && err.code !== 'ENOENT') {
    console.error('[ERRO]', err.message);
  }
  res.status(500).json({ error: 'Erro interno no servidor.' });
});

// INICIAR SERVIDOR
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[SERVER] Garage Tuning rodando em http://localhost:${PORT}`);
});

module.exports = app;
