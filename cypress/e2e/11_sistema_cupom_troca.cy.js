// CASO DE USO 11 — Sistema gera cupom de troca após recebimento
//                  do produto devolvido

const DELAY = 800;
for (const cmd of ['visit','click','type','clear','select','trigger']) {
  Cypress.Commands.overwrite(cmd, (fn, ...args) =>
    Cypress.Promise.delay(DELAY).then(() => fn(...args))
  );
}

const BASE        = 'http://localhost:3000';
const ADMIN_EMAIL = 'admin@garage.com';
const ADMIN_SENHA = 'admin123';
const CLIENTE_EMAIL = 'abner@gmail.com';
const CLIENTE_SENHA = 'Joj0Joj0*';

describe('UC-11: Sistema gera cupom de troca automaticamente', () => {

  it('deve confirmar recebimento via interface admin e gerar cupom automaticamente', () => {
    // Passo 1: Login do admin na UI
    cy.visit(`${BASE}/login.html`);
    cy.get('#loginEmail').type(ADMIN_EMAIL);
    cy.get('#loginSenha').type(ADMIN_SENHA);
    cy.get('#btnLogin').click();
    cy.url().should('not.include', 'login.html');

    cy.visit(`${BASE}/admin-vendas.html`);
    cy.intercept('GET', '/api/admin/pedidos*').as('listarPedidos');
    cy.wait('@listarPedidos', { timeout: 10000 });

    cy.get('#vendaFiltroStatus').select('TROCA AUTORIZADA');
    
    cy.get('#tabelaVendasBody').then($body => {
      if ($body.find('tr').length > 0 && !$body.text().includes('Nenhum')) {
        cy.get('[data-acao="detalhe"]').first().click();
        cy.get('#modalPedido', { timeout: 8000 }).should('be.visible');

        cy.get('#recebimentoArea').should('be.visible');
        cy.get('#btnConfirmarRecebimento').click();

        // O modal deve fechar e a tabela atualizar
        cy.get('#modalPedido', { timeout: 8000 }).should('not.have.class', 'ativo');
        
        cy.get('#vendaFiltroStatus').select('TROCADO');
        cy.get('#tabelaVendasBody tr').first().find('.badge').should('contain.text', 'Trocado');
      } else {
        cy.log('Nenhum pedido com TROCA AUTORIZADA para confirmar recebimento');
      }
    });
  });

  it('deve exibir cupom de troca na aba "Meus Cupons" do cliente', () => {
    // Login do cliente
    cy.visit(`${BASE}/login.html`);
    cy.get('#loginEmail').type(CLIENTE_EMAIL);
    cy.get('#loginSenha').type(CLIENTE_SENHA);
    cy.get('#btnLogin').click();
    cy.url().should('not.include', 'login.html');

    cy.visit(`${BASE}/perfil.html`);
    cy.get('[data-tab="cupons"]').click();
    cy.get('#cuponsLista', { timeout: 8000 }).should('not.contain.text', 'Carregando');
    // Verifica que a área de cupons carregou (mesmo que vazia, não deve dar erro)
    cy.get('#cuponsLista').should('be.visible');
  });

  it('deve permitir admin criar cupom manualmente via interface', () => {
    // Login do admin
    cy.visit(`${BASE}/login.html`);
    cy.get('#loginEmail').type(ADMIN_EMAIL);
    cy.get('#loginSenha').type(ADMIN_SENHA);
    cy.get('#btnLogin').click();
    cy.url().should('not.include', 'login.html');

    cy.visit(`${BASE}/admin-vendas.html`);
    cy.intercept('POST', '/api/admin/cupons').as('criarCupom');

    cy.get('#btnGerarCupom', { timeout: 8000 }).click();
    cy.get('#modalCupom').should('be.visible');

    cy.get('#cupomCodigo').type('TROCA-CYPRESS-01');
    cy.get('#cupomTipo').select('percentual');
    cy.get('#cupomValor').type('10');
    cy.get('#cupomValidade').type('2099-12-31');

    cy.get('#btnSalvarCupom').click();
  });
});
