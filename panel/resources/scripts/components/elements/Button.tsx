import React from 'react';
import styled, { css } from 'styled-components/macro';
import tw from 'twin.macro';
import Spinner from '@/components/elements/Spinner';

interface Props {
    isLoading?: boolean;
    size?: 'xsmall' | 'small' | 'large' | 'xlarge';
    color?: 'green' | 'red' | 'primary' | 'grey';
    isSecondary?: boolean;
}

const ButtonStyle = styled.button<Omit<Props, 'isLoading'>>`
    ${tw`relative inline-flex items-center justify-center rounded text-sm transition-all duration-150`};
    font-family: var(--pn-font);
    font-weight: 650;
    letter-spacing: 0.01em;
    padding: 0.5rem 1rem;
    border-radius: var(--pn-radius);
    border: 1px solid transparent;
    gap: 0.4rem;

    ${(props) =>
        ((!props.isSecondary && !props.color) || props.color === 'primary') &&
        css<Props>`
            ${!props.isSecondary &&
            `
                background: linear-gradient(135deg, #6d52f7 0%, #4f3de0 60%, #3f2fd0 100%);
                color: #fff;
                border-color: transparent;
                box-shadow: 0 12px 24px -12px rgba(84, 61, 224, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.32);
                text-shadow: 0 1px 1px rgba(30, 16, 92, 0.3);
            `};

            &:hover:not(:disabled) {
                background: linear-gradient(135deg, #7d64ff 0%, #5b49ee 60%, #4736dc 100%);
            }
        `};

    ${(props) =>
        props.color === 'grey' &&
        css`
            background: var(--pn-surface);
            border-color: var(--pn-border-strong);
            color: var(--pn-text);
            box-shadow: var(--pn-shadow-1);

            &:hover:not(:disabled) {
                background: var(--pn-surface-2);
                border-color: var(--pn-border-accent);
                color: var(--pn-primary-600);
            }
        `};

    ${(props) =>
        props.color === 'green' &&
        css<Props>`
            background: rgba(4, 157, 108, 0.1);
            border-color: rgba(4, 157, 108, 0.4);
            color: #037152;

            &:hover:not(:disabled) {
                background: rgba(4, 157, 108, 0.18);
            }
        `};

    ${(props) =>
        props.color === 'red' &&
        css<Props>`
            background: rgba(224, 36, 94, 0.08);
            border-color: rgba(224, 36, 94, 0.4);
            color: #b3124f;

            &:hover:not(:disabled) {
                background: rgba(224, 36, 94, 0.16);
            }
        `};

    ${(props) => props.size === 'xsmall' && tw`px-2 py-1 text-xs`};
    ${(props) => (!props.size || props.size === 'small') && tw`px-4 py-2`};
    ${(props) => props.size === 'large' && tw`px-6 py-3 text-sm`};
    ${(props) => props.size === 'xlarge' && tw`px-6 py-3 w-full`};

    ${(props) =>
        props.isSecondary &&
        css<Props>`
            background: transparent;
            border-color: var(--pn-border-strong);
            color: var(--pn-text-muted);

            &:hover:not(:disabled) {
                border-color: var(--pn-border-accent);
                color: var(--pn-primary-600);
                background: var(--pn-primary-soft);
            }
        `};

    &:focus-visible {
        outline: 2px solid var(--pn-primary);
        outline-offset: 2px;
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

type ComponentProps = Omit<JSX.IntrinsicElements['button'], 'ref' | keyof Props> & Props;

const Button: React.FC<ComponentProps> = ({ children, isLoading, ...props }) => (
    <ButtonStyle {...props}>
        {isLoading && (
            <div css={tw`flex absolute justify-center items-center w-full h-full left-0 top-0`}>
                <Spinner size={'small'} />
            </div>
        )}
        <span css={isLoading ? tw`text-transparent` : undefined}>{children}</span>
    </ButtonStyle>
);

type LinkProps = Omit<JSX.IntrinsicElements['a'], 'ref' | keyof Props> & Props;

const LinkButton: React.FC<LinkProps> = (props) => <ButtonStyle as={'a'} {...props} />;

export { LinkButton, ButtonStyle };
export default Button;
