import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faServer, faTimes, faBolt, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

import { BenefitSubscription, billingErrorMessage, createBillingServer } from '@/api/billing';
import { formatIDR } from '@/config/plans';
import Spinner from '@/components/elements/Spinner';

interface Props {
    subscription: BenefitSubscription | null;
    onClose: () => void;
}

const CreateServerModal = ({ subscription, onClose }: Props) => {
    const [name, setName] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [done, setDone] = useState<string | null>(null);

    useEffect(() => {
        const handler = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handler);

        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    if (!subscription) return null;

    const plan = subscription.plan;
    const remaining = subscription.slots.remaining;
    const valid = /^[A-Za-z0-9][A-Za-z0-9 ._-]{1,63}$/.test(name.trim());

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!valid || busy) return;

        setBusy(true);
        setError(null);

        try {
            const result = await createBillingServer(name.trim(), subscription.id);
            setDone(result.message || 'Server berhasil dibuat.');
            // Reload penuh: server & benefit baru terambil fresh (swr 0.2 tidak punya API revalidasi global).
            window.setTimeout(() => window.location.reload(), 1600);
        } catch (e) {
            setError(billingErrorMessage(e));
        } finally {
            setBusy(false);
        }
    };

    return (
        <div
            className={'fixed inset-0 z-50 flex items-center justify-center p-4'}
            style={{ background: 'rgba(15,23,42,.55)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
            role={'dialog'}
            aria-modal={'true'}
        >
            <div
                className={'w-full max-w-lg overflow-hidden rounded-3xl border shadow-2xl'}
                style={{ background: 'var(--pn-surface)', borderColor: 'var(--pn-border)' }}
                onClick={(event) => event.stopPropagation()}
            >
                <div className={'flex items-center justify-between border-b px-6 py-4'} style={{ borderColor: 'var(--pn-border)' }}>
                    <div className={'flex items-center gap-3'}>
                        <span className={'grid h-10 w-10 place-items-center rounded-xl text-lg'}
                            style={{ background: 'rgba(109,78,240,.12)', color: 'var(--pn-primary-600)' }}>
                            <FontAwesomeIcon icon={faServer} />
                        </span>
                        <div>
                            <h3 className={'pn-h3 text-base leading-tight'}>Buat Server Baru</h3>
                            <p className={'text-[11px] text-[color:var(--pn-text-muted)]'}>
                                {plan?.name} &middot; sisa {remaining} slot dari {subscription.slots.total}
                            </p>
                        </div>
                    </div>
                    <button type={'button'} className={'pn-btn pn-btn--ghost pn-btn--sm'} onClick={onClose} aria-label={'Tutup'}>
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>

                {done ? (
                    <div className={'px-6 py-8 text-center'}>
                        <div className={'mx-auto grid h-14 w-14 place-items-center rounded-2xl text-2xl'}
                            style={{ background: 'rgba(16,185,129,.15)', color: 'var(--pn-success)' }}>
                            <FontAwesomeIcon icon={faCheckCircle} />
                        </div>
                        <h4 className={'pn-h3 mt-4 text-lg'}>Server sedang dibuat</h4>
                        <p className={'mt-1 text-sm text-[color:var(--pn-text-muted)]'}>{done}</p>
                        <p className={'mt-1 text-xs text-[color:var(--pn-text-dim)]'}>
                            Tugas instalasi berjalan di background; status koneksi muncul di daftar layanan beberapa saat lagi.
                        </p>
                        <button type={'button'} className={'pn-btn pn-btn--primary mt-5'} onClick={onClose}>
                            Lihat Layanan Saya
                        </button>
                    </div>
                ) : (
                    <form onSubmit={submit} className={'px-6 py-5 space-y-4'}>
                        {plan && (
                            <div className={'grid grid-cols-3 gap-2 text-center text-[11px]'}
                                style={{ background: 'var(--pn-surface-2)', border: '1px solid var(--pn-border)', borderRadius: 16, padding: 12 }}>
                                <div><div className={'pn-text-strong font-bold'}>{plan.specs.cpu}</div><div className={'text-[color:var(--pn-text-muted)]'}>CPU</div></div>
                                <div><div className={'pn-text-strong font-bold'}>{plan.specs.ram}</div><div className={'text-[color:var(--pn-text-muted)]'}>RAM</div></div>
                                <div><div className={'pn-text-strong font-bold'}>{plan.specs.disk}</div><div className={'text-[color:var(--pn-text-muted)]'}>Disk</div></div>
                            </div>
                        )}
                        <div>
                            <label htmlFor={'server-name'} className={'text-[11px] font-semibold uppercase tracking-wider text-[color:var(--pn-text-muted)]'}>
                                Nama server
                            </label>
                            <input
                                id={'server-name'}
                                name={'name'}
                                autoFocus
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                placeholder={'mis. Minebot Utama'}
                                maxLength={64}
                                className={'pn-input mt-1.5 w-full'}
                                required
                            />
                            <p className={'mt-1 text-[11px] text-[color:var(--pn-text-dim)]'}>
                                Huruf, angka, spasi, titik, strip, underscore. Minimal 3 karakter.
                            </p>
                        </div>

                        {error && (
                            <div className={'flex items-start gap-2 rounded-xl px-3 py-2 text-xs'}
                                style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', color: '#b91c1c' }}>
                                <FontAwesomeIcon icon={faExclamationTriangle} className={'mt-0.5'} />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className={'flex items-center justify-between gap-3'}>
                            <div className={'text-[11px] text-[color:var(--pn-text-dim)]'}>
                                Paket {plan?.name}{plan ? ` · ${formatIDR(plan.price_monthly)}/bulan` : ''}
                            </div>
                            <div className={'flex gap-2'}>
                                <button type={'button'} className={'pn-btn pn-btn--ghost'} onClick={onClose} disabled={busy}>Batal</button>
                                <button type={'submit'} className={'pn-btn pn-btn--primary'} disabled={!valid || busy || remaining < 1}>
                                    {busy ? <Spinner size={'small'} /> : <FontAwesomeIcon icon={faBolt} className={'text-[11px]'} />}
                                    Buat Sekarang
                                </button>
                            </div>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default CreateServerModal;
