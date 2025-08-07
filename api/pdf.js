// api/pdf.js
import PDFDocument from "pdfkit";
import { db } from "./firebase.js";

export const config = {
  api: { bodyParser: false },
};

// Theme inspired by reference image: black canvas, yellow question, white options
const theme = {
  background: '#000000',
  question: '#FFD700',
  option: '#FFFFFF',
  brand: '#FFFFFF',
  brandAccent: '#00C853', // green accent
  questionFont: 'Times-Bold',
  optionFont: 'Times-Roman',
  questionSize: 30,
  optionSize: 26,
  topSafeY: 110,
};

function paintBackground(doc) {
  doc.save();
  doc.rect(0, 0, doc.page.width, doc.page.height).fill(theme.background);
  doc.restore();
}

function drawBrand(doc) {
  // Simple textual brand to avoid image assets
  doc.save();
  doc.fillColor(theme.brand).font('Times-Bold').fontSize(20);
  doc.text('Result गुरु', doc.page.margins.left, doc.page.margins.top - 30, {
    width: 200,
  });
  // Small accent dot to the left for a hint of the logo color
  doc.circle(doc.page.margins.left - 14, doc.page.margins.top - 18, 5).fill(theme.brandAccent);
  doc.restore();
}

function renderQuestions(doc, questions) {
  // First page chrome
  paintBackground(doc);
  drawBrand(doc);
  doc.y = theme.topSafeY;

  doc.on('pageAdded', () => {
    paintBackground(doc);
    drawBrand(doc);
    doc.y = theme.topSafeY;
  });

  const contentWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  questions.forEach((question, index) => {
    if (index > 0) doc.addPage();

    const numberLabel = `${index + 1}.`;
    const questionText = typeof question.q === 'string' && question.q.trim().length > 0
      ? question.q.trim()
      : 'Untitled question';

    // Number + question in yellow serif, large
    doc.font(theme.questionFont).fontSize(theme.questionSize).fillColor(theme.question);
    doc.text(`${numberLabel} ${questionText}`, doc.page.margins.left, doc.y, {
      width: contentWidth,
      align: 'left',
    });
    doc.moveDown(1);

    // Options in white serif, large
    const normalizedType = (question.type || '').toLowerCase();
    doc.font(theme.optionFont).fontSize(theme.optionSize).fillColor(theme.option);

    if ((normalizedType === 'mcq' || normalizedType === 'true_false') && Array.isArray(question.options) && question.options.length > 0) {
      question.options.forEach((rawOption) => {
        const optionText = String(rawOption);
        doc.text(optionText, {
          width: contentWidth,
          align: 'left',
        });
        doc.moveDown(0.4);
      });
    } else {
      // Short answer lines in subtle gray for contrast on black
      const startX = doc.page.margins.left;
      let currentY = doc.y + 8;
      const endX = doc.page.width - doc.page.margins.right;
      doc.strokeColor('#4f4f4f').lineWidth(0.6);
      for (let i = 0; i < 6; i += 1) {
        doc.moveTo(startX, currentY).lineTo(endX, currentY).stroke();
        currentY += 22;
      }
      // Reset fill color for any following text
      doc.fillColor(theme.option);
      doc.y = currentY;
    }
  });
}

export default async function handler(req, res) {
  try {
    const { userId, exportId } = req.query;
    if (!userId || !exportId) {
      res.status(400).send('Missing userId or exportId');
      return;
    }

    const snap = await db.ref(`exports/${userId}/${exportId}`).once('value');
    const data = snap.val();
    const questions = (data && Array.isArray(data.questions)) ? data.questions : [];

    // Stream PDF to client
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="questions-${exportId}.pdf"`);
    const doc = new PDFDocument({ size: 'A4', margins: { top: 64, bottom: 72, left: 56, right: 56 } });
    doc.pipe(res);
    renderQuestions(doc, questions);
    doc.end();
  } catch (err) {
    console.error('Error generating PDF on-the-fly:', err);
    res.status(500).send('Failed to generate PDF');
  }
}


