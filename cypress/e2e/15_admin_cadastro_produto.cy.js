const DELAY = 800;
for (const cmd of ['visit', 'click', 'type', 'clear', 'select', 'trigger']) {
  Cypress.Commands.overwrite(cmd, (fn, ...args) =>
    Cypress.Promise.delay(DELAY).then(() => fn(...args))
  );
}

const BASE        = 'http://localhost:3000';
const ADMIN_EMAIL = 'admin@garage.com';
const ADMIN_SENHA = 'admin123';

describe('UC-15: Administrador cadastra novo produto no catálogo', () => {

  beforeEach(() => {
    // Login como administrador
    cy.visit(`${BASE}/login.html`);
    cy.get('#loginEmail').type(ADMIN_EMAIL);
    cy.get('#loginSenha').type(ADMIN_SENHA);
    cy.get('#btnLogin').click();
    cy.url().should('not.include', 'login.html');

    // Acessa a gestão de produtos
    cy.visit(`${BASE}/admin-produtos.html`);
    cy.get('#tabelaProdutos', { timeout: 10000 }).should('be.visible');
  });

  it('deve cadastrar um novo produto com todos os campos obrigatórios', () => {
    const nomeProduto = `Rodas Forjadas Cypress ${Date.now()}`;

    // Abre o modal de novo produto
    cy.get('#btnNovoProduto').click();
    cy.get('#modalProduto', { timeout: 6000 }).should('be.visible');
    cy.get('#modalProdTitulo').should('contain.text', 'Novo Produto');

    // Informações básicas
    cy.get('#prodNome').type(nomeProduto);
    cy.get('#prodCodigo').type(`PEC-${String(Date.now()).slice(-3)}`);
    cy.get('#prodCategoria').select('Peças');
    cy.get('#prodDescricao').type('Rodas forjadas de alta performance para veículos JDM. Peso reduzido e máxima resistência.');

    // Precificação
    cy.get('#prodGrupoPrecificacao').select('premium');
    cy.get('#prodCusto').clear().type('5000.00');
    cy.get('#prodVenda').clear().type('8000.00');

    // Estoque
    cy.get('#prodEstoque').type('10');
    cy.get('#prodEstoqueMin').type('2');

    // Peso
    cy.get('#prodPesoKg').type('15');

    // Imagem (URL fictícia válida)
    cy.get('#prodImagemUrl').type('https://example.com/rodas-jdm.jpg');

    // Marca como novidade
    cy.get('#prodIsNovo').check({ force: true });

    // Status ativo (já vem selecionado)
    cy.get('#prodStatus').select('ativo');

    // Salva o produto
    cy.get('#formProduto').within(() => {
      cy.get('[type="submit"]').click();
    });

    // O modal fecha e o produto aparece na tabela
    cy.get('#modalProduto', { timeout: 8000 }).should('not.have.class', 'ativo');
    cy.get('#tabelaProdutosBody', { timeout: 10000 })
      .should('contain.text', nomeProduto);
  });

  it('deve recusar o cadastro sem nome e categoria (campos obrigatórios)', () => {
    cy.get('#btnNovoProduto').click();
    cy.get('#modalProduto', { timeout: 6000 }).should('be.visible');

    // Tenta salvar sem preencher nenhum campo
    cy.get('#formProduto').within(() => {
      cy.get('[type="submit"]').click();
    });

    // O formulário HTML5 deve bloquear o envio — modal continua visível
    cy.get('#modalProduto').should('be.visible');
    cy.get('#prodNome:invalid').should('exist');
  });
});
