import { defaults } from "./defaults.js";
import {
  db, auth, collection, getDocs, addDoc, doc, getDoc, setDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, where, increment, serverTimestamp,
  signInWithEmailAndPassword, signOut, onAuthStateChanged, setPersistence,
  browserLocalPersistence, browserSessionPersistence, sendPasswordResetEmail
} from "./firebase.js";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const DAY_MS = 86400000;
const DEMOS = ["barbearia", "restaurante", "salao", "dentista", "pet", "cafe", "ginasio", "confeitaria", "floricultura"];
const STATES = ["novo", "contactado", "fechado", "perdido"];
const state = {
  orders: [], clients: [], visits: [], plans: [], settings: { ...defaults.configuracoes },
  charts: {}, unsubscribers: [], orderIdsSeen: new Set(), ordersLoaded: false, ordersSignature: null,
  ordersView: "list", visitorView: "day", visitorRowsLimit: 7, currentOrder: null, legacyVisits: 0,
  selectedYear: new Date().getFullYear(), selectedMonth: "todos", loginFailures: 0,
  lockTimer: null, idleTimer: null, warningTimer: null, warningCountdown: null,
  signedOutByUser: false
};

const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
}[character]));
const money = (value) => new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(Number(value) || 0);
const getDate = (value) => {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate();
  if (typeof value === "string") {
    const date = new Date(`${value}T12:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (value.seconds) return new Date(value.seconds * 1000);
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};
const dayKey = (date = new Date()) => date.toLocaleDateString("sv-SE", { timeZone: "Europe/Lisbon" });
const getOrderDate = (order) => getDate(order.criadoEm);
const setStatus = (message, bad = false, selector = "#admin-status") => {
  const node = $(selector);
  if (node) {
    node.textContent = message;
    node.dataset.bad = String(bad);
  }
};
const setLoading = (selector, loading) => {
  const node = $(selector);
  if (node) node.hidden = !loading;
};

function setTheme(theme) {
  document.body.dataset.theme = theme;
  try { localStorage.setItem("AnilanderTheme", theme); } catch (_) {}
}

function setupTheme() {
  let saved;
  try { saved = localStorage.getItem("AnilanderTheme"); } catch (_) {}
  setTheme(saved || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
  $("#theme-toggle").addEventListener("click", () => setTheme(document.body.dataset.theme === "dark" ? "light" : "dark"));
}

function showLogin(message = "") {
  $("#app").hidden = true;
  $("#login").hidden = false;
  $("#login-status").textContent = message;
}

function showApp(user) {
  $("#login").hidden = true;
  $("#app").hidden = false;
  $("#greeting").textContent = "Olá, Anilander";
  $("#admin-date").textContent = new Intl.DateTimeFormat("pt-PT", { dateStyle: "full", timeZone: "Europe/Lisbon" }).format(new Date());
}

function cleanupListeners() {
  state.unsubscribers.forEach((unsubscribe) => unsubscribe());
  state.unsubscribers = [];
  Object.values(state.charts).forEach((chart) => chart?.destroy());
  state.charts = {};
  state.orders = [];
  state.clients = [];
  state.visits = [];
  state.ordersLoaded = false;
  state.ordersSignature = null;
  state.orderIdsSeen.clear();
  clearTimeout(state.idleTimer);
  clearTimeout(state.warningTimer);
  clearInterval(state.warningCountdown);
  if ($("#idle-warning").open) $("#idle-warning").close();
}

function startLockout(seconds = 30) {
  const button = $("#login-submit");
  let remaining = seconds;
  button.disabled = true;
  button.textContent = `Tenta novamente em ${remaining}s`;
  clearInterval(state.lockTimer);
  state.lockTimer = setInterval(() => {
    remaining -= 1;
    if (remaining <= 0) {
      clearInterval(state.lockTimer);
      state.loginFailures = 0;
      button.disabled = false;
      button.textContent = "Entrar";
      return;
    }
    button.textContent = `Tenta novamente em ${remaining}s`;
  }, 1000);
}

function authErrorMessage(error) {
  const messages = {
    "auth/invalid-credential": "Email ou palavra-passe inválidos.",
    "auth/wrong-password": "Email ou palavra-passe inválidos.",
    "auth/user-not-found": "Email ou palavra-passe inválidos.",
    "auth/invalid-email": "Indica um endereço de email válido.",
    "auth/too-many-requests": "Demasiadas tentativas. Aguarda um pouco e tenta novamente.",
    "auth/network-request-failed": "Sem ligação à internet. Verifica a ligação e tenta novamente.",
    "auth/user-disabled": "Esta conta está desativada. Contacta o administrador."
  };
  return messages[error?.code] || "Não foi possível iniciar sessão. Tenta novamente.";
}

$("#toggle-password").addEventListener("click", (event) => {
  const input = $("#admin-password");
  const visible = input.type === "password";
  input.type = visible ? "text" : "password";
  event.currentTarget.textContent = visible ? "Esconder" : "Mostrar";
  event.currentTarget.setAttribute("aria-label", visible ? "Esconder palavra-passe" : "Mostrar palavra-passe");
  event.currentTarget.setAttribute("aria-pressed", String(visible));
});

$("#login-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!auth || $("#login-submit").disabled) return;
  const button = $("#login-submit");
  button.disabled = true;
  button.textContent = "A entrar…";
  $("#login-status").textContent = "";
  try {
    const persistence = $("#keep-session").checked ? browserLocalPersistence : browserSessionPersistence;
    await setPersistence(auth, persistence);
    await signInWithEmailAndPassword(auth, $("#admin-email").value.trim(), $("#admin-password").value);
    state.loginFailures = 0;
  } catch (error) {
    state.loginFailures += 1;
    $("#login-status").textContent = authErrorMessage(error);
    button.disabled = false;
    button.textContent = "Entrar";
    if (state.loginFailures >= 5) {
      $("#login-status").textContent = "Demasiadas tentativas. O acesso foi bloqueado durante 30 segundos.";
      startLockout();
    }
  }
});

$("#password-reset").addEventListener("click", async () => {
  const email = $("#admin-email").value.trim();
  if (!email) {
    $("#login-status").textContent = "Indica o teu email para receberes instruções, se existir uma conta associada.";
    return;
  }
  try {
    if (!auth) throw new Error("Firebase Authentication indisponível.");
    await sendPasswordResetEmail(auth, email);
    $("#login-status").textContent = "Se existir uma conta associada a este email, receberás instruções para redefinir a palavra-passe.";
  } catch (error) {
    console.error("passwordReset:", error.code || error.message);
    $("#login-status").textContent = error.code === "auth/network-request-failed"
      ? "Sem ligação à internet. Verifica a ligação e tenta novamente."
      : "Não foi possível pedir a recuperação da palavra-passe agora. Tenta novamente mais tarde.";
  }
});

function resetIdleTimer() {
  clearTimeout(state.idleTimer);
  clearTimeout(state.warningTimer);
  clearInterval(state.warningCountdown);
  if ($("#idle-warning").open) $("#idle-warning").close();
  if ($("#app").hidden || !auth?.currentUser) return;
  state.warningTimer = setTimeout(() => {
    const dialog = $("#idle-warning");
    const message = $("p", dialog);
    let remaining = 60;
    message.textContent = `A sessão terminará por inatividade dentro de ${remaining} segundos.`;
    dialog.showModal();
    state.warningCountdown = setInterval(() => {
      remaining -= 1;
      if (!dialog.open) { clearInterval(state.warningCountdown); return; }
      message.textContent = `A sessão terminará por inatividade dentro de ${remaining} segundos.`;
    }, 1000);
  }, 29 * 60 * 1000);
  state.idleTimer = setTimeout(() => logout(true), 30 * 60 * 1000);
}

["pointerdown", "keydown", "touchstart", "scroll"].forEach((eventName) => {
  document.addEventListener(eventName, resetIdleTimer, { passive: true });
});
$("#stay-signed-in").addEventListener("click", () => resetIdleTimer());
$("#idle-logout").addEventListener("click", () => logout(true));

async function logout(expired = false) {
  state.signedOutByUser = true;
  cleanupListeners();
  try { if (auth?.currentUser) await signOut(auth); }
  catch (error) { console.error("Não foi possível terminar a sessão.", error); }
  showLogin(expired ? "A sessão terminou por inatividade. Volta a entrar para continuar." : "");
}

function checkAdmin(user) {
  if (!user || !db) return Promise.resolve(false);
  return getDoc(doc(db, "admins", user.uid)).then((snapshot) => snapshot.exists());
}

function chartColors() {
  const styles = getComputedStyle(document.body);
  return {
    blue: styles.getPropertyValue("--blue").trim() || "#2f5dff",
    mint: styles.getPropertyValue("--mint").trim() || "#2bc5a6",
    text: styles.getPropertyValue("--admin-text").trim() || "#202432",
    line: styles.getPropertyValue("--admin-line").trim() || "#e6e9f0"
  };
}

function makeChart(selector, type, labels, datasets, options = {}) {
  const canvas = $(selector);
  if (!window.Chart || !canvas) return;
  state.charts[selector] = new Chart(canvas, {
    type,
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: chartColors().text } } },
      scales: type === "doughnut" ? {} : {
        x: { ticks: { color: chartColors().text }, grid: { color: chartColors().line } },
        y: { beginAtZero: true, ticks: { precision: 0, color: chartColors().text }, grid: { color: chartColors().line } }
      },
      ...options
    }
  });
}

function chartUpdate(selector, type, labels, datasets, options = {}) {
  state.charts[selector]?.destroy();
  makeChart(selector, type, labels, datasets, options);
}

function startRealtime() {
  if (!db) {
    setStatus("Firebase não está configurado.", true);
    return;
  }
  loadOrders();
  loadClients();
  loadDailyVisits();
  loadLegacyVisits();
  loadPlans();
  loadSettings();
  setupTelegramStatus();
}

function orderLabel(order) {
  return `${order.nome || "Sem nome"} · ${order.plano || "Sem plano"}`;
}

function filteredOrders() {
  const search = $("#order-search").value.trim().toLocaleLowerCase("pt-PT");
  const status = $("#order-status-filter").value;
  const plan = $("#order-plan-filter").value;
  const business = $("#order-business-filter").value;
  const from = $("#order-date-from").value;
  const to = $("#order-date-to").value;
  return state.orders.filter((order) => {
    const date = getOrderDate(order);
    const dateValue = date ? dayKey(date) : "";
    const searchText = `${order.nome || ""} ${order.email || ""} ${order.telefone || ""}`.toLocaleLowerCase("pt-PT");
    return (!search || searchText.includes(search))
      && (status === "todos" || (order.estado || "novo") === status)
      && (plan === "todos" || (order.plano || "") === plan)
      && (business === "todos" || (order.tipoNegocio || "") === business)
      && (!from || dateValue >= from)
      && (!to || dateValue <= to);
  }).sort((a, b) => (getOrderDate(b)?.getTime() || 0) - (getOrderDate(a)?.getTime() || 0));
}

function updateOrderFilters() {
  const preserve = (selector, key, label) => {
    const select = $(selector);
    const value = select.value;
    const items = [...new Set(state.orders.map((order) => order[key]).filter(Boolean))].sort();
    select.innerHTML = `<option value="todos">Todos ${label}</option>${items.map((item) => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`).join("")}`;
    if (items.includes(value)) select.value = value;
  };
  preserve("#order-plan-filter", "plano", "os planos");
  preserve("#order-business-filter", "tipoNegocio", "os negócios");
}

function renderOrderCard(order, board = false) {
  const id = escapeHtml(order.id);
  const orderState = STATES.includes(order.estado) ? order.estado : "novo";
  return `<article class="card admin-row ${orderState === "novo" ? "is-new" : ""}" data-order-id="${id}">
    <div class="admin-row-head"><div><button class="text-button" type="button" data-open-order="${id}"><strong>${escapeHtml(order.nome || "Sem nome")}</strong></button><div class="admin-date">${escapeHtml(order.email || "Sem email")} · ${escapeHtml(order.telefone || "Sem telemóvel")}</div></div>${orderState === "novo" ? '<span class="admin-badge">Novo</span>' : ""}</div>
    <span>${escapeHtml(order.tipoNegocio || "Negócio não indicado")} · ${escapeHtml(order.plano || "Plano não indicado")}</span>
    ${board ? `<label>Estado<select data-state="${id}">${STATES.map((item) => `<option value="${item}" ${item === orderState ? "selected" : ""}>${item}</option>`).join("")}</select></label>` : ""}
    <p>${escapeHtml(order.mensagem || "Sem mensagem")}</p><div class="admin-action-row"><button class="btn btn-secondary btn-small" type="button" data-open-order="${id}">Ver detalhes</button>${!board ? `<label class="inline-state">Estado<select data-state="${id}">${STATES.map((item) => `<option value="${item}" ${item === orderState ? "selected" : ""}>${item}</option>`).join("")}</select></label>` : ""}</div>
  </article>`;
}

function renderOrders() {
  const orders = filteredOrders();
  const root = $("#orders");
  if (state.ordersView === "board") {
    const scrollLeft = root.scrollLeft;
    const columnScrollTops = $$(".board-column", root).map((column) => column.scrollTop);
    root.className = "admin-board";
    root.innerHTML = STATES.map((orderState) => {
      const group = orders.filter((order) => (order.estado || "novo") === orderState);
      return `<section class="board-column"><h3>${orderState}<span>${group.length}</span></h3>${group.map((order) => renderOrderCard(order, true)).join("") || '<p class="form-note">Sem pedidos</p>'}</section>`;
    }).join("");
    root.scrollLeft = scrollLeft;
    $$(".board-column", root).forEach((column, index) => { column.scrollTop = columnScrollTops[index] || 0; });
  } else {
    root.className = "admin-list";
    root.innerHTML = orders.length ? orders.map((order) => renderOrderCard(order)).join("") : '<p class="empty-state card">Ainda não existem pedidos para estes filtros.</p>';
  }
  $("#orders-more").hidden = true;
  updateOrderFilters();
}

function renderSummary() {
  const newOrders = state.orders.filter((order) => (order.estado || "novo") === "novo");
  const closed = state.orders.filter((order) => order.estado === "fechado").length;
  $("#summary-new").textContent = String(newOrders.length);
  $("#summary-total").textContent = String(state.orders.length);
  $("#summary-conversion").textContent = state.orders.length ? `${Math.round(closed / state.orders.length * 100)}%` : "0%";
  const mrr = state.clients.filter((client) => client.estado !== "cancelado").reduce((total, client) => total + (Number(client.mensalidade) || 0), 0);
  $("#summary-mrr").textContent = money(mrr);
  const today = state.visits.find((visit) => visit.dia === dayKey())?.visitas || 0;
  const weekStart = new Date(`${dayKey()}T12:00:00`);
  weekStart.setDate(weekStart.getDate() - 6);
  const week = state.visits.filter((visit) => visit.dia >= dayKey(weekStart) && visit.dia <= dayKey()).reduce((sum, visit) => sum + (Number(visit.visitas) || 0), 0);
  $("#summary-visits-today").textContent = String(today);
  $("#summary-visits-week").textContent = String(week);
  const stale = newOrders.filter((order) => {
    const date = getOrderDate(order);
    return date && Date.now() - date.getTime() > DAY_MS;
  });
  const alert = $("#stale-orders-alert");
  alert.hidden = stale.length === 0;
  alert.textContent = stale.length ? `${stale.length} pedido${stale.length === 1 ? "" : "s"} novo${stale.length === 1 ? "" : "s"} há mais de 24 horas sem resposta.` : "";
  $("#recent-orders").innerHTML = state.orders.slice(0, 5).map((order) => {
    const phone = String(order.telefone || "").replace(/\D/g, "");
    const whatsapp = phone ? `https://wa.me/${encodeURIComponent(phone)}` : "";
    return `<div class="compact-order"><button type="button" data-open-order="${escapeHtml(order.id)}"><span><strong>${escapeHtml(order.nome || "Sem nome")}</strong><small>${escapeHtml(order.tipoNegocio || "Negócio não indicado")}</small></span><span class="admin-badge">${escapeHtml(order.estado || "novo")}</span></button>${whatsapp ? `<a class="compact-order-contact" href="${whatsapp}" target="_blank" rel="noopener noreferrer">WhatsApp</a>` : ""}</div>`;
  }).join("") || '<p class="empty-state">Ainda não há pedidos.</p>';
  renderSummaryVisitsChart();
}

function renderSummaryVisitsChart() {
  const today = new Date(`${dayKey()}T12:00:00`);
  const dates = Array.from({ length: 14 }, (_, index) => {
    const date = new Date(today);
    date.setDate(date.getDate() - 13 + index);
    const key = dayKey(date);
    return { key, label: new Intl.DateTimeFormat("pt-PT", { day: "2-digit", month: "2-digit" }).format(date) };
  });
  const values = dates.map(({ key }) => Number(state.visits.find((visit) => visit.dia === key)?.visitas) || 0);
  chartUpdate("#summary-visits-chart", "bar", dates.map((item) => item.label), [{
    label: "Visitas",
    data: values,
    backgroundColor: chartColors().blue,
    borderRadius: 5
  }]);
}

function loadOrders() {
  setLoading("#orders-loading", true);
  state.unsubscribers.push(onSnapshot(query(collection(db, "pedidos"), orderBy("criadoEm", "desc")), (snapshot) => {
    const incoming = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
    if (state.ordersLoaded && window.Notification?.permission === "granted" && localStorage.getItem("AnilanderNotifications") === "true") {
      incoming.filter((order) => !state.orderIdsSeen.has(order.id) && (order.estado || "novo") === "novo").forEach((order) => announceOrder(order));
    }
    state.orderIdsSeen = new Set(incoming.map((order) => order.id));
    state.ordersLoaded = true;
    state.orders = incoming.sort((a, b) => (getOrderDate(b)?.getTime() || 0) - (getOrderDate(a)?.getTime() || 0));
    setLoading("#orders-loading", false);
    const signature = JSON.stringify(state.orders.map((order) => [order.id, order.estado, order.notaInterna, order.mensagem]));
    if (signature !== state.ordersSignature) {
      state.ordersSignature = signature;
      renderOrders();
      renderSummary();
      updateOrderTitleBadge();
    }
  }, (error) => {
    setLoading("#orders-loading", false);
    $("#orders-error").textContent = error.code === "permission-denied"
      ? "Sem permissões para ler pedidos. Confirma o documento admins/{UID} e publica as regras Firestore."
      : "Não foi possível carregar os pedidos.";
    console.error("loadOrders:", error.code, error.message);
  }));
}

function updateOrderTitleBadge() {
  const count = state.orders.filter((order) => (order.estado || "novo") === "novo").length;
  const badge = $("#orders-badge");
  badge.textContent = String(count);
  badge.hidden = count === 0;
  document.title = `${count ? `(${count}) ` : ""}Admin | NaWeb`;
}

function announceOrder(order) {
  if (!window.Notification || Notification.permission !== "granted") return;
  const notification = new Notification("Novo pedido — NaWeb", { body: orderLabel(order), tag: `order-${order.id}` });
  notification.onclick = () => {
    window.focus();
    activateTab("orders-panel");
    requestAnimationFrame(() => {
      const row = $(`[data-order-id="${CSS.escape(order.id)}"]`);
      row?.classList.add("order-highlight");
      row?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      const audio = new AudioContextClass();
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.connect(gain); gain.connect(audio.destination);
      gain.gain.value = 0.045; oscillator.frequency.value = 660;
      oscillator.start(); oscillator.stop(audio.currentTime + 0.12);
      oscillator.onended = () => audio.close();
    }
  } catch (_) {}
}

function setupBrowserNotifications() {
  const status = $("#notification-status");
  const button = $("#enable-notifications");
  const update = () => {
    if (!("Notification" in window)) {
      status.textContent = "Não suportadas neste browser";
      button.disabled = true;
    } else if (Notification.permission === "denied") {
      status.textContent = "Bloqueadas pelo browser";
      button.disabled = false;
    } else if (Notification.permission === "granted") {
      status.textContent = "Ativas neste browser";
      button.textContent = "Notificações ativas";
      button.disabled = true;
      try { localStorage.setItem("nawebAdminNotifications", "true"); } catch (_) {}
    } else {
      status.textContent = "Desativadas";
      button.textContent = "Ativar notificações";
      button.disabled = false;
    }
  };
  update();
  button.addEventListener("click", async () => {
    if (!("Notification" in window)) return update();
    const permission = await Notification.requestPermission();
    try { localStorage.setItem("nawebAdminNotifications", String(permission === "granted")); } catch (_) {}
    update();
  });
}

async function saveOrderStatus(orderId, status) {
  if (!STATES.includes(status)) return;
  const order = state.orders.find((item) => item.id === orderId);
  if (!order) return;
  const previousStatus = order.estado;
  order.estado = status;
  renderOrders();
  renderSummary();
  try {
    await updateDoc(doc(db, "pedidos", orderId), { estado: status });
    setStatus("Estado do pedido atualizado.");
  } catch (error) {
    order.estado = previousStatus;
    renderOrders();
    renderSummary();
    setStatus("Não foi possível atualizar o estado do pedido.", true);
    console.error("saveOrderStatus:", error.code, error.message);
  }
}

function openOrder(orderId) {
  const order = state.orders.find((item) => item.id === orderId);
  if (!order) return;
  state.currentOrder = order;
  const phone = String(order.telefone || "").replace(/\D/g, "");
  const whatsAppMessage = encodeURIComponent(`Olá ${order.nome || ""}, obrigado pelo teu pedido à NaWeb. Gostaria de falar contigo sobre o teu projeto.`);
  const mailMessage = encodeURIComponent(`Olá ${order.nome || ""},\n\nObrigado pelo teu pedido. Vamos falar sobre o teu projeto.\n\nA equipa NaWeb`);
  const history = Array.isArray(order.historicoNotas) ? order.historicoNotas : (order.notaInterna ? [{ texto: order.notaInterna, em: null }] : []);
  const reminder = order.lembrarEm || "";
  const overdue = reminder && reminder < dayKey();
  $("#order-detail-content").innerHTML = `
    <span class="eyebrow">Pedido recebido</span><h2>${escapeHtml(order.nome || "Sem nome")}</h2>
    <div class="detail-grid"><p><strong>Email</strong>${escapeHtml(order.email || "—")}</p><p><strong>Telemóvel</strong>${escapeHtml(order.telefone || "—")}</p><p><strong>Negócio</strong>${escapeHtml(order.tipoNegocio || "—")}</p><p><strong>Plano</strong>${escapeHtml(order.plano || "—")}</p><p><strong>Recebido</strong>${escapeHtml(order.criadoEm ? new Intl.DateTimeFormat("pt-PT", { dateStyle: "medium", timeStyle: "short" }).format(getOrderDate(order)) : "—")}</p></div>
    <h3>Mensagem</h3><p class="order-detail-message">${escapeHtml(order.mensagem || "Sem mensagem")}</p>
    <div class="admin-action-row">${phone ? `<a class="btn btn-primary btn-small" href="https://wa.me/${phone}?text=${whatsAppMessage}" target="_blank" rel="noopener">WhatsApp</a><a class="btn btn-secondary btn-small" href="tel:${phone}">Ligar</a>` : ""}${order.email ? `<a class="btn btn-secondary btn-small" href="mailto:${encodeURIComponent(order.email)}?subject=${encodeURIComponent("O teu pedido à NaWeb")}&body=${mailMessage}">Email</a>` : ""}<button class="btn btn-secondary btn-small" type="button" data-copy-contacts="${escapeHtml(order.id)}">Copiar contactos</button></div>
    <form id="order-detail-form" class="form-grid"><label>Estado<select name="estado">${STATES.map((item) => `<option value="${item}" ${item === (order.estado || "novo") ? "selected" : ""}>${item}</option>`).join("")}</select></label><label>Valor do negócio (€)<input name="valorNegocio" type="number" min="0" step="0.01" value="${escapeHtml(order.valorNegocio ?? "")}"></label><label class="wide-field ${overdue ? "reminder-overdue" : ""}">Lembrar em<input name="lembrarEm" type="date" value="${escapeHtml(reminder)}"></label><label class="wide-field">Nota interna<textarea name="notaInterna" rows="3">${escapeHtml(order.notaInterna || "")}</textarea></label><button class="btn btn-primary" type="submit">Guardar detalhes</button><button class="btn btn-secondary" type="button" data-convert-client="${escapeHtml(order.id)}">Converter em cliente</button><button class="btn btn-secondary" type="button" data-delete-order="${escapeHtml(order.id)}">Apagar pedido</button></form>
    <h3>Histórico de notas</h3><div class="note-history">${history.map((item) => `<div class="timeline-item"><p>${escapeHtml(item.texto)}</p><small>${escapeHtml(item.em ? new Intl.DateTimeFormat("pt-PT", { dateStyle: "medium", timeStyle: "short" }).format(getDate(item.em)) : "Nota anterior")}</small></div>`).join("") || '<p class="form-note">Ainda não há notas.</p>'}</div>`;
  $("#order-detail").showModal();
}

$("#orders").addEventListener("click", (event) => {
  const openButton = event.target.closest("[data-open-order]");
  if (openButton) openOrder(openButton.dataset.openOrder);
  const deleteButton = event.target.closest("[data-delete-order]");
  if (deleteButton) removeOrder(deleteButton.dataset.deleteOrder);
  const copyButton = event.target.closest("[data-copy-contacts]");
  if (copyButton) {
    const order = state.orders.find((item) => item.id === copyButton.dataset.copyContacts);
    navigator.clipboard?.writeText([order?.nome, order?.email, order?.telefone].filter(Boolean).join(" · "))
      .then(() => setStatus("Contactos copiados."))
      .catch(() => setStatus("Não foi possível copiar os contactos.", true));
  }
  const convert = event.target.closest("[data-convert-client]");
  if (convert) convertOrderToClient(convert.dataset.convertClient);
});
$("#recent-orders").addEventListener("click", (event) => {
  const button = event.target.closest("[data-open-order]");
  if (button) openOrder(button.dataset.openOrder);
});
$("#order-detail-content").addEventListener("click", (event) => {
  const deleteButton = event.target.closest("[data-delete-order]");
  if (deleteButton) removeOrder(deleteButton.dataset.deleteOrder);
  const convertButton = event.target.closest("[data-convert-client]");
  if (convertButton) convertOrderToClient(convertButton.dataset.convertClient);
  const copyButton = event.target.closest("[data-copy-contacts]");
  if (copyButton) {
    const order = state.orders.find((item) => item.id === copyButton.dataset.copyContacts);
    if (!navigator.clipboard?.writeText) {
      setStatus("A cópia de contactos não está disponível neste browser.", true);
      return;
    }
    navigator.clipboard.writeText([order?.nome, order?.email, order?.telefone].filter(Boolean).join(" · "))
      .then(() => setStatus("Contactos copiados."))
      .catch(() => setStatus("Não foi possível copiar os contactos.", true));
  }
});
$("#orders").addEventListener("change", (event) => {
  const select = event.target.closest("[data-state]");
  if (select) saveOrderStatus(select.dataset.state, select.value);
});
$("#order-detail-content").addEventListener("submit", async (event) => {
  if (event.target.id !== "order-detail-form") return;
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.target));
  const order = state.currentOrder;
  const oldNote = order.notaInterna || "";
  const notes = Array.isArray(order.historicoNotas) ? [...order.historicoNotas] : (oldNote ? [{ texto: oldNote, em: null }] : []);
  const newNote = String(data.notaInterna || "").trim();
  if (newNote && newNote !== oldNote) notes.push({ texto: newNote, em: new Date().toISOString() });
  try {
    await updateDoc(doc(db, "pedidos", order.id), {
      estado: data.estado,
      notaInterna: newNote,
      historicoNotas: notes,
      lembrarEm: data.lembrarEm || "",
      valorNegocio: Number(data.valorNegocio) || 0
    });
    setStatus("Detalhes do pedido guardados.");
    $("#order-detail").close();
  } catch (error) {
    setStatus("Não foi possível guardar os detalhes do pedido.", true);
    console.error("saveOrderDetails:", error.code, error.message);
  }
});

async function removeOrder(id) {
  if (!confirm("Apagar este pedido? Esta ação não pode ser anulada.")) return;
  try {
    await deleteDoc(doc(db, "pedidos", id));
    $("#order-detail").close();
    setStatus("Pedido apagado.");
  } catch (error) {
    setStatus("Não foi possível apagar o pedido.", true);
    console.error("removeOrder:", error.code, error.message);
  }
}

async function convertOrderToClient(id) {
  const order = state.orders.find((item) => item.id === id);
  if (!order) return;
  const monthlyPlan = state.plans.find((plan) => plan.id === order.plano || plan.nome === order.plano);
  const monthlyValue = Number(monthlyPlan?.preco) || 0;
  const creationValue = Number(order.valorNegocio) || Number(monthlyPlan?.precoCriacao) || 0;
  if (!confirm(`Converter ${order.nome || "este pedido"} em cliente?`)) return;
  try {
    await addDoc(collection(db, "clientes"), {
      nome: order.nome || "",
      contacto: order.telefone || order.email || "",
      plano: order.plano || "",
      valorCriacao: creationValue,
      entrada50Paga: false,
      restante50Pago: false,
      mensalidade: monthlyValue,
      inicio: dayKey(),
      proximaCobranca: "",
      estado: "ativo",
      notas: order.mensagem || "",
      pedidoId: order.id,
      criadoEm: serverTimestamp()
    });
    await updateDoc(doc(db, "pedidos", id), { estado: "fechado", clienteCriado: true });
    $("#order-detail").close();
    activateTab("clients-panel");
    setStatus("Pedido convertido em cliente.");
  } catch (error) {
    setStatus("Não foi possível criar o cliente.", true);
    console.error("convertOrderToClient:", error.code, error.message);
  }
}

function loadClients() {
  state.unsubscribers.push(onSnapshot(query(collection(db, "clientes"), orderBy("nome")), (snapshot) => {
    state.clients = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
    renderClients();
    renderSummary();
  }, (error) => {
    $("#clients-error").textContent = error.code === "permission-denied" ? "Sem permissões para ler clientes. Publica as regras Firestore atualizadas." : "Não foi possível carregar os clientes.";
    console.error("loadClients:", error.code, error.message);
  }));
}

function renderClients() {
  const root = $("#clients");
  const active = state.clients.filter((client) => client.estado !== "cancelado");
  const mrr = active.reduce((sum, client) => sum + (Number(client.mensalidade) || 0), 0);
  const due = state.clients.reduce((sum, client) => {
    const value = Number(client.valorCriacao) || 0;
    return sum + (client.entrada50Paga ? 0 : value / 2) + (client.restante50Pago ? 0 : value / 2);
  }, 0);
  $("#clients-mrr").textContent = money(mrr);
  $("#clients-due").textContent = money(due);
  const dueSoon = active.filter((client) => client.proximaCobranca && client.proximaCobranca >= dayKey() && client.proximaCobranca <= dayKey(new Date(Date.now() + 7 * DAY_MS)));
  $("#billing-alert").hidden = dueSoon.length === 0;
  $("#billing-alert").textContent = dueSoon.length ? `${dueSoon.length} cobrança${dueSoon.length === 1 ? "" : "s"} prevista${dueSoon.length === 1 ? "" : "s"} nos próximos 7 dias.` : "";
  $("#clients-empty").hidden = state.clients.length > 0;
  root.innerHTML = state.clients.map((client) => `<tr data-client-id="${escapeHtml(client.id)}"><td><strong>${escapeHtml(client.nome || "Sem nome")}</strong><br><small>${escapeHtml(client.contacto || "")}</small></td><td>${escapeHtml(client.plano || "—")}</td><td><select data-client-field="estado" aria-label="Estado do cliente">${["ativo", "cancelado"].map((item) => `<option ${item === (client.estado || "ativo") ? "selected" : ""}>${item}</option>`).join("")}</select></td><td><label class="check-row"><input data-client-field="entrada50Paga" type="checkbox" ${client.entrada50Paga ? "checked" : ""}> Entrada 50%</label><label class="check-row"><input data-client-field="restante50Pago" type="checkbox" ${client.restante50Pago ? "checked" : ""}> Restante 50%</label></td><td><input data-client-field="mensalidade" type="number" min="0" step="0.01" value="${escapeHtml(client.mensalidade || 0)}" aria-label="Mensalidade"></td><td><button class="btn btn-secondary btn-small" type="button" data-save-client="${escapeHtml(client.id)}">Guardar</button></td></tr>`).join("");
}

$("#clients").addEventListener("click", async (event) => {
  const button = event.target.closest("[data-save-client]");
  if (!button) return;
  const row = button.closest("tr");
  const data = {};
  row.querySelectorAll("[data-client-field]").forEach((input) => {
    data[input.dataset.clientField] = input.type === "checkbox" ? input.checked
      : input.type === "number" ? Number(input.value) || 0 : input.value;
  });
  try {
    await updateDoc(doc(db, "clientes", button.dataset.saveClient), data);
    setStatus("Cliente atualizado.");
  } catch (error) {
    setStatus("Não foi possível atualizar o cliente.", true);
    console.error("saveClient:", error.code, error.message);
  }
});

$("#client-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget));
  try {
    await addDoc(collection(db, "clientes"), {
      ...data,
      valorCriacao: Number(data.valorCriacao) || 0,
      mensalidade: Number(data.mensalidade) || 0,
      entrada50Paga: false,
      restante50Pago: false,
      inicio: data.inicio || dayKey(),
      proximaCobranca: data.proximaCobranca || "",
      estado: "ativo",
      notas: "",
      criadoEm: serverTimestamp()
    });
    event.currentTarget.reset();
    setStatus("Cliente adicionado.");
  } catch (error) {
    setStatus("Não foi possível adicionar o cliente.", true);
    console.error("createClient:", error.code, error.message);
  }
});

function loadDailyVisits() {
  const dailyQuery = query(collection(db, "estatisticas_diarias"), where("dia", ">=", "2000-01-01"), orderBy("dia"));
  state.unsubscribers.push(onSnapshot(dailyQuery, (snapshot) => {
    state.visits = snapshot.docs.map((item) => item.data()).sort((a, b) => a.dia.localeCompare(b.dia));
    populateYearFilter();
    renderVisitors();
    renderSummary();
  }, (error) => {
    $("#visits-error").textContent = error.code === "permission-denied" ? "Sem permissões para ler estatísticas diárias. Publica as regras Firestore atualizadas." : "Não foi possível carregar as estatísticas diárias.";
    console.error("loadDailyVisits:", error.code, error.message);
  }));
}

function loadLegacyVisits() {
  state.unsubscribers.push(onSnapshot(doc(db, "estatisticas", "visitas"), (snapshot) => {
    state.legacyVisits = Number(snapshot.data()?.total) || 0;
    renderVisitors();
  }, (error) => console.error("loadLegacyVisits:", error.code, error.message)));
}

function populateYearFilter() {
  const select = $("#visits-year");
  const years = [...new Set([...state.visits.map((visit) => Number(visit.dia.slice(0, 4))), new Date().getFullYear()])].filter(Number.isFinite).sort((a, b) => b - a);
  if (!years.length) years.push(new Date().getFullYear());
  if (!years.includes(state.selectedYear)) state.selectedYear = years[0];
  select.innerHTML = years.map((year) => `<option value="${year}" ${year === state.selectedYear ? "selected" : ""}>${year}</option>`).join("");
}

function periodVisits(year = state.selectedYear, month = state.selectedMonth) {
  const filtered = state.visits.filter((visit) => Number(visit.dia.slice(0, 4)) === Number(year)
    && (month === "todos" || Number(visit.dia.slice(5, 7)) === Number(month)));
  return new Map(filtered.map((visit) => [visit.dia, visit]));
}

function renderVisitorMetrics() {
  const today = dayKey();
  const yesterdayDate = new Date(`${today}T12:00:00`);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = dayKey(yesterdayDate);
  const sumBetween = (start, end) => state.visits.filter((visit) => visit.dia >= start && visit.dia <= end).reduce((sum, visit) => sum + (Number(visit.visitas) || 0), 0);
  const weekStart = new Date(`${today}T12:00:00`);
  weekStart.setDate(weekStart.getDate() - 6);
  const monthStart = `${today.slice(0, 7)}-01`;
  const yearStart = `${today.slice(0, 4)}-01-01`;
  const dailySum = state.visits.reduce((sum, visit) => sum + (Number(visit.visitas) || 0), 0);
  const legacyOnly = Math.max(0, state.legacyVisits - dailySum);
  $("#visits-today").textContent = String(sumBetween(today, today));
  $("#visits-yesterday").textContent = String(sumBetween(yesterday, yesterday));
  $("#visits-week").textContent = String(sumBetween(dayKey(weekStart), today));
  $("#visits-month").textContent = String(sumBetween(monthStart, today));
  $("#visits-year").textContent = String(sumBetween(yearStart, today));
  $("#visits-total").textContent = String(dailySum + legacyOnly);
  $("#visits-history-note").textContent = state.visits.length ? `Sem detalhe por dia antes de ${new Intl.DateTimeFormat("pt-PT").format(getDate(state.visits[0].dia))}.` : "Ainda sem estatísticas diárias.";
  const best = state.visits.reduce((current, visit) => Number(visit.visitas) > Number(current?.visitas || 0) ? visit : current, null);
  $("#visits-best").textContent = best ? `${best.visitas} · ${new Intl.DateTimeFormat("pt-PT", { day: "2-digit", month: "2-digit", year: "numeric" }).format(getDate(best.dia))}` : "—";
  const firstDay = state.visits.length ? getDate(state.visits[0].dia) : null;
  const calendarDays = firstDay ? Math.max(1, Math.floor((new Date(`${today}T12:00:00`) - firstDay) / DAY_MS) + 1) : 0;
  $("#visits-average").textContent = calendarDays ? (dailySum / calendarDays).toLocaleString("pt-PT", { maximumFractionDigits: 1 }) : "0";
}

function buildVisitorRows() {
  const visits = periodVisits();
  if (state.visitorView === "day") {
    const month = state.selectedMonth === "todos" ? 0 : Number(state.selectedMonth);
    const start = month ? new Date(state.selectedYear, month - 1, 1, 12) : new Date(state.selectedYear, 0, 1, 12);
    const end = month ? new Date(state.selectedYear, month, 0, 12) : new Date(state.selectedYear, 11, 31, 12);
    const rows = [];
    const today = dayKey();
    for (const date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const key = dayKey(date);
      if (key <= today) rows.push({ dia: key, visitas: Number(visits.get(key)?.visitas) || 0, mobile: Number(visits.get(key)?.mobile) || 0, desktop: Number(visits.get(key)?.desktop) || 0 });
    }
    return rows.reverse();
  }
  if (state.visitorView === "weekday") {
    const names = ["segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado", "domingo"];
    const totals = Array.from({ length: 7 }, (_, index) => ({ nome: names[index], visitas: 0, dias: 0 }));
    const month = state.selectedMonth === "todos" ? 0 : Number(state.selectedMonth);
    const first = month ? new Date(state.selectedYear, month - 1, 1, 12) : new Date(state.selectedYear, 0, 1, 12);
    const last = month ? new Date(state.selectedYear, month, 0, 12) : new Date(state.selectedYear, 11, 31, 12);
    const visitMap = periodVisits();
    for (const date = new Date(first); date <= last; date.setDate(date.getDate() + 1)) {
      const weekday = (date.getDay() + 6) % 7;
      totals[weekday].visitas += Number(visitMap.get(dayKey(date))?.visitas) || 0;
      totals[weekday].dias += 1;
    }
    const total = totals.reduce((sum, row) => sum + row.visitas, 0);
    return totals.map((row) => ({ ...row, media: row.dias ? row.visitas / row.dias : 0, percentagem: total ? row.visitas / total * 100 : 0 }));
  }
  if (state.visitorView === "month") {
    return Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      const rows = state.visits.filter((visit) => Number(visit.dia.slice(0, 4)) === state.selectedYear && Number(visit.dia.slice(5, 7)) === month);
      const total = rows.reduce((sum, visit) => sum + (Number(visit.visitas) || 0), 0);
      const max = rows.reduce((best, visit) => Math.max(best, Number(visit.visitas) || 0), 0);
      const days = new Date(state.selectedYear, month, 0).getDate();
      return { nome: new Intl.DateTimeFormat("pt-PT", { month: "long" }).format(new Date(state.selectedYear, index, 1)), visitas: total, media: total / days, melhorDia: max };
    });
  }
  const years = [...new Set(state.visits.map((visit) => Number(visit.dia.slice(0, 4))))].sort((a, b) => b - a);
  return years.map((year) => ({ nome: String(year), visitas: state.visits.filter((visit) => Number(visit.dia.slice(0, 4)) === year).reduce((sum, visit) => sum + (Number(visit.visitas) || 0), 0) }));
}

