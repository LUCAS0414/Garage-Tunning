(function () {
  // ESTADO
  let historico = [];
  const user = JSON.parse(localStorage.getItem('garage_user') || '{}');

  // HTML
  const widget = document.createElement('div');
  widget.id = 'gt-chat-widget';
  widget.innerHTML = `
    <button id="gtChatToggle" aria-label="Abrir chat">
      <span id="gtChatIconOpen"><i class="fas fa-comments"></i></span>
      <span id="gtChatIconClose" style="display:none">✕</span>
      <span id="gtChatBadge">1</span>
    </button>
    <div id="gtChatNotif" style="display:none">
      <div id="gtChatNotif__avatar">
        <span><i class="fas fa-flag-checkered"></i></span>
        <strong>The Mecânico</strong>
      </div>
      <p id="gtChatNotif__msg">Se quiser facilitar sua busca ou precisar de ajuda com algo, só mandar no chat para o mecânico<i class="fas fa-screwdriver"></i></p>
      <button id="gtChatNotif__close" aria-label="Fechar notificação">✕</button>
    </div>
    <div id="gtChatBox" style="display:none">
      <div id="gtChatHeader">
        <span><i class="fas fa-flag-checkered"></i> The Mecânico</span>
      </div>
      <div id="gtChatMsgs"></div>
      <div id="gtChatInput">
        <input id="gtChatField" type="text" placeholder="Ex: Preciso de uma suspensão esportiva..." maxlength="300" />
        <button id="gtChatSend"><i class="fas fa-paper-plane"></i></button>
      </div>
    </div>
  `;
  document.body.appendChild(widget);

  // ESTILO
  const style = document.createElement('style');
  style.textContent = `
    @keyframes gt-float {
      0%   { transform: translateY(0px);   box-shadow: 0 4px 16px rgba(0,0,0,.4); }
      50%  { transform: translateY(-7px);  box-shadow: 0 10px 24px rgba(232,184,0,.35); }
      100% { transform: translateY(0px);   box-shadow: 0 4px 16px rgba(0,0,0,.4); }
    }
    @keyframes gt-notify-in {
      0%   { opacity:0; transform: translateX(20px) scale(.92); }
      100% { opacity:1; transform: translateX(0)    scale(1); }
    }
    @keyframes gt-notify-out {
      0%   { opacity:1; transform: translateX(0)    scale(1); }
      100% { opacity:0; transform: translateX(20px) scale(.92); }
    }
    #gt-chat-widget { position:fixed; bottom:24px; right:24px; z-index:9999; font-family:inherit; }
    #gtChatToggle {
      background:var(--cor-primaria, #e8b800);
      border:none; border-radius:50%; width:54px; height:54px;
      font-size:22px; cursor:pointer;
      box-shadow:0 4px 16px rgba(0,0,0,.4);
      display:flex; align-items:center; justify-content:center;
      animation: gt-float 2.8s ease-in-out infinite;
      transition: transform .15s;
    }
    #gtChatToggle:hover { animation-play-state: paused; transform: scale(1.1) translateY(-2px); }
    #gtChatBox { position:absolute; bottom:66px; right:0; width:340px; background:var(--cor-fundo-card, #1a1a1a); border:1px solid var(--cor-borda, #333); border-radius:12px; overflow:hidden; box-shadow:0 8px 32px rgba(0,0,0,.5); display:flex; flex-direction:column; }
    #gtChatHeader { background:var(--cor-primaria, #e8b800); color:#000; padding:12px 16px; font-weight:700; font-size:.9rem; }
    #gtChatMsgs { flex:1; max-height:320px; overflow-y:auto; padding:12px; display:flex; flex-direction:column; gap:8px; }
    .gt-msg { max-width:85%; padding:8px 12px; border-radius:10px; font-size:.85rem; line-height:1.4; white-space:pre-wrap; }
    .gt-msg.user { align-self:flex-end; background:var(--cor-primaria, #e8b800); color:#000; border-bottom-right-radius:2px; }
    .gt-msg.bot { align-self:flex-start; background:var(--cor-fundo-secundario, #2a2a2a); color:var(--cor-texto, #eee); border-bottom-left-radius:2px; }
    .gt-msg.loading { opacity:.6; }
    .gt-chat-link { color: var(--cor-primaria, #e8b800); text-decoration: underline; font-weight: bold; transition: opacity 0.2s; }
    .gt-chat-link:hover { opacity: 0.8; }
    #gtChatInput { display:flex; border-top:1px solid var(--cor-borda, #333); }
    #gtChatField { flex:1; background:transparent; border:none; padding:10px 12px; color:var(--cor-texto, #eee); font-size:.85rem; outline:none; }
    #gtChatSend { background:var(--cor-primaria, #e8b800); border:none; padding:0 16px; color:#000; font-size:16px; cursor:pointer; }
    #gtChatSend:disabled { opacity:.5; cursor:default; }

    #gtChatNotif {
      position: absolute;
      bottom: 66px;
      right: 0;
      width: 260px;
      background: #1e1e1e;
      border: 1px solid var(--cor-primaria, #e8b800);
      border-radius: 14px 14px 4px 14px;
      padding: 12px 14px 10px;
      box-shadow: 0 6px 28px rgba(0,0,0,.55), 0 0 0 1px rgba(232,184,0,.15);
      animation: gt-notify-in .4s cubic-bezier(.22,1,.36,1) forwards;
      cursor: pointer;
    }
    #gtChatNotif.gt-hide {
      animation: gt-notify-out .35s ease forwards;
      pointer-events: none;
    }
    #gtChatNotif__avatar {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 7px;
    }
    #gtChatNotif__avatar span:first-child {
      font-size: 20px;
      background: var(--cor-primaria, #e8b800);
      border-radius: 50%;
      width: 32px; height: 32px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    #gtChatNotif__avatar strong {
      font-size: .78rem;
      color: var(--cor-primaria, #e8b800);
      letter-spacing: .03em;
    }
    #gtChatNotif__msg {
      font-size: .8rem;
      color: #ddd;
      line-height: 1.45;
    }
    #gtChatNotif__close {
      position: absolute;
      top: 7px; right: 9px;
      background: none; border: none;
      color: #666; font-size: 13px;
      cursor: pointer; line-height: 1;
      padding: 2px 4px;
      border-radius: 50%;
      transition: color .2s;
    }
    #gtChatNotif__close:hover { color: #ccc; }
    #gtChatBadge {
      position: absolute;
      top: -3px; right: -3px;
      background: #e53e3e;
      color: #fff;
      font-size: 10px;
      font-weight: 700;
      width: 18px; height: 18px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 2px 6px rgba(0,0,0,.4);
      pointer-events: none;
    }
  `;
  document.head.appendChild(style);

  // FUNÇÃO
  function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }

  function parseMarkdownLinks(texto) {
    const escaped = escapeHTML(texto);
    // Regex para achar [texto](link)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    return escaped.replace(linkRegex, (match, text, url) => {
      return `<a href="${url}" target="_blank" class="gt-chat-link">${text}</a>`;
    });
  }

  function addMsg(texto, tipo) {
    const msgs = document.getElementById('gtChatMsgs');
    const div = document.createElement('div');
    div.className = `gt-msg ${tipo}`;
    div.innerHTML = parseMarkdownLinks(texto);
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
    return div;
  }

  async function enviar() {
    const field = document.getElementById('gtChatField');
    const btn = document.getElementById('gtChatSend');
    const mensagem = field.value.trim();
    if (!mensagem) return;

    field.value = '';
    btn.disabled = true;
    addMsg(mensagem, 'user');
    const loading = addMsg('...', 'bot loading');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensagem, historico, clienteId: user.id || null, email: user.email || null })
      });
      const data = await res.json();
      const resposta = data.resposta || data.error || 'Erro ao obter resposta.';

      loading.remove();
      addMsg(resposta, 'bot');

      historico.push({ role: 'user', content: mensagem });
      historico.push({ role: 'assistant', content: resposta });
      if (historico.length > 12) historico = historico.slice(-12);
    } catch {
      loading.remove();
      addMsg('Erro de conexão. Tente novamente.', 'bot');
    }

    btn.disabled = false;
    field.focus();
  }

  // NOTIFICAÇÃO AUTOMATICA
  let notifTimer = null;

  function showNotif() {
    const notif = document.getElementById('gtChatNotif');
    const badge = document.getElementById('gtChatBadge');
    notif.style.display = 'block';
    notif.classList.remove('gt-hide');
    if (badge) badge.style.display = 'flex';
  }

  function hideNotif() {
    const notif = document.getElementById('gtChatNotif');
    const badge = document.getElementById('gtChatBadge');
    notif.classList.add('gt-hide');
    if (badge) badge.style.display = 'none';
    clearTimeout(notifTimer);
    setTimeout(() => { notif.style.display = 'none'; }, 380);
  }

  // Mostra a notificação 1.5s após carregar
  notifTimer = setTimeout(showNotif, 1500);

  // Auto-oculta após 6s (contados a partir da exibição)
  setTimeout(() => { hideNotif(); }, 7500);

  document.getElementById('gtChatNotif').addEventListener('click', () => {
    hideNotif();
    // Abre o chat ao clicar na notificação
    const box = document.getElementById('gtChatBox');
    const open = document.getElementById('gtChatIconOpen');
    const close = document.getElementById('gtChatIconClose');
    box.style.display = 'flex';
    open.style.display = 'none';
    close.style.display = 'inline';
    if (!document.querySelector('#gtChatMsgs .gt-msg')) {
      addMsg('Olá! Sou o assistente mecânico virtual da The Garage. Me diga o que você procura — posso recomendar peças, veículos e acessórios do nosso catálogo', 'bot');
    }
  });

  document.getElementById('gtChatNotif__close').addEventListener('click', e => {
    e.stopPropagation();
    hideNotif();
  });

  // EVENTOS
  document.getElementById('gtChatToggle').addEventListener('click', () => {
    const box = document.getElementById('gtChatBox');
    const open = document.getElementById('gtChatIconOpen');
    const close = document.getElementById('gtChatIconClose');
    const visible = box.style.display !== 'none';
    box.style.display = visible ? 'none' : 'flex';
    open.style.display = visible ? 'inline' : 'none';
    close.style.display = visible ? 'none' : 'inline';

    // Fecha a notificação ao abrir o chat
    hideNotif();

    if (!visible && !document.querySelector('#gtChatMsgs .gt-msg')) {
      addMsg('Olá! Sou o assistente mecânico virtual da The Garage. Me diga o que você procura — posso recomendar peças, veículos e acessórios do nosso catálogo', 'bot');
    }
  });

  document.getElementById('gtChatSend').addEventListener('click', enviar);
  document.getElementById('gtChatField').addEventListener('keydown', e => {
    if (e.key === 'Enter') enviar();
  });
})();