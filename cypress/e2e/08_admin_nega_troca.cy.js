const DELAY = 800;
for (const cmd of ['visit', 'click', 'type', 'clear', 'select', 'trigger']) {
  Cypress.Commands.overwrite(cmd, (fn, ...args) =>
    Cypress.Promise.delay(DELAY).then(() => fn(...args))
  );
}

const BASE        = 'http://localhost:3000';
const ADMIN_EMAIL = 'admin@garage.com';
const ADMIN_SENHA = 'admin123';

describe('UC-08: Administrador nega troca/devolução', () => {

  beforeEach(() => {
    cy.visit(`${BASE}/login.html`);
    cy.get('#loginEmail').type(ADMIN_EMAIL);
    cy.get('#loginSenha').type(ADMIN_SENHA);
    cy.get('#btnLogin').click();
    cy.url().should('not.include', 'login.html');
  });

  it('deve negar troca de pedido EM TROCA via interface admin', () => {
    cy.visit(`${BASE}/admin-vendas.html`);

    cy.get('#tabelaVendasBody', { timeout: 10000 }).should('be.visible');

    cy.get('#vendaFiltroStatus').select('EM TROCA');
    cy.get('#tabelaVendasBody tr', { timeout: 8000 }).should('have.length.at.least', 1);

    cy.get('[data-acao="detalhe"]').first().click();
    cy.get('#modalPedido', { timeout: 8000 }).should('be.visible');
    cy.get('#trocaArea').should('be.visible');

    cy.get('#btnNegarTroca').click();

    // Após negar, o modal fecha
    cy.get('#modalPedido', { timeout: 10000 }).should('not.have.class', 'ativo');

    // Filtra por ENTREGUE para confirmar que o pedido voltou ao status
    cy.get('#vendaFiltroStatus').select('ENTREGUE');
    cy.get('#tabelaVendasBody tr').first().find('.badge').should('contain.text', 'Entregue');
  });
});
