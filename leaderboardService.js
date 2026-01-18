// leaderboardService.js
import { db, ensureAnonAuth } from "./firebaseClient.js";
import {
  doc, runTransaction,
  collection, query, orderBy, limit, getDocs
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

function normalizeName(name) {
  return name.trim().slice(0, 24); // limite semplice
}

export async function submitScoreIfBest(rawName, score) {
  const name = normalizeName(rawName);
  if (!name) throw new Error("Nome non valido");
  if (!Number.isFinite(score)) throw new Error("Score non valido");

  await ensureAnonAuth();

  const ref = doc(db, "leaderboard", name);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) {
      tx.set(ref, { name, bestScore: score, updatedAt: Date.now() });
      return;
    }
    const old = snap.data().bestScore ?? 0;
    if (score > old) {
      tx.update(ref, { bestScore: score, updatedAt: Date.now() });
    }
    // se score <= old: non fare nulla
  });

  return name;
}

export async function fetchTopLeaderboard(max = 10) {
  const q = query(
    collection(db, "leaderboard"),
    orderBy("bestScore", "desc"),
    limit(max)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data());
}
