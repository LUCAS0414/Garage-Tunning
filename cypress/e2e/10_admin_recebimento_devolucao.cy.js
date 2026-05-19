// CASO DE USO 10 — Administrador confirma recebimento do produto
//                  devolvido + sistema gera cupom de troca

const DELAY = 800;
for (const cmd of ['visit','click','type','clear','select','trigger']) {
  Cypress.Commands.overwrite(cmd, (fn, ...args) =>
    Cypress.Promise.delay(DELAY).then(() => fn(...args))
  );
}

const BASE        = 'http://localhost:3000';
const ADMIN_EMAIL = 'admin@garage.com';
const ADMIN_SENHA = 'admin123';

describe('UC-10: Administrador confirma recebimento do produto devolvido', () => {
    beforeEach(() => {
    cy.visit(`${BASE}/login.html`);
    cy.get('#loginEmail').type(ADMIN_EMAIL);
    cy.get('#loginSenha').type(ADMIN_SENHA);
    cy.get('#btnLogin').click();
    cy.url().should('not.include', 'login.html');

    cy.visit(`${BASE}/admin-vendas.html`);
    cy.intercept('GET', '/api/admin/pedidos*').as('listarPedidos');
    cy.intercept('PUT', '/api/admin/pedidos/*/status').as('confirmarRecebimento');
  });

  it('deve confirmar recebimento do produto devolvido via interface admin', () => {
    cy.visit(`${BASE}/admin-vendas.html`);
    cy.wait('@listarPedidos', { timeout: 10000 });

    cy.get('#vendaFiltroStatus').select('TROCA AUTORIZADA');
    cy.get('#tabelaVendasBody tr', { timeout: 8000 }).should('have.length.at.least', 1);

    cy.get('[data-acao="detalhe"]').first().click();
    cy.get('#modalPedido', { timeout: 8000 }).should('be.visible');
    cy.get('#recebimentoArea').should('be.visible');

    cy.get('#btnConfirmarRecebimento').click();

    // Pedido passa para TROCADO
    cy.get('#modalPedido').should('not.have.class', 'ativo');
  });
});
