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

export function initChatbot(state) {
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
  panel.setAttribute("aria-modal", "true");
  panel.hidden = true;

  const header = makeElement("header", "naweb-chat-header");
  header.append(makeElement("h2", "", "Assistente NaWeb"));
  const closeButton = makeElement("button", "naweb-chat-close", "×");
  closeButton.type = "button";
  closeButton.setAttribute("aria-label", "Fechar assistente");
  header.append(closeButton);

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
  input.setAttribute("aria-label", "Escreve a tua mensagem");
  const sendButton = makeElement("button", "naweb-chat-send", "Enviar");
  sendButton.type = "submit";
  form.append(input, sendButton);
  panel.append(header, messages, quickReplies, form);
  document.body.append(launcher, panel);

  const actionsFor = (...labels) => labels.map((label) => ({ label }));
  const findFaq = (terms) => state.faq.find((item) => item.ativo !== false
    && terms.some((term) => normalize(item.pergunta).includes(term)));
  const faqAnswer = (terms, honestAnswer) => {
    const item = findFaq(terms);
    if (!item) return { texto: honestAnswer, acoes: actionsFor("WhatsApp") };
    if (/\bTODO\b/i.test(item.resposta)) {
      return { texto: honestAnswer, acoes: actionsFor("WhatsApp") };
    }
    return { texto: item.resposta, acoes: actionsFor("Pedir orçamento", "WhatsApp") };
  };

  async function getAnswer(texto) {
    const text = normalize(texto);
    const includesAny = (...terms) => terms.some((term) => text.includes(term));

    if (includesAny("whatsapp")) {
      return { texto: "Podes falar connosco diretamente pelo WhatsApp.", acoes: actionsFor("WhatsApp") };
    }
    if (includesAny("preco", "precos", "plano", "planos", "quanto custa", "custam")) {
      const plans = state.planos.filter((plan) => plan.ativo !== false && Number.isFinite(Number(plan.preco)));
      const formatEuro = (value) => new Intl.NumberFormat("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value));
      const details = plans.map((plan) => {
        const price = `${formatEuro(plan.preco)}€/ ${plan.periodo || "mês"}`.replace("/ ", "/");
        const creation = Number.isFinite(Number(plan.precoCriacao)) && plan.precoCriacao !== null
          ? ` (criação: ${formatEuro(plan.precoCriacao)}€)`
          : "";
        return `${plan.nome}: ${price}${creation}`;
      });
      const answer = details.length
        ? `Estes são os planos disponíveis: ${details.join("; ")}. Os detalhes estão na secção de preços.`
        : "Ainda não temos planos disponíveis para apresentar. Fala connosco para prepararmos uma proposta.";
      return { texto: answer, acoes: actionsFor("Pedir orçamento", "WhatsApp") };
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
      const plans = state.planos.filter((plan) => plan.ativo !== false
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

    return {
      texto: "Não percebi bem. Queres falar connosco no WhatsApp ou deixar o teu pedido no formulário?",
      acoes: actionsFor("WhatsApp", "Pedir orçamento")
    };
  }

  const appendMessage = (author, text, actions = []) => {
    const message = makeElement("div", `naweb-chat-message naweb-chat-message-${author}`, text);
    if (actions.length) {
      const actionList = makeElement("div", "naweb-chat-actions");
      actions.forEach(({ label }) => {
        if (label === "WhatsApp") {
          const link = makeElement("a", "naweb-chat-action", label);
          const number = String(state.configuracoes.whatsapp || "").replace(/\D/g, "");
          link.href = `https://wa.me/${number}?text=${encodeURIComponent("Olá! Gostaria de saber mais sobre os serviços da NaWeb.")}`;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          actionList.append(link);
          return;
        }
        const button = makeElement("button", "naweb-chat-action", label);
        button.type = "button";
        button.addEventListener("click", () => {
          if (label === "Ver exemplos") {
            document.querySelector("#exemplos")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
          } else if (label === "Pedir orçamento") {
            closePanel();
            document.querySelector("#contacto")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
          }
        });
        actionList.append(button);
      });
      message.append(actionList);
    }
    messages.append(message);
    messages.scrollTop = messages.scrollHeight;
  };

  const closePanel = () => {
    panel.hidden = true;
    launcher.hidden = false;
    launcher.setAttribute("aria-expanded", "false");
    launcher.focus();
  };

  const sendMessage = async (text) => {
    const trimmedText = text.trim();
    if (!trimmedText || sendButton.disabled) return;
    appendMessage("user", trimmedText);
    quickReplies.hidden = true;
    input.value = "";
    input.disabled = true;
    sendButton.disabled = true;
    const typing = makeElement("div", "naweb-chat-message naweb-chat-message-bot naweb-chat-typing", "a escrever…");
    typing.setAttribute("role", "status");
    messages.append(typing);
    messages.scrollTop = messages.scrollHeight;
    await new Promise((resolve) => window.setTimeout(resolve, 600));
    const answer = await getAnswer(trimmedText);
    typing.remove();
    appendMessage("bot", answer.texto, answer.acoes);
    input.disabled = false;
    sendButton.disabled = false;
    input.focus();
  };

  appendMessage("bot", "Olá! Sou o assistente da NaWeb. Como posso ajudar?");
  quickReplyLabels.forEach((label) => {
    const button = makeElement("button", "naweb-chat-quick-reply", label);
    button.type = "button";
    button.addEventListener("click", () => sendMessage(label));
    quickReplies.append(button);
  });

  const openPanel = () => {
    panel.hidden = false;
    launcher.hidden = true;
    launcher.setAttribute("aria-expanded", "true");
    input.focus();
  };
  launcher.addEventListener("click", openPanel);
  closeButton.addEventListener("click", closePanel);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    sendMessage(input.value);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !panel.hidden) closePanel();
  });
}
