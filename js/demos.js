const DEMO_DATA = {
  barbearia: {
    notifications: [["✂️", "Marcação confirmada", "Corte com o Alex amanhã às 15:00", "há 5 min"], ["⭐", "Novo serviço", "Conhece o nosso ritual de barba.", "há 1 h"], ["💈", "Horário atualizado", "Estamos abertos até às 19:00 hoje.", "ontem"]],
    promotions: [["Combo corte + barba", "Um visual completo numa só visita.", "-20%", "DEMO20", "Até ao fim do mês"], ["Corte à terça", "Reserva uma terça-feira tranquila.", "-10%", "TERCA10", "Esta semana"], ["Primeira visita", "Uma oferta de boas-vindas.", "-5€", "OLA5", "Para novos clientes"]]
  },
  restaurante: {
    notifications: [["🍽️", "Reserva confirmada", "A tua mesa para sexta às 20:00 está confirmada.", "há 5 min"], ["🥘", "Prato do dia", "Hoje há arroz de polvo com coentros.", "há 35 min"], ["📅", "Novas reservas", "Já podes reservar mesa para o fim de semana.", "ontem"]],
    promotions: [["Menu do dia", "Prato, bebida e café de segunda a sexta.", "9,90€", "MENU990", "Dias úteis ao almoço"], ["Jantar a dois", "Uma sobremesa para partilhar.", "-10%", "DOIS10", "Até domingo"], ["Almoço de grupo", "Condições especiais para grupos.", "-15%", "GRUPO15", "Mediante reserva"]]
  },
  salao: {
    notifications: [["💆", "Lembrete de marcação", "Tratamento amanhã às 11:00.", "há 5 min"], ["✨", "Novidade no salão", "Descobre o nosso novo ritual hidratante.", "há 2 h"], ["📅", "Agenda disponível", "Já podes marcar para a próxima semana.", "ontem"]],
    promotions: [["Hidratação profunda", "Um cuidado extra para o teu cabelo.", "-15%", "HIDRA15", "Até ao fim do mês"], ["Manicure + brushing", "Combina dois momentos de cuidado.", "-10%", "MIMO10", "Esta semana"], ["Primeira visita", "Um mimo de boas-vindas.", "-5€", "OLA5", "Para novos clientes"]]
  },
  dentista: {
    notifications: [["🦷", "Lembrete de consulta", "A tua consulta de avaliação é amanhã às 10:30.", "há 5 min"], ["🪥", "Dica de saúde oral", "Não te esqueças de usar fio dentário.", "há 1 h"], ["📅", "Agenda disponível", "Temos novas vagas para a próxima semana.", "ontem"]],
    promotions: [["Avaliação inicial", "Conhece a equipa e o plano de cuidados.", "Grátis", "SORRISO", "Mediante marcação"], ["Higiene oral", "Limpeza dentária com aconselhamento.", "-10%", "LIMPA10", "Até ao fim do mês"], ["Cuidado completo", "Avaliação e plano personalizado.", "Oferta", "CUIDAR", "Vagas limitadas"]]
  },
  pet: {
    notifications: [["🐾", "Pedido pronto", "O teu pedido está pronto para levantar.", "há 5 min"], ["🦴", "Produto em destaque", "Chegaram novos snacks para cães.", "há 1 h"], ["📦", "Reposição", "A tua ração favorita voltou ao stock.", "ontem"]],
    promotions: [["Ração selecionada", "Nutrição completa para o teu companheiro.", "-20%", "PATAS20", "Até ao fim do mês"], ["Brinquedos", "Diversão para cães e gatos.", "-10%", "BRINCA10", "Esta semana"], ["Higiene", "Cuidados diários para o teu animal.", "-5€", "CUIDA5", "Em compras superiores a 25€"]]
  },
  cafe: {
    notifications: [["🍰", "Novo bolo do dia", "Cheesecake de frutos vermelhos disponível.", "há 5 min"], ["☕", "Café acabado de tirar", "Passa por cá para uma pausa.", "há 30 min"], ["🥐", "Encomendas abertas", "Reserva já os teus favoritos para amanhã.", "ontem"]],
    promotions: [["Café + pastel de nata", "A combinação clássica para a tua pausa.", "2,50€", "PAUSA250", "Até às 11:00"], ["Brunch a dois", "Dois menus brunch e sumo natural.", "-10%", "BRUNCH10", "Fim de semana"], ["Bolo do dia", "Uma fatia com qualquer bebida quente.", "-1€", "BOLO1", "Enquanto houver"]]
  },
  ginasio: {
    notifications: [["🚴", "Aula com vagas", "Aula de Spinning às 18:30 com vagas.", "há 5 min"], ["🏋️", "Novo horário", "Consulta o horário atualizado de aulas.", "há 1 h"], ["💪", "Treino da semana", "Experimenta uma aula de HIIT esta semana.", "ontem"]],
    promotions: [["Primeiro mês", "Começa a treinar com acompanhamento.", "-50%", "PULSE50", "Novas inscrições"], ["Plano anual", "Compromisso com a tua rotina.", "-15%", "ANUAL15", "Até ao fim do mês"], ["Aula experimental", "Vem conhecer o espaço sem compromisso.", "Grátis", "TESTE", "Mediante marcação"]]
  }
};