function visitorColumns(rows) {
  if (state.visitorView === "day") return [
    ["Data", (row) => new Intl.DateTimeFormat("pt-PT", { day: "2-digit", month: "2-digit", year: "numeric" }).format(getDate(row.dia))],
    ["Dia da semana", (row) => new Intl.DateTimeFormat("pt-PT", { weekday: "long" }).format(getDate(row.dia))],
    ["Visitas", (row) => row.visitas], ["Telemóvel", (row) => row.mobile], ["Computador", (row) => row.desktop],
    ["Variação", (row, index) => {
      const previous = rows[index + 1]?.visitas || 0;
      if (previous === 0 && row.visitas === 0) return "—";
      if (previous === 0) return "↑ Novo";
      const diff = (row.visitas - previous) / previous * 100;
      const arrow = diff > 0 ? "↑" : diff < 0 ? "↓" : "→";
      return `<span class="${diff > 0 ? "change-up" : diff < 0 ? "change-down" : ""}">${arrow} ${Math.round(Math.abs(diff))}%</span>`;
    }]
  ];
  if (state.visitorView === "weekday") return [["Dia da semana", (row) => row.nome], ["Visitas", (row) => row.visitas], ["Média diária", (row) => row.media.toLocaleString("pt-PT", { maximumFractionDigits: 1 })], ["Percentagem", (row) => `${row.percentagem.toFixed(1)}%`]];
  if (state.visitorView === "month") return [["Mês", (row) => row.nome], ["Visitas", (row) => row.visitas], ["Média diária", (row) => row.media.toLocaleString("pt-PT", { maximumFractionDigits: 1 })], ["Melhor dia", (row) => row.melhorDia]];
  return [["Ano", (row) => row.nome], ["Visitas", (row) => row.visitas]];
}

