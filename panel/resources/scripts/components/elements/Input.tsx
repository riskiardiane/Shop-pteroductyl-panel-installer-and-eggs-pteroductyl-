import styled, { css } from 'styled-components/macro';

export interface Props {
    isLight?: boolean;
    hasError?: boolean;
}

const checkboxStyle = css<Props>`
    cursor: pointer;
    appearance: none;
    display: inline-block;
    vertical-align: middle;
    user-select: none;
    flex-shrink: 0;
    width: 1.1rem;
    height: 1.1rem;
    color: var(--pn-primary);
    border: 1.5px solid var(--pn-border-strong);
    background: var(--pn-surface);
    border-radius: 5px;
    box-shadow: inset 0 1.5px 2px rgba(18, 24, 58, 0.06);
    transition: all 90ms linear, box-shadow 90ms linear;

    &:checked {
        border-color: transparent;
        background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M5.707 7.293a1 1 0 0 0-1.414 1.414l2 2a1 1 0 0 0 1.414 0l4-4a1 1 0 0 0-1.414-1.414L7 8.586 5.707 7.293z'/%3e%3c/svg%3e");
        background-color: currentColor;
        background-size: 100% 100%;
        background-position: center;
        background-repeat: no-repeat;
    }

    &:focus {
        outline: none;
        border-color: var(--pn-primary);
        box-shadow: 0 0 0 4px rgba(98, 80, 245, 0.16);
    }
`;

const inputStyle = css<Props>`
    resize: none;
    appearance: none;
    outline: none;
    width: 100%;
    min-width: 0;
    padding: 0.7rem 0.85rem;
    font-size: 0.88rem;
    border-radius: var(--pn-radius);
    background: var(--pn-surface);
    color: var(--pn-text);
    border: 1px solid var(--pn-border-strong);
    box-shadow: inset 0 1.5px 3px rgba(18, 24, 58, 0.05);
    transition: border-color 0.16s var(--pn-ease), box-shadow 0.16s var(--pn-ease), background 0.16s var(--pn-ease);

    &::placeholder {
        color: var(--pn-text-dim);
    }

    &:hover {
        border-color: var(--pn-border-accent);
    }

    &:not(:disabled):not(:read-only):focus {
        border-color: var(--pn-primary);
        background: #fff;
        box-shadow: 0 0 0 4px rgba(98, 80, 245, 0.15), inset 0 1.5px 3px rgba(18, 24, 58, 0.04);
    }

    &:disabled {
        opacity: 0.65;
        background: var(--pn-surface-2);
        cursor: not-allowed;
    }

    ${(props) =>
        props.hasError &&
        css<Props>`
            border-color: rgba(224, 36, 94, 0.55) !important;
            color: #b3124f;
            &:focus {
                box-shadow: 0 0 0 4px rgba(224, 36, 94, 0.14) !important;
            }
        `}

    & + .input-help {
        margin-top: 0.4rem;
        font-size: 0.72rem;
        color: var(--pn-text-muted);

        ${(props) => props.hasError && css`color: #b3124f;`}
    }
`;

const Input = styled.input<Props>`
    &:not([type='checkbox']):not([type='radio']) {
        ${inputStyle};
    }

    &[type='checkbox'],
    &[type='radio'] {
        ${checkboxStyle};

        &[type='radio'] {
            border-radius: 9999px;
        }
    }
`;

const Textarea = styled.textarea<Props>`
    ${inputStyle}
`;

export { Textarea };
export default Input;
