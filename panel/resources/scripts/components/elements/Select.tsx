import styled, { css } from 'styled-components/macro';
import tw from 'twin.macro';

interface Props {
    hideDropdownArrow?: boolean;
}

const Select = styled.select<Props>`
    ${tw`block p-3 pr-8 rounded w-full text-sm`};
    transition: border-color 0.16s var(--pn-ease), box-shadow 0.16s var(--pn-ease);
    background-color: var(--pn-surface);
    border: 1px solid var(--pn-border-strong);
    color: var(--pn-text);
    box-shadow: inset 0 1.5px 3px rgba(18, 24, 58, 0.05);

    &,
    &:hover:not(:disabled),
    &:focus {
        ${tw`outline-none`};
    }

    -webkit-appearance: none;
    -moz-appearance: none;
    background-size: 1rem;
    background-repeat: no-repeat;
    background-position-x: calc(100% - 0.75rem);
    background-position-y: center;

    &::-ms-expand {
        display: none;
    }

    &:hover:not(:disabled) { border-color: var(--pn-border-accent); }
    &:focus { border-color: var(--pn-primary); box-shadow: 0 0 0 4px rgba(98, 80, 245, 0.15); }
    &:disabled { opacity: 0.6; cursor: not-allowed; background: var(--pn-surface-2); }

    ${(props) =>
        !props.hideDropdownArrow &&
        css`
            background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3e%3cpath fill='%233d4560' d='M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z'/%3e%3c/svg%3e ");
        `};
`;

export default Select;
