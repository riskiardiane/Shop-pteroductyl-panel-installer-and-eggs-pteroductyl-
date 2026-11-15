import React, { useEffect } from 'react';
import ContentContainer from '@/components/elements/ContentContainer';
import { CSSTransition } from 'react-transition-group';
import tw from 'twin.macro';
import FlashMessageRender from '@/components/FlashMessageRender';

export interface PageContentBlockProps {
  title?: string;
  className?: string;
  showFlashKey?: string;
}

import SiteFooter from '@/components/elements/SiteFooter';
import BeforeSection from '@blueprint/components/Dashboard/Global/BeforeSection';
import AfterSection from '@blueprint/components/Dashboard/Global/AfterSection';

const PageContentBlock: React.FC<PageContentBlockProps> = ({ title, showFlashKey, className, children }) => {
  useEffect(() => {
    if (title) {
      document.title = title;
    }
  }, [title]);

  return (
    <CSSTransition timeout={150} classNames={'fade'} appear in>
      <>
        <BeforeSection />
        <ContentContainer css={tw`my-4 sm:my-6`} className={className}>
          {showFlashKey && <FlashMessageRender byKey={showFlashKey} css={tw`mb-4`} />}
          {children}
        </ContentContainer>
        <AfterSection />
        <ContentContainer css={tw`mb-6`}>
          <p css={tw`text-center text-xs`} style={{ color: 'var(--pn-text-dim)' }}>
            <SiteFooter />
          </p>
        </ContentContainer>
      </>
    </CSSTransition>
  );
};

export default PageContentBlock;
