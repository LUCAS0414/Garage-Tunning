const express = require('express');
const router = express.Router();
const pool = require('../db/config');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Teste consumo de token
pool.execute(`
  CREATE TABLE IF NOT EXISTS chat_uso_tokens (
    id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    email       VARCHAR(150)    NOT NULL,
    mensagem    TEXT            NOT NULL,
    tokens_est  INT             DEFAULT 0,
    sucesso     TINYINT(1)      DEFAULT 1,
    criado_em   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_email (email),
    INDEX idx_criado_em (criado_em)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
`).catch(err => console.error('[chat_uso_tokens] Erro ao criar tabela:', err.message));

// Registra o uso de tokens
async function registrarUso(email, mensagem, resposta, sucesso = true) {
  if (!email) return;
  try {
    const tokensEst = Math.ceil((mensagem.length + (resposta || '').length) / 4);
    await pool.execute(
      'INSERT INTO chat_uso_tokens (email, mensagem, tokens_est, sucesso) VALUES (?, ?, ?, ?)',
      [email, mensagem.slice(0, 500), tokensEst, sucesso ? 1 : 0]
    );
  } catch (err) {
    console.warn('[chat_uso_tokens] Erro ao registrar uso:', err.message);
  }
}

// Lista de stop words
const STOP_WORDS = new Set([
  'para', 'com', 'sem', 'por', 'uma', 'uma', 'uns', 'umas', 'este', 'esta', 'estes', 'estas',
  'aquele', 'aquela', 'aqueles', 'aquelas', 'esse', 'essa', 'esses', 'essas', 'como', 'mais',
  'muito', 'algum', 'alguma', 'alguns', 'algumas', 'coisa', 'coisas', 'outro', 'outra', 'outros',
  'outras', 'pelo', 'pela', 'pelos', 'pelas', 'tudo', 'nada', 'sobre', 'onde', 'quando', 'quem',
  'você', 'voce', 'dele', 'dela', 'deles', 'delas', 'esteja', 'estava', 'seria', 'teria',
  // Palavras adicionais que não ajudam na busca de produtos
  'minha', 'meu', 'meus', 'minhas', 'filho', 'filha', 'dar', 'presente', 'comprar',
  'quero', 'gostaria', 'preciso', 'tenho', 'minha', 'nosso', 'nossa', 'anos', 'ano',
  'filho', 'filha', 'esposa', 'marido', 'amigo', 'amiga', 'pessoa', 'gente', 'crianca',
  'criança', 'menino', 'menina', 'jovem', 'velho', 'adulto', 'idoso'
]);

// Busca produtos relevantes no banco
async function buscarProdutosRelevantes(mensagem) {
  const palavras = mensagem
    .toLowerCase()
    .replace(/[^\w\sáéíóúãõâêîôûç]/g, '')
    .split(/\s+/)
    .filter(p => p.length >= 3 && !STOP_WORDS.has(p));

  // Seem palavra relevante
  if (!palavras.length) {
    const [rows] = await pool.execute(
      `SELECT p.id, p.nome, p.descricao, p.preco_venda, p.estoque_atual, c.nome AS categoria
       FROM produtos p
       JOIN categorias c ON p.categoria_id = c.id
       WHERE p.status = 1 LIMIT 40`
    );
    return rows;
  }

  // Busca com OR
  const likes = palavras.map(() => '(p.nome LIKE ? OR p.descricao LIKE ? OR c.nome LIKE ?)').join(' OR ');
  const params = palavras.flatMap(p => [`%${p}%`, `%${p}%`, `%${p}%`]);

  const [rows] = await pool.execute(
    `SELECT p.id, p.nome, p.descricao, p.preco_venda, p.estoque_atual, c.nome AS categoria
     FROM produtos p
     JOIN categorias c ON p.categoria_id = c.id
     WHERE p.status = 1 AND (${likes})
     LIMIT 40`,
    params
  );

  // Retorno geral
  if (!rows.length) {
    const [geral] = await pool.execute(
      `SELECT p.id, p.nome, p.descricao, p.preco_venda, p.estoque_atual, c.nome AS categoria
       FROM produtos p
       JOIN categorias c ON p.categoria_id = c.id
       WHERE p.status = 1 LIMIT 40`
    );
    return geral;
  }

  return rows;
}

// Busca histórico de compras do cliente
async function buscarHistoricoCliente(clienteId) {
  if (!clienteId) return [];
  const [rows] = await pool.execute(
    `SELECT DISTINCT p.nome, p.descricao, c.nome AS categoria
     FROM pedido_itens pi
     JOIN pedidos ped ON pi.pedido_id = ped.id
     JOIN produtos p ON pi.produto_id = p.id
     JOIN categorias c ON p.categoria_id = c.id
     WHERE ped.usuario_id = ?
     ORDER BY ped.data_pedido DESC
     LIMIT 10`,
    [clienteId]
  );
  return rows;
}

