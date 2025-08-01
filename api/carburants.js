export default async function handler(req, res) {
  try {
    const xmlUrl = "https://donnees.roulez-eco.fr/opendata/instantane";
    const response = await fetch(xmlUrl);
    const xmlText = await response.text();

    const stations = await parseXmlToStations(xmlText);

    res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate");
    res.status(200).json(stations);
  } catch (error) {
    console.error("Erreur récupération carburants:", error);
    res.status(500).json({ error: "Erreur récupération des données" });
  }
}

async function parseXmlToStations(xml) {
  const { parseStringPromise } = await import("xml2js");
  const parsed = await parseStringPromise(xml);

  const rawStations = parsed?.pdv_liste?.pdv || [];
  return rawStations.map((station) => {
    const lat = parseFloat(station.$.latitude) / 100000;
    const lon = parseFloat(station.$.longitude) / 100000;
    const id = station.$.id;
    const ville = station.ville?.[0] || "";
    const adresse = station.adresse?.[0] || "";
    const carburants = (station.prix || []).map((p) => ({
      nom: p.$.nom,
      valeur: p.$.valeur,
      maj: p.$.maj
    }));
    return { id, lat, lon, ville, adresse, carburants };
  });
}
