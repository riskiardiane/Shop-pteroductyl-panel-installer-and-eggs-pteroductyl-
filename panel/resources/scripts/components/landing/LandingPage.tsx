import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowRight,
    faBolt,
    faChartLine,
    faCheckCircle,
    faCloud,
    faCogs,
    faComments,
    faDatabase,
    faGlobe,
    faHeadset,
    faLayerGroup,
    faLock,
    faMicrochip,
    faPlay,
    faServer,
    faShieldAlt,
    faTerminal,
    faUser,
    faUsers,
} from '@fortawesome/free-solid-svg-icons';

import { BillingCycle, formatIDR, getPlans, orderUrl } from '@/config/plans';
import { Badge, Card, SectionHeading } from '@/components/theme/primitives';
import BillingToggle from '@/components/theme/BillingToggle';
import PlanCard from '@/components/theme/PlanCard';

const features = [
    {
        icon: faBolt,
        title: 'Instan & Otomatis',
        description: 'Pembayaran QRIS terkonfirmasi, server langsung dibuat tanpa menunggu admin. Provisioning via Wings API.',
    },
    {
        icon: faShieldAlt,
        title: 'Anti-DDoS Berlapis',
        description: 'Perlindungan jaringan di layer 3/4/7 dengan mitigasi otomatis dan monitoring 24/7.',
    },
    {
        icon: faDatabase,
        title: 'NVMe & Backup',
        description: 'Penyimpanan NVMe gen4 untuk load cepat, backup terjadwal dan restore satu klik.',
    },
    {
        icon: faTerminal,
        title: 'Kontrol Penuh',
        description: 'Console realtime, file manager, SFTP, database, jadwal task, dan sub-user permission.',
    },
    {
        icon: faChartLine,
        title: 'Monitoring Realtime',
        description: 'CPU, RAM, disk, dan bandwidth terpantau langsung dengan grafik historis.',
    },
    {
        icon: faHeadset,
        title: 'Support Manusia',
        description: 'Tim support yang benar-benar paham game server — bukan balasan template.',
    },
];

const steps = [
    {
        icon: faUser,
        title: 'Buat akun',
        description: 'Daftar sekali, verifikasi email, dan akses dashboard pelanggan.',
    },
    {
        icon: faLayerGroup,
        title: 'Pilih paket',
        description: 'Tentukan CPU, RAM, dan storage sesuai kebutuhan komunitas kamu.',
    },
    {
        icon: faPlay,
        title: 'Bayar & main',
        description: 'Scan QRIS, server aktif otomatis dalam hitungan detik.',
    },
];

const faqs = [
    {
        q: 'Apakah server langsung aktif setelah bayar?',
        a: 'Ya. Setelah pembayaran QRIS dikonfirmasi, sistem otomatis membuat server di node yang tersedia dan mengirim detail akses ke email kamu.',
    },
    {
        q: 'Bisa upgrade paket di tengah jalan?',
        a: 'Bisa. Buka Dashboard → Layanan, pilih upgrade. Selisih biaya dihitung prorata dan server restart otomatis dengan resource baru.',
    },
    {
        q: 'Game apa saja yang didukung?',
        a: 'Semua egg Pterodactyl: Minecraft (Java/Bedrock), Rust, ARK, Valheim, Palworld, FiveM, bot Discord, Node.js, dan masih banyak lagi.',
    },
    {
        q: 'Apakah ada garansi uang kembali?',
        a: 'Ada. Garansi 3 hari pertama jika server tidak dapat digunakan karena masalah di sisi kami.',
    },
    {
        q: 'Metode pembayaran apa yang tersedia?',
        a: 'QRIS (semua e-wallet & mobile banking), transfer bank virtual account, dan e-wallet. Diproses otomatis lewat MustikaPayment.',
    },
];

