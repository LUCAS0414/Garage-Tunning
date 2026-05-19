// CASO DE USO 6 — Administrador confirma o pagamento
//                 (status: EM PROCESSAMENTO → APROVADO)

const DELAY = 800;
for (const cmd of ['visit','click','type','clear','select','trigger']) {
  Cypress.Commands.overwrite(cmd, (fn, ...args) =>
    Cypress.Promise.delay(DELAY).then(() => fn(...args))
  );
}

const BASE        = 'http://localhost:3000';
const ADMIN_EMAIL = 'admin@garage.com';
const ADMIN_SENHA = 'admin123';

describe('UC-06: Administrador confirma o pagamento', () => {

  beforeEach(() => {
    // Login
    cy.visit(`${BASE}/login.html`);
    cy.get('#loginEmail').type(ADMIN_EMAIL);
    cy.get('#loginSenha').type(ADMIN_SENHA);
    cy.get('#btnLogin').click();
    cy.url().should('not.include', 'login.html');

    cy.visit(`${BASE}/admin-vendas.html`);
    cy.intercept('GET', '/api/admin/pedidos*').as('listarPedidos');
    cy.intercept('PUT', '/api/admin/pedidos/*/status').as('atualizarStatus');
  });

  it('deve aprovar pagamento de pedido EM PROCESSAMENTO via interface admin', () => {
    cy.visit(`${BASE}/admin-vendas.html`);
    cy.wait('@listarPedidos', { timeout: 10000 });

    // Filtra pedidos em processamento
    cy.get('#vendaFiltroStatus').select('EM PROCESSAMENTO');
    cy.get('#tabelaVendasBody tr', { timeout: 8000 }).should('have.length.at.least', 1);

    // Abre detalhe do primeiro
    cy.get('[data-acao="detalhe"]').first().click();
    cy.get('#modalPedido', { timeout: 8000 }).should('be.visible');

    // Clica no botão "→ Aprovado"
    cy.get('#acoesPedido [data-novo-status="APROVADO"]').should('be.visible').click();
    cy.wait('@atualizarStatus').its('response.statusCode').should('eq', 200);

    // Verifica que o badge de status mudou
    cy.get('#modalPedido .badge').should('contain.text', 'Aprovado');
  });

});
