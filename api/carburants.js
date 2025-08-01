
import { Buffer } from "buffer";
import JSZip from "jszip";
import { parseStringPromise } from "xml2js";
import iconv from "iconv-lite";

export default async function handler(req, res) {
  try {
    const zipUrl = "https://donnees.roulez-eco.fr/opendata/instantane";
    const zipResponse = await fetch(zipUrl);
    const zipBuffer = await zipResponse.arrayBuffer();

    const zip = await JSZip.loadAsync(Buffer.from(zipBuffer));
    const xmlFileName = Object.keys(zip.files).find(name => name.endsWith(".xml"));
    const xmlBuffer = await zip.files[xmlFileName].async("nodebuffer");
    const xmlText = iconv.decode(xmlBuffer, "ISO-8859-15");

    const stations = await parseXmlToStations(xmlText);

    res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate");
    res.status(200).json(stations);
  } catch (error) {
    console.error("Erreur récupération carburants:", error);
    res.status(500).json({ error: "Erreur récupération des données" });
  }
}

async function parseXmlToStations(xml) {
  const parsed = await parseStringPromise(xml);

  const rawStations = parsed?.pdv_liste?.pdv || [];
  return rawStations.map((station) => {
    const lat = parseFloat(station.$.latitude) / 100000;
    const lon = parseFloat(station.$.longitude) / 100000;
    const id = station.$.id;
    const ville = station.ville?.[0] || "";
    const adresse = station.adresse?.[0] || "";
    const carburants = (station.prix || []).map(p => ({
      nom: p.$.nom,
      valeur: p.$.valeur,
      maj: p.$.maj,
    }));
    return { id, lat, lon, ville, adresse, carburants };
  });
}