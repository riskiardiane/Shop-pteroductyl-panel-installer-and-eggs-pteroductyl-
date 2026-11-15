import * as React from 'react';
import tw from 'twin.macro';
import styled from 'styled-components/macro';

export type FlashMessageType = 'success' | 'info' | 'warning' | 'error';

interface Props {
    title?: string;
    children: string;
    type?: FlashMessageType;
}

const palette = (type?: FlashMessageType) => {
    switch (type) {
        case 'error':
            return { box: 'rgba(224, 36, 94, 0.08)', border: 'rgba(224, 36, 94, 0.32)', text: '#b3124f', chip: '#e0245e' };
        case 'info':
            return { box: 'rgba(98, 80, 245, 0.09)', border: 'rgba(98, 80, 245, 0.32)', text: '#3f2fd0', chip: '#6250f5' };
        case 'success':
            return { box: 'rgba(4, 157, 108, 0.09)', border: 'rgba(4, 157, 108, 0.32)', text: '#037152', chip: '#049d6c' };
        case 'warning':
            return { box: 'rgba(199, 116, 0, 0.09)', border: 'rgba(199, 116, 0, 0.32)', text: '#8a4d00', chip: '#c77400' };
        default:
            return { box: 'var(--pn-surface-2)', border: 'var(--pn-border-strong)', text: 'var(--pn-text-muted)', chip: 'var(--pn-text-dim)' };
    }
};

const Container = styled.div<{ $type?: FlashMessageType }>`
    display: flex;
    align-items: center;
    gap: 0.65rem;
    width: 100%;
    padding: 0.6rem 0.85rem;
    border-radius: var(--pn-radius);
    border: 1px solid ${(props) => palette(props.$type).border};
    background: ${(props) => palette(props.$type).box};
    color: ${(props) => palette(props.$type).text};
    font-size: 0.84rem;
    line-height: 1.45;
    box-shadow: var(--pn-shadow-1);
`;
Container.displayName = 'MessageBox.Container';

const Chip = styled.span<{ $type?: FlashMessageType }>`
    display: inline-flex;
    align-items: center;
    border-radius: var(--pn-radius-pill);
    padding: 0.15rem 0.55rem;
    font-size: 0.62rem;
    font-weight: 800;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    background: ${(props) => palette(props.$type).chip};
    color: #fff;
`;
Chip.displayName = 'MessageBox.Chip';

const MessageBox = ({ title, children, type }: Props) => (
    <Container $type={type} role={'alert'}>
        {title && <Chip $type={type}>{title}</Chip>}
        <span css={tw`text-left flex-auto`}>{children}</span>
    </Container>
);

export default MessageBox;
