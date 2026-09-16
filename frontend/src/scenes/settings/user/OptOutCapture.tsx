import { useActions, useValues } from 'kea'
import { useTranslation } from 'react-i18next'

import { LemonSwitch } from '@posthog/lemon-ui'

import { userLogic } from 'scenes/userLogic'

export function OptOutCapture(): JSX.Element {
    const { t } = useTranslation()
    const { user, userLoading } = useValues(userLogic)
    const { updateUser } = useActions(userLogic)

    return (
        <div>
            <LemonSwitch
                label={t('settings.user.anonymizeData', { defaultValue: 'Anonymize my data' })}
                data-attr="anonymize-data-collection"
                onChange={(checked) => updateUser({ anonymize_data: checked })}
                checked={user?.anonymize_data ?? false}
                disabled={userLoading}
                bordered
            />
        </div>
    )
}
