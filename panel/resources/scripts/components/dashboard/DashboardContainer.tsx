import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Server } from '@/api/server/getServer';
import getServers from '@/api/getServers';
import ServerRow from '@/components/dashboard/ServerRow';
import Spinner from '@/components/elements/Spinner';
import PageContentBlock from '@/components/elements/PageContentBlock';
import useFlash from '@/plugins/useFlash';
import { useStoreState } from 'easy-peasy';
import { usePersistedState } from '@/plugins/usePersistedState';
import Switch from '@/components/elements/Switch';
import useSWR from 'swr';
import { PaginatedResult } from '@/api/http';
import Pagination from '@/components/elements/Pagination';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowRight,
    faBolt,
    faCheckCircle,
    faCrown,
    faExclamationTriangle,
    faLayerGroup,
    faPlus,
    faReceipt,
    faServer,
    faTags,
    faWallet,
} from '@fortawesome/free-solid-svg-icons';

import BeforeContent from '@blueprint/components/Dashboard/Serverlist/BeforeContent';
import AfterContent from '@blueprint/components/Dashboard/Serverlist/AfterContent';
import { Badge, Card, CardBody, CardFoot, CardHead, EmptyState, StatCard } from '@/components/theme/primitives';
import PlanCard from '@/components/theme/PlanCard';
import BenefitPanel from '@/components/dashboard/BenefitPanel';
import CreateServerModal from '@/components/dashboard/CreateServerModal';
import { BenefitSubscription, getBenefits } from '@/api/billing';
import {
    BillingCycle,
    PanelInvoice as Invoice,
    Plan,
    SystemStats,
    formatIDR,
    getPlans,
} from '@/config/plans';

type Tab = 'overview' | 'services' | 'billing';

const TABS: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Ringkasan' },
    { id: 'services', label: 'Layanan' },
    { id: 'billing', label: 'Tagihan' },
];

const invoiceBadge = (status: Invoice['status']) => {
    if (status === 'paid') {
        return <Badge tone={'success'}>Lunas</Badge>;
    }
    if (status === 'unpaid') {
        return <Badge tone={'warning'}>Menunggu</Badge>;
    }
    if (status === 'refunded') {
        return <Badge tone={'danger'}>Refund</Badge>;
    }
    return <Badge tone={'danger'}>Kedaluwarsa</Badge>;
};

