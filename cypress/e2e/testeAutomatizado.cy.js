const COMMAND_DELAY = 1000;

for (const command of ['visit', 'click', 'trigger', 'type', 'clear', 'reload', 'select']) {
  Cypress.Commands.overwrite(command, (originalFn, ...args) => {
    const result = originalFn(...args);
    return Cypress.Promise.delay(COMMAND_DELAY).then(() => result);
  });
}

describe('Registro de Pedido de Venda com Sucesso', () => {

  const USUARIO_EMAIL = 'abner@gmail.com';
  const USUARIO_SENHA = 'Joj0Joj0*';

  const BASE_URL = 'http://localhost:3000';

  beforeEach(() => {
    // login
    cy.visit(`${BASE_URL}/login.html`);
    cy.get('#loginEmail').type(USUARIO_EMAIL);
    cy.get('#loginSenha').type(USUARIO_SENHA);
    cy.get('#btnLogin').click();
    cy.url().should('not.include', 'login.html');

    // página principal - produto 1
    cy.visit(`${BASE_URL}/index.html`);
    cy.get('.produto-card__acoes a', { timeout: 10000 }).should('have.length.at.least', 2);
    //checkout
    cy.get('.produto-card__acoes a').first().click();
    cy.get('#btnAddCarrinho', { timeout: 10000 }).should('be.visible').click();

    //produto 2
    cy.visit(`${BASE_URL}/index.html`);
    cy.get('.produto-card__acoes a', { timeout: 10000 }).should('have.length.at.least', 2);
    cy.get('.produto-card__acoes a').eq(1).click();
    cy.get('#btnAddCarrinho', { timeout: 10000 }).should('be.visible').click();

    //spy
    cy.intercept('GET', `/api/clientes/*`).as('clienteDados');
    cy.intercept('POST', '/api/pedidos').as('criarPedido');
  });

  // Cartão de crédito
  it('deve registrar um pedido de venda com sucesso', () => {
    cy.visit(`${BASE_URL}/checkout.html`);

    cy.title().should('include', 'Checkout');
    cy.wait('@clienteDados');

    //Verificação de itend
    cy.get('#checkoutItens', { timeout: 8000 })
      .should('be.visible')
      .and('not.be.empty');

    cy.get('.checkout-item-linha').should('have.length.at.least', 1);

    //seleção de endereço e cartão
    cy.get('input[name="endereco"]').first().check({ force: true });
    cy.get('input[name="endereco"]:checked').should('exist');
    cy.get('input[name="cartao"]').first().check({ force: true });
    cy.get('input[name="cartao"]:checked').should('exist');

    // Verificação do valor
    cy.get('#checkoutCalc')
      .should('be.visible')
      .and('contain.text', 'Total');

      cy.get('#btnConfirmarPedido')
      .should('be.visible')
      .and('not.be.disabled')
      .click();

      cy.wait('@criarPedido').its('response.statusCode').should('eq', 201);

    cy.get('#modalConfirmacao', { timeout: 8000 })
      .should('have.class', 'ativo');

    cy.get('#modalConfirmacao').within(() => {
      cy.contains('Pedido Confirmado!').should('be.visible');
      cy.contains('Seu pedido foi recebido').should('be.visible');
    });

    //verifica o número do pedido
    cy.get('#numPedidoGerado')
      .should('be.visible')
      .invoke('text')
      .should('match', /^#GT-\d{4}-\d{4}$/);

    // Verifica que o carrinho foi limpo
    cy.window().then((win) => {
      const carrinho = JSON.parse(
        win.localStorage.getItem('garage_carrinho') || '[]'
      );
      expect(carrinho).to.have.length(0);
    });
  });

  // Pix
  it('deve registrar pedido com pagamento via PIX com sucesso', () => {
    cy.visit(`${BASE_URL}/checkout.html`);

    cy.wait('@clienteDados');

    cy.get('#checkoutItens', { timeout: 8000 }).should('not.be.empty');

    // Endereço e método
    cy.get('input[name="endereco"]').first().check({ force: true });
    cy.get('.metodo-tab[data-metodo="pix"]').click();
    cy.get('#metodoPix').should('be.visible');

    // Confirma pedido
    cy.get('#btnConfirmarPedido').click();

    cy.wait('@criarPedido').its('response.statusCode').should('eq', 201);

    cy.get('#modalConfirmacao', { timeout: 8000 }).should('have.class', 'ativo');
    cy.get('#numPedidoGerado')
      .invoke('text')
      .should('match', /^#GT-\d{4}-\d{4}$/);
  });

  //Cartão com cupom
  it('deve registrar pedido com cupom de desconto válido', () => {
    // Validação do cupom
    cy.intercept('POST', '/api/cupons/validar').as('validarCupom');

    cy.visit(`${BASE_URL}/checkout.html`);

    cy.wait('@clienteDados');

    cy.get('#checkoutItens', { timeout: 8000 }).should('not.be.empty');

    // Endereço e cartões
    cy.get('input[name="endereco"]').first().check({ force: true });
    cy.get('input[name="cartao"]').first().check({ force: true });

    // Aplicação do cupom
    cy.get('#checkoutCupom').type('GARAGEM15');
    cy.get('#btnAplicarCupomCheckout').click();

    cy.wait('@validarCupom').its('response.statusCode').should('eq', 200);

    cy.get('#checkoutCupomFeedback')
      .should('be.visible')
      .and('contain.text', '15% de desconto');

    // Confirma pedido
    cy.get('#btnConfirmarPedido').click();

    cy.wait('@criarPedido').its('response.statusCode').should('eq', 201);

    // Verifica confirmação
    cy.get('#modalConfirmacao', { timeout: 8000 }).should('have.class', 'ativo');
    cy.get('#numPedidoGerado')
      .invoke('text')
      .should('match', /^#GT-\d{4}-\d{4}$/);
  });

});