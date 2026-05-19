// CASO DE USO 5 — Cliente solicita troca/devolução de um item
//                 ou do pedido completo

const DELAY = 800;
for (const cmd of ['visit','click','type','clear','select','trigger']) {
  Cypress.Commands.overwrite(cmd, (fn, ...args) =>
    Cypress.Promise.delay(DELAY).then(() => fn(...args))
  );
}

const BASE  = 'http://localhost:3000';
const EMAIL = 'abner@gmail.com';
const SENHA = 'Joj0Joj0*';

describe('UC-05: Cliente solicita troca ou devolução', () => {

  beforeEach(() => {
    cy.visit(`${BASE}/login.html`);
    cy.get('#loginEmail').type(EMAIL);
    cy.get('#loginSenha').type(SENHA);
    cy.get('#btnLogin').click();
    cy.url().should('not.include', 'login.html');
  });

  it('deve solicitar troca de um item de um pedido ENTREGUE', () => {
    cy.visit(`${BASE}/perfil.html`);
    cy.get('[data-tab="pedidos"]').click();
    cy.get('#pedidosList', { timeout: 10000 }).should('be.visible');

    // Clica em "Solicitar Troca" no primeiro pedido entregue disponível
    cy.get('#btn-solicitar-troca', { timeout: 8000 }).first().click();

    cy.get('#modalSolicitarTroca', { timeout: 8000 }).should('be.visible');
    cy.get('#trocaProdutoSelect').should('exist');

    cy.get('#trocaMotivo').type('Produto chegou com defeito de fabricação.');
    cy.get('#trocaQuantidade').clear().type('1');

    cy.intercept('POST', '/api/trocas').as('solicitarTroca');
    cy.get('#btnEnviarTroca').click();
    cy.wait('@solicitarTroca').its('response.statusCode').should('eq', 201);

    cy.get('#modalSolicitarTroca', { timeout: 5000 }).should('not.have.class', 'ativo');

    // Recarrega e verifica se o pedido agora está em troca
    cy.reload();
    cy.get('[data-tab="pedidos"]').click();
    cy.get('#pedidosList', { timeout: 10000 }).should('contain.text', 'Em Troca');
  });
});
