import styled from 'styled-components/macro';
import tw from 'twin.macro';

export default styled.div<{ $hoverable?: boolean }>`
    ${tw`flex rounded items-center p-4 overflow-hidden`};
    position: relative;
    text-decoration: none;
    background: var(--pn-surface);
    color: var(--pn-text);
    border: 1px solid var(--pn-border);
    border-radius: var(--pn-radius);
    box-shadow: var(--pn-shadow-1);
    transition: border-color 0.18s var(--pn-ease), box-shadow 0.18s var(--pn-ease), transform 0.18s var(--pn-ease);

    ${(props) =>
        props.$hoverable !== false &&
        `
        &:hover {
            border-color: var(--pn-border-accent);
            box-shadow: var(--pn-shadow-1), 0 0 0 1px rgba(98, 80, 245, 0.12);
        }
        `};

    & .icon {
        ${tw`rounded-full flex items-center justify-center`};
        width: 4rem;
        height: 4rem;
        flex-shrink: 0;
        background: linear-gradient(135deg, rgba(98, 80, 245, 0.14), rgba(138, 123, 255, 0.06));
        border: 1px solid var(--pn-border-accent);
        color: var(--pn-primary-600);
    }
`;
