import React from 'react';
import Icon from '@/components/elements/Icon';
import { IconDefinition } from '@fortawesome/free-solid-svg-icons';
import classNames from 'classnames';
import styles from './style.module.css';
import useFitText from 'use-fit-text';
import CopyOnClick from '@/components/elements/CopyOnClick';

interface StatBlockProps {
    title: string;
    copyOnClick?: string;
    /** Tone semantik: undefined = normal, 'warn' = hangat, 'crit' = kritis. */
    color?: string | undefined;
    icon: IconDefinition;
    children: React.ReactNode;
    className?: string;
}

const toneOf = (color?: string): 'ok' | 'warn' | 'crit' => {
    // Kompatibilitas pemanggil lama: 'bg-yellow-500' / 'bg-red-500' tetap diterjemahkan.
    if (!color) return 'ok';
    if (color.includes('red') || color.includes('crit')) return 'crit';
    if (color.includes('yellow') || color.includes('warn')) return 'warn';

    return 'ok';
};

export default ({ title, copyOnClick, icon, color, className, children }: StatBlockProps) => {
    const { fontSize, ref } = useFitText({ minFontSize: 8, maxFontSize: 500 });
    const tone = toneOf(color);

    return (
        <CopyOnClick text={copyOnClick}>
            <div className={classNames(styles.stat_block, className)} data-tone={tone}>
                <div className={styles.status_bar} />
                <div className={styles.icon}>
                    <Icon icon={icon} className={styles.icon_svg} />
                </div>
                <div className={'flex flex-col justify-center overflow-hidden w-full'}>
                    <p className={styles.label}>{title}</p>
                    <div ref={ref} className={styles.value} style={{ fontSize }}>
                        {children}
                    </div>
                </div>
            </div>
        </CopyOnClick>
    );
};
