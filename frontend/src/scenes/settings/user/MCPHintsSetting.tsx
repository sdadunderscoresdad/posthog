import { useActions, useValues } from 'kea'
import { useTranslation } from 'react-i18next'

import { LemonSwitch } from '@posthog/lemon-ui'

import { userLogic } from 'scenes/userLogic'

export function MCPHintsSetting(): JSX.Element {
    const { t } = useTranslation()
    const { user, userLoading } = useValues(userLogic)
    const { updateUser } = useActions(userLogic)

    return (
        <LemonSwitch
            onChange={(checked) => {
                updateUser({ hide_mcp_hints: !checked })
            }}
            checked={!(user?.hide_mcp_hints ?? false)}
            loading={userLoading}
            label={t('settings.user.mcpHints', { defaultValue: 'Show MCP hints after I take actions' })}
            bordered
        />
    )
}
