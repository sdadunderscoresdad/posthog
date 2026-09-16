import { useValues } from 'kea'
import { router } from 'kea-router'
import { useEffect, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'

import { LemonButton, LemonSelect } from '@posthog/lemon-ui'

import { getCookie } from 'lib/api'
import { BridgePage } from 'lib/components/BridgePage/BridgePage'
import { Spinner } from 'lib/lemon-ui/Spinner'
import { SceneExport } from 'scenes/sceneTypes'

export const scene: SceneExport = {
    component: VercelConnect,
}

interface Team {
    id: number
    name: string
    already_linked: boolean
}

interface Organization {
    id: string
    name: string
    already_linked: boolean
    teams: Team[]
}

interface SessionInfo {
    next_url: string
    organizations: Organization[]
}

export function VercelConnect(): JSX.Element {
    const { t } = useTranslation()
    const { searchParams } = useValues(router)
    const sessionKey = searchParams.session

    const [loading, setLoading] = useState(true)
    const [linking, setLinking] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null)
    const [selectedOrg, setSelectedOrg] = useState<string | null>(null)
    const [envMapping, setEnvMapping] = useState<{
        production: number | null
        preview: number | null
        development: number | null
    }>({
        production: null,
        preview: null,
        development: null,
    })
    const [linkedOrgName, setLinkedOrgName] = useState<string>('')

    useEffect(() => {
        if (!sessionKey) {
            setError('Missing session parameter. Please try again from Vercel.')
            setLoading(false)
            return
        }

        fetch(`/api/vercel/connect/session?session=${encodeURIComponent(sessionKey)}`)
            .then((res) => {
                if (!res.ok) {
                    throw new Error('Session expired or invalid')
                }
                return res.json()
            })
            .then((data: SessionInfo) => {
                setSessionInfo(data)
                const available = data.organizations.filter((o) => !o.already_linked)
                if (available.length === 1) {
                    setSelectedOrg(available[0].id)
                }
                setLoading(false)
            })
            .catch((err) => {
                setError(err.message || 'Failed to load session')
                setLoading(false)
            })
    }, [sessionKey])

    useEffect(() => {
        if (selectedOrg && sessionInfo) {
            const org = sessionInfo.organizations.find((o) => o.id === selectedOrg)
            const teams = org?.teams.filter((t) => !t.already_linked) || []
            if (teams.length === 1) {
                const id = teams[0].id
                setEnvMapping({ production: id, preview: id, development: id })
            } else {
                setEnvMapping({ production: null, preview: null, development: null })
            }
        }
    }, [selectedOrg, sessionInfo])

    const handleLink = (): void => {
        if (!selectedOrg || !sessionKey) {
            return
        }

        setLinking(true)
        setError(null)

        fetch('/api/vercel/connect/complete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('posthog_csrftoken') || '',
            },
            body: JSON.stringify({
                session: sessionKey,
                organization_id: selectedOrg,
                environment_mapping: {
                    production: envMapping.production,
                    preview: envMapping.preview || envMapping.production,
                    development: envMapping.development || envMapping.production,
                },
            }),
        })
            .then((res) => {
                if (!res.ok) {
                    return res.json().then((data) => {
                        throw new Error(data.detail || data.attr?.session || 'Failed to link')
                    })
                }
                return res.json()
            })
            .then((data) => {
                setLinkedOrgName(data.organization_name)
                setSuccess(true)
                setLinking(false)

                const returnUrl = data.next_url
                if (returnUrl) {
                    window.location.href = returnUrl
                }
            })
            .catch((err) => {
                setError(err.message || 'Failed to link organization')
                setLinking(false)
            })
    }

    const redirectUrl = sessionInfo?.next_url

    if (loading) {
        return (
            <BridgePage view="vercel-connect">
                <div className="text-center">
                    <Spinner className="text-4xl" />
                    <p className="mt-4">{t('settings.loading', { defaultValue: 'Loading...' })}</p>
                </div>
            </BridgePage>
        )
    }

    if (success) {
        return (
            <BridgePage view="vercel-connect">
                <h2 className="text-center">{t('vercelConnect.linkedTitle', { defaultValue: 'Account linked' })}</h2>
                <p className="text-center mb-6">
                    <Trans
                        i18nKey="vercelConnect.linkedDetail"
                        values={{ org: linkedOrgName }}
                        components={{ Strong: <strong /> }}
                        defaults="Your PostHog organization <Strong>{{ org }}</Strong> is now connected to Vercel."
                    />
                </p>
                {redirectUrl ? (
                    <LemonButton
                        fullWidth
                        type="primary"
                        center
                        onClick={() => {
                            window.location.href = redirectUrl
                        }}
                    >
                        {t('vercelConnect.returnToVercel', { defaultValue: 'Return to Vercel' })}
                    </LemonButton>
                ) : (
                    <LemonButton fullWidth type="primary" center to="/">
                        {t('vercelConnect.goToPosthog', { defaultValue: 'Go to PostHog' })}
                    </LemonButton>
                )}
            </BridgePage>
        )
    }

    if (error && !sessionInfo) {
        return (
            <BridgePage view="vercel-connect">
                <h2 className="text-center">
                    {t('vercelConnect.errorTitle', { defaultValue: 'Something went wrong' })}
                </h2>
                <p className="text-center text-danger mb-6">{error}</p>
                <LemonButton fullWidth type="secondary" center onClick={() => window.close()}>
                    {t('vercelConnect.close', { defaultValue: 'Close' })}
                </LemonButton>
            </BridgePage>
        )
    }

    const availableOrgs = sessionInfo?.organizations.filter((o) => !o.already_linked) || []
    const linkedOrgs = sessionInfo?.organizations.filter((o) => o.already_linked) || []
    const selectedOrgData = sessionInfo?.organizations.find((o) => o.id === selectedOrg)
    const availableTeams = selectedOrgData?.teams.filter((t) => !t.already_linked) || []

    return (
        <BridgePage view="vercel-connect">
            <h2 className="text-center">{t('vercelConnect.title', { defaultValue: 'Connect to Vercel' })}</h2>
            <p className="text-center mb-6">
                {t('vercelConnect.description', {
                    defaultValue: 'Select which PostHog organization to link to your Vercel account.',
                })}
            </p>

            {error && <p className="text-danger text-center mb-4">{error}</p>}

            {availableOrgs.length === 0 ? (
                <div className="text-center mb-6">
                    <p className="text-muted">
                        {linkedOrgs.length > 0
                            ? t('vercelConnect.allLinked', {
                                  defaultValue: 'All your organizations are already linked to Vercel.',
                              })
                            : t('vercelConnect.noAdminOrgs', {
                                  defaultValue: "You don't have any organizations with admin access.",
                              })}
                    </p>
                </div>
            ) : (
                <>
                    <div className="mb-6">
                        <LemonSelect
                            fullWidth
                            placeholder={t('vercelConnect.selectOrg', { defaultValue: 'Select an organization' })}
                            value={selectedOrg}
                            onChange={(value) => setSelectedOrg(value)}
                            options={availableOrgs.map((org) => ({
                                value: org.id,
                                label: org.name,
                            }))}
                        />
                    </div>

                    {selectedOrg && availableTeams.length > 0 && (
                        <div className="mb-6 space-y-3">
                            {(['production', 'preview', 'development'] as const).map((env) => (
                                <div key={env}>
                                    <label className="text-xs font-medium text-muted uppercase mb-1 block">{env}</label>
                                    <LemonSelect
                                        fullWidth
                                        placeholder={t('vercelConnect.selectProject', {
                                            defaultValue: 'Select a project',
                                        })}
                                        value={envMapping[env]}
                                        onChange={(value) => setEnvMapping((prev) => ({ ...prev, [env]: value }))}
                                        options={availableTeams.map((t) => ({
                                            value: t.id,
                                            label: t.name,
                                        }))}
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    <LemonButton
                        fullWidth
                        type="primary"
                        center
                        disabled={!selectedOrg || !envMapping.production || linking}
                        loading={linking}
                        onClick={handleLink}
                    >
                        {t('vercelConnect.connectOrganization', { defaultValue: 'Connect organization' })}
                    </LemonButton>
                </>
            )}

            <LemonButton fullWidth type="secondary" center className="mt-2" onClick={() => window.close()}>
                {t('settings.cancel', { defaultValue: 'Cancel' })}
            </LemonButton>
        </BridgePage>
    )
}

export default VercelConnect
