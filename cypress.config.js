const { defineConfig } = require("cypress");
require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // Configuração da Task para falar com o Gemini
      on('task', {
        async perguntarIA(prompt) {
          try {
            const genAI = new GoogleGenerativeAI(process.env.CYPRESS_AI_API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const result = await model.generateContent(prompt);
            return result.response.text();
          } catch (error) {
            console.error("Erro na IA:", error);
            return "Erro ao processar prompt";
          }
        },
      });
      return config;
    },
    baseUrl: 'http://localhost:3000', 
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}'
  },
});