const PRODUCTS = [
  { id: "cao-adulto", name: "Ração seca cão adulto", brand: "Patudo", description: "Receita completa para cães adultos.", size: "12 kg", price: 39.9, oldPrice: 46.9, category: "alimentacao", image: "photo-1543466835-00a7907e9de1", emoji: "🐶", details: "Frango, arroz integral e legumes. Para cães adultos de porte médio e grande; alimentação completa para o dia a dia." },
  { id: "gato-esterilizado", name: "Ração gato esterilizado", brand: "Miaudável", description: "Equilíbrio diário para gatos esterilizados.", size: "4 kg", price: 24.5, category: "alimentacao", image: "photo-1573865526739-10659fec78a5", emoji: "🐱", details: "Com proteína de aves e fibras. Indicada para gatos adultos esterilizados." },
  { id: "snacks-dentarios", name: "Snacks dentários cão", brand: "MordeBem", description: "Textura pensada para a higiene oral.", size: "180 g", price: 6.9, category: "alimentacao", image: "photo-1582798358481-d199fb7347bb", emoji: "🦴", details: "Snacks complementares para cães adultos. Oferecer como recompensa e manter água fresca disponível." },
  { id: "humida-gato", name: "Ração húmida gato", brand: "Miaudável", description: "Seleção de sabores em molho.", size: "Pack 12 × 85 g", price: 11.9, category: "alimentacao", image: "photo-1514888286974-6c03e2ca1dba", emoji: "🐈", details: "Pack variado com receitas de carne e peixe para gatos adultos." },
  { id: "bola-borracha", name: "Bola de borracha", brand: "Patudo Play", description: "Brinquedo resistente para brincadeiras.", size: "Tamanho M", price: 4.5, category: "brinquedos", image: "photo-1535294435445-d7249524ef2e", emoji: "🎾", details: "Bola flexível para brincadeiras supervisionadas. Para cães de porte pequeno e médio." },
  { id: "varinha-penas", name: "Varinha com penas para gato", brand: "Miaudável Play", description: "Estimula a curiosidade e o movimento.", size: "45 cm", price: 5.9, category: "brinquedos", image: "photo-1513360371669-4adf3dd7dff8", emoji: "🪶", details: "Brinquedo interativo para sessões de brincadeira com o gato. Guardar fora do alcance após utilização." },
  { id: "arranhador", name: "Arranhador", brand: "Miaudável Casa", description: "Um espaço próprio para afiar as unhas.", size: "60 cm", price: 29.9, category: "acessorios", image: "photo-1573865526739-10659fec78a5", emoji: "🐾", details: "Estrutura estável com poste revestido e base macia. Adequado para gatos de todas as idades." },
  { id: "coleira", name: "Coleira ajustável", brand: "Patudo", description: "Confortável e fácil de ajustar.", size: "S–M", price: 9.9, category: "acessorios", image: "photo-1551717743-49959800b1f6", emoji: "🐕", details: "Coleira ajustável com fecho seguro. Confirme que deixa espaço para dois dedos entre a coleira e o pescoço." },
  { id: "peitoral", name: "Peitoral", brand: "Patudo", description: "Apoio confortável para os passeios.", size: "Tamanho M", price: 14.9, category: "acessorios", image: "photo-1551717743-49959800b1f6", emoji: "🦮", details: "Peitoral ajustável para passeios. Meça o peito do animal antes de escolher o tamanho." },
  { id: "cama", name: "Cama ortopédica", brand: "Patudo Casa", description: "Descanso acolhedor com apoio extra.", size: "80 × 60 cm", price: 34.9, category: "acessorios", image: "photo-1541599540903-216a46ca1dc0", emoji: "🛏️", details: "Cama com base de apoio e capa amovível para facilitar a limpeza. Indicada para cães de porte médio." },
  { id: "champo", name: "Champô para cães", brand: "Patudo Care", description: "Limpeza suave para o pelo.", size: "250 ml", price: 8.5, category: "higiene", image: "photo-1583337130417-3346a1be7dee", emoji: "🧴", details: "Champô de uso externo para cães. Evite o contacto com os olhos e siga as instruções da embalagem." },
  { id: "areia", name: "Areia aglomerante", brand: "Miaudável Casa", description: "Areia prática para a caixa do gato.", size: "10 L", price: 8.9, category: "higiene", image: "photo-1514888286974-6c03e2ca1dba", emoji: "🐈", details: "Areia mineral aglomerante para caixas de gato. Remova os resíduos diariamente." }
];

