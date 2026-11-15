import React from 'react';
import { Link } from 'react-router-dom';
import useSWR from 'swr';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBolt,
    faCheckCircle,
    faCrown,
    faExclamationTriangle,
    faInfinity,
    faPlus,
    faServer,
    faShieldAlt,
    faSync,
    faExclamationCircle,
} from '@fortawesome/free-solid-svg-icons';

import { BenefitSubscription, getBenefits } from '@/api/billing';
import { formatIDR } from '@/config/plans';
import { Badge, Card, CardBody, EmptyState } from '@/components/theme/primitives';
import Spinner from '@/components/elements/Spinner';

const statusTone = (status: string): 'success' | 'warning' | 'danger' | 'primary' => {
    if (status === 'active') return 'success';
    if (status === 'suspended') return 'warning';
    if (status === 'cancelled' || status === 'expired' || status === 'failed') return 'danger';

    return 'primary';
};

const statusLabel = (status: string): string => {
    switch (status) {
        case 'active': return 'Aktif';
        case 'provisioning': return 'Memproses';
        case 'suspended': return 'Ditangguhkan';
        case 'expired': return 'Berakhir';
        case 'cancelled': return 'Dibatalkan';
        default: return status;
    }
};

const fillTone = (daysRemaining: number, status: string): string => {
    if (status !== 'active') return 'pn-progress__fill--danger';
    if (daysRemaining <= 3) return 'pn-progress__fill--danger';
    if (daysRemaining <= 7) return 'pn-progress__fill--warn';

    return 'pn-progress__fill--ok';
};

