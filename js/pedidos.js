import { config } from "./config.js";
import { db, collection, addDoc, serverTimestamp } from "./firebase.js";

async function guardarNoFirestore(data) {
  if (!db) throw new Error("Firebase não configurado");
  return addDoc(collection(db, "pedidos"), {
    ...data,
    estado: "novo",
    origem: "site",
    notaInterna: "",
    criadoEm: serverTimestamp()
  });
}

async function enviarFormspree(data) {
  if (config.FORMSPREE_ENDPOINT.includes("COLOCAR_ID_AQUI")) {
    console.warn("Formspree ainda não está configurado. Substitui o ID em js/config.js.");
    throw new Error("Formspree não configurado");
  }

  const response = await fetch(config.FORMSPREE_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify({
      nome: data.nome,
      email: data.email,
      telefone: data.telefone,
      tipoNegocio: data.tipoNegocio,
      plano: data.plano,
      mensagem: data.mensagem,
      _subject: `Novo pedido NaWeb – ${data.tipoNegocio} (${data.plano})`
    })
  });

  if (!response.ok) throw new Error(`Formspree respondeu com o estado ${response.status}`);
  return response;
}

export async function guardarPedido(data) {
  const [firestoreResult, formspreeResult] = await Promise.allSettled([
    guardarNoFirestore(data),
    enviarFormspree(data)
  ]);

  if (firestoreResult.status === "fulfilled") return firestoreResult.value;
  if (formspreeResult.status === "fulfilled") return formspreeResult.value;

  const firebaseError = firestoreResult.reason;
  const error = new Error(firebaseError?.message || formspreeResult.reason?.message || "Não foi possível enviar o pedido.");
  if (firebaseError?.code) error.code = firebaseError.code;
  throw error;
}
