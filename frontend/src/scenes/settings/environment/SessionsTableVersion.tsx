import { useActions } from 'kea'

import { RestrictionScope, useRestrictedArea } from 'lib/components/RestrictedArea'
import { TeamMembershipLevel } from 'lib/constants'
import { i18n } from 'lib/i18n/i18n'
import { LemonRadioOption } from 'lib/lemon-ui/LemonRadio'
import { eventUsageLogic } from 'lib/utils/eventUsageLogic'

import { HogQLQueryModifiers } from '~/queries/schema/schema-general'

import { TeamSettingRadio } from '../components/TeamSettingRadio'

type SessionTableVersionType = NonNullable<HogQLQueryModifiers['sessionTableVersion']>

/** Built per language, because labels resolved at import would keep the language the app started in. */
function sessionTableVersionOptions(): LemonRadioOption<SessionTableVersionType>[] {
    return [
        { value: 'auto', label: i18n.t('settings.environment.sessionsTableVersion.auto', { defaultValue: 'Auto' }) },
        {
            value: 'v1',
            label: i18n.t('settings.environment.sessionsTableVersion.v1', { defaultValue: 'Version 1' }),
        },
        {
            value: 'v2',
            label: i18n.t('settings.environment.sessionsTableVersion.v2', { defaultValue: 'Version 2' }),
        },
        {
            value: 'v3',
            label: i18n.t('settings.environment.sessionsTableVersion.v3', { defaultValue: 'Version 3' }),
        },
    ]
}

export function SessionsTableVersion(): JSX.Element {
    const { reportSessionTableVersionUpdated } = useActions(eventUsageLogic)
    const restrictedReason = useRestrictedArea({
        scope: RestrictionScope.Project,
        minimumAccessLevel: TeamMembershipLevel.Admin,
    })
    const versionOptions = sessionTableVersionOptions().map((option) => ({
        ...option,
        disabledReason: restrictedReason ?? undefined,
    }))

    return (
        <TeamSettingRadio
            field="modifiers.sessionTableVersion"
            options={versionOptions}
            defaultValue="auto"
            onSave={reportSessionTableVersionUpdated}
            disabledReason={restrictedReason}
        />
    )
}
