import React from 'react';
import { BillingCycle } from '@/config/plans';

const OPTIONS: { value: BillingCycle; label: string; hint?: string }[] = [
    { value: 'monthly', label: 'Bulanan' },
    { value: 'quarterly', label: '3 Bulan', hint: '5%' },
    { value: 'yearly', label: 'Tahunan', hint: 'Hemat' },
];

const BillingToggle: React.FC<{ value: BillingCycle; onChange: (value: BillingCycle) => void }> = ({
    value,
    onChange,
}) => (
    <div className={'pn-tabs'} role={'tablist'} aria-label={'Siklus penagihan'}>
        {OPTIONS.map((option) => (
            <button
                key={option.value}
                type={'button'}
                role={'tab'}
                aria-selected={value === option.value}
                className={'pn-tab'}
                onClick={() => onChange(option.value)}
            >
                {option.label}
                {option.hint && (
                    <span
                        className={'ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold'}
                        style={{ background: 'rgba(34,211,238,.16)', color: '#0e7490' }}
                    >
                        {option.hint}
                    </span>
                )}
            </button>
        ))}
    </div>
);

export default BillingToggle;
