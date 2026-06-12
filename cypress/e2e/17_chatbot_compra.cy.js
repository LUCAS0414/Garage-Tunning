const DELAY = 800;
for (const cmd of ['visit', 'click', 'type', 'clear', 'select', 'trigger']) {
  Cypress.Commands.overwrite(cmd, (fn, ...args) =>
    Cypress.Promise.delay(DELAY).then(() => fn(...args))
  );
}

const BASE  = 'http://localhost:3000';
const EMAIL = 'abner@gmail.com';
const SENHA = 'Joj0Joj0*';

describe('UC-17: Usuário busca produto via chatbot e finaliza a compra', () => {

  beforeEach(() => {
    // Login
    cy.visit(`${BASE}/login.html`);
    cy.get('#loginEmail').type(EMAIL);
    cy.get('#loginSenha').type(SENHA);
    cy.get('#btnLogin').click();
    cy.url().should('not.include', 'login.html');
  });

  it('deve enviar mensagem no chat, clicar no produto sugerido e comprá-lo', () => {
    // Acessa a página inicial onde o chat está disponível
    cy.visit(`${BASE}/index.html`);

    // Aguarda o widget do chat aparecer na tela
    cy.get('#gt-chat-widget', { timeout: 10000 }).should('be.visible');

    // Fecha a notificação automática se aparecer
    cy.get('body').then($body => {
      if ($body.find('#gtChatNotif__close').length && $body.find('#gtChatNotif').css('display') !== 'none') {
        cy.get('#gtChatNotif__close').click();
      }
    });

    // Abre o chat clicando no botão flutuante
    cy.get('#gtChatToggle').click();
    cy.get('#gtChatBox', { timeout: 6000 }).should('be.visible');

    // Aguarda a mensagem de boas-vindas aparecer
    cy.get('#gtChatMsgs .gt-msg.bot', { timeout: 8000 }).should('have.length.at.least', 1);

    // Digita a mensagem de busca
    cy.get('#gtChatField').type('Quero comprar um carro JDM potente');
    cy.get('#gtChatSend').click();

    // Aguarda a resposta do chatbot (mensagem de loading some e nova mensagem aparece)
    cy.get('#gtChatMsgs .gt-msg.bot:not(.loading)', { timeout: 400000 })
      .should('have.length.at.least', 2);

    // Verifica que o chat retornou alguma resposta com link de produto
    cy.get('#gtChatMsgs .gt-msg.bot').last().then($msg => {
      const texto = $msg.text();
      cy.log('Resposta do chat: ' + texto);
      // O chat deve ter respondido com algum conteúdo
      expect(texto.length).to.be.greaterThan(10);
    });

    // Tenta clicar no primeiro link de produto que o chat sugeriu
    cy.get('#gtChatMsgs .gt-chat-link').first().then($link => {
      const href = $link.attr('href');
      cy.log('Link do produto sugerido: ' + href);

      // Navega para o produto sugerido
      cy.visit(`${BASE}${href.startsWith('/') ? href : '/' + href}`);
    });

    // Verifica que está na página do produto
    cy.get('#btnAddCarrinho', { timeout: 10000 }).should('be.visible');

    // Adiciona ao carrinho
    cy.get('#btnAddCarrinho').click();

    // Vai para o checkout
    cy.visit(`${BASE}/checkout.html`);

    // Aguarda o carregamento do checkout
    cy.get('#checkoutItens', { timeout: 10000 }).should('not.be.empty');
    cy.get('.checkout-item-linha').should('have.length.at.least', 1);

    // Seleciona o primeiro endereço disponível
    cy.get('input[name="endereco"]', { timeout: 8000 }).first().check({ force: true });

    // Seleciona o primeiro cartão disponível
    cy.get('input[name="cartao"]').first().check({ force: true });

    // Verifica o resumo
    cy.get('#checkoutCalc').should('contain.text', 'Total');

    // Confirma o pedido
    cy.get('#btnConfirmarPedido').should('be.visible').and('not.be.disabled').click();

    // Aguarda o modal de confirmação
    cy.get('#modalConfirmacao', { timeout: 15000 }).should('have.class', 'ativo');
    cy.contains('Pedido Confirmado!').should('be.visible');

    // Verifica o número do pedido
    cy.get('#numPedidoGerado')
      .invoke('text')
      .should('match', /^#GT-\d{4}-\d{4}$/);

    // Verifica que o carrinho foi limpo
    cy.window().then(win => {
      const carrinho = JSON.parse(win.localStorage.getItem('garage_carrinho') || '[]');
      expect(carrinho).to.have.length(0);
    });
  });
});
