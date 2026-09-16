import { useTranslation } from 'react-i18next'

import { LemonInputSelect } from '@posthog/lemon-ui'

import type { OrganizationSelectorProps } from './types'
import { createOrganizationOption } from './utils'

export const OrganizationSelector = ({
    organizations,
    mode,
    value,
    onChange,
}: OrganizationSelectorProps): JSX.Element => {
    const { t } = useTranslation()
    return (
        <LemonInputSelect
            mode={mode}
            data-attr="organizations"
            value={value}
            onChange={onChange}
            options={organizations.map((org) => createOrganizationOption(org)) ?? []}
            loading={organizations === undefined}
            placeholder={
                mode === 'single'
                    ? t('settings.user.scopes.selectOrganization', { defaultValue: 'Select an organization...' })
                    : t('settings.user.scopes.selectOrganizations', { defaultValue: 'Select organizations...' })
            }
        />
    )
}
