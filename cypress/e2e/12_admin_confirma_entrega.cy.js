const DELAY = 800;
for (const cmd of ['visit', 'click', 'type', 'clear', 'select', 'trigger']) {
  Cypress.Commands.overwrite(cmd, (fn, ...args) =>
    Cypress.Promise.delay(DELAY).then(() => fn(...args))
  );
}

const BASE        = 'http://localhost:3000';
const ADMIN_EMAIL = 'admin@garage.com';
const ADMIN_SENHA = 'admin123';

describe('UC-12: Administrador confirma que o produto foi ENTREGUE', () => {

  beforeEach(() => {
    // Login via interface
    cy.visit(`${BASE}/login.html`);
    cy.get('#loginEmail').type(ADMIN_EMAIL);
    cy.get('#loginSenha').type(ADMIN_SENHA);
    cy.get('#btnLogin').click();
    cy.url().should('not.include', 'login.html');
  });

  it('deve confirmar entrega de pedido EM TRANSPORTE via interface admin', () => {
    cy.visit(`${BASE}/admin-vendas.html`);

    cy.get('#tabelaVendasBody', { timeout: 10000 }).should('be.visible');

    cy.get('#vendaFiltroStatus').select('EM TRANSPORTE');
    cy.get('#tabelaVendasBody tr', { timeout: 8000 }).should('have.length.at.least', 1);

    cy.get('[data-acao="detalhe"]').first().click();
    cy.get('#modalPedido', { timeout: 8000 }).should('be.visible');

    cy.get('#acoesPedido [data-novo-status="ENTREGUE"]').should('be.visible').click();

    cy.get('#modalPedido .badge', { timeout: 10000 }).should('contain.text', 'Entregue');
  });
});