function renderVisitors() {
  renderVisitorMetrics();
  const allRows = buildVisitorRows();
  const rows = state.visitorView === "day" ? allRows.slice(0, state.visitorRowsLimit) : allRows;
  const columns = visitorColumns(allRows);
  const total = allRows.reduce((sum, row) => sum + (Number(row.visitas) || 0), 0);
  const best = allRows.reduce((value, row) => Math.max(value, Number(row.visitas) || 0), 0);
  const today = dayKey();
  const headers = columns.map(([label]) => `<th>${label}</th>`).join("");
  const body = rows.map((row, index) => {
    const isToday = row.dia === today;
    const isBest = row.visitas === best && best > 0;
    const cells = columns.map(([, value]) => `<td>${value(row, index)}</td>`).join("");
    return `<tr class="${isToday ? "is-today" : ""} ${isBest ? "is-best" : ""}">${cells}</tr>`;
  }).join("");
  const totalCells = columns.map(([label], index) => `<td>${index === 0 ? (state.visitorView === "day" ? "Total do período" : "Total") : (label === "Visitas" ? total : "")}</td>`).join("");
  $("#visitor-table").className = "visitor-table table-scroll";
  $("#visitor-table").innerHTML = `<table><thead><tr>${headers}</tr></thead><tbody>${body}</tbody><tfoot><tr>${totalCells}</tr></tfoot></table>`;
  $("#visits-more").hidden = state.visitorView !== "day" || allRows.length <= state.visitorRowsLimit;
  $("#visits-less").hidden = state.visitorView !== "day" || state.visitorRowsLimit <= 7;
  renderVisitorCharts(allRows);
  renderDemoAnalytics();
}

