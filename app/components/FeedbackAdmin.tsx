"use client";
import { useEffect, useState } from "react";
import { Icon } from "./icons";
import { useEngine } from "../lib/engine";
import { useLang } from "../lib/i18n";
import { SB_KEY, SB_URL } from "../lib/tournament";

type Row = { rating: number; comment: string | null; lang: string | null; created_at: string };

const Stars = ({ n, size = 16 }: { n: number; size?: number }) => (
  <span className="fa-stars" role="img" aria-label={`${n}/5`}>{[1, 2, 3, 4, 5].map(i => <Icon key={i} name="star" size={size} className={"icon" + (i <= Math.round(n) ? " on" : "")} />)}</span>
);

/** Vista para responsables: media, reparto y comentarios de las valoraciones del torneo. */
export function FeedbackAdmin({ code }: { code: string }) {
  const { tn } = useEngine(), { t, locale } = useLang();
  const [rows, setRows] = useState<Row[] | null>(null), [err, setErr] = useState(false);
  useEffect(() => {
    let live = true;
    setRows(null); setErr(false);
    fetch(SB_URL + "/functions/v1/derio-cup-feedback", { method: "POST", headers: { "Content-Type": "application/json", apikey: SB_KEY }, body: JSON.stringify({ code, tournament_id: tn.id }) })
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j: Row[]) => { if (live) setRows(Array.isArray(j) ? j : []); })
      .catch(() => { if (live) setErr(true); });
    return () => { live = false; };
  }, [code, tn.id]);

  if (err) return <p className="form-error" role="alert">{t("No se pudieron cargar las opiniones.", "Ezin izan dira iritziak kargatu.", "Impossible de charger les avis.")}</p>;
  if (!rows) return <p className="fa-empty" role="status">{t("Cargando…", "Kargatzen…", "Chargement…")}</p>;
  if (!rows.length) return <p className="fa-empty">{t("Aún no hay opiniones de este torneo.", "Oraindik ez dago txapelketa honen iritzirik.", "Aucun avis pour ce tournoi pour le moment.")}</p>;

  const avg = rows.reduce((s, r) => s + r.rating, 0) / rows.length, comments = rows.filter(r => r.comment && r.comment.trim());
  const fmt = (iso: string) => new Date(iso).toLocaleString(locale, { timeZone: "Europe/Madrid", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  return (
    <div className="fa">
      <div className="fa-sum">
        <div className="fa-avg"><b>{avg.toFixed(1).replace(".", locale.startsWith("es") || locale.startsWith("eu") || locale.startsWith("fr") ? "," : ".")}</b><Stars n={avg} size={18} /><small>{rows.length} {t(rows.length === 1 ? "valoración" : "valoraciones", "balorazio", rows.length === 1 ? "avis" : "avis")}</small></div>
        <ul className="fa-dist" aria-label={t("Reparto de valoraciones", "Balorazioen banaketa", "Répartition des notes")}>
          {[5, 4, 3, 2, 1].map(n => { const c = rows.filter(r => r.rating === n).length; return <li key={n}><span>{n}</span><i><em style={{ width: (c / rows.length) * 100 + "%" }} /></i><small>{c}</small></li>; })}
        </ul>
      </div>
      <h3>{t("Comentarios", "Iruzkinak", "Commentaires")} ({comments.length})</h3>
      {comments.length === 0
        ? <p className="fa-empty">{t("Sin comentarios todavía.", "Oraindik iruzkinik ez.", "Pas encore de commentaires.")}</p>
        : <ul className="fa-list">{comments.map((r, i) => <li key={i}><div><Stars n={r.rating} size={14} /><time dateTime={r.created_at}>{fmt(r.created_at)}</time></div><p>{r.comment}</p></li>)}</ul>}
    </div>
  );
}