const LandingPage = () => {
    const user = useStoreState((state: ApplicationStore) => state.user.data);
    const settings = useStoreState((state: ApplicationStore) => state.settings.data);
    const isAuthenticated = !!user?.uuid;
    const panelName = settings?.name || 'Pterodactyl';

    const [cycle, setCycle] = useState<BillingCycle>('monthly');
    const plans = getPlans();
    const previewPlans = plans.slice(0, 3);

    const stats = window.SystemStats || {
        serversCount: 0,
        usersCount: 0,
        nestsCount: 1,
        eggsCount: 8,
        nodesCount: 1,
    };

    const primaryCta = isAuthenticated ? '/dashboard' : '/auth/login';

    return (
        <div className={'min-h-screen w-full overflow-x-hidden bg-[color:var(--pn-bg)] text-[color:var(--pn-text)]'}>
            {/* ============================= NAVBAR ============================= */}
            <header
                className={'sticky top-0 z-50 border-b'}
                style={{
                    background: 'rgba(255,255,255,.82)',
                    borderColor: 'var(--pn-border)',
                    backdropFilter: 'blur(18px)',
                    WebkitBackdropFilter: 'blur(18px)',
                }}
            >
                <div className={'pn-shell flex h-[4.25rem] items-center justify-between gap-4'}>
                    <Link
                        to={'/'}
                        className={'flex items-center gap-2.5 no-underline'}
                        style={{ color: 'var(--pn-text)' }}
                        aria-label={panelName}
                    >
                        <span
                            className={'grid h-9 w-9 place-items-center rounded-xl text-sm font-bold'}
                            style={{
                                background: 'linear-gradient(135deg, var(--pn-primary), #5b8cff)',
                                boxShadow: '0 10px 24px -10px rgba(124,92,255,.9)',
                                color: '#fff',
                            }}
                        >
                            <FontAwesomeIcon icon={faServer} />
                        </span>
                        <span className={'font-header text-xl font-bold tracking-tight'}>{panelName}</span>
                    </Link>

                    <nav className={'hidden items-center gap-1 md:flex'} aria-label={'Navigasi utama'}>
                        <a href={'#fitur'} className={'pn-navlink'}>
                            Fitur
                        </a>
                        <a href={'#harga'} className={'pn-navlink'}>
                            Harga
                        </a>
                        <Link to={'/pricing'} className={'pn-navlink'}>
                            Semua Paket
                        </Link>
                        <a href={'#cara-kerja'} className={'pn-navlink'}>
                            Cara Kerja
                        </a>
                        <a href={'#faq'} className={'pn-navlink'}>
                            FAQ
                        </a>
                        {user?.rootAdmin && (
                            <a href={'/admin'} className={'pn-navlink'}>
                                <FontAwesomeIcon icon={faCogs} className={'text-xs'} />
                                Admin
                            </a>
                        )}
                    </nav>

                    <div className={'flex items-center gap-2.5'}>
                        {isAuthenticated ? (
                            <>
                                <Link to={'/dashboard'} className={'pn-btn pn-btn--primary pn-btn--sm'}>
                                    Dashboard
                                    <FontAwesomeIcon icon={faArrowRight} className={'text-[10px]'} />
                                </Link>
                                <Link
                                    to={'/account'}
                                    className={'grid h-9 w-9 place-items-center rounded-full no-underline'}
                                    style={{
                                        background: 'rgba(124,92,255,.18)',
                                        border: '1px solid var(--pn-border-accent)',
                                        color: 'var(--pn-primary-300)',
                                    }}
                                    aria-label={'Akun'}
                                >
                                    <FontAwesomeIcon icon={faUser} className={'text-xs'} />
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link to={'/auth/login'} className={'pn-btn pn-btn--ghost pn-btn--sm hidden sm:inline-flex'}>
                                    Masuk
                                </Link>
                                <Link to={'/auth/login'} className={'pn-btn pn-btn--primary pn-btn--sm'}>
                                    Mulai Sekarang
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* ============================= HERO ============================= */}
            <section className={'relative isolate overflow-hidden'}>
                <div className={'pn-grid-bg absolute inset-0 -z-10'} />
                <div
                    className={'pn-aurora -z-10'}
                    style={{ width: 520, height: 520, left: '-10%', top: -160, background: 'rgba(124,92,255,.45)' }}
                />
                <div
                    className={'pn-aurora -z-10'}
                    style={{ width: 460, height: 460, right: '-8%', top: -80, background: 'rgba(34,211,238,.28)' }}
                />

                <div className={'pn-shell grid items-center gap-14 py-16 lg:grid-cols-12 lg:py-24'}>
                    <div className={'lg:col-span-6'}>
                        <span className={'pn-badge pn-badge--primary pn-fade-up'}>
                            <span className={'pn-dot pn-dot--live'} />
                            Node aktif • {stats.nodesCount} lokasi
                        </span>

                        <h1 className={'pn-h1 pn-fade-up pn-fade-up--1 mt-5'}>
                            Jual panel game server,
                            <br />
                            <span className={'pn-gradient-text'}>aktif dalam 30 detik.</span>
                        </h1>

                        <p className={'pn-lede pn-fade-up pn-fade-up--2 mt-5 max-w-xl'}>
                            Infrastruktur game panel siap pakai dengan billing otomatis, provisioning instan, dan
                            dashboard pelanggan yang rapi. Fokus ke komunitasmu, bukan ke server.
                        </p>

                        <div className={'pn-fade-up pn-fade-up--3 mt-7 flex flex-wrap items-center gap-3'}>
                            <a href={'#harga'} className={'pn-btn pn-btn--primary pn-btn--lg'}>
                                Lihat Paket
                                <FontAwesomeIcon icon={faArrowRight} className={'text-xs'} />
                            </a>
                            <Link to={primaryCta} className={'pn-btn pn-btn--ghost pn-btn--lg'}>
                                <FontAwesomeIcon icon={faTerminal} className={'text-xs'} />
                                {isAuthenticated ? 'Buka Dashboard' : 'Coba Panel'}
                            </Link>
                            <span className={'flex items-center gap-2 text-xs text-[color:var(--pn-text-muted)]'}>
                                <FontAwesomeIcon icon={faCheckCircle} style={{ color: 'var(--pn-success)' }} />
                                Tanpa kontrak • Batalkan kapan saja
                            </span>
                        </div>

                        <dl className={'mt-10 grid max-w-lg grid-cols-3 gap-4'}>
                            {[
                                { label: 'Server aktif', value: stats.serversCount.toLocaleString('id-ID') },
                                { label: 'Pengguna', value: stats.usersCount.toLocaleString('id-ID') },
                                { label: 'Uptime', value: '99.9%' },
                            ].map((item) => (
                                <div key={item.label} className={'pn-card pn-card--flat px-4 py-3'}>
                                    <dt className={'text-[10px] font-bold uppercase tracking-widest text-[color:var(--pn-text-dim)]'}>
                                        {item.label}
                                    </dt>
                                    <dd className={'pn-mono mt-1 text-xl font-bold pn-text-strong'}>{item.value}</dd>
                                </div>
                            ))}
                        </dl>
                    </div>

                    {/* Mock panel */}
                    <div className={'lg:col-span-6'}>
                        <div className={'relative mx-auto max-w-xl'}>
                            <div
                                className={'pn-card pn-card--glass pn-card--glow pn-hoverable overflow-hidden'}
                                style={{ borderRadius: 'var(--pn-radius-xl)' }}
                            >
                                <div
                                    className={'flex items-center justify-between border-b px-5 py-3.5'}
                                    style={{ borderColor: 'var(--pn-border)' }}
                                >
                                    <div className={'flex items-center gap-2'}>
                                        <span className={'h-2.5 w-2.5 rounded-full'} style={{ background: '#fb7185' }} />
                                        <span className={'h-2.5 w-2.5 rounded-full'} style={{ background: '#fbbf24' }} />
                                        <span className={'h-2.5 w-2.5 rounded-full'} style={{ background: '#34d399' }} />
                                        <span className={'pn-mono ml-2 text-[11px] text-[color:var(--pn-text-dim)]'}>
                                            ~/survival-01
                                        </span>
                                    </div>
                                    <Badge tone={'success'} dot>
                                        Running
                                    </Badge>
                                </div>

                                <div className={'grid grid-cols-3 gap-3 p-5'}>
                                    {[
                                        { icon: faMicrochip, label: 'CPU', value: '38%', bar: 38 },
                                        { icon: faDatabase, label: 'RAM', value: '4.2 / 8 GB', bar: 52 },
                                        { icon: faGlobe, label: 'Ping', value: '18 ms', bar: 22 },
                                    ].map((metric) => (
                                        <div
                                            key={metric.label}
                                            className={'rounded-xl px-3 py-2.5'}
                                            style={{
                                                background: 'rgba(15,23,42,.035)',
                                                border: '1px solid var(--pn-border)',
                                            }}
                                        >
                                            <div className={'flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[color:var(--pn-text-dim)]'}>
                                                <FontAwesomeIcon icon={metric.icon} />
                                                {metric.label}
                                            </div>
                                            <div className={'pn-mono mt-1 text-sm font-bold pn-text-strong'}>{metric.value}</div>
                                            <div className={'mt-2 h-1 w-full overflow-hidden rounded-full'} style={{ background: 'rgba(15,23,42,.07)' }}>
                                                <div
                                                    className={'h-full rounded-full'}
                                                    style={{
                                                        width: `${metric.bar}%`,
                                                        background: 'linear-gradient(90deg, var(--pn-primary), var(--pn-cyan))',
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div
                                    className={'pn-mono space-y-1 px-5 pb-4 text-[11px] leading-relaxed'}
                                    style={{ color: 'var(--pn-text-dim)' }}
                                >
                                    <p>
                                        <span style={{ color: 'var(--pn-success)' }}>[Server]</span> Starting minecraft
                                        server version 1.21.4
                                    </p>
                                    <p>
                                        <span style={{ color: 'var(--pn-cyan)' }}>[Wings]</span> Container ready in 1.42s
                                    </p>
                                    <p>
                                        <span style={{ color: 'var(--pn-primary-300)' }}>[Panel]</span> Auto-provision
                                        completed ✓
                                    </p>
                                </div>

                                <div
                                    className={'flex items-center justify-between border-t px-5 py-3'}
                                    style={{ borderColor: 'var(--pn-border)' }}
                                >
                                    <div className={'flex items-center gap-2 text-[11px] text-[color:var(--pn-text-muted)]'}>
                                        <FontAwesomeIcon icon={faCloud} />
                                        Node: Singapore-01
                                    </div>
                                    <span className={'pn-btn pn-btn--primary pn-btn--sm'} style={{ cursor: 'default' }}>
                                        Console
                                    </span>
                                </div>
                            </div>

                            <div
                                className={'pn-card pn-card--glass absolute -bottom-6 -left-4 hidden w-52 p-3.5 sm:block'}
                                style={{ borderRadius: 'var(--pn-radius-lg)' }}
                            >
                                <div className={'flex items-center gap-2.5'}>
                                    <span
                                        className={'grid h-8 w-8 place-items-center rounded-lg text-xs'}
                                        style={{ background: 'rgba(52,211,153,.15)', color: '#047857' }}
                                    >
                                        <FontAwesomeIcon icon={faCheckCircle} />
                                    </span>
                                    <div>
                                        <div className={'text-xs font-bold pn-text-strong'}>Pembayaran diterima</div>
                                        <div className={'text-[10px] text-[color:var(--pn-text-dim)]'}>QRIS • otomatis</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ============================= TRUST BAR ============================= */}
            <section className={'border-y'} style={{ borderColor: 'var(--pn-border)' }}>
                <div className={'pn-shell flex flex-wrap items-center justify-center gap-x-8 gap-y-3 py-5 text-[11px] font-semibold uppercase tracking-widest text-[color:var(--pn-text-dim)]'}>
                    <span className={'flex items-center gap-2'}>
                        <FontAwesomeIcon icon={faLock} /> TLS 1.3
                    </span>
                    <span className={'flex items-center gap-2'}>
                        <FontAwesomeIcon icon={faShieldAlt} /> Anti-DDoS
                    </span>
                    <span className={'flex items-center gap-2'}>
                        <FontAwesomeIcon icon={faServer} /> NVMe Gen4
                    </span>
                    <span className={'flex items-center gap-2'}>
                        <FontAwesomeIcon icon={faGlobe} /> Multi-region
                    </span>
                    <span className={'flex items-center gap-2'}>
                        <FontAwesomeIcon icon={faUsers} /> {stats.eggsCount}+ game eggs
                    </span>
                </div>
            </section>

            {/* ============================= FITUR ============================= */}
            <section id={'fitur'} className={'pn-section'}>
                <div className={'pn-shell'}>
                    <SectionHeading
                        align={'center'}
                        eyebrow={'Kenapa memilih kami'}
                        title={'Semua yang dibutuhkan untuk jualan panel'}
                        description={'Dari checkout sampai server online — tanpa langkah manual, tanpa drama.'}
                    />

                    <div className={'pn-grid pn-grid--3 mt-12'}>
                        {features.map((feature) => (
                            <Card key={feature.title} className={'pn-hoverable pn-card__body'}>
                                <div className={'pn-stat__icon mb-4'}>
                                    <FontAwesomeIcon icon={feature.icon} />
                                </div>
                                <h3 className={'pn-h3'}>{feature.title}</h3>
                                <p className={'mt-2 text-sm leading-relaxed text-[color:var(--pn-text-muted)]'}>
                                    {feature.description}
                                </p>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* ============================= HARGA ============================= */}
            <section id={'harga'} className={'pn-section relative'}>
                <div
                    className={'pn-aurora'}
                    style={{ width: 520, height: 320, left: '50%', top: 80, transform: 'translateX(-50%)', background: 'rgba(124,92,255,.16)' }}
                />
                <div className={'pn-shell relative'}>
                    <div className={'flex flex-col items-center gap-6 text-center'}>
                        <SectionHeading
                            align={'center'}
                            eyebrow={'Harga transparan'}
                            title={'Pilih paket, langsung aktif'}
                            description={'Tanpa biaya setup. Upgrade atau downgrade kapan pun dari dashboard.'}
                        />
                        <BillingToggle value={cycle} onChange={setCycle} />
                    </div>

                    <div className={'pn-grid pn-grid--3 mt-12'}>
                        {previewPlans.map((plan) => (
                            <PlanCard
                                key={plan.slug}
                                plan={plan}
                                cycle={cycle}
                                onSelect={(selectedPlan) => {
                                    window.location.href = isAuthenticated
                                        ? orderUrl(selectedPlan, cycle)
                                        : `/auth/login`;
                                }}
                            />
                        ))}
                    </div>

                    <p className={'mt-8 text-center text-xs text-[color:var(--pn-text-dim)]'}>
                        Mulai dari {formatIDR(plans[0]?.priceMonthly ?? 15000)}/bulan. Harga sudah termasuk pajak.
                    </p>

                    <div className={'mt-6 flex justify-center'}>
                        <Link to={'/pricing'} className={'pn-btn pn-btn--outline'}>
                            Bandingkan semua paket
                            <FontAwesomeIcon icon={faArrowRight} className={'text-[10px]'} />
                        </Link>
                    </div>
                </div>
            </section>

            {/* ============================= CARA KERJA ============================= */}
            <section id={'cara-kerja'} className={'pn-section border-y'} style={{ borderColor: 'var(--pn-border)' }}>
                <div className={'pn-shell'}>
                    <SectionHeading
                        align={'center'}
                        eyebrow={'3 langkah'}
                        title={'Dari checkout ke server dalam satu menit'}
                    />

                    <div className={'mt-12 grid gap-6 md:grid-cols-3'}>
                        {steps.map((step, index) => (
                            <div key={step.title} className={'relative'}>
                                <Card className={'pn-card__body h-full'}>
                                    <div className={'flex items-center justify-between'}>
                                        <div className={'pn-stat__icon'}>
                                            <FontAwesomeIcon icon={step.icon} />
                                        </div>
                                        <span
                                            className={'pn-mono text-3xl font-bold'}
                                            style={{ color: 'rgba(148,163,184,.18)' }}
                                        >
                                            0{index + 1}
                                        </span>
                                    </div>
                                    <h3 className={'pn-h3 mt-4'}>{step.title}</h3>
                                    <p className={'mt-2 text-sm text-[color:var(--pn-text-muted)]'}>{step.description}</p>
                                </Card>
                                {index < steps.length - 1 && (
                                    <FontAwesomeIcon
                                        icon={faArrowRight}
                                        className={'absolute -right-4 top-1/2 hidden -translate-y-1/2 text-[color:var(--pn-text-dim)] md:block'}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ============================= FAQ ============================= */}
            <section id={'faq'} className={'pn-section'}>
                <div className={'pn-shell grid gap-10 lg:grid-cols-12'}>
                    <div className={'lg:col-span-4'}>
                        <SectionHeading
                            eyebrow={'FAQ'}
                            title={'Pertanyaan yang sering muncul'}
                            description={'Belum ketemu jawabannya? Tim support siap membantu lewat tiket.'}
                        />
                        <div className={'mt-6 flex items-center gap-3'}>
                            <div className={'pn-stat__icon'}>
                                <FontAwesomeIcon icon={faComments} />
                            </div>
                            <div>
                                <div className={'text-sm font-semibold pn-text-strong'}>Butuh bantuan?</div>
                                <div className={'text-xs text-[color:var(--pn-text-muted)]'}>Rata-rata balas &lt; 15 menit</div>
                            </div>
                        </div>
                    </div>

                    <div className={'space-y-3 lg:col-span-8'}>
                        {faqs.map((faq) => (
                            <details
                                key={faq.q}
                                className={'pn-card group px-5 py-4'}
                                style={{ borderRadius: 'var(--pn-radius-lg)' }}
                            >
                                <summary
                                    className={'flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold pn-text-strong'}
                                >
                                    {faq.q}
                                    <span
                                        className={'grid h-6 w-6 flex-shrink-0 place-items-center rounded-full text-xs transition-transform group-open:rotate-45'}
                                        style={{ background: 'rgba(124,92,255,.16)', color: 'var(--pn-primary-300)' }}
                                    >
                                        +
                                    </span>
                                </summary>
                                <p className={'mt-3 text-sm leading-relaxed text-[color:var(--pn-text-muted)]'}>{faq.a}</p>
                            </details>
                        ))}
                    </div>
                </div>
            </section>

            {/* ============================= CTA ============================= */}
            <section className={'pb-20'}>
                <div className={'pn-shell'}>
                    <div
                        className={'pn-card relative overflow-hidden px-6 py-12 text-center sm:px-12'}
                        style={{
                            borderRadius: 'var(--pn-radius-xl)',
                            borderColor: 'var(--pn-border-accent)',
                            background:
                                'radial-gradient(120% 140% at 50% -20%, rgba(124,92,255,.35), transparent 60%), var(--pn-surface)',
                        }}
                    >
                        <div className={'pn-grid-bg absolute inset-0 opacity-40'} />
                        <div className={'relative'}>
                            <Badge tone={'cyan'} dot>
                                Slot terbatas
                            </Badge>
                            <h2 className={'pn-h2 mt-4'}>Siap menjual panel pertamamu hari ini?</h2>
                            <p className={'pn-lede mx-auto mt-3 max-w-xl'}>
                                Aktifkan dalam hitungan detik. Pembayaran QRIS, provisioning otomatis, dan dashboard
                                pelanggan siap pakai.
                            </p>
                            <div className={'mt-7 flex flex-wrap justify-center gap-3'}>
                                <a href={'#harga'} className={'pn-btn pn-btn--primary pn-btn--lg'}>
                                    Mulai dari {formatIDR(plans[0]?.priceMonthly ?? 15000)}
                                    <FontAwesomeIcon icon={faArrowRight} className={'text-xs'} />
                                </a>
                                <Link to={primaryCta} className={'pn-btn pn-btn--ghost pn-btn--lg'}>
                                    {isAuthenticated ? 'Buka Dashboard' : 'Masuk ke Panel'}
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ============================= FOOTER ============================= */}
            <footer className={'border-t py-12'} style={{ borderColor: 'var(--pn-border)' }}>
                <div className={'pn-shell grid gap-10 md:grid-cols-4'}>
                    <div className={'md:col-span-2'}>
                        <div className={'flex items-center gap-2.5'}>
                            <span
                                className={'grid h-8 w-8 place-items-center rounded-lg text-xs font-bold'}
                                style={{ background: 'linear-gradient(135deg, var(--pn-primary), #5b8cff)', color: '#fff' }}
                            >
                                <FontAwesomeIcon icon={faServer} />
                            </span>
                            <span className={'font-header text-lg font-bold pn-text-strong'}>{panelName}</span>
                        </div>
                        <p className={'mt-4 max-w-sm text-sm leading-relaxed text-[color:var(--pn-text-muted)]'}>
                            Penyedia game panel terkelola dengan fokus pada performa, keamanan, dan pengalaman
                            pelanggan.
                        </p>
                        <div className={'mt-5 flex items-center gap-2'}>
                            <Badge tone={'success'} dot>
                                Semua sistem normal
                            </Badge>
                            <Badge tone={'primary'}>v{(settings as { version?: string } | undefined)?.version ?? '1.x'}</Badge>
                        </div>
                    </div>

                    <div>
                        <h4 className={'text-xs font-bold uppercase tracking-widest text-[color:var(--pn-text-dim)]'}>Produk</h4>
                        <ul className={'mt-4 space-y-2.5 text-sm'}>
                            <li>
                                <a href={'#harga'} className={'no-underline'} style={{ color: 'var(--pn-text-muted)' }}>
                                    Paket & harga
                                </a>
                            </li>
                            <li>
                                <Link to={'/pricing'} className={'no-underline'} style={{ color: 'var(--pn-text-muted)' }}>
                                    Perbandingan
                                </Link>
                            </li>
                            <li>
                                <a href={'#fitur'} className={'no-underline'} style={{ color: 'var(--pn-text-muted)' }}>
                                    Fitur
                                </a>
                            </li>
                            <li>
                                <Link to={'/dashboard'} className={'no-underline'} style={{ color: 'var(--pn-text-muted)' }}>
                                    Dashboard
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h4 className={'text-xs font-bold uppercase tracking-widest text-[color:var(--pn-text-dim)]'}>Bantuan</h4>
                        <ul className={'mt-4 space-y-2.5 text-sm'}>
                            <li>
                                <a href={'#faq'} className={'no-underline'} style={{ color: 'var(--pn-text-muted)' }}>
                                    FAQ
                                </a>
                            </li>
                            <li>
                                <a
                                    href={'https://pterodactyl.io'}
                                    target={'_blank'}
                                    rel={'noreferrer'}
                                    className={'no-underline'}
                                    style={{ color: 'var(--pn-text-muted)' }}
                                >
                                    Dokumentasi
                                </a>
                            </li>
                            <li>
                                <Link to={'/auth/login'} className={'no-underline'} style={{ color: 'var(--pn-text-muted)' }}>
                                    Masuk
                                </Link>
                            </li>
                            {user?.rootAdmin && (
                                <li>
                                    <a href={'/admin'} className={'no-underline'} style={{ color: 'var(--pn-text-muted)' }}>
                                        Admin panel
                                    </a>
                                </li>
                            )}
                        </ul>
                    </div>
                </div>

                <div className={'pn-shell mt-10 flex flex-col items-center justify-between gap-3 border-t pt-6 text-[11px] sm:flex-row'} style={{ borderColor: 'var(--pn-border)', color: 'var(--pn-text-dim)' }}>
                    <span>
                        &copy; {new Date().getFullYear()} {panelName}. Seluruh hak dilindungi.
                    </span>
                    <span className={'flex items-center gap-4'}>
                        <span>Dibangun dengan Pterodactyl &amp; Blueprint</span>
                    </span>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
