const DELAY = 800;
for (const cmd of ['visit', 'click', 'type', 'clear', 'select', 'trigger']) {
  Cypress.Commands.overwrite(cmd, (fn, ...args) =>
    Cypress.Promise.delay(DELAY).then(() => fn(...args))
  );
}

const BASE  = 'http://localhost:3000';
const EMAIL = 'abner@gmail.com';
const SENHA = 'Joj0Joj0*';

describe('UC-14: Usuário cadastra cartões e endereço no perfil', () => {

  beforeEach(() => {
    // Login
    cy.visit(`${BASE}/login.html`);
    cy.get('#loginEmail').type(EMAIL);
    cy.get('#loginSenha').type(SENHA);
    cy.get('#btnLogin').click();
    cy.url().should('not.include', 'login.html');

    // Navega para o perfil
    cy.visit(`${BASE}/perfil.html`);
  });

  it('deve cadastrar um novo endereço de entrega com sucesso', () => {
    // Clica na aba Endereços
    cy.get('[data-tab="enderecos"]').click();
    cy.get('#tab-enderecos', { timeout: 8000 }).should('have.class', 'ativo');

    const identificacao = `Endereço Secundário ${Date.now()}`;

    // Abre o formulário
    cy.get('#btnNovoEndereco').click();
    cy.get('#enderecoForm', { timeout: 6000 }).should('be.visible');

    // Preenche os dados
    cy.get('#endIdentificacao').type(identificacao);
    cy.get('#endTipoUso').select('ENTREGA');
    cy.get('#endCep').type('01310100');
    cy.get('#endLogradouro').type('Avenida Paulista');
    cy.get('#endNumero').type('1578');
    cy.get('#endBairro').type('Bela Vista');
    cy.get('#endCidade').type('São Paulo');
    cy.get('#endEstado').type('SP');

    // Salva
    cy.get('#btnSalvarEndereco').click();

    // Verifica que o endereço apareceu na lista
    cy.get('#enderecosList', { timeout: 10000 })
      .should('contain.text', identificacao);
  });

  it('deve cadastrar um cartão de crédito pelo perfil', () => {
    // Clica na aba Cartões
    cy.get('[data-tab="cartoes"]').click();
    cy.get('#tab-cartoes', { timeout: 8000 }).should('have.class', 'ativo');

    // Abre o formulário de novo cartão
    cy.get('#btnNovoCartao').click();
    cy.get('#cartaoForm', { timeout: 6000 }).should('be.visible');

    // Preenche os dados do cartão de crédito
    cy.get('#novoCartaoNum').type('4111 1111 1111 1111');
    cy.get('#novoCartaoBandeira').select('VISA');
    cy.get('#novoCartaoNome').type('ABNER SILVA');
    cy.get('#novoCartaoCVV').type('321');

    // Salva
    cy.get('#btnSalvarCartao').click();

    // Verifica que o cartão apareceu na lista
    cy.get('#cartoesList', { timeout: 8000 })
      .should('not.contain.text', 'Nenhum cartão cadastrado.')
      .and('contain.text', '1111');
  });

  it('deve cadastrar um cartão de débito pelo perfil', () => {
    // Clica na aba Cartões
    cy.get('[data-tab="cartoes"]').click();
    cy.get('#tab-cartoes', { timeout: 8000 }).should('have.class', 'ativo');

    // Abre o formulário de novo cartão
    cy.get('#btnNovoCartao').click();
    cy.get('#cartaoForm', { timeout: 6000 }).should('be.visible');

    // Preenche os dados do cartão de débito (MASTERCARD)
    cy.get('#novoCartaoNum').type('5500 0000 0000 0004');
    cy.get('#novoCartaoBandeira').select('MASTERCARD');
    cy.get('#novoCartaoNome').type('ABNER SILVA DEBITO');
    cy.get('#novoCartaoCVV').type('456');

    // Define como cartão principal
    cy.get('#novoCartaoPref').check({ force: true });

    // Salva
    cy.get('#btnSalvarCartao').click();

    // Verifica que o cartão apareceu na lista
    cy.get('#cartoesList', { timeout: 8000 })
      .should('not.contain.text', 'Nenhum cartão cadastrado.')
      .and('contain.text', '0004');
  });
});
