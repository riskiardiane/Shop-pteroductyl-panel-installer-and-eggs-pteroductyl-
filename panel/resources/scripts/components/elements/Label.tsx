import styled from 'styled-components/macro';

const Label = styled.label<{ isLight?: boolean }>`
    display: block;
    font-family: var(--pn-font);
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.075em;
    text-transform: uppercase;
    color: var(--pn-text-dim);
    margin-bottom: 0.35rem;

    @media (min-width: 640px) {
        margin-bottom: 0.45rem;
    }
`;

export default Label;
