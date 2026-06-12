const DELAY = 800;
for (const cmd of ['visit', 'click', 'type', 'clear', 'select', 'trigger']) {
  Cypress.Commands.overwrite(cmd, (fn, ...args) =>
    Cypress.Promise.delay(DELAY).then(() => fn(...args))
  );
}

const BASE  = 'http://localhost:3000';
const EMAIL = 'abner@gmail.com';
const SENHA = 'Joj0Joj0*';

describe('UC-04: Cliente registra novo cartão e novo endereço no ato da compra', () => {

  beforeEach(() => {
    cy.visit(`${BASE}/login.html`);
    cy.get('#loginEmail').type(EMAIL);
    cy.get('#loginSenha').type(SENHA);
    cy.get('#btnLogin').click();
    cy.url().should('not.include', 'login.html');

    cy.visit(`${BASE}/index.html`);
    cy.get('.produto-card__acoes a', { timeout: 10000 }).first().click();
    cy.get('#btnAddCarrinho', { timeout: 8000 }).should('be.visible').click();
  });

  it('deve adicionar novo endereço de entrega antes de finalizar o pedido', () => {
    // Cadastra endereço pelo perfil antes do checkout
    cy.visit(`${BASE}/perfil.html`);
    cy.get('[data-tab="enderecos"]').click();
    cy.get('#tab-enderecos', { timeout: 8000 }).should('have.class', 'ativo');

    cy.get('#btnNovoEndereco').click();
    cy.get('#enderecoForm').should('be.visible');

    cy.get('#endIdentificacao').type('Endereço Teste Cypress');
    cy.get('#endCep').type('01310100');
    cy.get('#endLogradouro').type('Avenida Paulista');
    cy.get('#endNumero').type('1578');
    cy.get('#endBairro').type('Bela Vista');
    cy.get('#endCidade').type('São Paulo');
    cy.get('#endEstado').type('SP');
    cy.get('#btnSalvarEndereco').click();

    // Verifica que o endereço apareceu na lista
    cy.get('#enderecosList', { timeout: 10000 })
      .should('contain.text', 'Endereço Teste Cypress');

    // Vai para o checkout e verifica que o novo endereço aparece
    cy.visit(`${BASE}/checkout.html`);
    cy.get('input[name="endereco"]', { timeout: 10000 }).should('have.length.at.least', 1);
    cy.get('#enderecoOpcoes').should('contain.text', 'Endereço Teste Cypress');
  });

  it('deve adicionar novo cartão via opção "+ Novo cartão" no checkout', () => {
    cy.visit(`${BASE}/checkout.html`);

    cy.get('#checkoutItens', { timeout: 10000 }).should('not.be.empty');
    cy.get('input[name="endereco"]').first().check({ force: true });

    // Seleciona opção "Novo cartão"
    cy.get('input[name="cartao"][value="novo"]').check({ force: true });
    cy.get('#novoCartaoForm').should('be.visible');

    // Preenche dados do novo cartão
    cy.get('#checkoutCartaoNum').type('4111 1111 1111 1111');
    cy.get('#checkoutCartaoNome').type('ABNER TESTE');
    cy.get('#checkoutCartaoBandeira').select('VISA');
    cy.get('#checkoutCartaoCVV').type('123');

    cy.get('#btnConfirmarPedido').click();

    cy.get('#modalConfirmacao', { timeout: 15000 }).should('have.class', 'ativo');
    cy.get('#numPedidoGerado').invoke('text').should('match', /^#GT-\d{4}-\d{4}$/);
  });
});
