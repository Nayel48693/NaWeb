const normalize = (value) => String(value ?? "")
  .toLocaleLowerCase("pt-PT")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "");

const makeElement = (tag, className, text) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
};

export function initChatbot(state = {}) {
  state = state || {};
  const planos = state.planos || [];
  const faq = state.faq || [];
  const exemplos = state.exemplos || [];
  const configuracoes = state.configuracoes || {};
  const launcher = makeElement("button", "naweb-chat-launcher");
  launcher.type = "button";
  launcher.setAttribute("aria-label", "Abrir assistente NaWeb");
  launcher.setAttribute("aria-expanded", "false");
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("aria-hidden", "true");
  const bubble = document.createElementNS("http://www.w3.org/2000/svg", "path");
  bubble.setAttribute("d", "M20 11.5a7.5 7.5 0 0 1-7.5 7.5H5l1.7-3.4A7.5 7.5 0 1 1 20 11.5Z");
  icon.append(bubble);
  launcher.append(icon);

  const panel = makeElement("section", "naweb-chat-panel");
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "Assistente NaWeb");
  panel.setAttribute("aria-modal", "false");
  panel.hidden = true;

  const header = makeElement("header", "naweb-chat-header");
  const heading = makeElement("div", "naweb-chat-heading");
  heading.append(makeElement("h2", "", "Assistente NaWeb"), makeElement("p", "", "Assistente com IA"));
  header.append(heading);
  const headerActions = makeElement("div", "naweb-chat-header-actions");
  const newConversationButton = makeElement("button", "naweb-chat-new", "Nova conversa");
  newConversationButton.type = "button";
  headerActions.append(newConversationButton);
  const closeButton = makeElement("button", "naweb-chat-close", "×");
  closeButton.type = "button";
  closeButton.setAttribute("aria-label", "Fechar assistente");
  headerActions.append(closeButton);
  header.append(headerActions);

  const messages = makeElement("div", "naweb-chat-messages");
  messages.setAttribute("role", "log");
  messages.setAttribute("aria-live", "polite");
  messages.setAttribute("aria-label", "Mensagens da conversa");
  const quickReplies = makeElement("div", "naweb-chat-quick-replies");
  quickReplies.setAttribute("aria-label", "Respostas rápidas");
  const quickReplyLabels = ["Planos e preços", "Como funciona", "Quanto tempo demora", "Ver exemplos", "Pedir orçamento", "Falar no WhatsApp"];
  const form = makeElement("form", "naweb-chat-form");
  const input = makeElement("input", "naweb-chat-input");
  input.type = "text";
  input.name = "mensagem";
  input.placeholder = "Escreve a tua mensagem...";
  input.autocomplete = "off";
  input.maxLength = 500;
  input.setAttribute("aria-label", "Escreve a tua mensagem");
  const sendButton = makeElement("button", "naweb-chat-send", "Enviar");
  sendButton.type = "submit";
  sendButton.disabled = true;
  form.append(input, sendButton);
  panel.append(header, makeElement("p", "naweb-chat-note", "Assistente com IA. Não partilhes dados pessoais sensíveis."), messages, quickReplies, form);
  document.body.append(launcher, panel);

  const history = [];
  let aiCalls = 0;
  let lastMessageAt = 0;
  let isSending = false;
  let lastBotActions = [];
  let fallbackIndex = -1;
  const actionsFor = (...labels) => labels.map((label) => ({ label }));
  const findFaq = (terms) => faq.find((item) => item.ativo !== false
    && terms.some((term) => normalize(item.pergunta).includes(term)));
  const faqAnswer = (terms, honestAnswer) => {
    const item = findFaq(terms);
    if (!item || /\bTODO\b/i.test(item.resposta)) {
      return { texto: honestAnswer, acoes: actionsFor("WhatsApp") };
    }
    return { texto: item.resposta, acoes: actionsFor("Pedir orçamento", "WhatsApp") };
  };

  const getAnswer = (texto) => {
    const text = normalize(texto);
    const includesAny = (...terms) => terms.some((term) => text.includes(term));
    if (includesAny("whatsapp")) {
      return { texto: "Podes falar connosco diretamente pelo WhatsApp.", acoes: actionsFor("WhatsApp") };
    }
    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount > 4 && !quickReplyLabels.some((label) => normalize(label) === text)) return null;
    if (includesAny("que site fazem", "tipos de site", "tipo de site", "para que negocio", "que negocios")) {
      const titles = exemplos.filter((item) => item.ativo !== false).map((item) => item.titulo).filter(Boolean);
      return {
        texto: titles.length ? `Temos exemplos para estes tipos de negócio: ${titles.join(", ")}.` : "Ainda não temos exemplos disponíveis para apresentar.",
        acoes: actionsFor("Ver exemplos")
      };
    }
    if (includesAny("preco", "precos", "plano", "planos", "quanto custa", "custam")) {
      const plans = planos.filter((plan) => plan.ativo !== false && Number.isFinite(Number(plan.preco)));
      const formatEuro = (value) => new Intl.NumberFormat("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value));
      const details = plans.map((plan) => {
        const price = `${formatEuro(plan.preco)}€/${plan.periodo || "mês"}`;
        const creation = Number.isFinite(Number(plan.precoCriacao)) && plan.precoCriacao !== null
          ? ` (criação: ${formatEuro(plan.precoCriacao)}€)` : "";
        return `${plan.nome}: ${price}${creation}`;
      });
      return {
        texto: details.length ? `Estes são os planos disponíveis: ${details.join("; ")}. Os detalhes estão na secção de preços.`
          : "Ainda não temos planos disponíveis para apresentar. Fala connosco para prepararmos uma proposta.",
        acoes: actionsFor("Pedir orçamento", "WhatsApp")
      };
    }
    if (includesAny("alojamento", "hospedagem")) {
      return faqAnswer(["alojamento", "hospedagem"], "O alojamento está incluído nos planos apresentados. Os limites e o fornecedor ainda estão por confirmar; fala connosco pelo WhatsApp para esclarecer.");
    }
    if (includesAny("dominio", "dominios")) {
      return faqAnswer(["dominio", "dominios"], "Podes usar um domínio que já tenhas ou escolher um novo. O processo e os custos ainda estão por confirmar; fala connosco pelo WhatsApp.");
    }
    if (includesAny("prazo", "demora", "tempo")) {
      return faqAnswer(["quanto tempo", "demora", "prazo"], "O prazo depende do tipo de site e dos conteúdos disponíveis. Depois da conversa inicial, apresentamos uma previsão clara.");
    }
    if (includesAny("alteracao", "alteracoes", "mudar", "atualizar")) {
      return faqAnswer(["alteracoes", "alteracao", "mensal"], "Sim. Cada plano inclui um número mensal de alterações, indicado na página de preços.");
    }
    if (includesAny("marcacao", "marcacoes", "reserva", "reservas", "agendamento")) {
      const plans = planos.filter((plan) => plan.ativo !== false
        && (plan.funcionalidades || []).some((feature) => normalize(feature).includes("marc")));
      const names = plans.map((plan) => plan.nome);
      const details = names.length ? ` Está disponível no plano ${names.join(" e ")}.` : "";
      return { texto: `A NaWeb pode incluir um sistema de marcações online. Para confirmar como funciona no teu caso, fala connosco.${details}`, acoes: actionsFor("Pedir orçamento", "WhatsApp") };
    }
    if (includesAny("cancelar", "cancelamento", "rescindir")) {
      return faqAnswer(["cancelar", "cancelamento"], "As condições de cancelamento ainda estão por confirmar. Para receberes essa informação corretamente, fala connosco pelo WhatsApp.");
    }
    if (includesAny("exemplo", "exemplos", "demo", "demos")) {
      return { texto: "Temos vários exemplos de websites para diferentes tipos de negócio. Podes vê-los na página.", acoes: actionsFor("Ver exemplos") };
    }
    if (includesAny("orcamento", "contacto", "contactar", "falar connosco", "pedido")) {
      return { texto: "Podes deixar os teus dados e contar-nos o que precisas no formulário de contacto, ou falar connosco pelo WhatsApp.", acoes: actionsFor("Pedir orçamento", "WhatsApp") };
    }
    if (includesAny("como funciona", "funcionamento")) {
      return { texto: "Começamos por conhecer o teu negócio, apresentamos uma proposta, criamos o design e publicamos o site. Depois, continuamos a acompanhar-te com manutenção.", acoes: actionsFor("Pedir orçamento", "WhatsApp") };
    }
    if (/^(ola|bom dia|boa tarde|boa noite)\b/.test(text)) {
      return { texto: "Olá! Posso ajudar-te com os planos, o funcionamento do serviço, os prazos ou os exemplos.", acoes: actionsFor("Planos e preços", "Ver exemplos") };
    }
    return null;
  };

  const fallbackAnswer = () => {
    const options = [
      "Ainda não tenho essa informação confirmada. Queres falar connosco pelo WhatsApp ou pedir um orçamento?",
      "Não consegui encontrar uma resposta segura. Posso ajudar-te pelo WhatsApp ou através do formulário de orçamento.",
      "A equipa pode esclarecer melhor essa dúvida. Preferes falar pelo WhatsApp ou enviar um pedido de orçamento?"
    ];
    fallbackIndex = (fallbackIndex + 1) % options.length;
    return { texto: options[fallbackIndex], acoes: actionsFor("WhatsApp", "Pedir orçamento"), showQuickReplies: true };
  };

  const scrollTo = (selector) => document.querySelector(selector)?.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"
  });

  const cleanText = (value) => {
    let text = String(value ?? "")
      .replace(/\r\n?/g, "\n")
      .replace(/\*\*|__/g, "")
      .replace(/`/g, "")
      .replace(/^([ \t]*)#+[ \t]?/gm, "$1")
      .replace(/^([ \t]*)[-*][ \t]+/gm, "$1• ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    if (text.length > 600) {
      const truncated = text.slice(0, 600);
      const sentenceEnd = Math.max(
        truncated.lastIndexOf(". "),
        truncated.lastIndexOf("? "),
        truncated.lastIndexOf("! "),
        truncated.lastIndexOf(".\n"),
        truncated.lastIndexOf("?\n"),
        truncated.lastIndexOf("!\n")
      );
      const nextSentenceEnd = sentenceEnd < 0
        ? text.slice(600).search(/[.!?](?:\s|$)/)
        : -1;
      const end = sentenceEnd >= 0 ? sentenceEnd + 1 : (nextSentenceEnd >= 0 ? nextSentenceEnd + 601 : 600);
      text = text.slice(0, end).trim();
    }
    return text;
  };

  const appendMessage = (author, text, actions = []) => {
    const clean = cleanText(text);
    const message = makeElement("div", `naweb-chat-message naweb-chat-message-${author}`, clean);
    const visibleActions = author === "bot"
      ? actions.filter(({ label }) => !lastBotActions.includes(label)).slice(0, 2)
      : actions;
    if (visibleActions.length) {
      const actionList = makeElement("div", "naweb-chat-actions");
      const hideActions = () => actionList.remove();
      visibleActions.forEach(({ label }) => {
        if (label === "WhatsApp") {
          const link = makeElement("a", "naweb-chat-action", label);
          const number = String(configuracoes.whatsapp || "").replace(/\D/g, "");
          link.href = `https://wa.me/${number}?text=${encodeURIComponent("Olá! Gostaria de saber mais sobre os serviços da NaWeb.")}`;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          link.addEventListener("click", hideActions, { once: true });
          actionList.append(link);
          return;
        }
        const button = makeElement("button", "naweb-chat-action", label);
        button.type = "button";
        button.addEventListener("click", () => {
          hideActions();
          if (label === "Ver exemplos") scrollTo("#exemplos");
          else if (label === "Pedir orçamento") {
            closePanel();
            scrollTo("#contacto");
          } else if (label === "Ver preços") scrollTo("#precos");
        });
        actionList.append(button);
      });
      message.append(actionList);
    }
    if (author === "bot") lastBotActions = visibleActions.map(({ label }) => label);
    messages.append(message);
    if (author === "bot" && message.offsetHeight > messages.clientHeight) {
      messages.scrollTop += message.getBoundingClientRect().top - messages.getBoundingClientRect().top;
    } else {
      messages.scrollTop = messages.scrollHeight;
    }
    return clean;
  };

  const closePanel = () => {
    panel.classList.remove("is-open");
    panel.hidden = true;
    launcher.hidden = false;
    launcher.setAttribute("aria-expanded", "false");
    launcher.focus();
  };

  const buildContext = () => {
    const plans = planos.filter((item) => item.ativo !== false).map((plan) => [
      `Plano: ${plan.nome || ""}`,
      `Preço mensal: ${plan.preco ?? "não indicado"}€/${plan.periodo || "mês"}`,
      `Preço de criação: ${plan.precoCriacao ?? "não indicado"}€`,
      `Funcionalidades: ${(plan.funcionalidades || []).join(", ")}`
    ].join("\n")).join("\n");
    const faqs = faq.filter((item) => item.ativo !== false
      && !/\bTODO\b/i.test(String(item.resposta || "")))
      .map((item) => `Pergunta: ${item.pergunta}\nResposta: ${item.resposta}`).join("\n");
    const settings = configuracoes;
    const siteExamples = exemplos.filter((item) => item.ativo !== false)
      .map((item) => `${item.titulo || "Sem título"} (${item.categoria || "categoria não indicada"})`).join(", ");
    const context = [
      `Tipos de sites/demos disponíveis: ${siteExamples || "Sem exemplos ativos."}`,
      "PLANOS ATIVOS:",
      plans || "Sem planos ativos.",
      "FAQ CONFIRMADAS:",
      faqs || "Sem FAQ confirmadas.",
      `WhatsApp: ${settings.whatsapp || ""}`,
      `Email: ${settings.email || ""}`,
      `Telefone: ${settings.telefone || ""}`,
      "Pontos ainda não confirmados: domínio, limites do alojamento, cancelamento, prazo de resposta a pedidos; dizer que a equipa confirma por WhatsApp."
    ].join("\n");
    return context.slice(0, 2000);
  };

  const parseAiReply = (reply) => {
    const labels = [];
    const text = String(reply).replace(/\[\[ACAO:(WHATSAPP|ORCAMENTO|EXEMPLOS|PRECOS)\]\]/g, (_, action) => {
      const label = { WHATSAPP: "WhatsApp", ORCAMENTO: "Pedir orçamento", EXEMPLOS: "Ver exemplos", PRECOS: "Ver preços" }[action];
      if (!labels.includes(label) && labels.length < 2) labels.push(label);
      return "";
    });
    const visibleText = cleanText(text);
    return { texto: visibleText, acoes: labels.map((label) => ({ label })) };
  };

  const askAi = async () => {
    aiCalls += 1;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history.slice(-8), contexto: buildContext() }),
        signal: controller.signal
      });
      if (!response.ok) {
        console.warn("chatbot:", response.status);
        return null;
      }
      const data = await response.json();
      if (typeof data.reply !== "string" || !data.reply.trim()) {
        console.warn("chatbot:", "resposta inválida");
        return null;
      }
      const answer = parseAiReply(data.reply);
      if (!answer.texto) {
        console.warn("chatbot:", "resposta vazia");
        return null;
      }
      return answer.texto ? answer : null;
    } catch (error) {
      console.warn("chatbot:", error?.name || "erro de rede");
      return null;
    } finally {
      window.clearTimeout(timeout);
    }
  };

  const sendMessage = async (text) => {
    const trimmedText = text.trim().slice(0, 500);
    if (!trimmedText || isSending) return;
    if (Date.now() - lastMessageAt < 2000) {
      const answer = { texto: "Espera um instante antes de enviar outra mensagem.", acoes: actionsFor("WhatsApp") };
      appendMessage("bot", answer.texto, answer.acoes);
      return;
    }
    isSending = true;
    sendButton.disabled = true;
    newConversationButton.disabled = true;
    lastMessageAt = Date.now();
    appendMessage("user", trimmedText);
    history.push({ role: "user", content: trimmedText });
    input.value = "";
    const typing = makeElement("div", "naweb-chat-message naweb-chat-message-bot naweb-chat-typing");
    typing.setAttribute("role", "status");
    typing.setAttribute("aria-label", "A escrever");
    typing.append(makeElement("span", "", ""), makeElement("span", "", ""), makeElement("span", "", ""));
    messages.append(typing);
    messages.scrollTop = messages.scrollHeight;
    input.focus();
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 350));
      let answer = getAnswer(trimmedText);
      if (!answer) {
        if (aiCalls >= 20) {
          answer = { texto: "Já não consigo responder a mais perguntas automáticas nesta visita. Fala connosco pelo WhatsApp e ajudamos-te.", acoes: actionsFor("WhatsApp") };
        } else {
          answer = await askAi() || fallbackAnswer();
        }
      }
      const cleanAnswer = appendMessage("bot", answer.texto, answer.acoes);
      history.push({ role: "assistant", content: cleanAnswer });
      quickReplies.hidden = false;
    } finally {
      typing.remove();
      isSending = false;
      sendButton.disabled = !input.value.trim();
      newConversationButton.disabled = false;
      input.focus();
    }
  };

  const appendWelcome = () => appendMessage("bot", "Olá! Sou o assistente da NaWeb. Como posso ajudar?");
  appendWelcome();
  quickReplyLabels.forEach((label) => {
    const button = makeElement("button", "naweb-chat-quick-reply", label);
    button.type = "button";
    button.addEventListener("click", () => {
      input.focus();
      sendMessage(label);
    });
    quickReplies.append(button);
  });
  input.addEventListener("input", () => {
    sendButton.disabled = isSending || !input.value.trim();
  });
  newConversationButton.addEventListener("click", () => {
    if (isSending) return;
    history.length = 0;
    lastBotActions = [];
    messages.replaceChildren();
    appendWelcome();
    quickReplies.hidden = false;
    quickReplies.scrollLeft = 0;
    input.value = "";
    sendButton.disabled = true;
    input.focus();
  });

  const clampPosition = (left, top) => {
    const maxLeft = Math.max(8, window.innerWidth - launcher.offsetWidth - 8);
    const maxTop = Math.max(8, window.innerHeight - launcher.offsetHeight - 8);
    return {
      left: Math.min(maxLeft, Math.max(8, left)),
      top: Math.min(maxTop, Math.max(8, top))
    };
  };
  const setPosition = (left, top) => {
    const position = clampPosition(left, top);
    launcher.style.left = `${position.left}px`;
    launcher.style.top = `${position.top}px`;
    return position;
  };
  const savePosition = () => {
    const maxLeft = Math.max(1, window.innerWidth - launcher.offsetWidth - 16);
    const maxTop = Math.max(1, window.innerHeight - launcher.offsetHeight - 16);
    try {
      localStorage.setItem("naweb-chat-pos", JSON.stringify({
        x: (launcher.offsetLeft - 8) / maxLeft,
        y: (launcher.offsetTop - 8) / maxTop
      }));
    } catch (_) { }
  };
  let restored = false;
  try {
    const stored = JSON.parse(localStorage.getItem("naweb-chat-pos") || "null");
    if (stored && Number.isFinite(stored.x) && Number.isFinite(stored.y)
      && stored.x >= 0 && stored.x <= 1 && stored.y >= 0 && stored.y <= 1) {
      setPosition(8 + stored.x * Math.max(1, window.innerWidth - launcher.offsetWidth - 16),
        8 + stored.y * Math.max(1, window.innerHeight - launcher.offsetHeight - 16));
      restored = true;
    }
  } catch (_) { }
  if (!restored) setPosition(18, window.innerHeight - 190 - launcher.offsetHeight);

  let panelAnchor = null;
  const positionPanel = () => {
    if (window.innerWidth <= 700) return;
    const rect = panelAnchor || launcher.getBoundingClientRect();
    panel.style.left = `${Math.max(8, Math.min(window.innerWidth - panel.offsetWidth - 8, rect.left < window.innerWidth / 2 ? rect.left : rect.right - panel.offsetWidth))}px`;
    const above = rect.top - panel.offsetHeight - 12;
    const below = rect.bottom + 12;
    panel.style.top = `${above >= 8 ? above : Math.min(window.innerHeight - panel.offsetHeight - 8, below)}px`;
  };
  const syncMobileViewport = () => {
    const viewport = window.visualViewport;
    if (window.innerWidth > 700 || !viewport) {
      panel.style.removeProperty("height");
      panel.style.removeProperty("top");
      panel.style.removeProperty("bottom");
      return;
    }
    panel.style.height = `${viewport.height}px`;
    panel.style.setProperty("top", `${viewport.offsetTop}px`, "important");
    panel.style.setProperty("bottom", "auto", "important");
  };
  const openPanel = () => {
    panel.hidden = false;
    launcher.setAttribute("aria-expanded", "true");
    const position = clampPosition(launcher.offsetLeft, launcher.offsetTop);
    panelAnchor = {
      left: position.left,
      top: position.top,
      right: position.left + launcher.offsetWidth,
      bottom: position.top + launcher.offsetHeight
    };
    syncMobileViewport();
    positionPanel();
    launcher.hidden = true;
    window.requestAnimationFrame(() => panel.classList.add("is-open"));
    input.focus();
  };

  let drag = null;
  let suppressClick = false;
  launcher.addEventListener("pointerdown", (event) => {
    if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, left: launcher.offsetLeft, top: launcher.offsetTop, moved: false };
    launcher.setPointerCapture(event.pointerId);
  });
  launcher.addEventListener("pointermove", (event) => {
    if (!drag || drag.id !== event.pointerId) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) <= 6) return;
    drag.moved = true;
    launcher.classList.add("is-dragging");
    setPosition(drag.left + dx, drag.top + dy);
  });
  const finishDrag = (event) => {
    if (!drag || drag.id !== event.pointerId) return;
    if (drag.moved) {
      savePosition();
      if (event.type === "pointerup") suppressClick = true;
    }
    launcher.classList.remove("is-dragging");
    drag = null;
  };
  launcher.addEventListener("pointerup", finishDrag);
  launcher.addEventListener("pointercancel", finishDrag);
  launcher.addEventListener("click", (event) => {
    if (suppressClick && event.detail !== 0) {
      suppressClick = false;
      event.preventDefault();
      return;
    }
    openPanel();
  });
  launcher.addEventListener("keydown", (event) => {
    const step = event.shiftKey ? 40 : 10;
    const movements = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (!movements[event.key]) return;
    event.preventDefault();
    const [dx, dy] = movements[event.key];
    setPosition(launcher.offsetLeft + dx, launcher.offsetTop + dy);
    savePosition();
  });

  closeButton.addEventListener("click", closePanel);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    sendMessage(input.value);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !panel.hidden) closePanel();
  });
  const reposition = () => {
    if (!launcher.hidden) {
      setPosition(launcher.offsetLeft, launcher.offsetTop);
      savePosition();
    } else if (panelAnchor) {
      const position = clampPosition(panelAnchor.left, panelAnchor.top);
      panelAnchor = {
        left: position.left,
        top: position.top,
        right: position.left + launcher.offsetWidth,
        bottom: position.top + launcher.offsetHeight
      };
    }
    if (!panel.hidden) {
      syncMobileViewport();
      positionPanel();
    }
  };
  window.addEventListener("resize", reposition);
  window.addEventListener("orientationchange", reposition);
  window.visualViewport?.addEventListener("resize", syncMobileViewport);
  window.visualViewport?.addEventListener("scroll", syncMobileViewport);
}
