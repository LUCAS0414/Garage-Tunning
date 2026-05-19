// CASO DE USO 2 — Cliente realiza compra via PIX

const DELAY = 800;
for (const cmd of ['visit','click','type','clear','select','trigger']) {
  Cypress.Commands.overwrite(cmd, (fn, ...args) =>
    Cypress.Promise.delay(DELAY).then(() => fn(...args))
  );
}

const BASE = 'http://localhost:3000';
const EMAIL = 'abner@gmail.com';
const SENHA = 'Joj0Joj0*';

describe('UC-02: Cliente realiza compra com PIX', () => {

  beforeEach(() => {
    cy.visit(`${BASE}/login.html`);
    cy.get('#loginEmail').type(EMAIL);
    cy.get('#loginSenha').type(SENHA);
    cy.get('#btnLogin').click();
    cy.url().should('not.include', 'login.html');

    cy.visit(`${BASE}/index.html`);
    cy.get('.produto-card__acoes a', { timeout: 10000 }).should('have.length.at.least', 1);
    cy.get('.produto-card__acoes a').first().click();
    cy.get('#btnAddCarrinho', { timeout: 8000 }).should('be.visible').click();

    cy.intercept('GET', '/api/clientes/*').as('dadosCliente');
    cy.intercept('POST', '/api/pedidos').as('criarPedido');
  });

  it('deve finalizar pedido selecionando PIX como método de pagamento', () => {
    cy.visit(`${BASE}/checkout.html`);
    cy.wait('@dadosCliente');

    cy.get('#checkoutItens', { timeout: 8000 }).should('not.be.empty');

    cy.get('input[name="endereco"]').first().check({ force: true });

    // Seleciona aba PIX
    cy.get('.metodo-tab[data-metodo="pix"]').click();
    cy.get('#metodoPix').should('be.visible');

    cy.get('#btnConfirmarPedido').click();
    cy.wait('@criarPedido').its('response.statusCode').should('eq', 201);

    cy.get('#modalConfirmacao', { timeout: 8000 }).should('have.class', 'ativo');
    cy.get('#numPedidoGerado')
      .invoke('text')
      .should('match', /^#GT-\d{4}-\d{4}$/);
  });
});