const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
const euro = (value) => `${Number(value).toFixed(2).replace(".", ",")}€`;
function fallbackImages() {
  document.querySelectorAll(".demo img").forEach((image) => image.addEventListener("error", () => {
    const fallback = document.createElement("div");
    fallback.className = "demo-image-fallback";
    fallback.setAttribute("role", "img");
    fallback.setAttribute("aria-label", image.alt || "Imagem ilustrativa");
    fallback.textContent = image.dataset.fallbackEmoji || "🌿";
    image.replaceWith(fallback);
  }, { once: true }));
}

function notificationsAndPromotions() {
  const demo = document.body.dataset.demo;
  const data = DEMO_DATA[demo];
  const nav = document.querySelector(".demo-nav");
  if (!data || !nav) return;
  const actions = document.createElement("div");
  actions.className = "demo-actions";
  actions.innerHTML = `<button class="demo-icon-btn" type="button" aria-label="Notificações, 3 por ler" aria-expanded="false" aria-controls="demo-notifications" data-panel-toggle="notifications"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg><span class="demo-badge">3</span></button><button class="demo-icon-btn" type="button" aria-label="Promoções" aria-expanded="false" aria-controls="demo-promotions" data-panel-toggle="promotions"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.6 13.4 13 21l-10-10V3h8l9.6 9.6a.6.6 0 0 1 0 .8Z"/><circle cx="7.5" cy="7.5" r="1"/></svg><span class="demo-promo-dot" aria-hidden="true"></span></button></div>`;
  nav.append(actions);
  const panel = document.createElement("div");
  panel.className = "demo-panels";
  panel.innerHTML = `<section id="demo-notifications" class="demo-panel" role="dialog" aria-label="Notificações" hidden><h2>Notificações</h2><div class="demo-notification-list">${data.notifications.map(([icon, title, text, time]) => `<button class="demo-notification" type="button"><span class="demo-notification-icon" aria-hidden="true">${icon}</span><span><strong>${escapeHtml(title)}</strong><small>${escapeHtml(text)}</small><time>${escapeHtml(time)}</time></span></button>`).join("")}</div><p class="demo-panel-foot">Exemplos fictícios para demonstração</p></section><section id="demo-promotions" class="demo-panel" role="dialog" aria-label="Promoções" hidden><h2>Promoções</h2><div class="demo-promotion-list">${data.promotions.map(([title, text, discount, code, expiry]) => `<article class="demo-promotion"><span class="demo-discount">${escapeHtml(discount)}</span><div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(text)}</p><code>${escapeHtml(code)}</code><small>Válido: ${escapeHtml(expiry)}</small><button class="btn btn-primary btn-small" type="button" data-use-promo>Usar promoção</button></div></article>`).join("")}</div><p class="demo-panel-foot">Exemplos fictícios para demonstração</p></section>`;
  nav.append(panel);
  const toast = document.createElement("div");
  toast.className = "demo-toast";
  toast.setAttribute("role", "status");
  toast.setAttribute("aria-live", "polite");
  document.body.append(toast);
  let toastTimer;
  const showToast = () => {
    toast.textContent = "Simulação de demonstração, nada foi guardado";
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 3000);
  };
  const closePanels = () => {
    panel.querySelectorAll(".demo-panel").forEach((item) => { item.hidden = true; });
    actions.querySelectorAll("[data-panel-toggle]").forEach((button) => button.setAttribute("aria-expanded", "false"));
  };
  actions.addEventListener("click", (event) => {
    const button = event.target.closest("[data-panel-toggle]");
    if (!button) return;
    const target = document.getElementById(button.getAttribute("aria-controls"));
    const shouldOpen = target.hidden;
    closePanels();
    if (shouldOpen) {
      target.hidden = false;
      button.setAttribute("aria-expanded", "true");
      if (button.dataset.panelToggle === "notifications") {
        actions.querySelector(".demo-badge")?.remove();
        button.setAttribute("aria-label", "Notificações");
      }
    }
  });
  document.addEventListener("click", (event) => { if (!nav.contains(event.target)) closePanels(); });
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") closePanels(); });
  panel.addEventListener("click", (event) => {
    const notification = event.target.closest(".demo-notification");
    if (notification) notification.classList.add("is-read");
    if (event.target.closest("[data-use-promo]")) showToast();
  });
}

