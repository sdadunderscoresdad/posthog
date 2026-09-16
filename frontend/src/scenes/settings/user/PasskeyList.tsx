import type { TFunction } from 'i18next'
import { useActions, useValues } from 'kea'
import { useTranslation } from 'react-i18next'

import { IconCheckCircle, IconChip, IconClock, IconLaptop, IconLock, IconPencil, IconTrash } from '@posthog/icons'
import { LemonButton, LemonTable, Spinner } from '@posthog/lemon-ui'

import { IconLink, IconSync } from 'lib/lemon-ui/icons'
import { humanFriendlyDetailedTime } from 'lib/utils/datetime'

import { PasskeyCredential, passkeySettingsLogic } from './passkeySettingsLogic'

function VerificationStatusIcon({ verified, verifying }: { verified: boolean; verifying: boolean }): JSX.Element {
    if (verifying) {
        return <IconSync className="text-warning animate-spin" />
    }
    if (verified) {
        return <IconCheckCircle className="text-success" />
    }
    return <IconClock className="text-muted" />
}

function AuthenticatorTypeIcon({ type }: { type: 'platform' | 'hardware' | 'hybrid' | 'unknown' }): JSX.Element {
    switch (type) {
        case 'hardware':
            return <IconChip className="text-muted" />
        case 'platform':
            return <IconLaptop className="text-muted" />
        case 'hybrid':
            return <IconLink className="text-muted" />
        default:
            return <IconLock className="text-muted" />
    }
}

function getAuthenticatorTypeText(t: TFunction, type: 'platform' | 'hardware' | 'hybrid' | 'unknown'): string {
    switch (type) {
        case 'hardware':
            return t('settings.user.passkeys.types.hardware', { defaultValue: 'Hardware' })
        case 'platform':
            return t('settings.user.passkeys.types.platform', { defaultValue: 'Platform' })
        case 'hybrid':
            return t('settings.user.passkeys.types.hybrid', { defaultValue: 'Hybrid' })
        default:
            return t('settings.user.passkeys.types.unknown', { defaultValue: 'Unknown' })
    }
}

function getVerificationStatusText(t: TFunction, verified: boolean, verifying: boolean): string {
    if (verifying) {
        return t('settings.user.passkeys.status.verifying', { defaultValue: 'Verifying' })
    }
    if (verified) {
        return t('settings.user.passkeys.status.verified', { defaultValue: 'Verified' })
    }
    return t('settings.user.passkeys.status.notVerified', { defaultValue: 'Not verified' })
}

export function PasskeyList(): JSX.Element {
    const { t } = useTranslation()
    const { passkeys, passkeysLoading, verifyingPasskeyId } = useValues(passkeySettingsLogic)
    const { verifyPasskey, openDeleteModal, openRenameModal } = useActions(passkeySettingsLogic)

    if (passkeysLoading && passkeys.length === 0) {
        return (
            <div className="flex justify-center py-8">
                <Spinner />
            </div>
        )
    }

    return (
        <LemonTable
            dataSource={passkeys}
            columns={[
                {
                    title: t('settings.user.passkeys.columns.name', { defaultValue: 'Name' }),
                    dataIndex: 'label',
                    key: 'label',
                    render: (_, record: PasskeyCredential) => (
                        <div className="flex items-center gap-2">
                            <IconLock className="text-muted" />
                            <span className="font-medium">{record.label}</span>
                        </div>
                    ),
                },
                {
                    title: t('settings.user.passkeys.columns.type', { defaultValue: 'Type' }),
                    key: 'authenticator_type',
                    width: 120,
                    render: (_: any, record: PasskeyCredential) => (
                        <div className="flex items-center gap-2">
                            <AuthenticatorTypeIcon type={record.authenticator_type} />
                            <span className="text-sm">{getAuthenticatorTypeText(t, record.authenticator_type)}</span>
                        </div>
                    ),
                },
                {
                    title: t('settings.user.passkeys.columns.status', { defaultValue: 'Status' }),
                    key: 'verified',
                    width: 180,
                    render: (_: any, record: PasskeyCredential) => {
                        const verifying = verifyingPasskeyId === record.id
                        const statusText = getVerificationStatusText(t, record.verified, verifying)
                        return (
                            <div className="flex items-center gap-2">
                                <VerificationStatusIcon verified={record.verified} verifying={verifying} />
                                <span className="text-sm">{statusText}</span>
                                {!record.verified && !verifying && (
                                    <LemonButton
                                        size="small"
                                        onClick={() => verifyPasskey(record.id)}
                                        tooltip={t('settings.user.passkeys.verifyTooltip', {
                                            defaultValue: 'Verify this passkey',
                                        })}
                                    >
                                        {t('settings.user.passkeys.verify', { defaultValue: 'Verify' })}
                                    </LemonButton>
                                )}
                            </div>
                        )
                    },
                },
                {
                    title: t('settings.user.passkeys.columns.added', { defaultValue: 'Added' }),
                    dataIndex: 'created_at',
                    key: 'created_at',
                    render: (_: any, record: PasskeyCredential) => humanFriendlyDetailedTime(record.created_at),
                },
                {
                    title: '',
                    key: 'actions',
                    width: 100,
                    render: (_: any, record: PasskeyCredential) => (
                        <div className="flex gap-1">
                            <LemonButton
                                icon={<IconPencil />}
                                size="small"
                                tooltip={t('settings.user.passkeys.rename', { defaultValue: 'Rename' })}
                                onClick={() => openRenameModal(record.id, record.label)}
                            />
                            <LemonButton
                                icon={<IconTrash />}
                                size="small"
                                status="danger"
                                tooltip={t('settings.user.passkeys.delete', { defaultValue: 'Delete' })}
                                onClick={() => openDeleteModal(record.id)}
                            />
                        </div>
                    ),
                },
            ]}
            loading={passkeysLoading}
            emptyState={t('settings.user.passkeys.empty', { defaultValue: 'No passkeys' })}
        />
    )
}
