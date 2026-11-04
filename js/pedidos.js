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

export async function guardarPedido(data) {
  return guardarNoFirestore(data);
}
