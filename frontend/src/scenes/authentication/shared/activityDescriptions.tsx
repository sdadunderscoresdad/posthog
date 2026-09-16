import {
    ActivityLogItem,
    ActivityLogUserName,
    HumanizedChange,
    defaultDescriber,
} from 'lib/components/ActivityLog/humanizeActivity'
import { i18n } from 'lib/i18n/i18n'

export function userActivityDescriber(logItem: ActivityLogItem, asNotification?: boolean): HumanizedChange {
    if (logItem.scope !== 'User') {
        console.error('user describer received a non-user activity')
        return { description: null }
    }

    const context = logItem?.detail?.context as any

    if (logItem.activity === 'logged_in') {
        const loginMethod =
            context?.login_method || i18n.t('userActivity.unknownMethod', { defaultValue: 'an unknown method' })
        const reauthSensitiveOps = context?.reauth

        return {
            description: (
                <>
                    <ActivityLogUserName logItem={logItem} />{' '}
                    {i18n.t('userActivity.loggedInUsing', { defaultValue: 'logged in using' })} {loginMethod}
                    {reauthSensitiveOps && (
                        <>
                            {' '}
                            {i18n.t('userActivity.reauthenticatedSensitiveOps', {
                                defaultValue: '(re-authenticated for sensitive operations)',
                            })}
                        </>
                    )}
                </>
            ),
        }
    }

    if (logItem.activity === 'logged_out') {
        return {
            description: (
                <>
                    <ActivityLogUserName logItem={logItem} />{' '}
                    {i18n.t('userActivity.loggedOut', { defaultValue: 'logged out' })}
                </>
            ),
        }
    }

    return defaultDescriber(logItem, asNotification)
}
