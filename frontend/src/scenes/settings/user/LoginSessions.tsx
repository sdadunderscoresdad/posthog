import { useActions, useValues } from 'kea'
import { useTranslation } from 'react-i18next'

import * as magnifyingGlassPng from '@posthog/brand/hoggies/png/magnifying-glass-1'
import { IconLaptop, IconLeave } from '@posthog/icons'
import { LemonButton, LemonDialog, LemonTable, LemonTag } from '@posthog/lemon-ui'

import { pngHoggie } from 'lib/brand/hoggies'
import { humanFriendlyDetailedTime } from 'lib/utils/datetime'

import { UserAuthSessionApi } from '~/generated/core/api.schemas'

import { loginSessionsLogic } from './loginSessionsLogic'

const HedgehogMagnifyingGlass = pngHoggie(magnifyingGlassPng)

export function LoginSessions(): JSX.Element {
    const { t } = useTranslation()
    const { loginSessions, loginSessionsLoading } = useValues(loginSessionsLogic)
    const { revokeSession, revokeOtherSessions } = useActions(loginSessionsLogic)

    const hasOtherSessions = loginSessions.some((session) => !session.is_current)

    const handleRevoke = (session: UserAuthSessionApi): void => {
        LemonDialog.open({
            title: t('settings.user.sessions.logOutDeviceTitle', { defaultValue: 'Log out of this device?' }),
            description: t('settings.user.sessions.logOutDeviceDescription', {
                defaultValue: 'This device will be signed out of your PostHog account immediately.',
            }),
            primaryButton: {
                children: t('settings.user.sessions.logOut', { defaultValue: 'Log out' }),
                status: 'danger',
                onClick: () => revokeSession(session.id),
            },
            secondaryButton: { children: t('settings.cancel', { defaultValue: 'Cancel' }) },
        })
    }

    const handleRevokeOthers = (): void => {
        LemonDialog.open({
            title: t('settings.user.sessions.logOutOthersTitle', { defaultValue: 'Log out everywhere else?' }),
            description: t('settings.user.sessions.logOutOthersDescription', {
                defaultValue: 'Every device except this one will be signed out of your PostHog account immediately.',
            }),
            primaryButton: {
                children: t('settings.user.sessions.logOutOthers', { defaultValue: 'Log out everywhere else' }),
                status: 'danger',
                onClick: () => revokeOtherSessions(),
            },
            secondaryButton: { children: t('settings.cancel', { defaultValue: 'Cancel' }) },
        })
    }

    return (
        <div className="flex flex-col gap-4">
            <LemonButton
                type="secondary"
                status="danger"
                icon={<IconLeave />}
                className="self-start"
                loading={loginSessionsLoading}
                disabledReason={
                    hasOtherSessions
                        ? undefined
                        : t('settings.user.sessions.noOtherDevices', { defaultValue: 'No other devices to log out' })
                }
                onClick={handleRevokeOthers}
                data-attr="login-sessions-revoke-others"
            >
                {t('settings.user.sessions.logOutOthers', { defaultValue: 'Log out everywhere else' })}
            </LemonButton>
            <LemonTable
                dataSource={loginSessions}
                loading={loginSessionsLoading}
                columns={[
                    {
                        title: t('settings.user.sessions.columns.device', { defaultValue: 'Device' }),
                        dataIndex: 'device',
                        render: (_, session) => (
                            <div className="flex items-center gap-2">
                                <span className="font-medium">
                                    {session.device ||
                                        t('settings.user.sessions.unknownDevice', { defaultValue: 'Unknown device' })}
                                </span>
                                {session.is_current && (
                                    <LemonTag type="success" size="small">
                                        {t('settings.user.sessions.thisDevice', { defaultValue: 'This device' })}
                                    </LemonTag>
                                )}
                            </div>
                        ),
                    },
                    {
                        title: t('settings.user.sessions.columns.location', { defaultValue: 'Location' }),
                        dataIndex: 'location',
                        render: (_, session) =>
                            session.location || (
                                <span className="text-muted">
                                    {t('settings.user.sessions.unknown', { defaultValue: 'Unknown' })}
                                </span>
                            ),
                    },
                    {
                        title: t('settings.user.sessions.columns.signedInWith', { defaultValue: 'Signed in with' }),
                        dataIndex: 'login_method',
                        render: (_, session) => session.login_method || <span className="text-muted">—</span>,
                    },
                    {
                        title: t('settings.user.sessions.columns.startedAt', { defaultValue: 'Started at' }),
                        dataIndex: 'created_at',
                        render: (_, session) =>
                            session.created_at ? (
                                humanFriendlyDetailedTime(session.created_at, 'MMMM DD, YYYY', 'h:mm A')
                            ) : (
                                <span className="text-muted">
                                    {t('settings.user.sessions.unknown', { defaultValue: 'Unknown' })}
                                </span>
                            ),
                    },
                    {
                        title: t('settings.user.sessions.columns.lastActive', { defaultValue: 'Last active' }),
                        dataIndex: 'last_activity',
                        // Minute precision: last_activity is throttled to ~5-min updates, so seconds would be false precision.
                        render: (_, session) =>
                            humanFriendlyDetailedTime(session.last_activity, 'MMMM DD, YYYY', 'h:mm A'),
                    },
                    {
                        title: '',
                        width: 0,
                        render: (_, session) =>
                            session.is_current ? null : (
                                <LemonButton
                                    icon={<IconLeave />}
                                    status="danger"
                                    size="small"
                                    tooltip={t('settings.user.sessions.logOutDevice', {
                                        defaultValue: 'Log out of this device',
                                    })}
                                    disabledReason={
                                        loginSessionsLoading
                                            ? t('settings.user.sessions.working', { defaultValue: 'Working…' })
                                            : undefined
                                    }
                                    onClick={() => handleRevoke(session)}
                                />
                            ),
                    },
                ]}
                emptyState={
                    <div className="flex items-center gap-4 py-4">
                        <HedgehogMagnifyingGlass className="w-16 h-16" />
                        <div>
                            <div className="flex items-center gap-2 font-semibold">
                                <IconLaptop className="text-xl text-secondary" />
                                {t('settings.user.sessions.empty', { defaultValue: 'No active logins found' })}
                            </div>
                            <p className="text-secondary mt-1 mb-0">
                                {t('settings.user.sessions.emptyDescription', {
                                    defaultValue: 'Devices signed in to your account will appear here.',
                                })}
                            </p>
                        </div>
                    </div>
                }
            />
        </div>
    )
}
