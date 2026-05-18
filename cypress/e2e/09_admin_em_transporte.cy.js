// ===================================================================
// CASO DE USO 9 — Administrador define produto como EM TRANSPORTE
//                 (status: APROVADO → EM TRANSPORTE)
// ===================================================================

const DELAY = 800;
for (const cmd of ['visit','click','type','clear','select','trigger']) {
  Cypress.Commands.overwrite(cmd, (fn, ...args) =>
    Cypress.Promise.delay(DELAY).then(() => fn(...args))
  );
}

const BASE        = 'http://localhost:3000';
const ADMIN_EMAIL = 'admin@garage.com';
const ADMIN_SENHA = 'admin123';

describe('UC-09: Administrador define pedido como EM TRANSPORTE', () => {
    beforeEach(() => {
    cy.visit(`${BASE}/login.html`);
    cy.get('#loginEmail').type(ADMIN_EMAIL);
    cy.get('#loginSenha').type(ADMIN_SENHA);
    cy.get('#btnLogin').click();
    cy.url().should('not.include', 'login.html');

    cy.visit(`${BASE}/admin-vendas.html`);
    cy.intercept('GET', '/api/admin/pedidos*').as('listarPedidos');
    cy.intercept('PUT', '/api/admin/pedidos/*/status').as('atualizarStatus');
  });

  it('deve mover pedido APROVADO para EM TRANSPORTE via interface admin', () => {
    cy.visit(`${BASE}/admin-vendas.html`);
    cy.wait('@listarPedidos', { timeout: 10000 });

    cy.get('#vendaFiltroStatus').select('APROVADO');
    cy.get('#tabelaVendasBody tr', { timeout: 8000 }).should('have.length.at.least', 1);

    cy.get('[data-acao="detalhe"]').first().click();
    cy.get('#modalPedido', { timeout: 8000 }).should('be.visible');

    cy.get('#acoesPedido [data-novo-status="EM TRANSPORTE"]').should('be.visible').click();
    cy.wait('@atualizarStatus').its('response.statusCode').should('eq', 200);

    cy.get('#modalPedido .badge').should('contain.text', 'Em Transporte');
  });
});
