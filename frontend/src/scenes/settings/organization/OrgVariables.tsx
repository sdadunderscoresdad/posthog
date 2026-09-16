import { useValues } from 'kea'
import { Trans, useTranslation } from 'react-i18next'

import { LemonSkeleton } from '@posthog/lemon-ui'

import { CodeSnippet } from 'lib/components/CodeSnippet'
import { Link } from 'lib/lemon-ui/Link'
import { organizationLogic } from 'scenes/organizationLogic'

export function OrganizationVariables(): JSX.Element {
    const { t } = useTranslation()
    const { currentOrganization } = useValues(organizationLogic)

    return (
        <div className="border rounded p-4 space-y-3 bg-bg-light max-w-160">
            {currentOrganization ? (
                <CodeSnippet
                    compact
                    thing={t('settings.organization.variables.thing', { defaultValue: 'organization ID' })}
                >
                    {String(currentOrganization.id)}
                </CodeSnippet>
            ) : (
                <LemonSkeleton className="h-9" />
            )}
            <p className="text-muted text-xs mb-0">
                <Trans
                    i18nKey="settings.organization.variables.description"
                    components={{ ApiLink: <Link to="https://posthog.com/docs/api" /> }}
                    defaults="Use this ID to identify your organization in the <ApiLink>PostHog API</ApiLink>."
                />
            </p>
        </div>
    )
}
