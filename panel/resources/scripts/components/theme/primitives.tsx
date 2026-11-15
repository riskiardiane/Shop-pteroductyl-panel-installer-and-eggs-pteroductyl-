import React from 'react';

/**
 * Primitif UI bersama untuk seluruh panel.
 * Semua memakai class dari `assets/css/theme.css` supaya konsisten dan
 * tidak bergantung pada konfigurasi Tailwind JIT.
 */

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    glass?: boolean;
    glow?: boolean;
    flat?: boolean;
}

export const Card: React.FC<CardProps> = ({ glass, glow, flat, className = '', children, ...props }) => (
    <div
        className={['pn-card', glass && 'pn-card--glass', glow && 'pn-card--glow', flat && 'pn-card--flat', className]
            .filter(Boolean)
            .join(' ')}
        {...props}
    >
        {children}
    </div>
);

export const CardHead: React.FC<{ title: React.ReactNode; actions?: React.ReactNode; className?: string }> = ({
    title,
    actions,
    className = '',
}) => (
    <div className={`pn-card__head ${className}`}>
        <div className={'pn-card__title'}>{title}</div>
        {actions}
    </div>
);

export const CardBody: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', children, ...props }) => (
    <div className={`pn-card__body ${className}`} {...props}>
        {children}
    </div>
);

export const CardFoot: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', children, ...props }) => (
    <div className={`pn-card__foot ${className}`} {...props}>
        {children}
    </div>
);

type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'cyan';

export const Badge: React.FC<{ tone?: BadgeTone; dot?: boolean; className?: string }> = ({
    tone = 'neutral',
    dot,
    className = '',
    children,
}) => (
    <span className={`pn-badge ${tone !== 'neutral' ? `pn-badge--${tone}` : ''} ${className}`}>
        {dot && <span className={'pn-dot'} />}
        {children}
    </span>
);

export const SectionHeading: React.FC<{
    eyebrow?: string;
    title: React.ReactNode;
    description?: React.ReactNode;
    align?: 'left' | 'center';
    className?: string;
}> = ({ eyebrow, title, description, align = 'left', className = '' }) => (
    <div className={`${align === 'center' ? 'text-center mx-auto' : ''} max-w-2xl ${className}`}>
        {eyebrow && <span className={'pn-eyebrow'}>{eyebrow}</span>}
        <h2 className={'pn-h2 mt-2'}>{title}</h2>
        {description && <p className={'pn-lede mt-3'}>{description}</p>}
    </div>
);

export const StatCard: React.FC<{
    icon?: React.ReactNode;
    label: string;
    value: React.ReactNode;
    hint?: React.ReactNode;
    accent?: 'primary' | 'cyan' | 'success' | 'warning';
    className?: string;
}> = ({ icon, label, value, hint, accent = 'primary', className = '' }) => (
    <div className={`pn-stat ${className}`}>
        {icon && (
            <div
                className={'pn-stat__icon'}
                style={
                    accent === 'cyan'
                        ? { background: 'linear-gradient(135deg, rgba(14,125,148,.16), rgba(14,125,148,.06))', borderColor: 'rgba(14,125,148,.34)', color: '#0b5d70' }
                        : accent === 'success'
                        ? {
                              background: 'linear-gradient(135deg, rgba(4,157,108,.15), rgba(4,157,108,.05))',
                              borderColor: 'rgba(4,157,108,.34)',
                              color: '#037152',
                          }
                        : accent === 'warning'
                        ? {
                              background: 'linear-gradient(135deg, rgba(199,116,0,.14), rgba(199,116,0,.05))',
                              borderColor: 'rgba(199,116,0,.34)',
                              color: '#9a5700',
                          }
                        : undefined
                }
            >
                {icon}
            </div>
        )}
        <div className={'min-w-0'}>
            <div className={'pn-stat__label'}>{label}</div>
            <div className={'pn-stat__value'}>{value}</div>
            {hint && <div className={'pn-stat__hint'}>{hint}</div>}
        </div>
    </div>
);

export const EmptyState: React.FC<{
    icon?: React.ReactNode;
    title: React.ReactNode;
    description?: React.ReactNode;
    action?: React.ReactNode;
}> = ({ icon, title, description, action }) => (
    <div className={'pn-empty'}>
        {icon && <div className={'pn-empty__icon'}>{icon}</div>}
        <h3 className={'pn-h3'}>{title}</h3>
        {description && <p className={'pn-lede mt-2 max-w-md'}>{description}</p>}
        {action && <div className={'mt-5'}>{action}</div>}
    </div>
);

export const Divider: React.FC<{ className?: string }> = ({ className = '' }) => (
    <hr className={`pn-divider ${className}`} />
);

/** Bullet "✓" kecil untuk daftar fitur. */
export const Check: React.FC<{ className?: string }> = ({ className = '' }) => (
    <svg
        className={`pn-check ${className}`}
        width={'14'}
        height={'14'}
        viewBox={'0 0 20 20'}
        fill={'none'}
        aria-hidden={'true'}
    >
        <path
            d={'M5 10.5l3.2 3.2L15 7'}
            stroke={'currentColor'}
            strokeWidth={'2.2'}
            strokeLinecap={'round'}
            strokeLinejoin={'round'}
        />
    </svg>
);
