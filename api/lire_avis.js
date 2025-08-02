export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Méthode non autorisée' });
    return;
  }

  try {
    const response = await fetch('http://dubus.free.fr/lire_avis.php');
    const data = await response.text(); // car parfois ce n’est pas du JSON parfait

    res.setHeader('Content-Type', 'application/json');
    res.status(200).send(data);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors du chargement des avis', details: error.message });
  }
}
