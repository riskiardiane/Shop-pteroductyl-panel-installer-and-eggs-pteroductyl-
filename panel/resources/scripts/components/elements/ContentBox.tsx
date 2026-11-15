import React from 'react';
import FlashMessageRender from '@/components/FlashMessageRender';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';

type Props = Readonly<
    React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement> & {
        title?: string;
        borderColor?: string;
        showFlashes?: string | boolean;
        showLoadingOverlay?: boolean;
    }
>;

const ContentBox = ({ title, borderColor, showFlashes, showLoadingOverlay, children, className, ...props }: Props) => (
    <div className={className} {...props}>
        {title && (
            <h2 className={'mb-2 text-lg sm:text-xl font-bold tracking-tight'} style={{ color: 'var(--pn-text)' }}>
                {title}
            </h2>
        )}
        {showFlashes && (
            <FlashMessageRender byKey={typeof showFlashes === 'string' ? showFlashes : undefined} className={'mb-4'} />
        )}
        <div
            className={'rounded-2xl p-6 relative'}
            style={{
                background: 'var(--pn-surface)',
                border: '1px solid var(--pn-border)',
                borderTop: `3px solid ${borderColor || 'var(--pn-primary)'}`,
                boxShadow: 'var(--pn-shadow-1), var(--pn-inner-highlight)',
            }}
        >
            <SpinnerOverlay visible={showLoadingOverlay || false} />
            {children}
        </div>
    </div>
);

export default ContentBox;