// POST /api/chat
router.post('/', async (req, res) => {
  const { mensagem, historico = [], clienteId, email } = req.body;
  if (!mensagem?.trim()) return res.status(400).json({ error: 'Mensagem vazia.' });

  let produtos = [];
  let comprasAnteriores = [];

  try {
    const [resProdutos, resComprasAnteriores] = await Promise.all([
      buscarProdutosRelevantes(mensagem),
      buscarHistoricoCliente(clienteId)
    ]);
    produtos = resProdutos;
    comprasAnteriores = resComprasAnteriores;

    const listaProdutos = produtos
      .map(p =>
        `- ID ${p.id}: ${p.nome} | Categoria: ${p.categoria} | Preço: R$${Number(p.preco_venda).toLocaleString('pt-BR')} | Estoque: ${p.estoque_atual} un.\n  Descrição: ${p.descricao || 'Sem descrição'}`
      )
      .join('\n');

    const historicoCompras = comprasAnteriores.length
      ? '\n\nHistórico de compras do cliente:\n' +
        comprasAnteriores.map(c => `- ${c.nome} (${c.categoria})`).join('\n')
      : '';

    const systemPrompt = `Você é um mecânico de preparação e tuning profissional da oficina The Garage. Seu papel é ajudar clientes a encontrar peças e veículos do nosso catálogo com base nas necessidades deles.

════════════════════════════════════════
REGRA INVIOLÁVEL — ANTI-ALUCINAÇÃO
════════════════════════════════════════
Você só pode citar, recomendar ou mencionar produtos que estejam LITERALMENTE listados em "PRODUTOS DISPONÍVEIS" abaixo, com ID, nome e preço visíveis.
Jamais invente, cite de memória ou "complete" com produtos que não estejam na lista — mesmo que sejam marcas famosas, modelos populares ou pareçam óbvios para o contexto.
Se um produto não aparecer na lista com ID numérico, ele não existe no nosso estoque hoje. Ponto final.

════════════════════════════════════════
COMO RECOMENDAR (a partir do pedido do cliente)
════════════════════════════════════════
O cliente pode fazer dois tipos de perguntas. Responda de forma inteligente a ambas:

TIPO 1 — Busca por peças/compatibilidade:
  Exemplo: "Preciso de suspensão para meu Gol G5" ou "Que freio serve no Civic 2018?"
  → Analise tecnicamente os produtos da lista e recomende apenas o que for compatível com o veículo citado.
  → Se nenhuma peça compatível existir, informe honestamente e sugira que o cliente entre em contato.

TIPO 2 — Busca por veículo com base no perfil:
  Exemplo: "Gosto de acelerar, o que me recomenda?" ou "Quero algo potente para pista"
  → Analise o perfil e as preferências do cliente e recomende veículos da lista que se encaixam.
  → Explique tecnicamente por que cada veículo combina com o perfil descrito.

Em ambos os casos:
- Máximo de 3 recomendações por resposta.
- Para cada item recomendado, use o formato: [Nome Exato do Produto](/produto.html?id=ID) | Preço: R$ X,XX
- Em seguida, uma frase técnica explicando o ganho ou adequação ao perfil do cliente.

════════════════════════════════════════
FILTRO ÉTICO E DE SENSO COMUM
════════════════════════════════════════
Antes de qualquer resposta, avalie se a pergunta envolve algum dos cenários abaixo. Se sim, recuse educadamente sem recomendar nada:

❌ Menores de idade: Qualquer pedido que envolva dar, comprar ou recomendar veículos para pessoas com menos de 18 anos — independente do contexto (presente, coleção, pista, brincadeira). Responda: "Não posso recomendar veículos para menores de idade."

❌ Situações ilegais: Perguntas que sugiram uso do veículo para fins ilegais (racha em via pública, fuga, etc.). Responda com orientação legal sem recomendar produtos.

❌ Perguntas totalmente fora do escopo: Assuntos que não tenham qualquer relação com peças, veículos ou preparação automotiva. Responda: "Isso está fora do meu escopo como mecânico. Posso te ajudar com peças ou veículos do nosso catálogo."

════════════════════════════════════════
ESTILO DE RESPOSTA
════════════════════════════════════════
- Fale como mecânico experiente: técnico, direto, sem enrolação e se adapte ao cliente, caso fale de forma mais informal, usando gírias e etc., responda de forma adequada ao estilo do cliente, porém sem forçar a barra.
- Nunca envie saudações, apresentações ou introduções. Vá direto ao ponto.
- Se não houver produto adequado na lista, diga claramente que não temos no momento — nunca tente "completar" com produtos inventados.

PRODUTOS DISPONÍVEIS NO MOMENTO (recomende APENAS estes):
${listaProdutos}${historicoCompras}`;

    let resposta;
    let geminiSucesso = false;
    let modeloUsado = '';

    // Prepara o histórico
    const geminiHistory = historico.slice(-6).map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    // Cascata de modelos
    const modelos = ['gemini-3.5-flash', 'gemini-2.5-flash'];

    for (const nomeModelo of modelos) {
      try {
        console.log(`[Gemini] Tentando modelo: ${nomeModelo}`);
        const model = genAI.getGenerativeModel({
          model: nomeModelo,
          systemInstruction: systemPrompt,
        });

        const chat = model.startChat({ history: geminiHistory });
        
        // Timeout de 15 segundos (15000ms)
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('TIMEOUT: Limite de 10 segundos excedido')), 15000)
        );

        const result = await Promise.race([
          chat.sendMessage(mensagem),
          timeoutPromise
        ]);

        resposta = result.response.text();
        geminiSucesso = true;
        modeloUsado = nomeModelo;
        break; // Sucesso — não precisa tentar o próximo modelo
      } catch (err) {
        const isQuota = err.message?.includes('429') || err.message?.toLowerCase().includes('quota') || err.message?.toLowerCase().includes('resource_exhausted');
        const isUnavailable = err.message?.includes('503') || err.message?.toLowerCase().includes('unavailable');
        const isTimeout = err.message?.includes('TIMEOUT');

        if (isQuota) {
          console.warn(`[Gemini] Cota esgotada para ${nomeModelo}. Tentando próximo modelo...`);
        } else if (isUnavailable) {
          console.warn(`[Gemini] Serviço indisponível para ${nomeModelo}. Tentando próximo modelo...`);
        } else if (isTimeout) {
          console.warn(`[Gemini] Limite de tempo excedido (10s) para ${nomeModelo}. Tentando próximo modelo...`);
        } else {
          // Erro inesperado — não tenta o próximo, vai direto para fallback
          console.warn(`[Gemini] Erro inesperado em ${nomeModelo}:`, err.message);
          break;
        }
      }
    }

    if (geminiSucesso) {
      console.log(`[Gemini] Respondido com: ${modeloUsado}`);
      // Registra uso em background — não espera para responder
      registrarUso(email, mensagem, resposta, true);

      return res.json({
        resposta,
        produtos_base: produtos.map(p => ({ id: p.id, nome: p.nome }))
      });
    }

    // Ativa fallback local
    console.warn('[Gemini] Todos os modelos falharam. Ativando fallback básico.');
  } catch (apiErr) {
    console.warn('[Gemini API Fallback ativo]:', apiErr.message);

    const palavrasMinusculas = mensagem.toLowerCase();

    // Filtra produtos relevantes
    let categoriaBuscada = '';
    if (palavrasMinusculas.includes('suspensao') || palavrasMinusculas.includes('mola') || palavrasMinusculas.includes('amortecedor')) {
      categoriaBuscada = 'Suspensão';
    } else if (palavrasMinusculas.includes('roda') || palavrasMinusculas.includes('aro')) {
      categoriaBuscada = 'Rodas';
    } else if (palavrasMinusculas.includes('pneu')) {
      categoriaBuscada = 'Pneus';
    } else if (palavrasMinusculas.includes('escape') || palavrasMinusculas.includes('escapamento')) {
      categoriaBuscada = 'Escapamento';
    } else if (palavrasMinusculas.includes('filtro') || palavrasMinusculas.includes('intake')) {
      categoriaBuscada = 'Admissão';
    } else if (palavrasMinusculas.includes('freio') || palavrasMinusculas.includes('disco') || palavrasMinusculas.includes('pastilha')) {
      categoriaBuscada = 'Freios';
    }

    // Filtra apenas os produtos que correspondem à categoria buscada
    const produtosFiltrados = produtos.filter(p => {
      const nomeMatch = p.nome.toLowerCase().includes(palavrasMinusculas.split(/\s+/)[0]);
      const catMatch = categoriaBuscada && p.categoria && p.categoria.toLowerCase().includes(categoriaBuscada.toLowerCase());
      const isCarro = p.categoria && (p.categoria.includes('JDM') || p.categoria.includes('Alemães') || p.categoria.includes('Italianos') || p.categoria.includes('Americanos'));
      if (categoriaBuscada && isCarro) return false;

      return nomeMatch || catMatch;
    });

    if (produtosFiltrados.length > 0) {
      resposta = `Como mecânico, analisei nosso catálogo e separei estes itens de ${categoriaBuscada || 'performance'} adequados para o seu projeto:\n\n` +
        produtosFiltrados.slice(0, 3).map(p => `🏁 *[${p.nome}](/produto.html?id=${p.id})* | Preço: R$ ${Number(p.preco_venda).toLocaleString('pt-BR')}\n_${p.descricao || 'Item de alta performance indicado para preparação.'}_`).join('\n\n') +
        `\n\nRecomendo verificar a compatibilidade exata de fixação do modelo com o seu carro antes da instalação.`;
    } else if (categoriaBuscada) {
      resposta = `No momento não temos itens de ${categoriaBuscada} em estoque compatíveis com o seu projeto. Posso tentar buscar outra categoria ou peças universais?`;
    } else {
      resposta = `Para o projeto do seu veículo, no momento não encontrei peças específicas correspondentes em nosso catálogo. Tente buscar por termos diretos como 'suspensão', 'roda' ou 'escapamento'.`;
    }

    // Registra uso do fallback
    registrarUso(email, mensagem, resposta, false);

    res.json({
      resposta,
      produtos_base: produtos.map(p => ({ id: p.id, nome: p.nome }))
    });
  }
});

module.exports = router;
