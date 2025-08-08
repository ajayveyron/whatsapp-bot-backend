// api/admin/stats.js
import { db } from "../firebase.js";

export const config = { api: { bodyParser: false } };

function getMonthKey(date = new Date()) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export default async function handler(req, res) {
  const adminKey = process.env.ADMIN_API_KEY;
  const provided = req.headers['x-admin-key'];
  if (!adminKey || provided !== adminKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const month = (req.query.month || getMonthKey()).toString();
  try {
    const snap = await db.ref(`usage/${month}`).once('value');
    const data = snap.val() || {};

    // shape: { userId: { pdfCount, questionCount, lastAt } }
    // also compute totals
    let totalPdfs = 0;
    let totalQuestions = 0;
    const users = Object.entries(data).map(([userId, u]) => {
      const pdfCount = u?.pdfCount || 0;
      const questionCount = u?.questionCount || 0;
      totalPdfs += pdfCount;
      totalQuestions += questionCount;
      return { userId, pdfCount, questionCount, lastAt: u?.lastAt || null };
    }).sort((a, b) => b.pdfCount - a.pdfCount);

    res.status(200).json({ month, totalPdfs, totalQuestions, users });
  } catch (err) {
    console.error('Error reading usage stats:', err);
    res.status(500).json({ error: 'Failed to read stats' });
  }
}


