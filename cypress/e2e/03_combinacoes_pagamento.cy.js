const DELAY = 800;
for (const cmd of ['visit', 'click', 'type', 'clear', 'select', 'trigger']) {
  Cypress.Commands.overwrite(cmd, (fn, ...args) =>
    Cypress.Promise.delay(DELAY).then(() => fn(...args))
  );
}

const BASE  = 'http://localhost:3000';
const EMAIL = 'abner@gmail.com';
const SENHA = 'Joj0Joj0*';

function adicionarProdutoAoCarrinho() {
  cy.visit(`${BASE}/index.html`);
  cy.get('.produto-card__acoes a', { timeout: 10000 }).should('have.length.at.least', 1);
  cy.get('.produto-card__acoes a').first().click();
  cy.get('#btnAddCarrinho', { timeout: 8000 }).should('be.visible').click();
}

function login() {
  cy.visit(`${BASE}/login.html`);
  cy.get('#loginEmail').type(EMAIL);
  cy.get('#loginSenha').type(SENHA);
  cy.get('#btnLogin').click();
  cy.url().should('not.include', 'login.html');
}

describe('UC-03: Combinações de meios de pagamento', () => {

  beforeEach(() => {
    login();
    adicionarProdutoAoCarrinho();
  });

  it('cartão de crédito + cupom de desconto percentual (GARAGEM15)', () => {
    cy.visit(`${BASE}/checkout.html`);

    cy.get('#checkoutItens', { timeout: 10000 }).should('not.be.empty');
    cy.get('input[name="endereco"]').first().check({ force: true });
    cy.get('input[name="cartao"]').first().check({ force: true });

    cy.get('#checkoutCupom').type('GARAGEM15');
    cy.get('#btnAplicarCupomCheckout').click();

    // Aguarda o feedback do cupom aparecer na tela
    cy.get('#checkoutCupomFeedback', { timeout: 10000 })
      .should('be.visible')
      .and('contain.text', '%');

    cy.get('#btnConfirmarPedido').click();

    cy.get('#modalConfirmacao', { timeout: 15000 }).should('have.class', 'ativo');
    cy.get('#numPedidoGerado').invoke('text').should('match', /^#GT-\d{4}-\d{4}$/);
  });

  it('segundo cartão cadastrado (sem cupom)', () => {
    cy.visit(`${BASE}/checkout.html`);

    cy.get('#checkoutItens', { timeout: 10000 }).should('not.be.empty');
    cy.get('input[name="endereco"]').first().check({ force: true });

    // Seleciona o segundo cartão (se existir), senão usa o primeiro
    cy.get('input[name="cartao"]').then($radios => {
      if ($radios.length >= 2) {
        cy.wrap($radios).eq(1).check({ force: true });
      } else {
        cy.wrap($radios).first().check({ force: true });
      }
    });

    cy.get('#btnConfirmarPedido').click();

    cy.get('#modalConfirmacao', { timeout: 15000 }).should('have.class', 'ativo');
  });
});
