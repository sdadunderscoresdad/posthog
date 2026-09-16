import { useActions, useValues } from 'kea'
import { Trans, useTranslation } from 'react-i18next'

import { LemonSwitch, Link } from '@posthog/lemon-ui'

import { userLogic } from 'scenes/userLogic'

export function AllowImpersonation(): JSX.Element {
    const { t } = useTranslation()
    const { user, userLoading } = useValues(userLogic)
    const { updateUser } = useActions(userLogic)

    return (
        <div>
            <p>
                <Trans
                    i18nKey="settings.user.impersonation.description"
                    components={{
                        PolicyLink: (
                            <Link
                                to="https://posthog.com/handbook/company/security#impersonating-users"
                                target="_blank"
                            />
                        ),
                    }}
                    defaults="PostHog support staff may need to log in as you to help debug issues. If you disable this setting, support staff will not be able to access your account directly. Read our <PolicyLink>policy on user impersonation</PolicyLink>."
                />
            </p>
            <LemonSwitch
                label={t('settings.user.impersonation.label', { defaultValue: 'Allow support to log in as me' })}
                data-attr="allow-impersonation"
                onChange={(checked) => updateUser({ allow_impersonation: checked })}
                checked={user?.allow_impersonation ?? true}
                disabled={userLoading}
                bordered
            />
        </div>
    )
}
