import styled from 'styled-components/macro';
import tw from 'twin.macro';

const ContentContainer = styled.div`
    max-width: 1240px;
    ${tw`mx-4`};

    @media (min-width: 1280px) {
        margin-left: auto;
        margin-right: auto;
    }
`;
ContentContainer.displayName = 'ContentContainer';

export default ContentContainer;