function renderVisitorCharts(rows) {
  const labelKey = state.visitorView === "day" ? "dia" : "nome";
  const labels = rows.map((row) => state.visitorView === "day" ? new Intl.DateTimeFormat("pt-PT", { day: "2-digit", month: "2-digit" }).format(getDate(row.dia)) : row.nome);
  chartUpdate("#visits-period-chart", "bar", labels, [{
    label: "Visitas",
    data: rows.map((row) => Number(row.visitas) || 0),
    backgroundColor: chartColors().blue,
    borderRadius: 5
  }], { indexAxis: "x" });
}

function renderDemoAnalytics() {
  const years = periodVisits();
  const totals = DEMOS.map((demo) => ({
    demo,
    total: [...years.values()].reduce((sum, visit) => sum + (Number(visit[`demo_${demo}`]) || 0), 0)
  })).sort((a, b) => b.total - a.total);
  chartUpdate("#demo-views-chart", "bar", totals.map((item) => item.demo), [{
    label: "Visualizações",
    data: totals.map((item) => item.total),
    backgroundColor: chartColors().mint,
    borderRadius: 5
  }]);
  $("#demo-views-table").innerHTML = `<div class="table-scroll"><table><thead><tr><th>Demo</th><th>Visualizações</th></tr></thead><tbody>${totals.map((item) => `<tr><td>${escapeHtml(item.demo)}</td><td>${item.total}</td></tr>`).join("")}</tbody></table></div>`;
}

