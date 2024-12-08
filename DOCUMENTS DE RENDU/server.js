const express = require('express');
const axios = require('axios');
const app = express();

// Port d'écoute du serveur
const PORT = 3000;

// Liste prédéfinie des villes
const cities = {
  'new york': { postalCode: '10001', country: 'US' },
  'paris': { postalCode: '75001', country: 'FR' },
  'londre': { postalCode: 'SW1A', country: 'GB' },
  'troyes': { postalCode: '10000', country: 'FR' },
  'rome': { postalCode: '00100', country: 'IT' },
  'quebec': { postalCode: 'G1A', country: 'CA' },
  'yaoundé': { postalCode: '00001', country: 'CM' }
};

// Clé API
const apiKey = 'c65fa1800c9b4bb389f0e2c4b4f72e18';

// Route pour obtenir la température
app.get('/temperature', async (req, res) => {
  try {
    const cityName = req.query.city?.toLowerCase(); // Récupère le paramètre 'city' en minuscule

    // Vérifie si la ville existe dans la liste
    if (!cities[cityName]) {
      return res.status(400).json({ error: 'Ville non reconnue. Veuillez choisir parmi : ' + Object.keys(cities).join(', ') });
    }

    const { postalCode, country } = cities[cityName];

    // Appel à l'API météo
    const url = `https://api.weatherbit.io/v2.0/current?postal_code=${postalCode}&country=${country}&key=${apiKey}`;
    const response = await axios.get(url);

    // Extraire la température
    const temperature = response.data.data[0].temp; // Température en Celsius

    // Renvoi de la température
    res.json({
      ville: cityName,
      temperature: temperature
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des données météo:', error);
    res.status(500).json({ error: 'Impossible de récupérer les données météo' });
  }
});

// Lancer le serveur
app.listen(PORT, () => {
  console.log(`Serveur en écoute sur http://localhost:${PORT}`);
});