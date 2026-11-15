import { ExclamationIcon, ShieldExclamationIcon } from '@heroicons/react/outline';
import React from 'react';
import classNames from 'classnames';

interface AlertProps {
    type: 'warning' | 'danger';
    className?: string;
    children: React.ReactNode;
}

export default ({ type, className, children }: AlertProps) => {
    return (
        <div
            role={'alert'}
            className={classNames(
                'flex items-center rounded-[var(--pn-radius)] border px-4 py-3 text-[0.84rem] leading-snug',
                {
                    ['border-[rgba(224,36,94,.35)] bg-[rgba(224,36,94,.07)] text-[#b3124f]']: type === 'danger',
                    ['border-[rgba(199,116,0,.35)] bg-[rgba(199,116,0,.08)] text-[#8a4d00]']: type === 'warning',
                },
                className
            )}
            style={{ boxShadow: 'var(--pn-shadow-1)' }}
        >
            {type === 'danger' ? (
                <ShieldExclamationIcon className={'w-6 h-6 mr-3 flex-shrink-0'} style={{ color: '#e0245e' }} />
            ) : (
                <ExclamationIcon className={'w-6 h-6 mr-3 flex-shrink-0'} style={{ color: '#c77400' }} />
            )}
            <span>{children}</span>
        </div>
    );
};
