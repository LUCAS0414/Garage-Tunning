// CASO DE USO 1 — Cliente realiza compra com cartão

const DELAY = 800;
for (const cmd of ['visit','click','type','clear','select','trigger']) {
  Cypress.Commands.overwrite(cmd, (fn, ...args) =>
    Cypress.Promise.delay(DELAY).then(() => fn(...args))
  );
}

const BASE = 'http://localhost:3000';
const EMAIL = 'abner@gmail.com';
const SENHA = 'Joj0Joj0*';

describe('UC-01: Cliente realiza compra com cartão de crédito', () => {

  beforeEach(() => {
    // Login
    cy.visit(`${BASE}/login.html`);
    cy.get('#loginEmail').type(EMAIL);
    cy.get('#loginSenha').type(SENHA);
    cy.get('#btnLogin').click();
    cy.url().should('not.include', 'login.html');

    // Adicionar produto 1 ao carrinho
    cy.visit(`${BASE}/index.html`);
    cy.get('.produto-card__acoes a', { timeout: 10000 }).should('have.length.at.least', 1);
    cy.get('.produto-card__acoes a').first().click();
    cy.get('#btnAddCarrinho', { timeout: 8000 }).should('be.visible').click();

    cy.intercept('GET', '/api/clientes/*').as('dadosCliente');
    cy.intercept('POST', '/api/pedidos').as('criarPedido');
  });

  it('deve finalizar pedido com cartão de crédito já cadastrado', () => {
    cy.visit(`${BASE}/checkout.html`);
    cy.wait('@dadosCliente');

    cy.get('#checkoutItens', { timeout: 8000 }).should('not.be.empty');
    cy.get('.checkout-item-linha').should('have.length.at.least', 1);

    cy.get('input[name="endereco"]').first().check({ force: true });
    cy.get('input[name="cartao"]').first().check({ force: true });

    cy.get('#checkoutCalc').should('contain.text', 'Total');

    cy.get('#btnConfirmarPedido').should('be.visible').and('not.be.disabled').click();
    cy.wait('@criarPedido').its('response.statusCode').should('eq', 201);

    cy.get('#modalConfirmacao', { timeout: 8000 }).should('have.class', 'ativo');
    cy.contains('Pedido Confirmado!').should('be.visible');

    cy.get('#numPedidoGerado')
      .invoke('text')
      .should('match', /^#GT-\d{4}-\d{4}$/);

    cy.window().then(win => {
      const carrinho = JSON.parse(win.localStorage.getItem('garage_carrinho') || '[]');
      expect(carrinho).to.have.length(0);
    });
  });
});
