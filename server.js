const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/analyze', async (req, res) => {
    const { url } = req.body;
    
    if (!url) {
        return res.status(400).json({ error: "L'URL est obligatoire" });
    }

    // Nettoyage et formatage de l'URL
    let targetUrl = url.trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        targetUrl = 'https://' + targetUrl;
    }

    try {
        const response = await axios.get(targetUrl, { 
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' 
            },
            timeout: 10000 
        });
        
        const html = response.data.toLowerCase();
        
        let points = 100;
        let diagnostic = {
            securite: { statut: "Excellent", icone: "✅", details: [] },
            ecommerce: { statut: "Excellent", icone: "✅", details: [] },
            mobile: { statut: "Excellent", icone: "✅", details: [] },
            confiance: { statut: "Excellent", icone: "✅", details: [] },
            seo: { statut: "Excellent", icone: "✅", details: [] },
            performance: { statut: "Excellent", icone: "✅", details: [] }
        };

        // 1. SÉCURITÉ
        if (!targetUrl.startsWith('https')) {
            points -= 20;
            diagnostic.securite.statut = "Critique";
            diagnostic.securite.icone = "❌";
            diagnostic.securite.details.push("Pas de connexion HTTPS cryptée. Les clients risquent de fuir.");
        } else {
            diagnostic.securite.details.push("Connexion HTTPS sécurisée détectée.");
        }

        // 2. LOGICIEL E-COMMERCE & PANIER
        const cartElements = ['panier', 'cart', 'add-to-cart', 'ajouter au panier', 'checkout', 'commander', 'shopify-section', 'wc-forward', 'product-form'];
        const hasCart = cartElements.some(el => html.includes(el));
        const paymentElements = ['stripe', 'paypal', 'visa', 'mastercard', 'cb', 'paiement sécurisé'];
        const hasPayment = paymentElements.some(el => html.includes(el));

        if (!hasCart) {
            points -= 20;
            diagnostic.ecommerce.statut = "Non détecté";
            diagnostic.ecommerce.icone = "❌";
            diagnostic.ecommerce.details.push("Aucun bouton d'achat ou structure de panier standard trouvée.");
        } else {
            diagnostic.ecommerce.details.push("Structure de panier et boutons d'achat fonctionnels détectés.");
        }
        if (!hasPayment) {
            points -= 10;
            diagnostic.ecommerce.details.push("Attention : Aucun logo de paiement sécurisé connu (Stripe, PayPal, Visa) visible directement.");
        }

        // 3. OPTIMISATION MOBILE
        if (html.includes('viewport') && html.includes('width=device-width')) {
            diagnostic.mobile.details.push("Le site intègre les balises pour un affichage parfait sur smartphone.");
        } else {
            points -= 15;
            diagnostic.mobile.statut = "Non optimisé";
            diagnostic.mobile.icone = "⚠️";
            diagnostic.mobile.details.push("Balise Viewport manquante. Le site risque de s'afficher en tout petit sur mobile.");
        }

        // 4. PREUVE SOCIALE & CONFIANCE LEGAL
        const trustPages = ['mentions légales', 'legal', 'cgv', 'conditions générales', 'contact', 'politique de confidentialité'];
        const foundTrust = trustPages.filter(p => html.includes(p));
        if (foundTrust.length < 2) {
            points -= 15;
            diagnostic.confiance.statut = "Risqué";
            diagnostic.confiance.icone = "⚠️";
            diagnostic.confiance.details.push("Pages de confiance manquantes (CGV, Mentions Légales ou Contact introuvables). Risque de sanctions légales.");
        } else {
            diagnostic.confiance.details.push(`Pages de confiance validées (${foundTrust.length} trouvées).`);
        }

        // 5. SEO (GOOGLE)
        if (!html.includes('<title>')) {
            points -= 10;
            diagnostic.seo.statut = "Faible";
            diagnostic.seo.icone = "❌";
            diagnostic.seo.details.push("Balise titre manquante. Ce site est invisible sur Google.");
        }
        if (!html.includes('name="description"') && !html.includes('property="og:description"')) {
            points -= 10;
            if(diagnostic.seo.statut === "Excellent") diagnostic.seo.statut = "Moyen";
            diagnostic.seo.details.push("Description SEO manquante pour les résultats de recherche.");
        }
        if (diagnostic.seo.details.length === 0) {
            diagnostic.seo.details.push("Balises SEO de base correctement configurées.");
        }

        // 6. PERFORMANCE (Poids estimé du code)
        const sizeKb = Math.round(html.length / 1024);
        if (sizeKb > 400) {
            points -= 10;
            diagnostic.performance.statut = "Lent";
            diagnostic.performance.icone = "⚠️";
            diagnostic.performance.details.push(`Le code source est très lourd (${sizeKb} KB). Risque de ralentissement au chargement.`);
        } else {
            diagnostic.performance.details.push(`Code source léger et rapide (${sizeKb} KB).`);
        }

        if (points < 0) points = 0;

        res.json({
            success: true,
            score: points,
            diagnostic: diagnostic
        });

    } catch (error) {
        res.json({
            success: false,
            score: 0,
            error: "Impossible d'analyser le site. L'adresse est invalide, le site est hors ligne, ou il bloque notre système de sécurité."
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Moteur Ultime déployé sur le port ${PORT}`));
