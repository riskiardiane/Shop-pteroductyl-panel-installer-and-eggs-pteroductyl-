import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowLeft,
    faArrowRight,
    faCheck,
    faCogs,
    faHeadset,
    faLock,
    faServer,
    faTimes,
} from '@fortawesome/free-solid-svg-icons';

import {
    BillingCycle,
    Plan,
    billingCycleLabel,
    formatIDR,
    getPlans,
    monthlyEquivalent,
    orderUrl,
    priceForCycle,
} from '@/config/plans';
import { Badge, Card, Check as CheckIcon, SectionHeading } from '@/components/theme/primitives';
import BillingToggle from '@/components/theme/BillingToggle';
import PlanCard from '@/components/theme/PlanCard';

const serverCountLabel = (plan: Plan): string => {
    const map: Record<string, number> = { starter: 1, growth: 3, elite: 10 };
    const count = map[plan.slug];
    return count ? `${count} panel` : '1 panel';
};

const COMPARISON_ROWS: { label: string; value: (plan: Plan) => React.ReactNode }[] = [
    { label: 'CPU', value: (plan) => plan.specs.cpu },
    { label: 'RAM', value: (plan) => plan.specs.ram },
    { label: 'Storage', value: (plan) => plan.specs.disk },
    { label: 'Bandwidth', value: (plan) => plan.specs.bandwidth },
    { label: 'Jumlah server', value: (plan) => serverCountLabel(plan) },
    { label: 'Backup harian', value: (plan) => (plan.slug === 'starter' ? '3 slot' : plan.slug === 'growth' ? '10 slot' : '30 slot') },
    { label: 'DDoS protection', value: (plan) => (plan.slug === 'starter' ? 'Dasar' : plan.slug === 'growth' ? 'Lanjutan' : 'Premium') },
    { label: 'Prioritas support', value: (plan) => (plan.featured ? 'Ya' : plan.slug === 'elite' ? '1 jam' : 'Standar') },
];