function downloadCsv(filename, rows) {
  const csv = `\uFEFF${rows.map((row) => row.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(";")).join("\r\n")}`;
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function exportOrders() {
  const orders = filteredOrders();
  downloadCsv("pedidos-naweb.csv", [
    ["Nome", "Email", "Telemóvel", "Negócio", "Plano", "Estado", "Data", "Mensagem"],
    ...orders.map((order) => [order.nome, order.email, order.telefone, order.tipoNegocio, order.plano, order.estado || "novo", getOrderDate(order)?.toISOString() || "", order.mensagem])
  ]);
}

function exportVisitors() {
  const rows = buildVisitorRows();
  const columns = visitorColumns(rows);
  const [headers, ...data] = [columns.map(([label]) => label), ...rows.map((row, index) => columns.map(([, value]) => String(value(row, index)).replace(/<[^>]*>/g, "")))];
  downloadCsv(`visitantes-naweb-${state.selectedYear}.csv`, [headers, ...data]);
}

function setupVisitorControls() {
  $("#visits-year").addEventListener("change", (event) => { state.selectedYear = Number(event.target.value); state.visitorRowsLimit = 7; renderVisitors(); });
  $("#visits-month").addEventListener("change", (event) => { state.selectedMonth = event.target.value; state.visitorRowsLimit = 7; renderVisitors(); });
  $("#period-prev").addEventListener("click", () => shiftMonth(-1));
  $("#period-next").addEventListener("click", () => shiftMonth(1));
  $$("[data-visitor-view]").forEach((button) => button.addEventListener("click", () => {
    state.visitorView = button.dataset.visitorView;
    state.visitorRowsLimit = 7;
    $$("[data-visitor-view]").forEach((item) => item.classList.toggle("is-active", item === button));
    renderVisitors();
  }));
  $("#visits-more").addEventListener("click", () => { state.visitorRowsLimit += 7; renderVisitors(); });
  $("#visits-less").addEventListener("click", () => { state.visitorRowsLimit = 7; renderVisitors(); });
}

function shiftMonth(offset) {
  state.visitorRowsLimit = 7;
  const month = state.selectedMonth === "todos" ? new Date().getMonth() : Number(state.selectedMonth) - 1;
  const date = new Date(state.selectedYear, month + offset, 1);
  state.selectedYear = date.getFullYear();
  state.selectedMonth = String(date.getMonth() + 1);
  $("#visits-month").value = state.selectedMonth;
  populateYearFilter();
  renderVisitors();
}

async function loadPlans() {
  try {
    const snapshot = await getDocs(collection(db, "planos"));
    state.plans = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
    $("#plans").innerHTML = state.plans.map((plan) => `<article class="card admin-row" data-plan-id="${escapeHtml(plan.id)}"><strong>${escapeHtml(plan.nome || plan.id)}</strong><label>Preço mensal (€)<input data-plan-field="preco" type="number" min="0" step="0.01" value="${escapeHtml(plan.preco || 0)}"></label><label>Preço de criação (€)<input data-plan-field="precoCriacao" type="number" min="0" step="0.01" value="${escapeHtml(plan.precoCriacao || 0)}"></label><label>Descrição<input data-plan-field="descricao" value="${escapeHtml(plan.descricao || "")}"></label><button class="btn btn-secondary btn-small" type="button" data-save-plan="${escapeHtml(plan.id)}">Guardar plano</button></article>`).join("") || '<p class="empty-state card">Carrega os dados iniciais para começar.</p>';
  } catch (error) {
    $("#plans-error").textContent = error.code === "permission-denied" ? "Sem permissões para ler planos." : "Não foi possível carregar os planos.";
    console.error("loadPlans:", error.code, error.message);
  }
}

$("#plans").addEventListener("click", async (event) => {
  const button = event.target.closest("[data-save-plan]");
  if (!button) return;
  const row = button.closest("[data-plan-id]");
  try {
    await updateDoc(doc(db, "planos", button.dataset.savePlan), {
      preco: Number(row.querySelector('[data-plan-field="preco"]').value) || 0,
      precoCriacao: Number(row.querySelector('[data-plan-field="precoCriacao"]').value) || 0,
      descricao: row.querySelector('[data-plan-field="descricao"]').value
    });
    setStatus("Plano atualizado.");
  } catch (error) {
    setStatus("Não foi possível atualizar o plano.", true);
    console.error("savePlan:", error.code, error.message);
  }
});

async function loadSettings() {
  try {
    const [site, chatbot] = await Promise.all([
      getDoc(doc(db, "configuracoes", "site")),
      getDoc(doc(db, "configuracoes", "chatbot"))
    ]);
    if (site.exists()) state.settings = { ...defaults.configuracoes, ...site.data() };
    fillSettingsForm();
    const commands = chatbot.exists() && Array.isArray(chatbot.data().comandos) ? chatbot.data().comandos : [];
    renderCommands(commands);
  } catch (error) {
    setStatus("Não foi possível carregar as definições.", true);
    console.error("loadSettings:", error.code, error.message);
  }
}

function fillSettingsForm() {
  const form = $("#site-settings-form");
  for (const field of ["whatsapp", "telefone", "email", "instagram", "facebook", "intervaloMs"]) {
    form.elements[field].value = state.settings[field] ?? "";
  }
  form.elements.mensagensHero.value = (state.settings.mensagensHero || []).join("\n");
  form.elements.mensagensBarra.value = (state.settings.mensagensBarra || []).join("\n");
}

$("#site-settings-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const value = {
    whatsapp: form.elements.whatsapp.value.trim(),
    telefone: form.elements.telefone.value.trim(),
    email: form.elements.email.value.trim(),
    instagram: form.elements.instagram.value.trim(),
    facebook: form.elements.facebook.value.trim(),
    intervaloMs: Math.max(1000, Number(form.elements.intervaloMs.value) || 3000),
    mensagensHero: form.elements.mensagensHero.value.split("\n").map((item) => item.trim()).filter(Boolean),
    mensagensBarra: form.elements.mensagensBarra.value.split("\n").map((item) => item.trim()).filter(Boolean)
  };
  try {
    await setDoc(doc(db, "configuracoes", "site"), value, { merge: true });
    state.settings = value;
    setStatus("Definições guardadas.");
  } catch (error) {
    setStatus("Não foi possível guardar as definições.", true);
    console.error("saveSettings:", error.code, error.message);
  }
});

