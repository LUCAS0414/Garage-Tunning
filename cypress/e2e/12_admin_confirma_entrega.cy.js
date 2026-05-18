// ===================================================================
// CASO DE USO 12 — Administrador confirma que o produto foi ENTREGUE
//                  (status: EM TRANSPORTE → ENTREGUE)
// ===================================================================

const DELAY = 800;
for (const cmd of ['visit','click','type','clear','select','trigger']) {
  Cypress.Commands.overwrite(cmd, (fn, ...args) =>
    Cypress.Promise.delay(DELAY).then(() => fn(...args))
  );
}

const BASE        = 'http://localhost:3000';
const ADMIN_EMAIL = 'admin@garage.com';
const ADMIN_SENHA = 'admin123';

function loginAdmin() {
  cy.request('POST', `${BASE}/api/admin/login`, {
    email: ADMIN_EMAIL,
    senha: ADMIN_SENHA,
  }).then(resp => {
    expect(resp.status).to.eq(200);
    const admin = { ...resp.body, logado: true, isAdmin: true };
    cy.window().then(win => {
      win.localStorage.setItem('garage_user', JSON.stringify(admin));
    });
  });
}

describe('UC-12: Administrador confirma que o produto foi ENTREGUE', () => {

  beforeEach(() => {
    cy.visit(`${BASE}/admin-vendas.html`);
    loginAdmin();
    cy.reload();
    cy.intercept('GET', '/api/admin/pedidos*').as('listarPedidos');
    cy.intercept('PUT', '/api/admin/pedidos/*/status').as('atualizarStatus');
  });

  it('deve confirmar entrega de pedido EM TRANSPORTE via interface admin', () => {
    cy.visit(`${BASE}/admin-vendas.html`);
    cy.wait('@listarPedidos', { timeout: 10000 });

    cy.get('#vendaFiltroStatus').select('EM TRANSPORTE');
    cy.get('#tabelaVendasBody tr', { timeout: 8000 }).should('have.length.at.least', 1);

    cy.get('[data-acao="detalhe"]').first().click();
    cy.get('#modalPedido', { timeout: 8000 }).should('be.visible');

    cy.get('#acoesPedido [data-novo-status="ENTREGUE"]').should('be.visible').click();
    cy.wait('@atualizarStatus').its('response.statusCode').should('eq', 200);

    cy.get('#modalPedido .badge').should('contain.text', 'Entregue');
  });

  it('deve confirmar entrega via API direta e verificar status final', () => {
    cy.request('GET', `${BASE}/api/admin/pedidos?status=EM+TRANSPORTE&limite=1`).then(resp => {
      const pedidos = resp.body.pedidos || [];
      if (pedidos.length === 0) {
        cy.log('Nenhum pedido em transporte disponível');
        return;
      }
      const pedidoId = pedidos[0].id;

      cy.request({
        method: 'PUT',
        url: `${BASE}/api/admin/pedidos/${pedidoId}/status`,
        body: { status: 'ENTREGUE' },
      }).then(r => {
        expect(r.status).to.eq(200);
      });

      cy.request('GET', `${BASE}/api/admin/pedidos/${pedidoId}`).then(r2 => {
        expect(r2.body.status).to.eq('ENTREGUE');
      });
    });
  });
});
