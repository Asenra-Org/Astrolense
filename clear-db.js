const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('./firebase-admin-key.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function clear() {
  const snapshot = await db.collection('events_feed').get();
  let count = 0;
  for (const doc of snapshot.docs) {
    await db.collection('events_feed').doc(doc.id).delete();
    count++;
  }
  console.log(`Deleted ${count} events.`);
}
clear();