function renderCommands(commands) {
  $("#chatbot-commands").innerHTML = commands.map((command) => `<div class="command-row"><label>Pergunta<input data-command-question value="${escapeHtml(command.pergunta || "")}"></label><label>Resposta<input data-command-answer value="${escapeHtml(command.resposta || "")}"></label><button class="btn btn-secondary btn-small" type="button" data-remove-command>Remover</button></div>`).join("");
}

$("#add-command").addEventListener("click", () => {
  const container = $("#chatbot-commands");
  const row = document.createElement("div");
  row.className = "command-row";
  row.innerHTML = '<label>Pergunta<input data-command-question></label><label>Resposta<input data-command-answer></label><button class="btn btn-secondary btn-small" type="button" data-remove-command>Remover</button>';
  container.append(row);
});
$("#chatbot-commands").addEventListener("click", (event) => {
  if (event.target.closest("[data-remove-command]")) event.target.closest(".command-row").remove();
});
$("#save-commands").addEventListener("click", async () => {
  const comandos = $$(".command-row", $("#chatbot-commands")).map((row) => ({
    pergunta: row.querySelector("[data-command-question]").value.trim(),
    resposta: row.querySelector("[data-command-answer]").value.trim()
  })).filter((command) => command.pergunta && command.resposta);
  try {
    await setDoc(doc(db, "configuracoes", "chatbot"), { comandos }, { merge: true });
    setStatus("Comandos personalizados guardados.");
  } catch (error) {
    setStatus("Não foi possível guardar os comandos personalizados.", true);
    console.error("saveChatbotCommands:", error.code, error.message);
  }
});

