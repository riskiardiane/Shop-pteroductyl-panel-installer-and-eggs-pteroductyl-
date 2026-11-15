import React from 'react';
import ContentBox from '@/components/elements/ContentBox';
import UpdatePasswordForm from '@/components/dashboard/forms/UpdatePasswordForm';
import UpdateEmailAddressForm from '@/components/dashboard/forms/UpdateEmailAddressForm';
import ConfigureTwoFactorForm from '@/components/dashboard/forms/ConfigureTwoFactorForm';
import PageContentBlock from '@/components/elements/PageContentBlock';
import MessageBox from '@/components/MessageBox';
import { useLocation } from 'react-router-dom';
import { useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import { format } from 'date-fns';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faShieldAlt, faUser } from '@fortawesome/free-solid-svg-icons';

import BeforeContent from '@blueprint/components/Account/Overview/BeforeContent';
import AfterContent from '@blueprint/components/Account/Overview/AfterContent';

export default () => {
    const { state } = useLocation<undefined | { twoFactorRedirect?: boolean }>();
    const user = useStoreState((state: ApplicationStore) => state.user.data!);

    return (
        <PageContentBlock title={'Your Profile'}>
            {state?.twoFactorRedirect && (
                <MessageBox title={'2-Factor Required'} type={'error'}>
                    Your account must have two-factor authentication enabled in order to continue.
                </MessageBox>
            )}

            <BeforeContent />

            {/* Header */}
            <div className={'mb-8 max-w-[1200px] mx-auto'}>
                <h1 className={'text-2xl sm:text-3xl font-bold pn-text-strong tracking-tight'}>Your Profile</h1>
                <p className={'text-sm text-gray-400 mt-1'}>
                    Manage your account information and security settings.
                </p>
            </div>

            {/* Profile Grid Container */}
            <div className={'max-w-[1200px] mx-auto flex flex-col lg:flex-row gap-6 mb-12'}>
                {/* Left Profile Identity Card */}
                <div className={'w-full lg:w-[380px] flex-shrink-0 bg-[#130f2c]/90 border border-purple-500/20 rounded-2xl p-6 sm:p-8 shadow-xl shadow-purple-950/40 backdrop-blur-md flex flex-col items-center'}>
                    <div className={'w-24 h-24 rounded-full bg-purple-600 text-white flex items-center justify-center text-3xl shadow-lg shadow-purple-900/50 mb-4 border-2 border-purple-400/30'}>
                        <FontAwesomeIcon icon={faUser} />
                    </div>
                    <h2 className={'text-xl font-bold pn-text-strong tracking-tight'}>
                        {user.username}
                    </h2>
                    <div className={'mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-500/15 border border-green-500/30 text-green-400'}>
                        <span className={'w-2 h-2 rounded-full bg-green-400 animate-pulse'} />
                        <span>Online</span>
                    </div>

                    <div className={'w-full mt-8 space-y-4 text-left'}>
                        {/* Email Info Block */}
                        <div>
                            <span className={'text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5 mb-1.5'}>
                                <FontAwesomeIcon icon={faEnvelope} className={'text-purple-400'} />
                                <span>Email Address</span>
                            </span>
                            <div className={'w-full bg-[#181433] border border-purple-900/30 rounded-xl px-4 py-3 text-sm text-gray-200 font-mono break-all'}>
                                {user.email}
                            </div>
                        </div>

                        {/* Account Created Block */}
                        <div>
                            <span className={'text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5 mb-1.5'}>
                                <FontAwesomeIcon icon={faShieldAlt} className={'text-purple-400'} />
                                <span>Account Created</span>
                            </span>
                            <div className={'w-full bg-[#181433] border border-purple-900/30 rounded-xl px-4 py-3 text-sm text-gray-200'}>
                                {user.createdAt ? format(new Date(user.createdAt), 'MMM d, yyyy') : 'Recently'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Actions and Security Forms */}
                <div className={'flex-1 space-y-6'}>
                    <ContentBox title={'Change Email Address'} showFlashes={'account:email'}>
                        <p className={'text-xs text-gray-400 mb-4'}>
                            Update the email address associated with your account.
                        </p>
                        <UpdateEmailAddressForm />
                    </ContentBox>

                    <ContentBox title={'Two-Step Verification'}>
                        <p className={'text-xs text-gray-400 mb-4'}>
                            Add an extra layer of security to your account.
                        </p>
                        <ConfigureTwoFactorForm />
                    </ContentBox>

                    <ContentBox title={'Update Password'} showFlashes={'account:password'}>
                        <p className={'text-xs text-gray-400 mb-4'}>
                            Ensure your account is using a long, random password to stay secure.
                        </p>
                        <UpdatePasswordForm />
                    </ContentBox>
                </div>
            </div>

            <AfterContent />
        </PageContentBlock>
    );
};
