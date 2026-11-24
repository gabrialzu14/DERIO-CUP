import { SPONSOR_ASSETS } from "./sponsors.generated";

/* Patrocinadores de la pantalla de inicio, en este orden.
   Con logo: pon el archivo en assets/patrocinadores-originales/ y ejecuta `npm run sponsors`.
   Sin logo: se muestra el nombre en texto (campo `text`). `height` = alto en píxeles. */
export type Sponsor = { id: string; name: string; height: number; text?: { small?: string; main: string } };

export const SPONSORS: Sponsor[] = [
  { id: "derioko-udala", name: "Derioko Udala", height: 56 },
  { id: "dimension-football", name: "Dimension Football", height: 38 },
  { id: "adidas", name: "adidas", height: 32 },
  { id: "restaurante-la-ofi", name: "Restaurante La Ofi", height: 38, text: { small: "Restaurante", main: "La Ofi" } },
];

export const sponsorAsset = (id: string) => SPONSOR_ASSETS[id] ?? null;
