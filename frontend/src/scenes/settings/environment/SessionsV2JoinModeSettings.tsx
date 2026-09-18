import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'

import { RestrictionScope, useRestrictedArea } from 'lib/components/RestrictedArea'
import { TeamMembershipLevel } from 'lib/constants'
import { LemonRadioOption } from 'lib/lemon-ui/LemonRadio'

import { HogQLQueryModifiers } from '~/queries/schema/schema-general'

import { TeamSettingRadio } from '../components/TeamSettingRadio'

type SessionsV2JoinModeType = NonNullable<HogQLQueryModifiers['sessionsV2JoinMode']>

/** Built per call, because a module-scope label would keep the language the app started in. */
function sessionsV2JoinModeOptions(t: TFunction): LemonRadioOption<SessionsV2JoinModeType>[] {
    return [
        { value: 'string', label: t('settings.environment.sessionsV2JoinMode.string', { defaultValue: 'String' }) },
        { value: 'uuid', label: 'UUID' },
    ]
}

export function SessionsV2JoinModeSettings(): JSX.Element {
    const { t } = useTranslation()
    const restrictedReason = useRestrictedArea({
        scope: RestrictionScope.Project,
        minimumAccessLevel: TeamMembershipLevel.Admin,
    })

    const options = sessionsV2JoinModeOptions(t).map((o) => ({
        ...o,
        disabledReason: restrictedReason ?? undefined,
    }))

    return (
        <TeamSettingRadio
            field="modifiers.sessionsV2JoinMode"
            options={options}
            defaultValue="string"
            disabledReason={restrictedReason}
        />
    )
}
