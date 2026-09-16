import { useValues } from 'kea'
import { combineUrl } from 'kea-router'
import { useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'

import { IconInfo } from '@posthog/icons'
import { LemonBanner, LemonCheckbox, Link } from '@posthog/lemon-ui'

import { CodeSnippet, Language } from 'lib/components/CodeSnippet'
import { RestrictionScope, useRestrictedArea } from 'lib/components/RestrictedArea'
import { TeamMembershipLevel } from 'lib/constants'
import { domainFor, proxyLogic } from 'scenes/settings/environment/proxyLogic'
import { teamLogic } from 'scenes/teamLogic'

export function CSPReportingSettings(): JSX.Element {
    const { t } = useTranslation()
    const { currentTeam } = useValues(teamLogic)

    const { proxyRecords } = useValues(proxyLogic)
    const proxyRecord = domainFor(proxyRecords[0])

    const [includeSessionId, setIncludeSessionId] = useState(false)
    const [includeDistinctId, setIncludeDistinctId] = useState(false)
    const [includeVersion, setIncludeVersion] = useState(true)
    const [includeSampleRate, setIncludeSampleRate] = useState(false)

    const restrictedReason = useRestrictedArea({
        scope: RestrictionScope.Project,
        minimumAccessLevel: TeamMembershipLevel.Admin,
    })

    return (
        <>
            <p>
                <Trans
                    i18nKey="settings.environment.cspReporting.introWhatIsCsp"
                    defaults="A CSP is an instruction to the browser on what assets are allowed to be loaded and what domains your site can send information to. It's a very powerful security mechanism, that can be super tricky to configure."
                />
            </p>
            <p>
                <Trans
                    i18nKey="settings.environment.cspReporting.introWhatItDoes"
                    defaults="CSP Reporting lets you track your CSP by sending reports to PostHog when a CSP violation occurs. This helps you see when CSP misconfiguration, web site changes, or security flaws are causing problems."
                />
            </p>
            <p>
                <Trans
                    i18nKey="settings.environment.cspReporting.directives"
                    components={{
                        ReportUriLink: (
                            <Link
                                to="https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/report-uri"
                                target="_blank"
                            />
                        ),
                        ReportToLink: (
                            <Link
                                to="https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/report-to"
                                target="_blank"
                            />
                        ),
                    }}
                    defaults="PostHog supports both the <ReportUriLink>report-uri</ReportUriLink> and <ReportToLink>report-to</ReportToLink> directives, converting violations into an event. Letting you track and alert on them just like any other event."
                />
            </p>
            <div className="flex flex-col gap-2">
                <LemonBanner type="info" hideIcon={true}>
                    <div className="flex flex-row items-center gap-x-2">
                        <IconInfo />
                        <div>
                            <Trans
                                i18nKey="settings.environment.cspReporting.extraParameters"
                                components={{
                                    DocsLink: <Link to="https://posthog.com/docs/csp-tracking" />,
                                }}
                                defaults="We accept some additional parameters on the report URL. These require that you add information when adding the URL to your pages. <DocsLink>See our docs for some examples.</DocsLink>"
                            />
                        </div>
                    </div>
                </LemonBanner>
                <div>
                    <LemonCheckbox
                        label={t('settings.environment.cspReporting.includeVersion', {
                            defaultValue:
                                'version: the version for the current CSP. This helps you track impact of changes to your CSP.',
                        })}
                        checked={includeVersion}
                        onChange={setIncludeVersion}
                        disabledReason={restrictedReason}
                    />
                    <LemonCheckbox
                        label={t('settings.environment.cspReporting.includeSessionId', {
                            defaultValue:
                                'session_id: the PostHog UUIDv7 session id. Helps you link CSP violations to session replay.',
                        })}
                        checked={includeSessionId}
                        onChange={setIncludeSessionId}
                        disabledReason={restrictedReason}
                    />
                    <LemonCheckbox
                        label={t('settings.environment.cspReporting.includeDistinctId', {
                            defaultValue:
                                'distinct_id: the distinct id for the current user. So you can track which users are being affected',
                        })}
                        checked={includeDistinctId}
                        onChange={setIncludeDistinctId}
                        disabledReason={restrictedReason}
                    />
                    <LemonCheckbox
                        label={t('settings.environment.cspReporting.includeSampleRate', {
                            defaultValue:
                                'sample_rate: the sample rate for the current CSP. Lets you control the volume of reports you ingest.',
                        })}
                        checked={includeSampleRate}
                        onChange={setIncludeSampleRate}
                        disabledReason={restrictedReason}
                    />
                </div>
            </div>
            <div className="flex flex-col gap-y-2">
                <p>
                    {t('settings.environment.cspReporting.urlHint', {
                        defaultValue: 'Set this URL for both the report-to and report-uri endpoints',
                    })}
                </p>
                <CodeSnippet language={Language.Text} wrap={true}>
                    {
                        combineUrl(`${proxyRecord}/report/`, {
                            token: currentTeam?.api_token,
                            v: includeVersion ? 1 : undefined,
                            session_id: includeSessionId ? 'ADD_THE_SESSION_ID' : undefined,
                            distinct_id: includeDistinctId ? 'ADD_THE_DISTINCT_ID' : undefined,
                            sample_rate: includeSampleRate ? '0.5' : undefined,
                        }).url
                    }
                </CodeSnippet>
            </div>
        </>
    )
}
