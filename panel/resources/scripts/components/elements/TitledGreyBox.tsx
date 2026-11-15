import React, { memo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import isEqual from 'react-fast-compare';

interface Props {
    icon?: IconProp;
    title: string | React.ReactNode;
    className?: string;
    children: React.ReactNode;
}

/**
 * Kotak konten standar (dipakai settings/startup/databases/dll).
 * Setelah rombak AURORA 2.0: kartu putih dengan header dan body konsisten.
 */
const TitledGreyBox = ({ icon, title, children, className }: Props) => (
    <div className={`pn-card ${className ?? ''}`}>
        <div className={'pn-card__head'}>
            <p className={'pn-card__title'}>
                {icon && <FontAwesomeIcon icon={icon} className={'mr-2'} style={{ color: 'var(--pn-primary)' }} />}
                {title}
            </p>
        </div>
        <div className={'pn-card__body'}>{children}</div>
    </div>
);

export default memo(TitledGreyBox, isEqual);
