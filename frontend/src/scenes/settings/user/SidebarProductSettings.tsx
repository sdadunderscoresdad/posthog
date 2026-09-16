import { useActions, useValues } from 'kea'
import { useTranslation } from 'react-i18next'

import { LemonSwitch } from '@posthog/lemon-ui'

import { userLogic } from 'scenes/userLogic'

export function SidebarAutoSuggestSetting(): JSX.Element {
    const { t } = useTranslation()
    const { user, userLoading } = useValues(userLogic)
    const { updateUser } = useActions(userLogic)

    return (
        <LemonSwitch
            onChange={(checked) => {
                updateUser({ allow_sidebar_suggestions: checked })
            }}
            checked={user?.allow_sidebar_suggestions ?? false}
            loading={userLoading}
            label={t('settings.user.sidebar.autoSuggest', { defaultValue: 'Automatically suggest new tools' })}
            bordered
        />
    )
}
