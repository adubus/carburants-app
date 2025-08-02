export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Méthode non autorisée' });
    return;
  }

  try {
    const formData = new URLSearchParams();
    for (const [key, value] of Object.entries(req.body)) {
      formData.append(key, value);
    }

    const response = await fetch('http://dubus.free.fr/enregistrer_avis.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const text = await response.text();
    res.status(200).send(text);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
}