export default () => {
    const { search } = useLocation();
    const params = new URLSearchParams(search);
    const defaultPage = Number(params.get('page') || '1');
    const initialTab = (params.get('tab') as Tab) || 'overview';

    const [tab, setTab] = useState<Tab>(TABS.some((t) => t.id === initialTab) ? initialTab : 'overview');
    const [page, setPage] = useState(!isNaN(defaultPage) && defaultPage > 0 ? defaultPage : 1);
    const [createTarget, setCreateTarget] = useState<BenefitSubscription | null>(null);

    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const uuid = useStoreState((state) => state.user.data!.uuid);
    const rootAdmin = useStoreState((state) => state.user.data!.rootAdmin);
    const [showOnlyAdmin, setShowOnlyAdmin] = usePersistedState(`${uuid}:show_all_servers`, false);

    const stats: SystemStats = window.SystemStats || {
        serversCount: 0,
        usersCount: 0,
        nestsCount: 1,
        eggsCount: 8,
        nodesCount: 1,
    };

    const invoices: Invoice[] = window.PanelInvoices || [];
    const plans = getPlans();
    const activePlanSlug = window.PanelActivePlan;
    const activePlan: Plan | undefined = plans.find((plan) => plan.slug === activePlanSlug) || plans[1] || plans[0];
    const unpaidInvoice = invoices.find((invoice) => invoice.status === 'unpaid');

    const { data: servers, error } = useSWR<PaginatedResult<Server>>(
        ['/api/client/servers', showOnlyAdmin && rootAdmin, page],
        () => getServers({ page, type: showOnlyAdmin && rootAdmin ? 'admin' : undefined })
    );

    const { data: benefits } = useSWR('/api/billing/benefits', getBenefits, {
        refreshInterval: 30_000,
        revalidateOnFocus: true,
    });
    const firstCreatable = benefits?.subscriptions?.find((s) => s.can_create) ?? null;
    const attention = benefits?.subscriptions?.find(
        (s) => s.status === 'suspended' || s.status === 'expired' || s.expires_soon
    );

    useEffect(() => {
        if (!servers) return;
        if (servers.pagination.currentPage > 1 && !servers.items.length) {
            setPage(1);
        }
    }, [servers?.pagination.currentPage]);

    useEffect(() => {
        const query = tab === 'overview' && page <= 1 ? '' : `?tab=${tab}${page > 1 ? `&page=${page}` : ''}`;
        window.history.replaceState(null, document.title, `${window.location.pathname}${query}`);
    }, [page, tab]);

    useEffect(() => {
        if (error) clearAndAddHttpError({ key: 'dashboard', error });
        if (!error) clearFlashes('dashboard');
    }, [error]);

    const totalServers = servers ? servers.pagination.total : stats.serversCount;

    const cycleForDisplay: BillingCycle = 'monthly';

    const openCreateModal = (subscription?: BenefitSubscription | null) => {
        const target = subscription ?? firstCreatable;

        if (target) {
            setCreateTarget(target);
        } else {
            window.location.href = '/pricing';
        }
    };

    return (
        <PageContentBlock title={'Dashboard'} showFlashKey={'dashboard'}>
            <BeforeContent />

            {/* ======================= HEADER ======================= */}
            <div className={'relative mb-6 overflow-hidden rounded-3xl border p-6 sm:p-8'}
                style={{ borderColor: 'var(--pn-border)', background: 'linear-gradient(120deg, rgba(124,92,255,.16), rgba(34,211,238,.06) 55%, transparent)' }}>
                <div className={'pn-grid-bg absolute inset-0 opacity-30'} />
                <div className={'relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between'}>
                    <div>
                        <span className={'pn-eyebrow'}>
                            <span className={'pn-dot pn-dot--live'} style={{ color: 'var(--pn-success)' }} />
                            Semua sistem normal
                        </span>
                        <h1 className={'pn-h2 mt-2'}>
                            Selamat datang kembali<span className={'pn-gradient-text'}>.</span>
                        </h1>
                        <p className={'pn-lede mt-2 max-w-xl'}>
                            Kelola layanan, pantau resource, dan selesaikan tagihan dari satu dashboard.
                        </p>
                    </div>
                    <div className={'flex flex-wrap gap-2.5'}>
                        {firstCreatable ? (
                            <button type={'button'} className={'pn-btn pn-btn--primary'} onClick={() => openCreateModal()}>
                                <FontAwesomeIcon icon={faPlus} className={'text-[11px]'} />
                                Buat Server
                            </button>
                        ) : (
                            <Link to={'/pricing'} className={'pn-btn pn-btn--primary'}>
                                <FontAwesomeIcon icon={faPlus} className={'text-[11px]'} />
                                Pesan Layanan Baru
                            </Link>
                        )}
                        <a href={'#services'} className={'pn-btn pn-btn--ghost'}>
                            <FontAwesomeIcon icon={faServer} className={'text-[11px]'} />
                            Kelola Server
                        </a>
                    </div>
                </div>
            </div>

            {/* ======================= TABS ======================= */}
            <div className={'mb-6 flex flex-wrap items-center justify-between gap-3'}>
                <div className={'pn-tabs'} role={'tablist'} aria-label={'Menu dashboard'}>
                    {TABS.map((item) => (
                        <button
                            key={item.id}
                            role={'tab'}
                            type={'button'}
                            aria-selected={tab === item.id}
                            className={'pn-tab'}
                            onClick={() => setTab(item.id)}
                        >
                            {item.label}
                            {item.id === 'billing' && invoices.length > 0 && (
                                <span className={'ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold'}
                                    style={{ background: 'rgba(251,191,36,.18)', color: '#b45309' }}>
                                    {invoices.length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
                {rootAdmin && (
                    <div className={'flex items-center gap-3 rounded-2xl border px-4 py-2'}
                        style={{ background: 'var(--pn-surface)', borderColor: 'var(--pn-border)' }}>
                        <span className={'text-[10px] font-bold uppercase tracking-widest'} style={{ color: 'var(--pn-text-dim)' }}>
                            {showOnlyAdmin ? "Server pengguna lain" : 'Server saya'}
                        </span>
                        <Switch name={'show_all_servers'} defaultChecked={showOnlyAdmin} onChange={() => setShowOnlyAdmin(!showOnlyAdmin)} />
                    </div>
                )}
            </div>

            {attention && (
                <div className={'mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3'}
                    style={{
                        borderColor: 'rgba(217,119,6,.35)',
                        background: 'rgba(217,119,6,.08)',
                    }}>
                    <div className={'flex items-center gap-2.5 text-xs'} style={{ color: '#b45309' }}>
                        <FontAwesomeIcon icon={faExclamationTriangle} />
                        <span>
                            {attention.status === 'expired' || attention.status === 'suspended'
                                ? `Langganan ${attention.plan?.name ?? ''} ${attention.status === 'expired' ? 'sudah berakhir' : 'ditangguhkan'} — server benefit ikut ditangguhkan.`
                                : `Langganan ${attention.plan?.name ?? ''} berakhir dalam ${attention.days_remaining} hari. Perpanjang agar server tidak ditangguhkan.`}
                        </span>
                    </div>
                    <Link to={'/pricing'} className={'pn-btn pn-btn--primary pn-btn--sm'}>
                        <FontAwesomeIcon icon={faBolt} className={'text-[10px]'} />
                        Perpanjang Sekarang
                    </Link>
                </div>
            )}

            {/* ======================= OVERVIEW ======================= */}
            {tab === 'overview' && (
                <div className={'space-y-6'}>
                    <BenefitPanel onCreateServer={(subscription) => setCreateTarget(subscription)} />
                    <div className={'grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'}>
                        <StatCard
                            icon={<FontAwesomeIcon icon={faServer} />}
                            label={'Layanan aktif'}
                            value={totalServers}
                            hint={`${stats.nodesCount} node terhubung`}
                        />
                        <StatCard
                            icon={<FontAwesomeIcon icon={faCrown} />}
                            label={'Paket saat ini'}
                            value={activePlan?.name ?? 'Belum ada'}
                            hint={activePlan ? formatIDR(activePlan.priceMonthly) + ' / bulan' : 'Pilih paket untuk mulai'}
                            accent={'cyan'}
                        />
                        <StatCard
                            icon={<FontAwesomeIcon icon={faWallet} />}
                            label={'Tagihan'}
                            value={unpaidInvoice ? formatIDR(unpaidInvoice.amount) : 'Rp0'}
                            hint={unpaidInvoice ? `Jatuh tempo ${unpaidInvoice.dueDate}` : 'Tidak ada tagihan tertunda'}
                            accent={unpaidInvoice ? 'warning' : 'success'}
                        />
                        <StatCard
                            icon={<FontAwesomeIcon icon={faLayerGroup} />}
                            label={'Slot tersedia'}
                            value={`${stats.eggsCount} egg`}
                            hint={`${stats.nestsCount} nest terpasang`}
                            accent={'success'}
                        />
                    </div>

                    <div className={'grid gap-6 lg:grid-cols-3'}>
                        {/* Layanan ringkas */}
                        <Card className={'lg:col-span-2'}>
                            <CardHead
                                title={'Layanan terbaru'}
                                actions={
                                    <button type={'button'} className={'pn-btn pn-btn--ghost pn-btn--sm'} onClick={() => setTab('services')}>
                                        Lihat semua
                                        <FontAwesomeIcon icon={faArrowRight} className={'text-[10px]'} />
                                    </button>
                                }
                            />
                            <CardBody className={'p-0'}>
                                {!servers ? (
                                    <div className={'flex justify-center py-14'}>
                                        <Spinner size={'large'} />
                                    </div>
                                ) : servers.items.length > 0 ? (
                                    <div className={'space-y-3 p-4'}>
                                        {servers.items.slice(0, 3).map((server) => (
                                            <ServerRow key={server.uuid} server={server} />
                                        ))}
                                    </div>
                                ) : (
                                    <EmptyState
                                        icon={<FontAwesomeIcon icon={faServer} />}
                                        title={'Belum ada layanan'}
                                        description={'Pilih paket untuk membuat panel game server pertamamu. Aktif otomatis setelah pembayaran.'}
                                        action={
                                            firstCreatable ? (
                                                <button type={'button'} className={'pn-btn pn-btn--primary'} onClick={() => openCreateModal()}>
                                                    <FontAwesomeIcon icon={faPlus} className={'text-[11px]'} />
                                                    Buat Server Pertama
                                                </button>
                                            ) : (
                                                <Link to={'/pricing'} className={'pn-btn pn-btn--primary'}>
                                                    <FontAwesomeIcon icon={faTags} className={'text-[11px]'} />
                                                    Lihat Paket
                                                </Link>
                                            )
                                        }
                                    />
                                )}
                            </CardBody>
                        </Card>

                        {/* Plan aktif / upsell */}
                        <div className={'space-y-6'}>
                            {activePlan ? (
                                <Card glow>
                                    <CardHead title={'Paket aktif'} actions={<Badge tone={'success'} dot>Berjalan</Badge>} />
                                    <CardBody>
                                        <div className={'flex items-end justify-between'}>
                                            <div>
                                                <div className={'pn-h3 text-xl'}>{activePlan.name}</div>
                                                <p className={'mt-1 text-xs text-[color:var(--pn-text-muted)]'}>{activePlan.tagline}</p>
                                            </div>
                                            <div className={'text-right'}>
                                                <div className={'pn-font-display text-xl font-bold pn-text-strong'}>
                                                    {formatIDR(activePlan.priceMonthly)}
                                                </div>
                                                <div className={'text-[10px] text-[color:var(--pn-text-dim)]'}>/ bulan</div>
                                            </div>
                                        </div>
                                        <ul className={'mt-4 space-y-1.5 text-xs text-[color:var(--pn-text-muted)]'}>
                                            <li className={'flex justify-between'}>
                                                <span>CPU</span>
                                                <b className={'pn-text-strong'}>{activePlan.specs.cpu}</b>
                                            </li>
                                            <li className={'flex justify-between'}>
                                                <span>RAM</span>
                                                <b className={'pn-text-strong'}>{activePlan.specs.ram}</b>
                                            </li>
                                            <li className={'flex justify-between'}>
                                                <span>Storage</span>
                                                <b className={'pn-text-strong'}>{activePlan.specs.disk}</b>
                                            </li>
                                        </ul>
                                    </CardBody>
                                    <CardFoot>
                                        <Link to={'/pricing'} className={'pn-btn pn-btn--outline pn-btn--block pn-btn--sm'}>
                                            <FontAwesomeIcon icon={faBolt} className={'text-[10px]'} />
                                            Upgrade paket
                                        </Link>
                                    </CardFoot>
                                </Card>
                            ) : (
                                <Card className={'pn-card__body'}>
                                    <div className={'pn-stat__icon mb-4'}>
                                        <FontAwesomeIcon icon={faTags} />
                                    </div>
                                    <h3 className={'pn-h3'}>Belum berlangganan</h3>
                                    <p className={'mt-2 text-sm text-[color:var(--pn-text-muted)]'}>
                                        Aktifkan paket untuk mendapatkan resource dan panel otomatis.
                                    </p>
                                    <Link to={'/pricing'} className={'pn-btn pn-btn--primary pn-btn--block mt-4'}>
                                        Pilih paket
                                    </Link>
                                </Card>
                            )}

                            <Card className={'pn-card__body'}>
                                <div className={'flex items-center gap-3'}>
                                    <div className={'pn-stat__icon'}>
                                        <FontAwesomeIcon icon={faCheckCircle} />
                                    </div>
                                    <div>
                                        <div className={'text-sm font-semibold pn-text-strong'}>Butuh bantuan?</div>
                                        <div className={'text-xs text-[color:var(--pn-text-muted)]'}>Support siap 24/7</div>
                                    </div>
                                </div>
                                <a
                                    href={'/tickets'}
                                    className={'pn-btn pn-btn--ghost pn-btn--block pn-btn--sm mt-4'}
                                    style={{ pointerEvents: 'none', opacity: 0.7 }}
                                    aria-disabled={'true'}
                                    title={'Modul tiket tersedia di fase berikutnya'}
                                >
                                    Buka tiket (segera)
                                </a>
                            </Card>
                        </div>
                    </div>

                    {/* Preview plans */}
                    <div>
                        <div className={'mb-4 flex items-end justify-between'}>
                            <div>
                                <span className={'pn-eyebrow'}>Tingkatkan</span>
                                <h2 className={'pn-h3 mt-1 text-lg'}>Paket yang tersedia</h2>
                            </div>
                            <Link to={'/pricing'} className={'pn-navlink'}>
                                Bandingkan semua
                            </Link>
                        </div>
                        <div className={'pn-grid pn-grid--3'}>
                            {plans.slice(0, 3).map((plan) => (
                                <PlanCard
                                    key={plan.slug}
                                    plan={plan}
                                    cycle={cycleForDisplay}
                                    ctaLabel={plan.slug === activePlan?.slug ? 'Paket aktif' : 'Pilih paket'}
                                    onSelect={() => {
                                        window.location.href = '/pricing';
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ======================= SERVICES ======================= */}
            {tab === 'services' && (
                <div id={'services'} className={'space-y-5'}>
                    <Card>
                        <CardHead
                            title={
                                <span className={'flex items-center gap-2'}>
                                    Server Fleet
                                    <Badge tone={'primary'}>{totalServers} layanan</Badge>
                                </span>
                            }
                            actions={
                                firstCreatable ? (
                                    <button type={'button'} className={'pn-btn pn-btn--primary pn-btn--sm'} onClick={() => openCreateModal()}>
                                        <FontAwesomeIcon icon={faPlus} className={'text-[10px]'} />
                                        Buat Server
                                    </button>
                                ) : (
                                    <Link to={'/pricing'} className={'pn-btn pn-btn--primary pn-btn--sm'}>
                                        <FontAwesomeIcon icon={faPlus} className={'text-[10px]'} />
                                        Baru
                                    </Link>
                                )
                            }
                        />
                        <CardBody>
                            {!servers ? (
                                <div className={'flex justify-center py-16'}>
                                    <Spinner size={'large'} />
                                </div>
                            ) : servers.items.length > 0 ? (
                                <Pagination data={servers} onPageSelect={setPage}>
                                    {({ items }) => (
                                        <div className={'space-y-3'}>
                                            {items.map((server) => (
                                                <ServerRow key={server.uuid} server={server} />
                                            ))}
                                        </div>
                                    )}
                                </Pagination>
                            ) : (
                                <EmptyState
                                    icon={<FontAwesomeIcon icon={faServer} />}
                                    title={'Tidak ada server'}
                                    description={
                                        showOnlyAdmin
                                            ? 'Belum ada server pengguna lain di cluster ini.'
                                            : 'Kamu belum memiliki server. Pesan paket untuk memulai.'
                                    }
                                    action={
                                        firstCreatable ? (
                                            <button type={'button'} className={'pn-btn pn-btn--primary'} onClick={() => openCreateModal()}>
                                                <FontAwesomeIcon icon={faPlus} className={'text-[10px]'} />
                                                Buat Server Sekarang
                                            </button>
                                        ) : rootAdmin ? (
                                            <a href={'/admin/servers/new'} className={'pn-btn pn-btn--primary'}>
                                                <FontAwesomeIcon icon={faPlus} className={'text-[10px]'} />
                                                Deploy server
                                            </a>
                                        ) : (
                                            <Link to={'/pricing'} className={'pn-btn pn-btn--primary'}>
                                                Lihat paket
                                            </Link>
                                        )
                                    }
                                />
                            )}
                        </CardBody>
                    </Card>
                </div>
            )}

            {/* ======================= BILLING ======================= */}
            {tab === 'billing' && (
                <div className={'space-y-6'}>
                    <div className={'grid gap-6 lg:grid-cols-3'}>
                        <Card className={'lg:col-span-2'}>
                            <CardHead
                                title={'Riwayat tagihan'}
                                actions={<Badge tone={'primary'}>{invoices.length} invoice</Badge>}
                            />
                            <CardBody className={'p-0'}>
                                {invoices.length === 0 ? (
                                    <EmptyState
                                        icon={<FontAwesomeIcon icon={faReceipt} />}
                                        title={'Belum ada tagihan'}
                                        description={'Invoice akan muncul di sini setelah kamu memesan paket. Pembayaran QRIS diproses otomatis.'}
                                        action={
                                            <Link to={'/pricing'} className={'pn-btn pn-btn--primary'}>
                                                Mulai berlangganan
                                            </Link>
                                        }
                                    />
                                ) : (
                                    <div className={'overflow-x-auto'}>
                                        <table className={'pn-table min-w-[560px]'}>
                                            <thead>
                                                <tr>
                                                    <th>Invoice</th>
                                                    <th>Paket</th>
                                                    <th>Jumlah</th>
                                                    <th>Jatuh tempo</th>
                                                    <th>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {invoices.map((invoice) => (
                                                    <tr key={invoice.id}>
                                                        <td>
                                                            <span className={'pn-mono text-xs pn-text-strong'}>{invoice.id}</span>
                                                        </td>
                                                        <td>{invoice.planName}</td>
                                                        <td className={'font-semibold pn-text-strong'}>{formatIDR(invoice.amount)}</td>
                                                        <td>{invoice.dueDate}</td>
                                                        <td>{invoiceBadge(invoice.status)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardBody>
                        </Card>

                        <div className={'space-y-6'}>
                            <Card className={'pn-card__body'}>
                                <div className={'flex items-center justify-between'}>
                                    <div className={'pn-stat__label'}>Metode pembayaran</div>
                                    <Badge tone={'success'}>Aktif</Badge>
                                </div>
                                <div className={'mt-4 flex items-center gap-3 rounded-xl p-3'}
                                    style={{ background: 'var(--pn-surface-2)', border: '1px solid var(--pn-border)' }}>
                                    <span className={'grid h-10 w-10 place-items-center rounded-lg text-lg'}
                                        style={{ background: 'rgba(34,211,238,.12)', color: '#0e7490' }}>
                                        <FontAwesomeIcon icon={faWallet} />
                                    </span>
                                    <div>
                                        <div className={'text-sm font-semibold pn-text-strong'}>QRIS</div>
                                        <div className={'text-[11px] text-[color:var(--pn-text-muted)]'}>
                                            Semua e-wallet & mobile banking
                                        </div>
                                    </div>
                                </div>
                                <div className={'mt-3 flex items-center gap-3 rounded-xl p-3'}
                                    style={{ background: 'var(--pn-surface-2)', border: '1px solid var(--pn-border)' }}>
                                    <span className={'grid h-10 w-10 place-items-center rounded-lg text-lg'}
                                        style={{ background: 'rgba(124,92,255,.14)', color: 'var(--pn-primary-300)' }}>
                                        <FontAwesomeIcon icon={faReceipt} />
                                    </span>
                                    <div>
                                        <div className={'text-sm font-semibold pn-text-strong'}>Virtual Account</div>
                                        <div className={'text-[11px] text-[color:var(--pn-text-muted)]'}>BCA, BNI, BRI, Mandiri</div>
                                    </div>
                                </div>
                            </Card>

                            <Card className={'pn-card__body'}>
                                <div className={'pn-stat__label'}>Total pengeluaran</div>
                                <div className={'pn-font-display mt-1 text-2xl font-bold pn-text-strong'}>
                                    {formatIDR(invoices.filter((i) => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0))}
                                </div>
                                <p className={'mt-1 text-[11px] text-[color:var(--pn-text-dim)]'}>
                                    Dari {invoices.filter((i) => i.status === 'paid').length} invoice lunas
                                </p>
                            </Card>
                        </div>
                    </div>
                </div>
            )}

            <CreateServerModal subscription={createTarget} onClose={() => setCreateTarget(null)} />
            <AfterContent />
        </PageContentBlock>
    );
};

