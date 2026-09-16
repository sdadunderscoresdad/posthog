import { decode } from 'he'
import { useActions, useValues } from 'kea'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import * as magnifyingGlassPng from '@posthog/brand/hoggies/png/magnifying-glass-1'
import { LemonButton, LemonDialog, LemonTable, LemonTag } from '@posthog/lemon-ui'

import { pngHoggie } from 'lib/brand/hoggies'
import { IconKey } from 'lib/lemon-ui/icons'
import { humanFriendlyDetailedTime } from 'lib/utils/datetime'

import { connectedAppsLogic, ConnectedApp } from './connectedAppsLogic'

const HedgehogMagnifyingGlass = pngHoggie(magnifyingGlassPng)

function sortScopesWriteFirst(scopes: string[]): string[] {
    return [...scopes].sort((a, b) => {
        const aIsWrite = a.endsWith(':write')
        const bIsWrite = b.endsWith(':write')
        if (aIsWrite && !bIsWrite) {
            return -1
        }
        if (!aIsWrite && bIsWrite) {
            return 1
        }
        return 0
    })
}

function ScopesAccordion({ scopes }: { scopes: string[] }): JSX.Element {
    const { t } = useTranslation()
    const [expanded, setExpanded] = useState(false)
    const visibleCount = 3
    const sorted = sortScopesWriteFirst(scopes)
    const needsAccordion = sorted.length > visibleCount
    const visible = expanded || !needsAccordion ? sorted : sorted.slice(0, visibleCount)

    return (
        <div className="flex flex-wrap gap-1">
            {visible.map((scope) => (
                <LemonTag key={scope} size="small" type={scope.endsWith(':write') ? 'caution' : 'default'}>
                    {scope}
                </LemonTag>
            ))}
            {needsAccordion && (
                <LemonButton size="xsmall" type="secondary" onClick={() => setExpanded(!expanded)}>
                    {expanded
                        ? t('settings.user.connectedApps.showLess', { defaultValue: 'Show less' })
                        : t('settings.apiKeys.moreTags', {
                              defaultValue: '+{{ number }} more',
                              number: sorted.length - visibleCount,
                          })}
                </LemonButton>
            )}
        </div>
    )
}

export function ConnectedApps(): JSX.Element {
    const { t } = useTranslation()
    const { connectedApps, connectedAppsLoading } = useValues(connectedAppsLogic)
    const { revokeApp } = useActions(connectedAppsLogic)

    const handleRevoke = (app: ConnectedApp): void => {
        // Name is HTML-escaped at ingestion; decode for display (see posthog/api/oauth/client_name.py).
        const name = decode(app.name)

        LemonDialog.open({
            title: t('settings.user.connectedApps.revokeTitle', {
                defaultValue: 'Revoke access for {{ name }}?',
                name,
            }),
            description: t('settings.user.connectedApps.revokeDescription', {
                defaultValue:
                    "This will revoke all tokens and permissions granted to {{ name }}. The app will no longer be able to access your PostHog account. You can re-authorize it at any time through the application's own interface.",
                name,
            }),
            primaryButton: {
                children: t('settings.user.connectedApps.revoke', { defaultValue: 'Revoke' }),
                status: 'danger',
                onClick: () => revokeApp(app.id),
            },
            secondaryButton: {
                children: t('settings.cancel', { defaultValue: 'Cancel' }),
            },
        })
    }

    return (
        <LemonTable
            dataSource={connectedApps}
            loading={connectedAppsLoading}
            columns={[
                {
                    title: t('settings.user.connectedApps.columns.application', { defaultValue: 'Application' }),
                    dataIndex: 'name',
                    render: (_, app) => (
                        <div className="flex items-center gap-2">
                            {app.logo_uri ? (
                                <div className="w-8 h-8 shrink-0 rounded bg-bg-light border flex items-center justify-center p-1">
                                    <img
                                        src={app.logo_uri}
                                        alt={t('settings.user.connectedApps.logoAlt', {
                                            defaultValue: '{{ name }} logo',
                                            name: decode(app.name),
                                        })}
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                            ) : (
                                <div className="w-8 h-8 shrink-0 rounded bg-border flex items-center justify-center text-sm font-bold text-muted">
                                    {decode(app.name).charAt(0).toUpperCase()}
                                </div>
                            )}
                            <span className="font-medium">{decode(app.name)}</span>
                            {app.is_first_party ? (
                                <LemonTag type="highlight" size="small">
                                    {t('settings.user.connectedApps.firstParty', { defaultValue: 'PostHog' })}
                                </LemonTag>
                            ) : app.is_verified ? (
                                <LemonTag type="success" size="small">
                                    {t('settings.user.connectedApps.verified', { defaultValue: 'Verified' })}
                                </LemonTag>
                            ) : null}
                        </div>
                    ),
                },
                {
                    title: t('settings.apiKeys.columns.scopes', { defaultValue: 'Scopes' }),
                    dataIndex: 'scopes',
                    render: (_, app) =>
                        app.scopes.length > 0 ? (
                            <ScopesAccordion scopes={app.scopes} />
                        ) : (
                            <span className="text-muted">
                                {t('settings.user.connectedApps.noScopes', { defaultValue: 'No scopes' })}
                            </span>
                        ),
                },
                {
                    title: t('settings.user.connectedApps.columns.authorized', { defaultValue: 'Authorized' }),
                    dataIndex: 'authorized_at',
                    render: (_, app) => humanFriendlyDetailedTime(app.authorized_at),
                },
                {
                    title: '',
                    render: (_, app) => (
                        <LemonButton type="secondary" status="danger" size="small" onClick={() => handleRevoke(app)}>
                            {t('settings.user.connectedApps.revoke', { defaultValue: 'Revoke' })}
                        </LemonButton>
                    ),
                },
            ]}
            emptyState={
                <div className="flex items-center gap-4 py-4">
                    <HedgehogMagnifyingGlass className="w-16 h-16" />
                    <div>
                        <div className="flex items-center gap-2 font-semibold">
                            <IconKey className="text-xl text-secondary" />
                            {t('settings.user.connectedApps.empty', { defaultValue: 'No connected applications' })}
                        </div>
                        <p className="text-secondary mt-1 mb-0">
                            {t('settings.user.connectedApps.emptyDescription', {
                                defaultValue: 'Apps will appear here when third-party tools connect to your account.',
                            })}
                        </p>
                    </div>
                </div>
            }
        />
    )
}
