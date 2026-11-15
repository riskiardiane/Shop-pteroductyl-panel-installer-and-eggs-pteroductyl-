import * as React from 'react';
import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCogs, faLayerGroup, faSignOutAlt, faUser, faServer, faTags } from '@fortawesome/free-solid-svg-icons';
import { useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import SearchContainer from '@/components/dashboard/search/SearchContainer';
import http from '@/api/http';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import Tooltip from '@/components/elements/tooltip/Tooltip';

import BeforeNavigation from '@blueprint/components/Navigation/NavigationBar/BeforeNavigation';
import AdditionalItems from '@blueprint/components/Navigation/NavigationBar/AdditionalItems';
import AfterNavigation from '@blueprint/components/Navigation/NavigationBar/AfterNavigation';

const iconLinkStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '2.25rem',
  height: '2.25rem',
  borderRadius: 'var(--pn-radius)',
  cursor: 'pointer',
};

export default () => {
  const settings = useStoreState((state: ApplicationStore) => state.settings.data!);
  const name = settings.name;
  const rootAdmin = useStoreState((state: ApplicationStore) => state.user.data!.rootAdmin);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const onTriggerLogout = () => {
    setIsLoggingOut(true);
    http.post('/auth/logout').finally(() => {
      // @ts-expect-error this is valid
      window.location = '/';
    });
  };

  return (
    <div
      className={'sticky top-0 z-50 w-full border-b'}
      id={'NavigationBar'}
      style={{
        background: 'rgba(255,255,255,.8)',
        borderColor: 'var(--pn-border)',
        backdropFilter: 'blur(18px) saturate(1.15)',
        WebkitBackdropFilter: 'blur(18px) saturate(1.15)',
        boxShadow: '0 1px 0 rgba(18,24,58,.05)',
      }}
    >
      <BeforeNavigation />
      <SpinnerOverlay visible={isLoggingOut} />

      <div className={'pn-shell flex h-[3.85rem] items-center gap-3'}>
        {/* Brand */}
        <div id={'logo'} className={'flex flex-1 items-center gap-5'}>
          <Link to={'/'} className={'flex items-center gap-2.5 no-underline'} style={{ color: 'var(--pn-text)' }}>
            {settings.logo ? (
              <img
                src={settings.logo}
                alt={name || 'Panel'}
                className={'h-8 w-auto max-w-[7.5rem] rounded-lg object-contain'}
              />
            ) : (
              <span
                className={'grid h-8 w-8 place-items-center rounded-lg text-xs'}
                style={{
                  background: 'linear-gradient(135deg, #6d52f7, #4f3de0)',
                  boxShadow: '0 10px 24px -8px rgba(84,61,224,.65), inset 0 1px 0 rgba(255,255,255,.4)',
                  color: '#fff',
                }}
              >
                <FontAwesomeIcon icon={faServer} />
              </span>
            )}
            <span className={'font-header text-lg font-bold tracking-tight'}>{name || 'RizzDevs'}</span>
          </Link>

          {/* Primary navigation */}
          <nav className={'ml-2 hidden items-center gap-0.5 md:flex'} aria-label={'Navigasi panel'}>
            <NavLink to={'/'} exact className={'pn-navlink'}>
              <FontAwesomeIcon icon={faLayerGroup} className={'text-[11px]'} />
              Dashboard
            </NavLink>
            <Link to={'/pricing'} className={'pn-navlink'}>
              <FontAwesomeIcon icon={faTags} className={'text-[11px]'} />
              Paket
            </Link>
            <NavLink to={'/account'} className={'pn-navlink'}>
              <FontAwesomeIcon icon={faUser} className={'text-[11px]'} />
              Akun
            </NavLink>
            {rootAdmin && (
              <>
                <a href={'/admin/servers'} className={'pn-navlink'}>
                  Servers
                </a>
                <a href={'/admin/nests'} className={'pn-navlink'}>
                  Nests
                </a>
                <a href={'/admin/users'} className={'pn-navlink'}>
                  Users
                </a>
              </>
            )}
          </nav>
        </div>

        {/* Right side */}
        <div className={'flex items-center gap-1.5'}>
          <SearchContainer />

          <Tooltip placement={'bottom'} content={'Servers List'}>
            <NavLink to={'/'} exact id={'NavigationDashboard'} className={'pn-navlink'} style={iconLinkStyle}>
              <FontAwesomeIcon icon={faLayerGroup} className={'text-sm'} />
            </NavLink>
          </Tooltip>

          {rootAdmin && (
            <Tooltip placement={'bottom'} content={'Admin Panel'}>
              <a
                href={'/admin'}
                rel={'noreferrer'}
                id={'NavigationAdmin'}
                className={'hidden items-center gap-1.5 sm:flex'}
                style={{
                  padding: '.42rem .8rem',
                  borderRadius: 'var(--pn-radius-pill)',
                  background: 'rgba(109,78,240,.1)',
                  border: '1px solid var(--pn-border-accent)',
                  color: 'var(--pn-primary-600)',
                  fontSize: '.75rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                <FontAwesomeIcon icon={faCogs} className={'text-[10px]'} />
                <span>Admin</span>
              </a>
            </Tooltip>
          )}

          <AdditionalItems />

          <Tooltip placement={'bottom'} content={'Account Profile'}>
            <NavLink to={'/account'} id={'NavigationAccount'} className={'pn-navlink'} style={iconLinkStyle}>
              <span
                className={'grid h-7 w-7 place-items-center rounded-full text-[11px]'}
                style={{
                  background: 'linear-gradient(135deg, var(--pn-primary), #5b8cff)',
                  color: '#fff',
                  border: '1px solid rgba(15,23,42,.12)',
                }}
              >
                <FontAwesomeIcon icon={faUser} />
              </span>
            </NavLink>
          </Tooltip>

          <Tooltip placement={'bottom'} content={'Sign Out'}>
            <button
              onClick={onTriggerLogout}
              id={'NavigationLogout'}
              style={{ ...iconLinkStyle, background: 'transparent' }}
              aria-label={'Logout'}
            >
              <FontAwesomeIcon icon={faSignOutAlt} className={'text-sm'} />
            </button>
          </Tooltip>
        </div>
      </div>

      <AfterNavigation />
    </div>
  );
};
