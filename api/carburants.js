import AdmZip from "adm-zip";
import { parseStringPromise } from "xml2js";

export const config = {
  runtime: "nodejs18.x",
};

export default async function handler(req, res) {
  try {
    const zipUrl = "https://donnees.roulez-eco.fr/opendata/instantane";

    const zipResponse = await fetch(zipUrl);
    const zipBuffer = await zipResponse.arrayBuffer();

    const zip = new AdmZip(Buffer.from(zipBuffer));
    const entries = zip.getEntries();

    // Cherche un fichier .xml dans l’archive
    const xmlEntry = entries.find((e) => e.entryName.endsWith(".xml"));
    if (!xmlEntry) throw new Error("Fichier XML introuvable dans l’archive ZIP");

    const xmlText = xmlEntry.getData().toString("utf8");

    // Parse le contenu XML
    const parsed = await parseStringPromise(xmlText);
    const rawStations = parsed?.pdv_liste?.pdv || [];

    // Transformation des données
    const stations = rawStations.map((station) => {
      const lat = parseFloat(station.$.latitude) / 100000;
      const lon = parseFloat(station.$.longitude) / 100000;
      const id = station.$.id;
      const ville = station.ville?.[0] || "";
      const adresse = station.adresse?.[0] || "";

      const carburants = (station.prix || []).map((p) => ({
        nom: p.$.nom,
        valeur: p.$.valeur,
        maj: p.$.maj,
      }));

      return { id, lat, lon, ville, adresse, carburants };
    });

    res.setHeader("Cache-Control", "s-maxage=86400");
    res.status(200).json(stations);
  } catch (err) {
    console.error("Erreur récupération carburants:", err);
    res.status(500).json({ error: "Erreur récupération des données" });
  }
}