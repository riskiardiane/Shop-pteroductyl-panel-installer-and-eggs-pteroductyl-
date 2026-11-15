import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowLeft,
    faArrowRight,
    faCheckCircle,
    faCopy,
    faLock,
    faQrcode,
    faServer,
    faShieldAlt,
    faSpinner,
    faSyncAlt,
} from '@fortawesome/free-solid-svg-icons';

import { BillingCycle, Plan, billingCycleLabel, formatIDR, getPlans, monthlyEquivalent, priceForCycle } from '@/config/plans';
import { Badge, Card, CardBody, CardHead, Check } from '@/components/theme/primitives';
import BillingToggle from '@/components/theme/BillingToggle';
import { CheckoutSession, billingErrorMessage, createCheckoutSession, getOrderStatus } from '@/api/billing';

const CYCLE_VALUES: BillingCycle[] = ['monthly', 'quarterly', 'yearly'];

const formatCountdown = (milliseconds: number): string => {
    if (milliseconds <= 0) {
        return 'Kedaluwarsa';
    }

    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const CheckoutPage = () => {
    const location = useLocation();
    const user = useStoreState((state: ApplicationStore) => state.user.data);
    const isAuthenticated = !!user?.uuid;

    const plans = useMemo(() => getPlans(), []);
    const query = new URLSearchParams(location.search);

    const planFromQuery = plans.find((item) => item.slug === query.get('plan')) ?? plans[0];
    const cycleFromQuery = query.get('cycle') as BillingCycle | null;

    const [planSlug, setPlanSlug] = useState(planFromQuery?.slug ?? '');
    const [cycle, setCycle] = useState<BillingCycle>(
        cycleFromQuery && CYCLE_VALUES.includes(cycleFromQuery) ? cycleFromQuery : 'monthly'
    );

    const [session, setSession] = useState<CheckoutSession | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [countdown, setCountdown] = useState<string>('');

    const plan: Plan | undefined = plans.find((item) => item.slug === planSlug) ?? plans[0];
    const total = plan ? priceForCycle(plan, cycle) : 0;

    useEffect(() => {
        if (!session?.expires_at) {
            return;
        }

        const expiresAt = new Date(session.expires_at).getTime();

        const tick = () => setCountdown(formatCountdown(expiresAt - Date.now()));
        tick();

        const interval = window.setInterval(tick, 1000);

        return () => window.clearInterval(interval);
    }, [session?.expires_at]);

    useEffect(() => {
        if (!session) {
            return;
        }

        let active = true;

        const poll = async () => {
            try {
                const status = await getOrderStatus(session.order_uuid);

                if (!active || status.status !== 'paid') {
                    return;
                }

                window.location.href = `/success?order=${encodeURIComponent(session.order_uuid)}&invoice=${encodeURIComponent(session.invoice)}`;
            } catch {
                // Abaikan; polling dicoba lagi.
            }
        };

        const interval = window.setInterval(poll, 5000);

        return () => {
            active = false;
            window.clearInterval(interval);
        };
    }, [session]);

    const onSubmit = async () => {
        if (!plan) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const created = await createCheckoutSession(plan.slug, cycle);
            setSession(created);
        } catch (exception) {
            setError(billingErrorMessage(exception));
        } finally {
            setLoading(false);
        }
    };

    const copyQr = async () => {
        if (!session?.qr_string) {
            return;
        }

        try {
            await navigator.clipboard.writeText(session.qr_string);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1800);
        } catch {
            setCopied(false);
        }
    };

    return (
        <div className={'min-h-screen w-full bg-[color:var(--pn-bg)] text-[color:var(--pn-text)]'}>
            <header className={'border-b'} style={{ borderColor: 'var(--pn-border)' }}>
                <div className={'pn-shell flex h-[4.25rem] items-center justify-between'}>
                    <Link to={'/pricing'} className={'pn-btn pn-btn--ghost pn-btn--sm no-underline'}>
                        <FontAwesomeIcon icon={faArrowLeft} className={'text-[10px]'} />
                        Kembali ke paket
                    </Link>
                    <span className={'pn-eyebrow'}>
                        <FontAwesomeIcon icon={faLock} /> Checkout aman
                    </span>
                </div>
            </header>

            <main className={'pn-shell py-10 sm:py-14'}>
                {!isAuthenticated ? (
                    <Card className={'mx-auto max-w-lg pn-card__body text-center'}>
                        <div className={'pn-stat__icon mx-auto mb-4'}>
                            <FontAwesomeIcon icon={faLock} />
                        </div>
                        <h1 className={'pn-h2 text-2xl'}>Masuk untuk memesan</h1>
                        <p className={'pn-lede mt-2'}>
                            Kamu perlu akun panel sebelum membuat pesanan. Setelah masuk, kamu akan kembali ke
                            halaman ini.
                        </p>
                        <div className={'mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center'}>
                            <Link to={'/auth/login'} className={'pn-btn pn-btn--primary'}>
                                Masuk
                                <FontAwesomeIcon icon={faArrowRight} className={'text-[10px]'} />
                            </Link>
                            <Link to={'/pricing'} className={'pn-btn pn-btn--ghost'}>
                                Lihat paket
                            </Link>
                        </div>
                    </Card>
                ) : !plan ? (
                    <Card className={'mx-auto max-w-lg pn-card__body text-center'}>
                        <h1 className={'pn-h3'}>Paket tidak ditemukan</h1>
                        <p className={'pn-lede mt-2'}>Silakan pilih paket lain dari halaman harga.</p>
                        <Link to={'/pricing'} className={'pn-btn pn-btn--primary mt-4'}>
                            Lihat paket
                        </Link>
                    </Card>
                ) : session ? (
                    <div className={'mx-auto grid max-w-4xl gap-6 lg:grid-cols-5'}>
                        {/* QR */}
                        <Card className={'lg:col-span-3'} glow>
                            <CardHead
                                title={
                                    <span className={'flex items-center gap-2'}>
                                        <FontAwesomeIcon icon={faQrcode} />
                                        Scan QRIS
                                    </span>
                                }
                                actions={<Badge tone={'warning'} dot>{countdown}</Badge>}
                            />
                            <CardBody>
                                <div className={'flex flex-col items-center'}>
                                    <div
                                        className={'grid w-full max-w-[260px] place-items-center rounded-2xl p-3'}
                                        style={{ background: '#fff' }}
                                    >
                                        {session.qr_url ? (
                                            <img
                                                src={session.qr_url}
                                                alt={'QRIS pembayaran'}
                                                className={'h-auto w-full rounded-xl'}
                                            />
                                        ) : session.qr_string ? (
                                            <div
                                                className={'pn-mono w-full break-all p-3 text-[11px] leading-relaxed'}
                                                style={{ color: '#0f172a' }}
                                            >
                                                {session.qr_string}
                                            </div>
                                        ) : (
                                            <div className={'p-6 text-center text-xs'} style={{ color: '#0f172a' }}>
                                                QR tidak tersedia. Hubungi support dengan nomor invoice{' '}
                                                <b>{session.invoice}</b>.
                                            </div>
                                        )}
                                    </div>

                                    <div className={'mt-4 text-center'}>
                                        <div className={'text-xs text-[color:var(--pn-text-muted)]'}>Total pembayaran</div>
                                        <div className={'pn-font-display text-2xl font-bold pn-text-strong'}>
                                            {formatIDR(session.amount)}
                                        </div>
                                        <div className={'pn-mono mt-1 text-[11px] text-[color:var(--pn-text-dim)]'}>
                                            {session.invoice} • {session.reference}
                                        </div>
                                    </div>

                                    {session.qr_string && (
                                        <button
                                            type={'button'}
                                            className={'pn-btn pn-btn--ghost pn-btn--sm mt-4'}
                                            onClick={copyQr}
                                        >
                                            <FontAwesomeIcon icon={copied ? faCheckCircle : faCopy} className={'text-[10px]'} />
                                            {copied ? 'Kode disalin' : 'Salin kode QRIS'}
                                        </button>
                                    )}

                                    <div className={'pn-alert mt-5 w-full'}>
                                        <FontAwesomeIcon icon={faSyncAlt} className={'mt-0.5'} />
                                        <div>
                                            Halaman ini otomatis mendeteksi pembayaran. Setelah QRIS dikonfirmasi,
                                            kamu diarahkan ke halaman sukses dan server dibuat otomatis.
                                        </div>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>

                        {/* Ringkasan */}
                        <div className={'space-y-4 lg:col-span-2'}>
                            <Card>
                                <CardHead title={'Ringkasan pesanan'} />
                                <CardBody>
                                    <div className={'text-sm font-semibold pn-text-strong'}>{plan.name}</div>
                                    <p className={'mt-1 text-xs text-[color:var(--pn-text-muted)]'}>{plan.tagline}</p>
                                    <ul className={'mt-4 space-y-1.5 text-xs text-[color:var(--pn-text-muted)]'}>
                                        {[
                                            ['CPU', plan.specs.cpu],
                                            ['RAM', plan.specs.ram],
                                            ['Storage', plan.specs.disk],
                                            ['Bandwidth', plan.specs.bandwidth],
                                            ['Siklus', billingCycleLabel(cycle)],
                                        ].map(([label, value]) => (
                                            <li key={label} className={'flex items-center justify-between'}>
                                                <span>{label}</span>
                                                <b className={'pn-text-strong'}>{value}</b>
                                            </li>
                                        ))}
                                        <li className={'flex items-center justify-between border-t pt-2'} style={{ borderColor: 'var(--pn-border)' }}>
                                            <span>Total</span>
                                            <b className={'pn-text-strong'}>{formatIDR(total)}</b>
                                        </li>
                                    </ul>
                                </CardBody>
                            </Card>

                            <Card className={'pn-card__body'}>
                                <div className={'flex items-start gap-2 text-xs text-[color:var(--pn-text-muted)]'}>
                                    <FontAwesomeIcon icon={faShieldAlt} className={'mt-0.5'} style={{ color: 'var(--pn-success)' }} />
                                    Pembayaran diproses otomatis. Server aktif setelah pembayaran terkonfirmasi.
                                </div>
                                <Link to={'/dashboard'} className={'pn-btn pn-btn--ghost pn-btn--block pn-btn--sm mt-4'}>
                                    Buka dashboard
                                </Link>
                            </Card>
                        </div>
                    </div>
                ) : (
                    <div className={'mx-auto grid max-w-4xl gap-6 lg:grid-cols-5'}>
                        {/* Form */}
                        <Card className={'lg:col-span-3'}>
                            <CardHead title={'Konfirmasi pesanan'} actions={<Badge tone={'primary'}>QRIS</Badge>} />
                            <CardBody>
                                <div className={'mb-5'}>
                                    <label className={'pn-label'}>Pilih paket</label>
                                    <select
                                        className={'pn-select'}
                                        value={planSlug}
                                        onChange={(event) => setPlanSlug(event.target.value)}
                                    >
                                        {plans.map((item) => (
                                            <option key={item.slug} value={item.slug}>
                                                {item.name} — {formatIDR(item.priceMonthly)} / bulan
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className={'mb-5'}>
                                    <label className={'pn-label'}>Siklus penagihan</label>
                                    <BillingToggle value={cycle} onChange={setCycle} />
                                </div>

                                <ul className={'space-y-2'}>
                                    {plan.features.map((feature) => (
                                        <li key={feature} className={'flex items-start gap-2 text-xs text-[color:var(--pn-text-muted)]'}>
                                            <Check className={'mt-0.5'} />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>

                                {error && (
                                    <div className={'pn-alert pn-alert--warning mt-5'}>{error}</div>
                                )}

                                <button
                                    type={'button'}
                                    onClick={onSubmit}
                                    disabled={loading}
                                    className={'pn-btn pn-btn--primary pn-btn--block pn-btn--lg mt-6'}
                                >
                                    {loading ? (
                                        <>
                                            <FontAwesomeIcon icon={faSpinner} spin /> Membuat QRIS…
                                        </>
                                    ) : (
                                        <>
                                            <FontAwesomeIcon icon={faQrcode} />
                                            Bayar {formatIDR(total)} dengan QRIS
                                        </>
                                    )}
                                </button>

                                <p className={'mt-3 text-center text-[11px] text-[color:var(--pn-text-dim)]'}>
                                    Dengan melanjutkan kamu menyetujui Syarat Layanan & Kebijakan Refund.
                                </p>
                            </CardBody>
                        </Card>

                        {/* Ringkasan */}
                        <div className={'space-y-4 lg:col-span-2'}>
                            <Card glow>
                                <CardHead
                                    title={plan.name}
                                    actions={plan.featured ? <Badge tone={'cyan'}>Populer</Badge> : undefined}
                                />
                                <CardBody>
                                    <div className={'pn-plan__price'}>
                                        <span className={'pn-plan__currency'}>Rp</span>
                                        <span className={'pn-plan__amount'}>
                                            {formatIDR(monthlyEquivalent(plan, cycle)).replace('Rp', '').trim()}
                                        </span>
                                        <span className={'pn-plan__period'}>/ bulan</span>
                                    </div>
                                    <div className={'mt-1 text-[11px] text-[color:var(--pn-text-dim)]'}>
                                        Ditagih {formatIDR(total)} / {billingCycleLabel(cycle)}
                                    </div>
                                    <div className={'pn-plan__specs mt-4'}>
                                        <div className={'pn-plan__spec'}><FontAwesomeIcon icon={faServer} /> <b>{plan.specs.ram}</b></div>
                                        <div className={'pn-plan__spec'}><FontAwesomeIcon icon={faServer} /> <b>{plan.specs.cpu}</b></div>
                                        <div className={'pn-plan__spec'}><FontAwesomeIcon icon={faServer} /> <b>{plan.specs.disk}</b></div>
                                        <div className={'pn-plan__spec'}><FontAwesomeIcon icon={faServer} /> <b>{plan.specs.bandwidth}</b></div>
                                    </div>
                                </CardBody>
                            </Card>

                            <Card className={'pn-card__body'}>
                                <div className={'pn-stat__label'}>Pembayaran</div>
                                <div className={'mt-3 flex items-center gap-3'}>
                                    <span
                                        className={'grid h-9 w-9 place-items-center rounded-lg'}
                                        style={{ background: 'rgba(34,211,238,.12)', color: '#0e7490' }}
                                    >
                                        <FontAwesomeIcon icon={faQrcode} />
                                    </span>
                                    <div>
                                        <div className={'text-sm font-semibold pn-text-strong'}>QRIS</div>
                                        <div className={'text-[11px] text-[color:var(--pn-text-muted)]'}>
                                            Semua e-wallet & m-banking
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default CheckoutPage;
