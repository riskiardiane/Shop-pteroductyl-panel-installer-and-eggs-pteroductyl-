import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrochip, faMemory, faHdd, faNetworkWired, faBolt } from '@fortawesome/free-solid-svg-icons';
import { BillingCycle, Plan, formatIDR, monthlyEquivalent, priceForCycle, savingsPercent } from '@/config/plans';
import { Badge, Check } from '@/components/theme/primitives';

export interface PlanCardProps {
    plan: Plan;
    cycle: BillingCycle;
    onSelect?: (plan: Plan) => void;
    ctaLabel?: string;
    /** Tampilkan harga per bulan (efektif) untuk siklus panjang. */
    showMonthlyEquivalent?: boolean;
}

const PlanCard: React.FC<PlanCardProps> = ({
    plan,
    cycle,
    onSelect,
    ctaLabel = 'Pesan Sekarang',
    showMonthlyEquivalent = true,
}) => {
    const total = priceForCycle(plan, cycle);
    const perMonth = monthlyEquivalent(plan, cycle);
    const saving = savingsPercent(plan, cycle);

    return (
        <div className={`pn-plan ${plan.featured ? 'pn-plan--featured' : ''}`}>
            {plan.ribbon && <span className={'pn-plan__ribbon'}>{plan.ribbon}</span>}

            <div className={'flex items-start justify-between gap-3'}>
                <div>
                    <h3 className={'pn-h3'}>{plan.name}</h3>
                    <p className={'mt-1 text-xs text-[color:var(--pn-text-muted)]'}>{plan.tagline}</p>
                </div>
                {typeof plan.stock === 'number' && (
                    <Badge tone={plan.stock <= 8 ? 'warning' : 'success'} dot>
                        {plan.stock} slot
                    </Badge>
                )}
            </div>

            <div className={'pn-plan__price mt-5'}>
                <span className={'pn-plan__currency'}>Rp</span>
                <span className={'pn-plan__amount'}>{formatIDR(showMonthlyEquivalent ? perMonth : total).replace('Rp', '').trim()}</span>
                <span className={'pn-plan__period'}>/ bulan</span>
            </div>

            <div className={'mt-1 flex flex-wrap items-center gap-2 text-xs text-[color:var(--pn-text-dim)]'}>
                <span>
                    Ditagih {formatIDR(total)} / {cycle === 'yearly' ? 'tahun' : cycle === 'quarterly' ? '3 bulan' : 'bulan'}
                </span>
                {saving > 0 && <Badge tone={'cyan'}>Hemat {saving}%</Badge>}
            </div>

            <div className={'pn-plan__specs'}>
                <div className={'pn-plan__spec'}>
                    <FontAwesomeIcon icon={faMicrochip} className={'text-[color:var(--pn-primary-300)]'} />
                    <b>{plan.specs.cpu}</b>
                </div>
                <div className={'pn-plan__spec'}>
                    <FontAwesomeIcon icon={faMemory} className={'text-[color:var(--pn-primary-300)]'} />
                    <b>{plan.specs.ram}</b>
                </div>
                <div className={'pn-plan__spec'}>
                    <FontAwesomeIcon icon={faHdd} className={'text-[color:var(--pn-primary-300)]'} />
                    <b>{plan.specs.disk}</b>
                </div>
                <div className={'pn-plan__spec'}>
                    <FontAwesomeIcon icon={faNetworkWired} className={'text-[color:var(--pn-primary-300)]'} />
                    <b>{plan.specs.bandwidth}</b>
                </div>
            </div>

            <ul className={'pn-plan__features'}>
                {plan.features.map((feature) => (
                    <li key={feature}>
                        <Check />
                        <span>{feature}</span>
                    </li>
                ))}
            </ul>

            <div className={'pn-plan__cta'}>
                <button
                    type={'button'}
                    onClick={() => onSelect?.(plan)}
                    className={`pn-btn pn-btn--block ${plan.featured ? 'pn-btn--primary' : 'pn-btn--ghost'}`}
                >
                    <FontAwesomeIcon icon={faBolt} className={'text-xs'} />
                    {ctaLabel}
                </button>
            </div>
        </div>
    );
};

export default PlanCard;