const SubscriptionBlock = ({ subscription, onCreateServer }: { subscription: BenefitSubscription; onCreateServer: (s: BenefitSubscription) => void }) => {
    const plan = subscription.plan;
    const daysLeft = subscription.days_remaining;
    const expiresLabel = subscription.expires_at_label ?? '—';
    const canCreate = subscription.can_create;
    const isAlert = subscription.expires_soon || subscription.status === 'suspended' || subscription.status === 'expired';

    return (
        <Card glow={subscription.status === 'active'}>
            <CardBody className={'space-y-4'}>
                {/* Header */}
                <div className={'flex flex-wrap items-start justify-between gap-3'}>
                    <div className={'flex items-center gap-3'}>
                        <span className={'grid h-11 w-11 place-items-center rounded-2xl text-lg'}
                            style={{ background: 'linear-gradient(135deg, rgba(109,78,240,.18), rgba(14,116,144,.12))', color: 'var(--pn-primary-600)' }}>
                            <FontAwesomeIcon icon={faCrown} />
                        </span>
                        <div>
                            <div className={'flex items-center gap-2'}>
                                <h3 className={'pn-h3 text-lg leading-tight'}>{plan?.name ?? 'Langganan'}</h3>
                                <Badge tone={statusTone(subscription.status)} dot>{statusLabel(subscription.status)}</Badge>
                            </div>
                            <p className={'mt-0.5 text-xs text-[color:var(--pn-text-muted)]'}>
                                {plan?.tagline || 'Paket server kamu'}
                            </p>
                        </div>
                    </div>
                    <div className={'text-right'}>
                        <div className={'pn-font-display text-lg font-bold pn-text-strong'}>
                            {plan ? formatIDR(plan.price_monthly) : '—'}
                        </div>
                        <div className={'text-[10px] text-[color:var(--pn-text-dim)]'}>/ bulan</div>
                    </div>
                </div>

                {/* Expiry + slot meters */}
                <div className={'grid gap-3 sm:grid-cols-2'}>
                    <div className={'rounded-2xl border p-3'} style={{ borderColor: 'var(--pn-border)', background: 'var(--pn-surface-2)' }}>
                        <div className={'flex items-center justify-between gap-2'}>
                            <span className={'text-[10px] font-bold uppercase tracking-wider text-[color:var(--pn-text-muted)]'}>Masa berlaku</span>
                            <span className={'text-[11px] font-semibold pn-text-strong'}>
                                {subscription.status === 'active' ? `${daysLeft} hari lagi` : expiresLabel}
                            </span>
                        </div>
                        <div className={'pn-progress mt-2'}>
                            <div className={`pn-progress__fill ${fillTone(daysLeft, subscription.status)}`}
                                style={{ width: `${subscription.period_progress ?? (subscription.status === 'active' ? 100 : 100)}%` }} />
                        </div>
                        <div className={'mt-1.5 text-[10.5px] text-[color:var(--pn-text-dim)]'}>
                            Berakhir {expiresLabel}{subscription.auto_renew ? ' · perpanjangan otomatis' : ''}
                        </div>
                    </div>

                    <div className={'rounded-2xl border p-3'} style={{ borderColor: 'var(--pn-border)', background: 'var(--pn-surface-2)' }}>
                        <div className={'flex items-center justify-between gap-2'}>
                            <span className={'text-[10px] font-bold uppercase tracking-wider text-[color:var(--pn-text-muted)]'}>Slot server</span>
                            <span className={'text-[11px] font-semibold pn-text-strong'}>{subscription.slots.used}/{subscription.slots.total} terpakai</span>
                        </div>
                        <div className={'pn-progress mt-2'}>
                            <div className={`pn-progress__fill ${subscription.slots.remaining > 0 ? '' : 'pn-progress__fill--warn'}`}
                                style={{ width: `${subscription.slots.total > 0 ? Math.min(100, (subscription.slots.used / subscription.slots.total) * 100) : 0}%` }} />
                        </div>
                        <div className={'mt-1.5 text-[10.5px] text-[color:var(--pn-text-dim)]'}>
                            {subscription.slots.remaining > 0 ? `${subscription.slots.remaining} slot tersisa dari paket kamu` : 'Slot penuh — upgrade paket untuk menambah'}
                        </div>
                    </div>
                </div>

                {/* Plan limits (benefit, live from DB) */}
                {plan && (
                    <div className={'flex flex-wrap gap-1.5'}>
                        <span className={'pn-benefit-chip'}><FontAwesomeIcon icon={faServer} className={'text-[9px]'} />{plan.limits.server}× Server</span>
                        <span className={'pn-benefit-chip'}>{plan.specs.cpu}</span>
                        <span className={'pn-benefit-chip'}>{plan.specs.ram} RAM</span>
                        <span className={'pn-benefit-chip'}>{plan.specs.disk}</span>
                        <span className={'pn-benefit-chip'}>BW {plan.specs.bandwidth}</span>
                        <span className={'pn-benefit-chip'}><FontAwesomeIcon icon={faShieldAlt} className={'text-[9px]'} />{plan.limits.backup} backup</span>
                        <span className={'pn-benefit-chip'}><FontAwesomeIcon icon={faInfinity} className={'text-[9px]'} />{plan.limits.database} database</span>
                        <span className={'pn-benefit-chip'}>{plan.limits.allocation} alokasi</span>
                    </div>
                )}

                {/* Feature list (live from DB plan.features) */}
                {plan && plan.features.length > 0 && (
                    <ul className={'grid gap-1 text-[11.5px] text-[color:var(--pn-text-muted)] sm:grid-cols-2'}>
                        {plan.features.slice(0, 6).map((feature, index) => (
                            <li key={index} className={'flex items-center gap-1.5'}>
                                <FontAwesomeIcon icon={faCheckCircle} className={'text-[10px]'} style={{ color: 'var(--pn-success)' }} />
                                <span className={'truncate'} title={feature}>{feature}</span>
                            </li>
                        ))}
                    </ul>
                )}

                {/* Alert + CTA */}
                {isAlert && (
                    <div className={'flex items-start gap-2 rounded-xl px-3 py-2 text-xs'}
                        style={{ background: 'rgba(217,119,6,.09)', border: '1px solid rgba(217,119,6,.28)', color: '#b45309' }}>
                        <FontAwesomeIcon icon={faExclamationTriangle} className={'mt-0.5'} />
                        <span>
                            {subscription.status === 'expired'
                                ? 'Langganan sudah berakhir — server benefit otomatis ditangguhkan. '
                                : subscription.status === 'suspended'
                                    ? 'Langganan ditangguhkan. '
                                    : `Masa berlaku berakhir dalam ${daysLeft} hari. `}
                            <Link to={'/pricing'} className={'font-bold underline'}>Perpanjang / upgrade →</Link>
                        </span>
                    </div>
                )}

                <div className={'flex flex-wrap items-center justify-between gap-3 border-t pt-3'} style={{ borderColor: 'var(--pn-border)' }}>
                    <div className={'text-[10.5px] text-[color:var(--pn-text-dim)]'}>
                        Benefit tersinkron langsung dari paket aktif kamu.
                    </div>
                    {canCreate ? (
                        <button type={'button'} className={'pn-btn pn-btn--primary pn-btn--sm'} onClick={() => onCreateServer(subscription)}>
                            <FontAwesomeIcon icon={faPlus} className={'text-[10px]'} />
                            Buat Server
                        </button>
                    ) : (
                        <Link to={'/pricing'} className={'pn-btn pn-btn--outline pn-btn--sm'} title={subscription.block_reason ?? undefined}>
                            <FontAwesomeIcon icon={faBolt} className={'text-[10px]'} />
                            {subscription.slots.remaining < 1 ? 'Tambah Slot' : 'Perpanjang'}
                        </Link>
                    )}
                </div>
            </CardBody>
        </Card>
    );
};

