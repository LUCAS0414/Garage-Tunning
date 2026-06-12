const DELAY = 800;
for (const cmd of ['visit', 'click', 'type', 'clear', 'select', 'trigger']) {
  Cypress.Commands.overwrite(cmd, (fn, ...args) =>
    Cypress.Promise.delay(DELAY).then(() => fn(...args))
  );
}

const BASE = 'http://localhost:3000';

describe('UC-13: Cadastro de novo usuário', () => {
  let dados;
  let cpfGerado;

  before(() => {
    // Pega o CPF de um site gerador de CPFs
    cy.request({
      method: 'POST',
      url: 'https://www.4devs.com.br/ferramentas_online.php',
      form: true,
      body: {
        acao: 'gerar_cpf',
        pontuacao: 'S',
        cpf_estado: ''
      }
    }).then((resp) => {
      cpfGerado = resp.body;
    });
  });

  beforeEach(() => {
    const ts = Date.now();
    dados = {
      nome:   `Cypress Teste ${ts}`,
      email:  `cypress.${ts}@teste.com`,
      senha:  'Cypress@123',
      tel:    '11999998888', // 11 números
    };
  });

  it('deve criar uma nova conta em 3 passos e ser redirecionado', () => {
    cy.visit(`${BASE}/cadastro.html`);
    cy.title().should('include', 'Criar Conta');

    // ── PASSO 1: Dados Pessoais ──
    cy.get('#step1').should('be.visible');

    cy.get('#genero').select('M');
    cy.get('#nomeCompleto').type(dados.nome);
    cy.get('#dataNasc').type('1995-06-15');
    cy.get('#cpf').type(cpfGerado);
    cy.get('#numTel').type(dados.tel);

    cy.get('#btnProximo1').click();

    // ── PASSO 2: Endereço ──
    cy.get('#step2', { timeout: 6000 }).should('be.visible');

    cy.get('#cep').type('01310100');
    cy.get('#logradouro').type('Avenida Paulista');
    cy.get('#numEndereco').type('1000');
    cy.get('#bairro').type('Bela Vista');
    cy.get('#cidade').type('São Paulo');
    cy.get('#estado').select('SP');

    cy.get('#btnProximo2').click();

    // ── PASSO 3: Acesso ──
    cy.get('#step3', { timeout: 6000 }).should('be.visible');

    cy.get('#cadastroEmail').type(dados.email);
    cy.get('#cadastroSenha').type(dados.senha);
    cy.get('#confirmarSenha').type(dados.senha);
    cy.get('#aceitaTermos').check({ force: true });

    cy.get('#btnCadastrar').click();
    cy.url({ timeout: 15000 }).should('include', 'perfil');
  });
});
