import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { NumberField } from '../ui/NumberField';
import { PayoutEditor } from '../Dashboard/PrizePool';

const Field: React.FC<{ label: string; hint?: string; children: React.ReactNode }> = ({ label, hint, children }) => (
    <label className="block">
        <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">{label}</span>
        {children}
        {hint && <span className="block text-[11px] text-gray-500 mt-1">{hint}</span>}
    </label>
);

const Section: React.FC<{ title: string; description?: string; children: React.ReactNode; action?: React.ReactNode }> = ({ title, description, children, action }) => (
    <section className="bg-black/20 border border-white/5 rounded-2xl p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
            <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-white">{title}</h3>
                {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
            </div>
            {action}
        </div>
        {children}
    </section>
);

export const TournamentConfig: React.FC = () => {
    const s = useGameStore();
    const set = s.setTournamentSettings;

    return (
        <div className="space-y-5">
            <div>
                <h2 className="text-2xl font-black text-white tracking-tight">Datos del torneo</h2>
                <p className="text-xs text-gray-500 mt-1">Estos valores se usan por defecto al anotar jugadores, re-entradas y add-ons.</p>
            </div>

            <Section title="General">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Field label="Nombre (opcional)">
                        <input
                            value={s.tournamentName}
                            onChange={(e) => set({ tournamentName: e.target.value })}
                            placeholder="Ej: Viernes de póker"
                            maxLength={40}
                            className="h-10 w-full rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
                        />
                    </Field>
                    <Field label="Entrada">
                        <NumberField value={s.buyIn} onValueChange={(v) => set({ buyIn: v })} prefix="$" />
                    </Field>
                    <Field label="Stack inicial" hint="Fichas que recibe cada jugador">
                        <NumberField value={s.startingStack} onValueChange={(v) => set({ startingStack: v })} min={1} />
                    </Field>
                </div>
            </Section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Section
                    title="Re-entrada"
                    description="Para volver a entrar después de perder todas las fichas."
                    action={<button onClick={() => set({ rebuyAmount: s.buyIn, rebuyChips: s.startingStack })} className="text-[10px] font-bold uppercase tracking-wider text-primary hover:underline shrink-0">Igual a la entrada</button>}
                >
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Costo"><NumberField value={s.rebuyAmount} onValueChange={(v) => set({ rebuyAmount: v })} prefix="$" /></Field>
                        <Field label="Fichas"><NumberField value={s.rebuyChips} onValueChange={(v) => set({ rebuyChips: v })} /></Field>
                        <Field label="Hasta el nivel" hint={s.rebuyUntilLevel ? 'Incluye el descanso siguiente' : 'Sin límite'}>
                            <NumberField value={s.rebuyUntilLevel} onValueChange={(v) => set({ rebuyUntilLevel: v })} max={99} />
                        </Field>
                        <Field label="Máx. por jugador" hint={s.maxRebuys ? undefined : 'Sin límite'}>
                            <NumberField value={s.maxRebuys} onValueChange={(v) => set({ maxRebuys: v })} max={99} />
                        </Field>
                    </div>
                </Section>
                <Section title="Add-on" description="Fichas extra que se compran estando en juego.">
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Costo"><NumberField value={s.addonAmount} onValueChange={(v) => set({ addonAmount: v })} prefix="$" /></Field>
                        <Field label="Fichas"><NumberField value={s.addonChips} onValueChange={(v) => set({ addonChips: v })} /></Field>
                        <Field label="Hasta el nivel" hint={s.addonUntilLevel ? 'Incluye el descanso siguiente' : 'Sin límite'}>
                            <NumberField value={s.addonUntilLevel} onValueChange={(v) => set({ addonUntilLevel: v })} max={99} />
                        </Field>
                        <Field label="Máx. por jugador" hint={s.maxAddons ? undefined : 'Sin límite'}>
                            <NumberField value={s.maxAddons} onValueChange={(v) => set({ maxAddons: v })} max={99} />
                        </Field>
                    </div>
                </Section>
            </div>

            <Section title="Pozo" description="Todo es opcional: dejá en 0 lo que no uses.">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Field label="Comisión de la casa (%)" hint="Para comida, fichas u organización">
                        <NumberField value={s.rakePercent} onValueChange={(v) => set({ rakePercent: v })} max={50} />
                    </Field>
                    <Field label="Pozo garantizado" hint="Si no se llega, la casa pone la diferencia">
                        <NumberField value={s.guaranteedPool} onValueChange={(v) => set({ guaranteedPool: v })} prefix="$" />
                    </Field>
                    <Field
                        label="Bounty por cabeza"
                        hint={s.bountyAmount ? `De cada entrada, $${s.bountyAmount} van a quien elimine al jugador` : 'Sin bounties'}
                    >
                        <NumberField value={s.bountyAmount} onValueChange={(v) => set({ bountyAmount: v })} max={Math.max(0, s.buyIn)} prefix="$" />
                    </Field>
                </div>
            </Section>

            <Section title="Reparto de premios" description="Se puede cambiar durante el torneo desde Premios.">
                <PayoutEditor />
            </Section>
        </div>
    );
};
