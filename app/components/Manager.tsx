"use client";
import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { Dialog } from "./Dialog";
import { Crest } from "./ui";
import { Icon } from "./icons";
import { EVENT, SB_KEY, SB_URL, T, byTime, knockout, validKO, type KOGame, type Match, type ResultRow } from "../lib/tournament";

// El acceso real lo valida la función de Supabase; este código solo evita pulsaciones accidentales.
const ACCESS = "1802", AUTH_KEY = "derio-cup-manager-auth-v2";
type Scores = Record<string, [number, number]>;
type Results = Record<string, ResultRow>;
type Payload = { match_id: string; home_score: number; away_score: number; home_penalties?: number | null; away_penalties?: number | null; home_team: string | null; away_team: string | null; phase: string; round: string };
type Props = { ms: Match[]; koResults: Results; setKoResults: Dispatch<SetStateAction<Results>>; scores: Scores; setScores: Dispatch<SetStateAction<Scores>>; onClose: () => void };

const isGroup = (id: string) => id.startsWith("grupo-");
const json = { "Content-Type": "application/json", apikey: SB_KEY };

export function Manager({ ms, koResults, setKoResults, scores, setScores, onClose }: Props) {
  const [ok, setOk] = useState(() => { try { return localStorage.getItem(AUTH_KEY) === ACCESS; } catch { return false; } });
  const [code, setCode] = useState(ok ? ACCESS : "");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [undo, setUndo] = useState<{ payload: Payload; previous: [number, number] | ResultRow | undefined } | null>(null);

  const putLocal = (id: string, v: [number, number] | ResultRow | undefined) => {
    if (isGroup(id)) setScores(s => { const n = { ...s }; if (v) n[id] = v as [number, number]; else delete n[id]; return n; });
    else setKoResults(s => { const n = { ...s }; if (v) n[id] = v as ResultRow; else delete n[id]; return n; });
  };
  const run = async (id: string, job: () => Promise<void>, fail: string) => {
    setSaving(id); setErr("");
    try { await job(); } catch (e) { setErr(e instanceof Error ? e.message : fail); } finally { setSaving(null); }
  };
  const del = (id: string) => run(id, async () => {
    const r = await fetch(SB_URL + "/rest/v1/rpc/delete_derio_cup_result", { method: "POST", headers: json, body: JSON.stringify({ p_match_id: id }) });
    if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(j.message || j.error || "No se pudo eliminar"); }
    putLocal(id, undefined);
  }, "No se pudo eliminar");
  const save = (payload: Payload) => {
    const previous = isGroup(payload.match_id) ? scores[payload.match_id] : koResults[payload.match_id];
    return run(payload.match_id, async () => {
      const r = await fetch(SB_URL + "/functions/v1/derio-cup-result", { method: "POST", headers: json, body: JSON.stringify({ ...payload, code }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "No se pudo guardar");
      putLocal(payload.match_id, isGroup(payload.match_id) ? [payload.home_score, payload.away_score] : (j[0] || { ...payload, updated_at: new Date().toISOString() }));
      setSaved(payload.match_id); setUndo({ payload, previous });
      setTimeout(() => { setSaved(null); setUndo(null); }, 8000);
    }, "No se pudo guardar");
  };
  const undoSave = () => {
    if (!undo) return;
    const { payload, previous } = undo;
    if (!previous) { del(payload.match_id).then(() => { setUndo(null); setSaved(null); }); return; }
    run(payload.match_id, async () => {
      const body = isGroup(payload.match_id) ? { ...payload, home_score: (previous as [number, number])[0], away_score: (previous as [number, number])[1] } : { ...(previous as ResultRow), code };
      const r = await fetch(SB_URL + "/functions/v1/derio-cup-result", { method: "POST", headers: json, body: JSON.stringify({ ...body, code }) });
      if (!r.ok) throw new Error("No se pudo deshacer");
      putLocal(payload.match_id, previous); setUndo(null); setSaved(null);
    }, "No se pudo deshacer");
  };

  const kos = (["Oro", "Plata"] as const).flatMap(k => knockout(k, ms, koResults)).sort((a, b) => byTime(a, b) || a.field - b.field);
  const done = Object.keys(scores).length;

  return (
    <Dialog title={ok ? "Gestión de resultados" : "Acceso responsables"} onClose={onClose} wide>
      {!ok ? (
        <form className="manager-login" onSubmit={e => { e.preventDefault(); if (code === ACCESS) { try { localStorage.setItem(AUTH_KEY, ACCESS); } catch {} setOk(true); setErr(""); } else setErr("Código incorrecto"); }}>
          <p>Introduce el código de acceso para gestionar los resultados del torneo.</p>
          <label className="field"><span>Código de acceso</span>
            <input type="password" inputMode="numeric" autoComplete="one-time-code" maxLength={4} value={code} aria-invalid={!!err} aria-describedby={err ? "mgr-err" : undefined} onChange={e => setCode(e.currentTarget.value.replace(/\D/g, "").slice(0, 4))} />
          </label>
          {err && <p id="mgr-err" className="form-error" role="alert">{err}</p>}
          <button className="btn btn-primary block" disabled={code.length < 4}>Acceder</button>
        </form>
      ) : (
        <div className="manager">
          <div className="manager-bar"><b>{done}/{EVENT.groupMatchCount} grupos publicados</b><span>{EVENT.groupMatchCount - done} pendientes</span></div>
          {err && <p className="form-error" role="alert">{err}</p>}
          <h3>Fase de grupos</h3>
          {ms.slice().sort(byTime).map(m => <ManagerMatch key={m.id} m={m} current={scores[m.id]} saving={saving === m.id} save={save} remove={del} />)}
          <h3>Fases finales</h3>
          {kos.map(g => <ManagerKO key={g.id} g={g} saving={saving === g.id} save={save} remove={del} />)}
          {saved && <div className="toast" role="status"><Icon name="check" size={18} />Resultado publicado{undo && <button type="button" onClick={undoSave}>Deshacer</button>}</div>}
        </div>
      )}
    </Dialog>
  );
}

function Score({ value, set, label, disabled }: { value: string; set: (v: string) => void; label: string; disabled?: boolean }) {
  return <input className="score-input" type="number" inputMode="numeric" min="0" max="99" value={value} disabled={disabled} aria-label={label} onChange={e => set(e.currentTarget.value)} />;
}

function Remove({ onConfirm, disabled }: { onConfirm: () => void; disabled: boolean }) {
  const [ask, setAsk] = useState(false);
  useEffect(() => { if (!ask) return; const t = setTimeout(() => setAsk(false), 4000); return () => clearTimeout(t); }, [ask]);
  return <button type="button" className={"btn btn-danger" + (ask ? " is-armed" : "")} disabled={disabled} onClick={() => (ask ? onConfirm() : setAsk(true))}>{ask ? "Confirmar eliminación" : "Eliminar resultado"}</button>;
}

function ManagerMatch({ m, current, saving, save, remove }: { m: Match; current?: [number, number]; saving: boolean; save: (p: Payload) => void; remove: (id: string) => void }) {
  const [h, setH] = useState(current?.[0]?.toString() ?? ""), [a, setA] = useState(current?.[1]?.toString() ?? "");
  useEffect(() => { setH(current?.[0]?.toString() ?? ""); setA(current?.[1]?.toString() ?? ""); }, [current]);
  return (
    <div className="manager-card">
      <div className="manager-meta"><b>{m.time}</b><span>Grupo {m.group} · Campo {m.field}</span>{current && <span className="badge done">Publicado</span>}</div>
      <div className="manager-team"><Crest id={m.home} size={28} /><span>{T(m.home).name}</span><Score value={h} set={setH} label={"Goles " + T(m.home).name} /></div>
      <div className="manager-team"><Crest id={m.away} size={28} /><span>{T(m.away).name}</span><Score value={a} set={setA} label={"Goles " + T(m.away).name} /></div>
      <div className="manager-actions">
        <button type="button" className="btn btn-primary" disabled={saving || h === "" || a === ""} onClick={() => save({ match_id: m.id, home_score: Number(h), away_score: Number(a), home_team: m.home, away_team: m.away, phase: "group", round: "group" })}>{saving ? "Guardando…" : current ? "Actualizar" : "Guardar"}</button>
        {current && <Remove disabled={saving} onConfirm={() => remove(m.id)} />}
      </div>
    </div>
  );
}

function ManagerKO({ g, saving, save, remove }: { g: KOGame; saving: boolean; save: (p: Payload) => void; remove: (id: string) => void }) {
  const r = g.result, valid = validKO(g);
  const init = () => [valid ? String(r!.home_score) : "", valid ? String(r!.away_score) : "", valid && r!.home_penalties != null ? String(r!.home_penalties) : "", valid && r!.away_penalties != null ? String(r!.away_penalties) : ""];
  const [[h, a, hp, ap], setV] = useState(init);
  useEffect(() => { setV(init()); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [g.home, g.away, r?.updated_at]);
  const set = (i: number) => (v: string) => setV(s => s.map((x, j) => (j === i ? v : x)));
  const tie = h !== "" && a !== "" && Number(h) === Number(a), locked = !g.home || !g.away;
  const name = (id: string | null, label: string) => (id ? T(id).name : label);
  return (
    <div className={"manager-card" + (locked ? " is-locked" : "")}>
      <div className="manager-meta"><b>{g.time}</b><span>{g.kind} · {g.code} · Campo {g.field}</span>{valid && <span className="badge done">Publicado</span>}</div>
      <div className="manager-team">{g.home ? <Crest id={g.home} size={28} /> : <i className="crest-ph sm" />}<span className={g.home ? "" : "tbd"}>{name(g.home, g.homeLabel)}</span><Score value={h} set={set(0)} label={"Goles " + name(g.home, g.homeLabel)} disabled={!g.home} /></div>
      <div className="manager-team">{g.away ? <Crest id={g.away} size={28} /> : <i className="crest-ph sm" />}<span className={g.away ? "" : "tbd"}>{name(g.away, g.awayLabel)}</span><Score value={a} set={set(1)} label={"Goles " + name(g.away, g.awayLabel)} disabled={!g.away} /></div>
      {tie && <div className="manager-pens"><span>Penaltis</span><Score value={hp} set={set(2)} label="Penaltis local" /><i>–</i><Score value={ap} set={set(3)} label="Penaltis visitante" /></div>}
      <div className="manager-actions">
        <button type="button" className="btn btn-primary" disabled={saving || locked || h === "" || a === "" || (tie && (hp === "" || ap === "" || hp === ap))} onClick={() => save({ match_id: g.id, home_score: Number(h), away_score: Number(a), home_penalties: tie ? Number(hp) : null, away_penalties: tie ? Number(ap) : null, home_team: g.home, away_team: g.away, phase: g.kind.toLowerCase(), round: g.round.toLowerCase() })}>{saving ? "Guardando…" : valid ? "Actualizar" : "Guardar"}</button>
        {valid && <Remove disabled={saving} onConfirm={() => remove(g.id)} />}
      </div>
    </div>
  );
}
