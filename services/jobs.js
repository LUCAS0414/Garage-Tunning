const pool         = require('../db/config');
const EstoqueService = require('./estoqueService');
const CupomService   = require('./cupomService');

// Job 1: expira reservas de estoque vencidas e remove itens do carrinho. RN0044
function iniciarJobReservas() {
  setInterval(async () => {
    try {
      await EstoqueService.expirarReservasAntigas();
    } catch (err) {
      console.error('[JOB:Reservas] Erro:', err.message);
    }
  }, 60 * 1000); // a cada 1 minuto
  console.log('[JOB] Job de reservas de estoque iniciado (intervalo: 1 min).');
}

/*
  Job 2: envia cupom de abandono de carrinho de 3%
  para clientes de ranking "Iniciante" com itens há >48h. RN0047
  (Sem NodeMailer: registra o cupom no banco e loga o e-mail no console)
 */
function iniciarJobAbandonoCarrinho() {
  async function verificar() {
    try {
      const [candidatos] = await pool.execute(
        `SELECT DISTINCT c.cliente_id, cl.nome, cl.email, cl.ranking
         FROM carrinho c
         JOIN clientes cl ON cl.id = c.cliente_id
         WHERE c.adicionado_em < DATE_SUB(NOW(), INTERVAL 48 HOUR)
           AND cl.ranking = 'Iniciante'
           AND cl.status = 1`
      );

      if (candidatos.length === 0) return;

      const conexao = await pool.getConnection();
      try {
        await conexao.beginTransaction();

        for (const cli of candidatos) {
          const cupom = await CupomService.gerarAbandonoCarrinho(cli.cliente_id, conexao);
          if (cupom) {
            // Em produção: enviar e-mail com cupom.codigo
            console.log(
              `[JOB:Abandono] Cupom gerado para ${cli.email}: ${cupom.codigo} — 3% de desconto (válido 7 dias)`
            );
          }
        }

        await conexao.commit();
      } catch (err) {
        await conexao.rollback();
        console.error('[JOB:Abandono] Erro na transação:', err.message);
      } finally {
        conexao.release();
      }
    } catch (err) {
      console.error('[JOB:Abandono] Erro geral:', err.message);
    }
  }

  setInterval(verificar, 60 * 60 * 1000); // a cada 1 hora
  console.log('[JOB] Job de abandono de carrinho iniciado (intervalo: 1h).');
}

module.exports = { iniciarJobReservas, iniciarJobAbandonoCarrinho };