async function setupTelegramStatus() {
  $("#telegram-status").textContent = "Ainda não testado.";
}

$("#test-telegram").addEventListener("click", async () => {
  const button = $("#test-telegram");
  button.disabled = true;
  $("#telegram-status").textContent = "A testar…";
  try {
    const response = await fetch("/api/notificar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome: "", plano: "", tipoNegocio: "", teste: true })
    });
    const result = await response.json();
    if (response.ok && result.ok) $("#telegram-status").textContent = "ok — notificação de teste enviada.";
    else if (result.error === "not_configured") $("#telegram-status").textContent = "not_configured — configura os Secrets no Cloudflare Pages.";
    else $("#telegram-status").textContent = `Não foi possível enviar o teste (${result.error || response.status}).`;
  } catch (_) {
    $("#telegram-status").textContent = "Não foi possível contactar a função de notificações.";
  } finally { button.disabled = false; }
});

async function seed() {
  if (!confirm("Carregar dados iniciais? Esta ação atualiza os planos, exemplos, FAQ e definições predefinidas.")) return;
  try {
    for (const plan of defaults.planos) await setDoc(doc(db, "planos", plan.id), plan);
    for (const item of defaults.exemplos) {
      const { id, ...data } = item;
      await setDoc(doc(db, "exemplos", id), data);
    }
    for (const [index, item] of defaults.faq.entries()) await setDoc(doc(db, "faq", `faq-${index + 1}`), item);
    await setDoc(doc(db, "configuracoes", "site"), defaults.configuracoes);
    setStatus("Dados iniciais carregados.");
    await loadPlans();
    await loadSettings();
  } catch (error) {
    setStatus("Não foi possível carregar os dados iniciais.", true);
    console.error("seed:", error.code, error.message);
  }
}
$("#seed").addEventListener("click", seed);

