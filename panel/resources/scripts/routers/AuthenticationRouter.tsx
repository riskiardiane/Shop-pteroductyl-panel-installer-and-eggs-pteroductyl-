import React from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';
import LoginContainer from '@/components/auth/LoginContainer';
import ForgotPasswordContainer from '@/components/auth/ForgotPasswordContainer';
import ResetPasswordContainer from '@/components/auth/ResetPasswordContainer';
import LoginCheckpointContainer from '@/components/auth/LoginCheckpointContainer';
import { NotFound } from '@/components/elements/ScreenBlock';
import { useHistory, useLocation } from 'react-router';

export default () => {
    const history = useHistory();
    const location = useLocation();
    const { path } = useRouteMatch();

    return (
        <div className={'min-h-screen w-full bg-[color:var(--pn-bg)] flex flex-col justify-center items-center p-4 relative overflow-hidden select-none'}>
            {/* Ambient Background Radial Glows */}
            <div className={'pointer-events-none absolute -top-40 -left-40 w-96 h-96 bg-violet-400/20 rounded-full blur-[128px]'} />
            <div className={'pointer-events-none absolute -bottom-40 -right-40 w-96 h-96 bg-cyan-400/20 rounded-full blur-[128px]'} />
            <div className={'pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-300/20 rounded-full blur-[140px]'} />

            {/* Top-Left Geometric Accents & Dot Grid */}
            <svg className={'pointer-events-none absolute top-0 left-0 w-80 h-80 opacity-40'} viewBox={'0 0 320 320'} fill={'none'}>
                <path d={'M-60 140 L160 -80'} stroke={'url(#geomGrad1)'} strokeWidth={'2'} />
                <path d={'M-30 200 L210 -40'} stroke={'url(#geomGrad1)'} strokeWidth={'3'} strokeDasharray={'6 6'} />
                <path d={'M-10 260 L270 -20'} stroke={'url(#geomGrad1)'} strokeWidth={'1.5'} />
                <rect x={'20'} y={'20'} width={'80'} height={'120'} rx={'16'} stroke={'#7c3aed'} strokeWidth={'1'} strokeOpacity={'0.2'} transform={'rotate(-35 60 80)'} />
                <g fill={'#8b5cf6'} fillOpacity={'0.25'}>
                    <circle cx={'180'} cy={'60'} r={'1.5'} /><circle cx={'200'} cy={'60'} r={'1.5'} /><circle cx={'220'} cy={'60'} r={'1.5'} /><circle cx={'240'} cy={'60'} r={'1.5'} />
                    <circle cx={'180'} cy={'80'} r={'1.5'} /><circle cx={'200'} cy={'80'} r={'1.5'} /><circle cx={'220'} cy={'80'} r={'1.5'} /><circle cx={'240'} cy={'80'} r={'1.5'} />
                    <circle cx={'180'} cy={'100'} r={'1.5'} /><circle cx={'200'} cy={'100'} r={'1.5'} /><circle cx={'220'} cy={'100'} r={'1.5'} /><circle cx={'240'} cy={'100'} r={'1.5'} />
                </g>
                <defs>
                    <linearGradient id={'geomGrad1'} x1={'0%'} y1={'0%'} x2={'100%'} y2={'100%'}>
                        <stop offset={'0%'} stopColor={'#a855f7'} stopOpacity={'0.8'} />
                        <stop offset={'100%'} stopColor={'#6366f1'} stopOpacity={'0.1'} />
                    </linearGradient>
                </defs>
            </svg>

            {/* Bottom-Right Geometric Accents & Dot Grid */}
            <svg className={'pointer-events-none absolute bottom-0 right-0 w-80 h-80 opacity-40'} viewBox={'0 0 320 320'} fill={'none'}>
                <path d={'M380 180 L160 400'} stroke={'url(#geomGrad2)'} strokeWidth={'2'} />
                <path d={'M350 120 L110 360'} stroke={'url(#geomGrad2)'} strokeWidth={'3'} strokeDasharray={'6 6'} />
                <path d={'M330 60 L50 340'} stroke={'url(#geomGrad2)'} strokeWidth={'1.5'} />
                <rect x={'200'} y={'200'} width={'80'} height={'120'} rx={'16'} stroke={'#a855f7'} strokeWidth={'1'} strokeOpacity={'0.2'} transform={'rotate(-35 240 260)'} />
                <g fill={'#a855f7'} fillOpacity={'0.25'}>
                    <circle cx={'80'} cy={'220'} r={'1.5'} /><circle cx={'100'} cy={'220'} r={'1.5'} /><circle cx={'120'} cy={'220'} r={'1.5'} /><circle cx={'140'} cy={'220'} r={'1.5'} />
                    <circle cx={'80'} cy={'240'} r={'1.5'} /><circle cx={'100'} cy={'240'} r={'1.5'} /><circle cx={'120'} cy={'240'} r={'1.5'} /><circle cx={'140'} cy={'240'} r={'1.5'} />
                    <circle cx={'80'} cy={'260'} r={'1.5'} /><circle cx={'100'} cy={'260'} r={'1.5'} /><circle cx={'120'} cy={'260'} r={'1.5'} /><circle cx={'140'} cy={'260'} r={'1.5'} />
                </g>
                <defs>
                    <linearGradient id={'geomGrad2'} x1={'0%'} y1={'0%'} x2={'100%'} y2={'100%'}>
                        <stop offset={'0%'} stopColor={'#8b5cf6'} stopOpacity={'0.1'} />
                        <stop offset={'100%'} stopColor={'#a855f7'} stopOpacity={'0.8'} />
                    </linearGradient>
                </defs>
            </svg>

            {/* Main Auth Content Container */}
            <div className={'relative z-10 w-full flex flex-col items-center justify-center'}>
                <Switch location={location}>
                    <Route path={`${path}/login`} component={LoginContainer} exact />
                    <Route path={`${path}/login/checkpoint`} component={LoginCheckpointContainer} />
                    <Route path={`${path}/password`} component={ForgotPasswordContainer} exact />
                    <Route path={`${path}/password/reset/:token`} component={ResetPasswordContainer} />
                    <Route path={`${path}/checkpoint`} />
                    <Route path={'*'}>
                        <NotFound onBack={() => history.push('/auth/login')} />
                    </Route>
                </Switch>
            </div>
        </div>
    );
};
