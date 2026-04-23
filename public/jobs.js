// jobs.js
// Schema novo: tabelas carrinho e reservas_estoque foram removidas.
// Jobs de reserva e abandono de carrinho não são mais aplicáveis.
// Mantido apenas para extensão futura.

function iniciarJobs() {
  console.log('[JOB] Sem jobs ativos neste schema. Carrinho é gerenciado pelo frontend (localStorage).');
}

module.exports = { iniciarJobs };
