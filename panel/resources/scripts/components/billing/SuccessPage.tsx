import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowRight,
    faCheckCircle,
    faClock,
    faHeadset,
    faReceipt,
    faServer,
} from '@fortawesome/free-solid-svg-icons';

import { formatIDR } from '@/config/plans';
import { Badge, Card } from '@/components/theme/primitives';
import { OrderStatus, getOrderStatus } from '@/api/billing';

type ViewState = 'checking' | 'paid' | 'pending' | 'unknown';

const SuccessPage = () => {
    const location = useLocation();
    const user = useStoreState((state: ApplicationStore) => state.user.data);
    const isAuthenticated = !!user?.uuid;

    const query = new URLSearchParams(location.search);
    const orderUuid = query.get('order');
    const invoice = query.get('invoice');
    const amount = Number(query.get('amount') || 0);

    const [state, setState] = useState<ViewState>(orderUuid ? 'checking' : 'unknown');
    const [order, setOrder] = useState<OrderStatus | null>(null);
    const isPaid = state === 'paid';

    useEffect(() => {
        if (!orderUuid || isPaid) {
            return;
        }

        let active = true;

        const load = async () => {
            try {
                const status = await getOrderStatus(orderUuid);

                if (!active) {
                    return;
                }

                setOrder(status);
                setState(status.status === 'paid' ? 'paid' : 'pending');
            } catch {
                if (active) {
                    setState('unknown');
                }
            }
        };

        load();

        const interval = window.setInterval(load, 5000);

        return () => {
            active = false;
            window.clearInterval(interval);
        };
    }, [orderUuid, isPaid]);

    const displayAmount = order?.amount || amount;
    const displayInvoice = order?.invoice || invoice;

    return (
        <div className={'min-h-screen w-full bg-[color:var(--pn-bg)] text-[color:var(--pn-text)]'}>
            <main className={'pn-shell flex min-h-screen max-w-2xl flex-col items-center justify-center py-14'}>
                <Card className={'w-full pn-card__body text-center'} glow>
                    <div
                        className={'mx-auto mb-5 grid h-20 w-20 place-items-center rounded-full'}
                        style={{
                            background:
                                state === 'pending'
                                    ? 'rgba(251,191,36,.12)'
                                    : state === 'paid'
                                    ? 'rgba(52,211,153,.14)'
                                    : 'rgba(124,92,255,.14)',
                            border:
                                state === 'pending'
                                    ? '1px solid rgba(251,191,36,.35)'
                                    : state === 'paid'
                                    ? '1px solid rgba(52,211,153,.4)'
                                    : '1px solid var(--pn-border-accent)',
                            color:
                                state === 'pending' ? '#b45309' : state === 'paid' ? '#047857' : 'var(--pn-primary-300)',
                        }}
                    >
                        <FontAwesomeIcon
                            icon={state === 'pending' ? faClock : faCheckCircle}
                            className={'text-3xl'}
                            spin={state === 'checking'}
                        />
                    </div>

                    {state === 'paid' ? (
                        <>
                            <Badge tone={'success'} dot>Pembayaran berhasil</Badge>
                            <h1 className={'pn-h2 mt-4 text-3xl'}>Terima kasih!</h1>
                            <p className={'pn-lede mx-auto mt-3 max-w-md'}>
                                Pembayaran kamu sudah kami terima. Server sedang disiapkan otomatis dan akan muncul
                                di dashboard dalam beberapa saat.
                            </p>
                        </>
                    ) : state === 'pending' ? (
                        <>
                            <Badge tone={'warning'} dot>Menunggu pembayaran</Badge>
                            <h1 className={'pn-h2 mt-4 text-3xl'}>Pembayaran belum terkonfirmasi</h1>
                            <p className={'pn-lede mx-auto mt-3 max-w-md'}>
                                Sistem belum menerima konfirmasi dari provider. Halaman ini akan memperbarui status
                                secara otomatis. Jika kamu sudah membayar, tunggu beberapa detik.
                            </p>
                        </>
                    ) : (
                        <>
                            <Badge tone={'primary'} dot>Terima kasih</Badge>
                            <h1 className={'pn-h2 mt-4 text-3xl'}>Pesanan diterima</h1>
                            <p className={'pn-lede mx-auto mt-3 max-w-md'}>
                                Status pembayaran akan tampil di dashboard. Simpan nomor invoice di bawah untuk
                                referensi.
                            </p>
                        </>
                    )}

                    <div
                        className={'mx-auto mt-7 max-w-md rounded-2xl p-4 text-left'}
                        style={{ background: 'var(--pn-surface-2)', border: '1px solid var(--pn-border)' }}
                    >
                        <div className={'flex items-center justify-between text-sm'}>
                            <span className={'text-[color:var(--pn-text-muted)]'}>Invoice</span>
                            <span className={'pn-mono font-semibold pn-text-strong'}>{displayInvoice || '—'}</span>
                        </div>
                        <div className={'mt-2 flex items-center justify-between text-sm'}>
                            <span className={'text-[color:var(--pn-text-muted)]'}>Total</span>
                            <span className={'font-semibold pn-text-strong'}>
                                {displayAmount ? formatIDR(displayAmount) : '—'}
                            </span>
                        </div>
                        {order?.plan && (
                            <div className={'mt-2 flex items-center justify-between text-sm'}>
                                <span className={'text-[color:var(--pn-text-muted)]'}>Paket</span>
                                <span className={'font-semibold pn-text-strong'}>{order.plan}</span>
                            </div>
                        )}
                        {order?.paid_at && (
                            <div className={'mt-2 flex items-center justify-between text-sm'}>
                                <span className={'text-[color:var(--pn-text-muted)]'}>Dibayar</span>
                                <span className={'font-semibold pn-text-strong'}>
                                    {new Date(order.paid_at).toLocaleString('id-ID')}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className={'mt-7 flex flex-col gap-2 sm:flex-row sm:justify-center'}>
                        <Link
                            to={isAuthenticated ? '/dashboard' : '/auth/login'}
                            className={'pn-btn pn-btn--primary'}
                        >
                            <FontAwesomeIcon icon={faServer} className={'text-xs'} />
                            {isAuthenticated ? 'Buka Dashboard' : 'Masuk ke Panel'}
                            <FontAwesomeIcon icon={faArrowRight} className={'text-[10px]'} />
                        </Link>
                        <Link to={'/pricing'} className={'pn-btn pn-btn--ghost'}>
                            <FontAwesomeIcon icon={faReceipt} className={'text-xs'} />
                            Lihat paket lain
                        </Link>
                    </div>

                    <div className={'mt-6 flex items-center justify-center gap-2 text-[11px]'} style={{ color: 'var(--pn-text-dim)' }}>
                        <FontAwesomeIcon icon={faHeadset} />
                        Butuh bantuan? Hubungi support dengan nomor invoice di atas.
                    </div>
                </Card>
            </main>
        </div>
    );
};

export default SuccessPage;
