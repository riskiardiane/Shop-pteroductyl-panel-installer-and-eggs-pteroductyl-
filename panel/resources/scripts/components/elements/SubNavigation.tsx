import styled from 'styled-components/macro';
import tw from 'twin.macro';

const SubNavigation = styled.div`
    ${tw`w-full overflow-x-auto`};
    position: sticky;
    top: 0;
    z-index: 30;
    background: rgba(255, 255, 255, 0.82);
    backdrop-filter: blur(14px) saturate(1.25);
    -webkit-backdrop-filter: blur(14px) saturate(1.25);
    border-bottom: 1px solid var(--pn-border);

    & > div {
        ${tw`flex items-center text-sm mx-auto px-2`};
        max-width: 1200px;

        & > a,
        & > div {
            ${tw`inline-flex items-center no-underline whitespace-nowrap transition-all duration-150`};
            margin-top: 0.4rem;
            margin-bottom: 0.4rem;
            padding: 0.42rem 0.8rem;
            border-radius: var(--pn-radius-sm);
            border: 1px solid transparent;
            color: var(--pn-text-muted);
            font-weight: 650;
            font-size: 0.8rem;
            line-height: 1;

            &:not(:first-of-type) {
                ${tw`ml-1`};
            }

            &:hover {
                color: var(--pn-primary-600);
                background: var(--pn-primary-soft);
            }

            &:active,
            &.active {
                color: var(--pn-primary-700);
                background: var(--pn-primary-soft);
                border-color: var(--pn-border-accent);
                box-shadow: 0 0 0 1px rgba(98, 80, 245, 0.12);
            }

            & svg { margin-right: 0.4rem; }
        }
    }
`;

export default SubNavigation;
