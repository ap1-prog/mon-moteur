import express from 'express';
import cors from 'cors';
import axios from 'axios';
import * as cheerio from 'cheerio';

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/analyze', async (req, res) => {
  const { url } = req.body;

  if (!url) return res.status(400).json({ error: 'URL manquante' });

  try {
    const start = Date.now();

    const response = await axios.get(url, {
      timeout: 5000,
      headers: { 'User-Agent': 'AuditBot/1.0' }
    });

    const duration = Date.now() - start;
    const $ = cheerio.load(response.data);
    const html = response.data;

    let score = 100;
    const issues = [];

    const isNoIndex = $('meta[name="robots"]').attr('content')?.includes('noindex');
    if (isNoIndex) {
      score = 49;
      issues.push("noindex détecté");
    }

    const hasCart =
      html.includes('add-to-cart') ||
      $('form[action*="/cart/add"]').length > 0 ||
      $('button[name="add"]').length > 0 ||
      $('button:contains("Panier")').length > 0;

    if (!hasCart) {
      score = Math.min(score, 49);
      issues.push("Panier introuvable");
    }

    const title = $('title').text().trim();
    if (!title) {
      score -= 20;
      issues.push("Titre manquant");
    }

    if (duration > 1500) {
      score -= 25;
      issues.push("Site lent");
    }

    if (score < 0) score = 0;

    res.json({ url, score, issues });

  } catch (e) {
    res.status(500).json({ error: "SCAN_FAILED" });
  }
});

app.listen(5000, () => console.log("Backend running"));