/**
 * Kartu "Benefit Langganan" — data live dari /api/billing/benefits (refresh 30 dtk).
 */
const BenefitPanel = ({ onCreateServer }: { onCreateServer: (subscription: BenefitSubscription) => void }) => {
    const { data, error, isValidating } = useSWR('/api/billing/benefits', getBenefits, {
        refreshInterval: 30_000,
        revalidateOnFocus: true,
    });

    if (error) {
        return (
            <div className={'flex items-center gap-2 rounded-2xl border px-4 py-3 text-xs'}
                style={{ borderColor: 'rgba(239,68,68,.3)', background: 'rgba(239,68,68,.08)', color: '#b91c1c' }}>
                <FontAwesomeIcon icon={faExclamationCircle} />
                Gagal memuat data benefit. Muat ulang halaman atau coba lagi nanti.
            </div>
        );
    }

    if (!data) {
        return (
            <div className={'flex justify-center rounded-3xl border border-[color:var(--pn-border)] bg-white py-10'}>
                <Spinner size={'large'} />
            </div>
        );
    }

    const subscriptions = data.subscriptions;

    if (subscriptions.length === 0) {
        return (
            <EmptyState
                icon={<FontAwesomeIcon icon={faCrown} />}
                title={'Belum ada langganan'}
                description={'Aktifkan paket untuk mendapatkan benefit: server instan, resource terjamin, dan fitur sesuai paket.'}
                action={
                    <Link to={'/pricing'} className={'pn-btn pn-btn--primary'}>
                        <FontAwesomeIcon icon={faBolt} className={'text-[11px]'} />
                        Lihat Paket
                    </Link>
                }
            />
        );
    }

    return (
        <div className={'space-y-4'}>
            <div className={'flex flex-wrap items-center justify-between gap-2'}>
                <span className={'pn-eyebrow'}>
                    <span className={'pn-dot pn-dot--live'} style={{ color: 'var(--pn-success)' }} />
                    Benefit langganan kamu
                </span>
                <span className={'flex items-center gap-1.5 text-[10px] text-[color:var(--pn-text-dim)]'}>
                    <FontAwesomeIcon icon={faSync} className={isValidating ? 'fa-spin' : ''} />
                    Real-time · refresh 30 dtk
                </span>
            </div>
            {subscriptions.slice(0, 2).map((subscription) => (
                <SubscriptionBlock key={subscription.id} subscription={subscription} onCreateServer={onCreateServer} />
            ))}
        </div>
    );
};

export default BenefitPanel;
