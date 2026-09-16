import type { TFunction } from 'i18next'

import { LemonInputSelectOption, Tooltip } from '@posthog/lemon-ui'

import type { OrganizationOption, TeamOption } from './types'

export const createOrganizationOption = (t: TFunction, org: OrganizationOption): LemonInputSelectOption<string> => ({
    key: `${org.id}`,
    label: org.name,
    labelComponent: (
        <Tooltip
            title={
                <div>
                    <div className="font-semibold">{org.name}</div>
                    <div className="text-xs whitespace-nowrap">
                        {t('settings.user.scopes.organizationIdTooltip', { defaultValue: 'ID: {{ id }}', id: org.id })}
                    </div>
                </div>
            }
        >
            <span className="flex-1 font-semibold">{org.name}</span>
        </Tooltip>
    ),
})

export const createTeamOption = (
    t: TFunction,
    team: TeamOption,
    organizations: OrganizationOption[]
): LemonInputSelectOption<string> => {
    const orgName = organizations.find((org) => org.id === team.organization)?.name
    const displayLabel = organizations.length > 1 && orgName ? `${orgName} / ${team.name}` : team.name

    return {
        key: `${team.id}`,
        label: displayLabel,
        labelComponent: (
            <Tooltip
                title={
                    <div>
                        <div className="font-semibold">{team.name}</div>
                        <div className="text-xs whitespace-nowrap">
                            {t('settings.user.scopes.tokenTooltip', {
                                defaultValue: 'Token: {{ token }}',
                                token: team.api_token,
                            })}
                        </div>
                        <div className="text-xs whitespace-nowrap">
                            {t('settings.user.scopes.organizationIdTooltipLabel', {
                                defaultValue: 'Organization ID: {{ id }}',
                                id: team.organization,
                            })}
                        </div>
                    </div>
                }
            >
                {organizations.length > 1 ? (
                    <span>
                        <span>{orgName}</span>
                        <span className="text-secondary mx-1">/</span>
                        <span className="flex-1 font-semibold">{team.name}</span>
                    </span>
                ) : (
                    <span>{team.name}</span>
                )}
            </Tooltip>
        ),
    }
}