function setupForms() {
  document.querySelectorAll("[data-demo-form]").forEach((form) => form.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = form.querySelector("[name=name]")?.value || "";
    const customMessage = form.dataset.success;
    const message = customMessage || `Obrigado${name ? `, ${escapeHtml(name)}` : ""}. Esta é uma simulação de demonstração e não guardou dados.`;
    form.innerHTML = `<div class="confirmation"><h2>Pedido recebido</h2><p>${message}</p><button class="btn btn-primary" type="button" data-reload>Fazer novo pedido</button></div>`;
  }));
  document.addEventListener("click", (event) => { if (event.target.closest("[data-reload]")) location.reload(); });
}

function setupFilters() {
  document.querySelectorAll("[data-filter-group]").forEach((group) => {
    group.addEventListener("click", (event) => {
      const button = event.target.closest("[data-filter]");
      if (!button) return;
      group.querySelectorAll("[data-filter]").forEach((item) => item.classList.toggle("is-active", item === button));
      const filter = button.dataset.filter;
      document.querySelectorAll(button.dataset.filterTarget).forEach((item) => { item.hidden = filter !== "todos" && !item.dataset.category.split(/\s+/).includes(filter); });
    });
  });
}

function productImage(product) {
  const photo = product.image.split("?")[0];
  const url = `https://images.unsplash.com/${photo}?auto=format&fit=crop&w=800&q=80`;
  return `<img src="${url}" alt="${escapeHtml(product.name)}" loading="lazy" data-fallback-emoji="${product.emoji}">`;
}
function setupPetShop() {
  const grid = document.querySelector("#pet-products");
  if (!grid) return;
  const species = { "cao-adulto": "caes", "gato-esterilizado": "gatos", "snacks-dentarios": "caes", "humida-gato": "gatos", "bola-borracha": "caes", "varinha-penas": "gatos", arranhador: "gatos", coleira: "caes", peitoral: "caes", cama: "caes", champo: "caes", areia: "gatos" };
  grid.innerHTML = PRODUCTS.map((product) => `<article class="demo-card pet-product" data-category="${species[product.id]} ${product.category}" data-product="${product.id}"><div class="pet-product-image">${productImage(product)}</div><p class="pet-brand">${escapeHtml(product.brand)} · ${escapeHtml(product.size)}</p><h3>${escapeHtml(product.name)}</h3><p>${escapeHtml(product.description)}</p><div class="pet-price">${product.oldPrice ? `<del>${euro(product.oldPrice)}</del>` : ""}<strong>${euro(product.price)}</strong></div><div class="pet-product-actions"><button class="btn btn-secondary btn-small" type="button" data-product-details="${product.id}">Detalhes</button><button class="btn btn-primary btn-small" type="button" data-add-product="${product.id}">Adicionar</button></div></article>`).join("");
  fallbackImages();
  const cart = new Map();
  const cartButton = document.querySelector("[data-cart-open]");
  const drawer = document.querySelector("#pet-cart");
  const modal = document.querySelector("#product-modal");
  const toast = document.querySelector(".demo-toast");
  let toastTimer;
  const showToast = () => {
    toast.textContent = "Simulação de demonstração, nada foi guardado";
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 3000);
  };
  const updateCart = () => {
    const count = [...cart.values()].reduce((total, quantity) => total + quantity, 0);
    cartButton.querySelector("[data-cart-count]").textContent = String(count);
    const lines = [...cart.entries()].map(([id, quantity]) => {
      const product = PRODUCTS.find((item) => item.id === id);
      return `<div class="cart-line"><div><strong>${escapeHtml(product.name)}</strong><small>${euro(product.price)} cada</small></div><div class="cart-line-actions"><button type="button" aria-label="Diminuir ${escapeHtml(product.name)}" data-quantity="-1" data-id="${id}">−</button><span>${quantity}</span><button type="button" aria-label="Aumentar ${escapeHtml(product.name)}" data-quantity="1" data-id="${id}">+</button><button type="button" data-remove="${id}">Remover</button></div></div>`;
    });
    const total = [...cart.entries()].reduce((sum, [id, quantity]) => sum + PRODUCTS.find((item) => item.id === id).price * quantity, 0);
    drawer.querySelector("[data-cart-items]").innerHTML = lines.length ? lines.join("") : "<p>O carrinho está vazio.</p>";
    drawer.querySelector("[data-cart-total]").textContent = euro(total);
    drawer.querySelector("[data-checkout]").disabled = count === 0;
  };
  const closeCart = () => { drawer.hidden = true; cartButton.setAttribute("aria-expanded", "false"); };
  cartButton.addEventListener("click", () => {
    drawer.hidden = !drawer.hidden;
    cartButton.setAttribute("aria-expanded", String(!drawer.hidden));
  });
  drawer.addEventListener("click", (event) => {
    if (event.target.closest("[data-cart-close]")) closeCart();
    const quantityButton = event.target.closest("[data-quantity]");
    if (quantityButton) {
      const id = quantityButton.dataset.id;
      const next = (cart.get(id) || 0) + Number(quantityButton.dataset.quantity);
      if (next > 0) cart.set(id, next); else cart.delete(id);
      updateCart();
    }
    const removeButton = event.target.closest("[data-remove]");
    if (removeButton) { cart.delete(removeButton.dataset.remove); updateCart(); }
    if (event.target.closest("[data-checkout]")) {
      drawer.querySelector(".cart-checkout").hidden = false;
      drawer.querySelector(".cart-checkout form").scrollIntoView({ block: "nearest" });
    }
  });
  document.addEventListener("click", (event) => {
    const add = event.target.closest("[data-add-product]");
    if (add) {
      cart.set(add.dataset.addProduct, (cart.get(add.dataset.addProduct) || 0) + 1);
      updateCart();
      showToast();
    }
    const detail = event.target.closest("[data-product-details]");
    if (detail) {
      const product = PRODUCTS.find((item) => item.id === detail.dataset.productDetails);
      modal.innerHTML = `<button class="modal-close" type="button" aria-label="Fechar">×</button><div class="product-modal-image">${productImage(product)}</div><div><p class="pet-brand">${escapeHtml(product.brand)} · ${escapeHtml(product.size)}</p><h2>${escapeHtml(product.name)}</h2><p>${escapeHtml(product.details)}</p><strong>${euro(product.price)}</strong><button class="btn btn-primary" type="button" data-add-product="${product.id}">Adicionar ao carrinho</button></div>`;
      modal.showModal();
      fallbackImages();
    }
    if (!drawer.hidden && !drawer.contains(event.target) && !cartButton.contains(event.target)) closeCart();
  });
  modal.addEventListener("click", (event) => { if (event.target === modal || event.target.closest(".modal-close")) modal.close(); });
  drawer.querySelector(".cart-checkout form").addEventListener("submit", (event) => {
    event.preventDefault();
    drawer.querySelector(".cart-checkout").innerHTML = `<p class="confirmation" role="status">Pedido de levantamento simulado. Não foram guardados dados.</p>`;
    cart.clear();
    updateCart();
  });
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeCart(); });
  updateCart();
}

document.querySelectorAll("[data-step-next]").forEach((button) => button.addEventListener("click", () => {
  const current = button.closest("[data-step]");
  current.hidden = true;
  const next = document.querySelector(`[data-step='${button.dataset.stepNext}']`);
  if (next) next.hidden = false;
}));
notificationsAndPromotions();
fallbackImages();
setupForms();
setupFilters();
setupPetShop();

export { DEMO_DATA };