function activateTab(id) {
  $$(".admin-panel").forEach((panel) => panel.classList.toggle("is-active", panel.id === id));
  $$(".nav-item").forEach((button) => button.classList.toggle("is-active", button.dataset.tab === id));
  if (id === "visits-panel") renderVisitors();
}

$$("[data-tab]").forEach((button) => button.addEventListener("click", () => activateTab(button.dataset.tab)));
$$("[data-go-tab]").forEach((button) => button.addEventListener("click", () => activateTab(button.dataset.goTab)));
$("#logout").addEventListener("click", () => logout(false));
$("#export-orders").addEventListener("click", exportOrders);
$("#export-visits").addEventListener("click", exportVisitors);
let orderSearchTimer;
$("#order-search").addEventListener("input", () => {
  clearTimeout(orderSearchTimer);
  orderSearchTimer = setTimeout(renderOrders, 200);
});
["order-status-filter", "order-plan-filter", "order-business-filter", "order-date-from", "order-date-to"].forEach((id) => $(`#${id}`).addEventListener("change", renderOrders));
$$("[data-orders-view]").forEach((button) => button.addEventListener("click", () => {
  state.ordersView = button.dataset.ordersView;
  $$("[data-orders-view]").forEach((item) => item.classList.toggle("is-active", item === button));
  renderOrders();
}));
setupVisitorControls();
setupBrowserNotifications();
setupTheme();

if (auth) {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      cleanupListeners();
      if (!state.signedOutByUser) showLogin();
      state.signedOutByUser = false;
      return;
    }
    try {
      if (await checkAdmin(user)) {
        state.signedOutByUser = false;
        showApp(user);
        resetIdleTimer();
        startRealtime();
      } else {
        state.signedOutByUser = true;
        await signOut(auth);
        showLogin("Esta conta não tem permissões de administrador.");
      }
    } catch (error) {
      state.signedOutByUser = true;
      await signOut(auth);
      showLogin("Não foi possível verificar as permissões de administrador.");
      console.error("checkAdmin:", error.code, error.message);
    }
  });
} else {
  showLogin("Configura o Firebase antes de entrar.");
}