const PricingPage = () => {
    const user = useStoreState((state: ApplicationStore) => state.user.data);
    const isAuthenticated = !!user?.uuid;

    const [cycle, setCycle] = useState<BillingCycle>('monthly');
    const [selected, setSelected] = useState<{ plan: Plan; cycle: BillingCycle } | null>(null);

    const plans = getPlans();

    return (
        <div className={'min-h-screen w-full bg-[color:var(--pn-bg)] text-[color:var(--pn-text)]'}>
            <header
                className={'sticky top-0 z-50 border-b'}
                style={{ background: 'rgba(255,255,255,.82)', borderColor: 'var(--pn-border)', backdropFilter: 'blur(18px)' }}
            >
                <div className={'pn-shell flex h-[4.25rem] items-center justify-between'}>
                    <Link to={'/'} className={'pn-btn pn-btn--ghost pn-btn--sm no-underline'}>
                        <FontAwesomeIcon icon={faArrowLeft} className={'text-[10px]'} />
                        Beranda
                    </Link>
                    <nav className={'hidden items-center gap-1 sm:flex'}>
                        <a href={'#paket'} className={'pn-navlink'}>
                            Paket
                        </a>
                        <a href={'#bandingkan'} className={'pn-navlink'}>
                            Perbandingan
                        </a>
                        <a href={'#faq-harga'} className={'pn-navlink'}>
                            FAQ
                        </a>
                    </nav>
                    <Link to={isAuthenticated ? '/dashboard' : '/auth/login'} className={'pn-btn pn-btn--primary pn-btn--sm'}>
                        {isAuthenticated ? 'Dashboard' : 'Masuk'}
                    </Link>
                </div>
            </header>

            <section className={'relative isolate overflow-hidden border-b'} style={{ borderColor: 'var(--pn-border)' }}>
                <div className={'pn-grid-bg absolute inset-0 -z-10'} />
                <div className={'pn-shell py-16 text-center'}>
                    <Badge tone={'primary'}>
                        <span className={'pn-dot pn-dot--live'} />
                        Harga transparan
                    </Badge>
                    <h1 className={'pn-h1 mx-auto mt-5 max-w-3xl'}>
                        Paket yang tumbuh <span className={'pn-gradient-text'}>bersama komunitasmu</span>
                    </h1>
                    <p className={'pn-lede mx-auto mt-4 max-w-2xl'}>
                        Semua paket termasuk panel Pterodactyl penuh, proteksi DDoS, backup, dan provisioning otomatis.
                    </p>
                    <div className={'mt-8 flex justify-center'}>
                        <BillingToggle value={cycle} onChange={setCycle} />
                    </div>
                </div>
            </section>

            <section id={'paket'} className={'pn-section'}>
                <div className={'pn-shell'}>
                    <div className={'pn-grid pn-grid--3'}>
                        {plans.map((plan) => (
                            <PlanCard key={plan.slug} plan={plan} cycle={cycle} onSelect={(p) => setSelected({ plan: p, cycle })} />
                        ))}
                    </div>

                    <div className={'mt-6 grid gap-4 sm:grid-cols-2'}>
                        <Card className={'pn-card__body flex items-start gap-4'}>
                            <div className={'pn-stat__icon'}>
                                <FontAwesomeIcon icon={faCogs} />
                            </div>
                            <div>
                                <h3 className={'pn-h3 text-base'}>Butuh resource custom?</h3>
                                <p className={'mt-1 text-sm text-[color:var(--pn-text-muted)]'}>
                                    Tim kami bisa menyusun paket khusus untuk komunitas besar, tournament, atau
                                    reseller.
                                </p>
                                <a href={'mailto:support@example.com'} className={'pn-btn pn-btn--outline pn-btn--sm mt-3'}>
                                    Hubungi sales
                                </a>
                            </div>
                        </Card>

                        <Card className={'pn-card__body flex items-start gap-4'}>
                            <div className={'pn-stat__icon'}>
                                <FontAwesomeIcon icon={faHeadset} />
                            </div>
                            <div>
                                <h3 className={'pn-h3 text-base'}>Migrasi gratis</h3>
                                <p className={'mt-1 text-sm text-[color:var(--pn-text-muted)]'}>
                                    Pindah dari provider lain? Kami bantu migrasi world, plugin, dan konfigurasi tanpa
                                    downtime berarti.
                                </p>
                                <span className={'pn-badge pn-badge--success mt-3'}>
                                    <FontAwesomeIcon icon={faCheck} className={'text-[9px]'} /> Termasuk di semua paket
                                </span>
                            </div>
                        </Card>
                    </div>
                </div>
            </section>

            <section id={'bandingkan'} className={'pn-section border-y'} style={{ borderColor: 'var(--pn-border)' }}>
                <div className={'pn-shell'}>
                    <SectionHeading
                        align={'center'}
                        eyebrow={'Perbandingan'}
                        title={'Spesifikasi lengkap, tanpa kejutan'}
                        description={'Semua harga adalah harga final. Pajak dan biaya setup sudah termasuk.'}
                    />

                    <Card className={'mt-10 overflow-hidden p-0'} flat>
                        <div className={'overflow-x-auto'}>
                            <table className={'pn-table min-w-[720px]'}>
                                <thead>
                                    <tr>
                                        <th style={{ width: '28%' }}>Fitur</th>
                                        {plans.map((plan) => (
                                            <th key={plan.slug} className={'text-center'}>
                                                <span className={'pn-font-display text-sm font-bold pn-text-strong'}>{plan.name}</span>
                                                <div className={'mt-1 text-[11px] font-medium normal-case tracking-normal text-[color:var(--pn-text-dim)]'}>
                                                    {formatIDR(monthlyEquivalent(plan, cycle))} / bln
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {COMPARISON_ROWS.map((row) => (
                                        <tr key={row.label}>
                                            <td className={'font-medium text-[color:var(--pn-text)]'}>{row.label}</td>
                                            {plans.map((plan) => (
                                                <td key={plan.slug} className={'text-center'}>
                                                    <span className={'inline-flex items-center gap-1.5'}>
                                                        <CheckIcon />
                                                        {row.value(plan)}
                                                    </span>
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                    <tr>
                                        <td className={'font-medium text-[color:var(--pn-text)]'}>Total {billingCycleLabel(cycle)}</td>
                                        {plans.map((plan) => (
                                            <td key={plan.slug} className={'text-center font-bold pn-text-strong'}>
                                                {formatIDR(priceForCycle(plan, cycle))}
                                            </td>
                                        ))}
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            </section>

            <section id={'faq-harga'} className={'pn-section'}>
                <div className={'pn-shell max-w-3xl'}>
                    <SectionHeading align={'center'} eyebrow={'FAQ'} title={'Seputar pembayaran'} />
                    <div className={'mt-8 space-y-3'}>
                        {[
                            {
                                q: 'Kapan server aktif setelah pembayaran?',
                                a: 'Setelah QRIS dikonfirmasi (biasanya < 10 detik), sistem membuat server otomatis dan mengirim detail akses ke email.',
                            },
                            {
                                q: 'Apakah bisa bayar per tahun?',
                                a: 'Bisa. Pilih siklus tahunan dan dapatkan diskon hingga 25% tergantung paket.',
                            },
                            {
                                q: 'Bagaimana kalau server expired?',
                                a: 'Server ditangguhkan (bukan dihapus) selama 3 hari. Setelah itu data diarsipkan; backup terakhir tetap tersedia 7 hari.',
                            },
                            {
                                q: 'Bisa refund?',
                                a: 'Garansi 3 hari pertama bila server tidak dapat digunakan karena masalah di sisi kami.',
                            },
                        ].map((item) => (
                            <details key={item.q} className={'pn-card group px-5 py-4'}>
                                <summary className={'flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold pn-text-strong'}>
                                    {item.q}
                                    <span
                                        className={'grid h-6 w-6 flex-shrink-0 place-items-center rounded-full text-xs transition-transform group-open:rotate-45'}
                                        style={{ background: 'rgba(124,92,255,.16)', color: 'var(--pn-primary-300)' }}
                                    >
                                        +
                                    </span>
                                </summary>
                                <p className={'mt-3 text-sm leading-relaxed text-[color:var(--pn-text-muted)]'}>{item.a}</p>
                            </details>
                        ))}
                    </div>
                </div>
            </section>

            <footer className={'border-t py-8'} style={{ borderColor: 'var(--pn-border)' }}>
                <div className={'pn-shell flex flex-col items-center justify-between gap-3 text-xs sm:flex-row'} style={{ color: 'var(--pn-text-dim)' }}>
                    <span>&copy; {new Date().getFullYear()} — Semua harga dalam Rupiah.</span>
                    <span className={'flex items-center gap-2'}>
                        <FontAwesomeIcon icon={faLock} /> Pembayaran aman via QRIS
                    </span>
                </div>
            </footer>

            {/* ======================= ORDER DIALOG ======================= */}
            {selected && (
                <div className={'fixed inset-0 z-[100] flex items-end justify-center sm:items-center'} role={'dialog'} aria-modal={'true'}>
                    <div
                        className={'absolute inset-0'}
                        style={{ background: 'rgba(15,23,42,.45)', backdropFilter: 'blur(6px)' }}
                        onClick={() => setSelected(null)}
                    />
                    <Card
                        className={'relative m-4 w-full max-w-lg pn-fade-up'}
                        style={{ borderRadius: 'var(--pn-radius-xl)' }}
                    >
                        <div className={'flex items-start justify-between gap-4 p-6 pb-0'}>
                            <div>
                                <span className={'pn-eyebrow'}>Ringkasan pesanan</span>
                                <h3 className={'pn-h3 mt-1 text-xl'}>{selected.plan.name}</h3>
                                <p className={'mt-1 text-xs text-[color:var(--pn-text-muted)]'}>{selected.plan.tagline}</p>
                            </div>
                            <button
                                type={'button'}
                                className={'pn-btn pn-btn--ghost pn-btn--icon'}
                                onClick={() => setSelected(null)}
                                aria-label={'Tutup'}
                            >
                                <FontAwesomeIcon icon={faTimes} className={'text-xs'} />
                            </button>
                        </div>

                        <div className={'p-6'}>
                            <div className={'space-y-2.5 rounded-xl p-4'} style={{ background: 'var(--pn-surface-2)', border: '1px solid var(--pn-border)' }}>
                                {[
                                    { label: 'CPU', value: selected.plan.specs.cpu },
                                    { label: 'RAM', value: selected.plan.specs.ram },
                                    { label: 'Storage', value: selected.plan.specs.disk },
                                    { label: 'Bandwidth', value: selected.plan.specs.bandwidth },
                                    { label: 'Siklus', value: billingCycleLabel(selected.cycle) },
                                ].map((item) => (
                                    <div key={item.label} className={'flex items-center justify-between text-sm'}>
                                        <span className={'text-[color:var(--pn-text-muted)]'}>{item.label}</span>
                                        <span className={'font-semibold pn-text-strong'}>{item.value}</span>
                                    </div>
                                ))}
                                <hr className={'pn-divider my-2'} />
                                <div className={'flex items-center justify-between'}>
                                    <span className={'text-sm text-[color:var(--pn-text-muted)]'}>Total bayar</span>
                                    <span className={'pn-font-display text-xl font-bold pn-text-strong'}>
                                        {formatIDR(priceForCycle(selected.plan, selected.cycle))}
                                    </span>
                                </div>
                            </div>

                            <div className={'pn-alert mt-4'}>
                                <FontAwesomeIcon icon={faLock} className={'mt-0.5'} />
                                <div>
                                    <div className={'font-semibold pn-text-strong'}>Pembayaran QRIS</div>
                                    <div className={'mt-0.5'}>
                                        Kamu akan diarahkan ke halaman pembayaran QRIS. Server dibuat otomatis
                                        begitu pembayaran terkonfirmasi.
                                    </div>
                                </div>
                            </div>

                            <div className={'mt-5 flex flex-col gap-2 sm:flex-row'}>
                                <Link
                                    to={isAuthenticated ? orderUrl(selected.plan, selected.cycle) : '/auth/login'}
                                    className={'pn-btn pn-btn--primary pn-btn--block'}
                                >
                                    <FontAwesomeIcon icon={faServer} className={'text-xs'} />
                                    {isAuthenticated ? 'Lanjut ke Pembayaran' : 'Masuk untuk memesan'}
                                    <FontAwesomeIcon icon={faArrowRight} className={'text-[10px]'} />
                                </Link>
                                <button type={'button'} className={'pn-btn pn-btn--ghost'} onClick={() => setSelected(null)}>
                                    Nanti
                                </button>
                            </div>

                            <p className={'mt-3 text-center text-[11px] text-[color:var(--pn-text-dim)]'}>
                                Dengan melanjutkan kamu menyetujui Syarat Layanan & Kebijakan Refund.
                            </p>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default PricingPage;
