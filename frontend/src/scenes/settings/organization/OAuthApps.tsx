import { decode } from 'he'
import { useValues } from 'kea'
import { useTranslation } from 'react-i18next'

import { IconCopy } from '@posthog/icons'
import { LemonButton, LemonSkeleton, LemonTable, LemonTag } from '@posthog/lemon-ui'

import { IconKey } from 'lib/lemon-ui/icons'
import { copyToClipboard } from 'lib/utils/copyToClipboard'
import { humanFriendlyDetailedTime } from 'lib/utils/datetime'

import { OrganizationOAuthApplicationApi } from '~/generated/core/api.schemas'

import { oauthAppsLogic } from './oauthAppsLogic'

export function OAuthApps(): JSX.Element {
    const { t } = useTranslation()
    const { oauthApps, oauthAppsLoading } = useValues(oauthAppsLogic)

    if (oauthAppsLoading && oauthApps.length === 0) {
        return (
            <div className="space-y-2 mt-4">
                <LemonSkeleton className="h-12" />
                <LemonSkeleton className="h-12" />
            </div>
        )
    }

    if (oauthApps.length === 0) {
        return (
            <div className="border border-dashed rounded-lg p-8 text-center mt-4">
                <IconKey className="text-4xl text-secondary mx-auto mb-3" />
                <h3 className="text-base font-semibold mb-1">
                    {t('settings.organization.oauthApps.empty', { defaultValue: 'No connected applications' })}
                </h3>
                <p className="text-secondary">
                    {t('settings.organization.oauthApps.emptyDescription', {
                        defaultValue:
                            'Applications will appear here when third-party tools connect to your organization.',
                    })}
                </p>
            </div>
        )
    }

    return (
        <LemonTable
            dataSource={oauthApps}
            className="mt-4"
            columns={[
                {
                    title: t('settings.user.connectedApps.columns.application', { defaultValue: 'Application' }),
                    key: 'name',
                    render: (_, app: OrganizationOAuthApplicationApi) => (
                        <div className="flex items-center gap-2">
                            <span className="font-semibold">{decode(app.name ?? '')}</span>
                            {app.is_verified && (
                                <LemonTag type="success" size="small">
                                    {t('settings.user.connectedApps.verified', { defaultValue: 'Verified' })}
                                </LemonTag>
                            )}
                        </div>
                    ),
                },
                {
                    title: t('settings.organization.oauthApps.clientId', { defaultValue: 'Client ID' }),
                    key: 'client_id',
                    render: (_, app: OrganizationOAuthApplicationApi) => (
                        <div className="flex items-center gap-1">
                            <code className="text-xs bg-fill-primary rounded px-1.5 py-0.5 font-mono truncate max-w-[200px]">
                                {app.client_id}
                            </code>
                            <LemonButton
                                icon={<IconCopy />}
                                size="xsmall"
                                noPadding
                                tooltip={t('settings.organization.oauthApps.copyClientId', {
                                    defaultValue: 'Copy client ID',
                                })}
                                onClick={() =>
                                    void copyToClipboard(
                                        app.client_id ?? '',
                                        t('settings.organization.oauthApps.clientIdLabel', {
                                            defaultValue: 'client ID',
                                        })
                                    )
                                }
                            />
                        </div>
                    ),
                },
                {
                    title: t('settings.organization.oauthApps.redirectUris', { defaultValue: 'Redirect URIs' }),
                    key: 'redirect_uris',
                    render: (_, app: OrganizationOAuthApplicationApi) => {
                        const uris = app.redirect_uris_list || []
                        if (uris.length === 0) {
                            return (
                                <span className="text-muted">
                                    {t('settings.organization.oauthApps.none', { defaultValue: 'None' })}
                                </span>
                            )
                        }
                        return (
                            <div className="flex flex-col gap-0.5">
                                {uris.map((uri, i) => (
                                    <div key={i} className="flex items-center gap-1">
                                        <code className="text-xs bg-fill-primary rounded px-1.5 py-0.5 truncate max-w-[250px] block">
                                            {uri}
                                        </code>
                                        <LemonButton
                                            icon={<IconCopy />}
                                            size="xsmall"
                                            noPadding
                                            tooltip={t('settings.organization.oauthApps.copyUri', {
                                                defaultValue: 'Copy URI',
                                            })}
                                            onClick={() =>
                                                void copyToClipboard(
                                                    uri,
                                                    t('settings.organization.oauthApps.redirectUriLabel', {
                                                        defaultValue: 'redirect URI',
                                                    })
                                                )
                                            }
                                        />
                                    </div>
                                ))}
                            </div>
                        )
                    },
                },
                {
                    title: t('settings.organization.oauthApps.connected', { defaultValue: 'Connected' }),
                    key: 'created',
                    render: (_, app: OrganizationOAuthApplicationApi) => (
                        <span className="text-muted text-sm">{humanFriendlyDetailedTime(app.created)}</span>
                    ),
                },
            ]}
        />
    )
}
