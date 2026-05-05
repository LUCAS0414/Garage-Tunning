Cypress.Commands.add('ai', (instrucao) => {
  cy.log(`IA pensando sobre: ${instrucao}`);
  
  // Captura o texto da página para dar contexto ao Gemini
  cy.get('body').then(($body) => {
    const textoPagina = $body.text().substring(0, 1000); // Limita o texto para não estourar a API
    const prompt = `Contexto da página: ${textoPagina}. Instrução: ${instrucao}. Responda de forma curta o que deve ser feito.`;

    cy.task('perguntarIA', prompt).then((resposta) => {
      cy.log(`Sugestão da IA: ${resposta}`);
    });
  });
});