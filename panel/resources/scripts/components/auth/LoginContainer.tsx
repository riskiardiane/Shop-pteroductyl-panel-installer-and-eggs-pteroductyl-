import React, { useEffect, useRef, useState } from 'react';
import { Link, RouteComponentProps } from 'react-router-dom';
import login from '@/api/auth/login';
import LoginFormContainer from '@/components/auth/LoginFormContainer';
import { useStoreState } from 'easy-peasy';
import { Formik, FormikHelpers } from 'formik';
import { object, string } from 'yup';
import Reaptcha from 'reaptcha';
import useFlash from '@/plugins/useFlash';
import Spinner from '@/components/elements/Spinner';
import { UserIcon, LockClosedIcon, EyeIcon, EyeOffIcon, LoginIcon } from '@heroicons/react/solid';

interface Values {
    username: string;
    password: string;
}

const LoginContainer = ({ history }: RouteComponentProps) => {
    const ref = useRef<Reaptcha>(null);
    const [token, setToken] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const { enabled: recaptchaEnabled, siteKey } = useStoreState((state) => state.settings.data!.recaptcha);

    useEffect(() => {
        clearFlashes();
    }, []);

    const onSubmit = (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes();

        if (recaptchaEnabled && !token) {
            ref.current!.execute().catch((error) => {
                console.error(error);
                setSubmitting(false);
                clearAndAddHttpError({ error });
            });
            return;
        }

        login({ ...values, recaptchaData: token })
            .then((response) => {
                if (response.complete) {
                    // @ts-expect-error this is valid
                    window.location = response.intended || '/';
                    return;
                }

                history.replace('/auth/login/checkpoint', { token: response.confirmationToken });
            })
            .catch((error) => {
                console.error(error);
                setToken('');
                if (ref.current) ref.current.reset();
                setSubmitting(false);
                clearAndAddHttpError({ error });
            });
    };

    return (
        <Formik
            onSubmit={onSubmit}
            initialValues={{ username: '', password: '' }}
            validationSchema={object().shape({
                username: string().required('A username or email must be provided.'),
                password: string().required('Please enter your account password.'),
            })}
        >
            {({ values, errors, touched, handleChange, handleBlur, isSubmitting, submitForm }) => (
                <LoginFormContainer>
                    {/* Header */}
                    <div className={'mb-6'}>
                        <span className={'pn-eyebrow'}>Portal Pelanggan</span>
                        <h1 className={'pn-h2 mt-2 text-2xl sm:text-3xl'}>
                            Masuk untuk <span className={'pn-gradient-text'}>melanjutkan</span>
                        </h1>
                        <p className={'mt-2 text-xs sm:text-sm text-[color:var(--pn-text-muted)]'}>
                            Gunakan email dan password akun panel kamu.
                        </p>
                    </div>

                    {/* Username or Email Input */}
                    <div className={'mb-5'}>
                        <label htmlFor={'username'} className={'pn-label flex items-center gap-1.5'}>
                            <UserIcon className={'h-4 w-4'} />
                            <span>Username atau Email</span>
                        </label>
                        <div className={'relative'}>
                            <input
                                id={'username'}
                                name={'username'}
                                type={'text'}
                                value={values.username}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                disabled={isSubmitting}
                                placeholder={'Masukkan username atau email...'}
                                className={`pn-input ${touched.username && errors.username ? 'pn-input--error' : ''}`}
                            />
                        </div>
                        {touched.username && errors.username && (
                            <p className={'mt-1.5 text-xs text-[color:var(--pn-danger)]'}>{errors.username}</p>
                        )}
                    </div>

                    {/* Password Input with Show/Hide Toggle */}
                    <div className={'mb-6'}>
                        <label htmlFor={'password'} className={'pn-label flex items-center gap-1.5'}>
                            <LockClosedIcon className={'h-4 w-4'} />
                            <span>Password</span>
                        </label>
                        <div className={'relative'}>
                            <input
                                id={'password'}
                                name={'password'}
                                type={showPassword ? 'text' : 'password'}
                                value={values.password}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                disabled={isSubmitting}
                                placeholder={'Masukkan password...'}
                                className={`pn-input pr-11 ${touched.password && errors.password ? 'pn-input--error' : ''}`}
                            />
                            <button
                                type={'button'}
                                onClick={() => setShowPassword(!showPassword)}
                                className={'absolute right-3 top-1/2 -translate-y-1/2 p-1 transition-colors'}
                                style={{ color: 'var(--pn-text-dim)' }}
                                aria-label={'Toggle password visibility'}
                            >
                                {showPassword ? <EyeOffIcon className={'h-5 w-5'} /> : <EyeIcon className={'h-5 w-5'} />}
                            </button>
                        </div>
                        {touched.password && errors.password && (
                            <p className={'mt-1.5 text-xs text-[color:var(--pn-danger)]'}>{errors.password}</p>
                        )}
                    </div>

                    {/* Login Submit Button */}
                    <div className={'mb-6'}>
                        <button
                            type={'submit'}
                            disabled={isSubmitting}
                            className={'pn-btn pn-btn--primary pn-btn--block pn-btn--lg'}
                        >
                            {isSubmitting ? (
                                <Spinner size={'small'} />
                            ) : (
                                <>
                                    <LoginIcon className={'h-5 w-5'} />
                                    <span>Masuk ke Panel</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Invisible Reaptcha */}
                    {recaptchaEnabled && (
                        <Reaptcha
                            ref={ref}
                            size={'invisible'}
                            sitekey={siteKey || '_invalid_key'}
                            onVerify={(response) => {
                                setToken(response);
                                submitForm();
                            }}
                            onExpire={() => {
                                setSubmitting(false);
                                setToken('');
                            }}
                        />
                    )}

                    {/* Forgot Password Link with Divider */}
                    <div className={'relative mt-6 flex items-center justify-center'}>
                        <div className={'absolute h-px w-full'} style={{ background: 'var(--pn-border)' }} />
                        <div className={'relative px-4'} style={{ background: 'var(--pn-surface)' }}>
                            <Link
                                to={'/auth/password'}
                                className={'flex items-center gap-1.5 text-xs transition-colors no-underline'}
                                style={{ color: 'var(--pn-primary-300)' }}
                            >
                                <LockClosedIcon className={'h-3.5 w-3.5'} />
                                <span>Lupa password?</span>
                            </Link>
                        </div>
                    </div>
                </LoginFormContainer>
            )}
        </Formik>
    );
};

export default LoginContainer;
