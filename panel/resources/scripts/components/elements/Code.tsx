import React from 'react';
import classNames from 'classnames';

interface CodeProps {
    dark?: boolean | undefined;
    className?: string;
    children: React.ReactChild | React.ReactFragment | React.ReactPortal;
}

export default ({ dark, className, children }: CodeProps) => (
    <code
        className={classNames('font-mono text-[0.8em] px-2 py-0.5 inline-block rounded', className)}
        style={
            dark
                ? { background: '#101a30', color: '#c9d4ff', border: '1px solid rgba(141,154,255,.2)' }
                : { background: 'var(--pn-surface-3)', color: 'var(--pn-primary-600)', border: '1px solid var(--pn-border)' }
        }
    >
        {children}
    </code>
);
