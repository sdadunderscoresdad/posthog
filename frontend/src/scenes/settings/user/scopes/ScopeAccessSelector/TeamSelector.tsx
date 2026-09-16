import { useTranslation } from 'react-i18next'

import { LemonInputSelect } from '@posthog/lemon-ui'

import type { TeamSelectorProps } from './types'
import { createTeamOption } from './utils'

export const TeamSelector = ({ teams, organizations, mode, value, onChange }: TeamSelectorProps): JSX.Element => {
    const { t } = useTranslation()
    return (
        <LemonInputSelect
            mode={mode}
            data-attr="teams"
            value={value}
            onChange={onChange}
            options={(teams || []).map((team) => createTeamOption(team, organizations))}
            loading={teams === undefined}
            placeholder={
                mode === 'single'
                    ? t('settings.user.scopes.selectProject', { defaultValue: 'Select a project...' })
                    : t('settings.user.scopes.selectProjects', { defaultValue: 'Select projects...' })
            }
        />
    )
}
