import React, { forwardRef } from 'react';
import { Form } from 'formik';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBolt, faCheckCircle, faServer, faShieldAlt } from '@fortawesome/free-solid-svg-icons';
import FlashMessageRender from '@/components/FlashMessageRender';
import Attribution from '@blueprint/extends/Attribution';
import BeforeContent from '@blueprint/components/Authentication/Container/BeforeContent';
import AfterContent from '@blueprint/components/Authentication/Container/AfterContent';

type Props = React.DetailedHTMLProps<React.FormHTMLAttributes<HTMLFormElement>, HTMLFormElement> & {
    title?: string;
};

const highlights = [
    { icon: faBolt, text: 'Provisioning otomatis setelah pembayaran' },
    { icon: faShieldAlt, text: 'Perlindungan DDoS di setiap node' },
    { icon: faServer, text: 'Panel penuh: console, file, backup' },
];

export default forwardRef<HTMLFormElement, Props>(({ title, ...props }, ref) => (
    <div className={'mx-auto w-full max-w-[980px] px-4'}>
        <BeforeContent />
        <Form {...props} ref={ref}>
            <div
                className={'flex flex-col overflow-hidden md:flex-row'}
                style={{
                    background: 'var(--pn-surface)',
                    border: '1px solid var(--pn-border)',
                    borderRadius: 'var(--pn-radius-xl)',
                    boxShadow: 'var(--pn-glow)',
                }}
            >
                {/* Brand panel */}
                <div
                    className={'relative hidden w-[360px] flex-shrink-0 overflow-hidden p-8 md:flex md:flex-col md:justify-between'}
                    style={{
                        background:
                            'radial-gradient(120% 100% at 0% 0%, rgba(124,92,255,.4), transparent 60%), radial-gradient(120% 100% at 100% 100%, rgba(34,211,238,.22), transparent 55%), #0a0f1e',
                        borderRight: '1px solid var(--pn-border)',
                    }}
                >
                    <div className={'pn-grid-bg absolute inset-0 opacity-60'} />

                    <div className={'relative'}>
                        <div className={'flex items-center gap-2.5'}>
                            <span
                                className={'grid h-9 w-9 place-items-center rounded-xl text-sm'}
                                style={{ background: 'linear-gradient(135deg, var(--pn-primary), #5b8cff)' }}
                            >
                                <FontAwesomeIcon icon={faServer} />
                            </span>
                            <span className={'font-header text-lg font-bold text-white'}>Control Panel</span>
                        </div>

                        <h2 className={'pn-h2 mt-10 text-3xl'}>
                            Satu panel,
                            <br />
                            <span className={'pn-gradient-text'}>semua kendali.</span>
                        </h2>
                        <p className={'mt-3 text-sm leading-relaxed'} style={{ color: 'var(--pn-text-muted)' }}>
                            Kelola server, tagihan, dan resource dari dashboard yang sama.
                        </p>
                    </div>

                    <ul className={'relative mt-10 space-y-3'}>
                        {highlights.map((item) => (
                            <li key={item.text} className={'flex items-start gap-2.5 text-xs'} style={{ color: 'var(--pn-text-muted)' }}>
                                <span
                                    className={'mt-0.5 grid h-6 w-6 flex-shrink-0 place-items-center rounded-lg'}
                                    style={{ background: 'rgba(124,92,255,.16)', color: 'var(--pn-primary-300)' }}
                                >
                                    <FontAwesomeIcon icon={item.icon} className={'text-[10px]'} />
                                </span>
                                {item.text}
                            </li>
                        ))}
                    </ul>

                    <div className={'relative mt-10 flex items-center gap-2 text-[11px]'} style={{ color: 'var(--pn-text-dim)' }}>
                        <FontAwesomeIcon icon={faCheckCircle} style={{ color: 'var(--pn-success)' }} />
                        Uptime 99.9% • Mitigasi 24/7
                    </div>
                </div>

                {/* Mobile header */}
                <div
                    className={'flex flex-col items-center gap-2 border-b p-5 md:hidden'}
                    style={{ borderColor: 'var(--pn-border)', background: 'rgba(124,92,255,.08)' }}
                >
                    <span className={'grid h-10 w-10 place-items-center rounded-xl'} style={{ background: 'linear-gradient(135deg, var(--pn-primary), #5b8cff)' }}>
                        <FontAwesomeIcon icon={faServer} />
                    </span>
                    <span className={'font-header text-base font-bold text-white'}>Control Panel</span>
                </div>

                {/* Form */}
                <div className={'flex flex-1 flex-col justify-center p-6 sm:p-8 md:p-10'}>
                    {title && (
                        <div className={'mb-6'}>
                            <h1 className={'pn-h2 text-2xl sm:text-3xl'}>{title}</h1>
                        </div>
                    )}
                    <FlashMessageRender className={'mb-4'} />
                    {props.children}
                </div>
            </div>
        </Form>
        <AfterContent />

        <div className={'mt-8 flex items-center justify-center gap-3 text-[11px] sm:text-xs'} style={{ color: 'var(--pn-text-dim)' }}>
            <div className={'h-px w-12 sm:w-24'} style={{ background: 'linear-gradient(90deg, transparent, var(--pn-border-strong))' }} />
            <div className={'flex items-center gap-1.5'}>
                <a
                    rel={'noopener nofollow noreferrer'}
                    href={'https://pterodactyl.io'}
                    target={'_blank'}
                    className={'no-underline transition-colors'}
                    style={{ color: 'var(--pn-text-dim)' }}
                >
                    Pterodactyl&reg;
                </a>
                <span>&copy; 2015 – {new Date().getFullYear()}</span>
                <span>&bull;</span>
                <Attribution />
            </div>
            <div className={'h-px w-12 sm:w-24'} style={{ background: 'linear-gradient(90deg, var(--pn-border-strong), transparent)' }} />
        </div>
    </div>
));
