import { Trans } from 'react-i18next'

import {
    ActivityLogItem,
    ActivityLogUserName,
    HumanizedChange,
    defaultDescriber,
} from 'lib/components/ActivityLog/humanizeActivity'
import { i18n } from 'lib/i18n/i18n'

import { ActivityScope } from '~/types'

export function replayActivityDescriber(logItem: ActivityLogItem, asNotification?: boolean): HumanizedChange {
    if (logItem.scope !== ActivityScope.REPLAY) {
        console.error('replay describer received a non-replay activity')
        return { description: null }
    }

    if (logItem.activity === 'bulk_deleted') {
        return {
            description: (
                <>
                    <ActivityLogUserName logItem={logItem} />{' '}
                    {i18n.t('replay.bulkDeleted', { defaultValue: 'bulk deleted' })}{' '}
                    <b>
                        {logItem.detail?.name ||
                            i18n.t('replay.sessionRecordings', { defaultValue: 'session recordings' })}
                    </b>
                </>
            ),
        }
    }

    if (logItem.activity === 'share_login_success') {
        const afterData = logItem.detail.changes?.[0]?.after as any
        const clientIp = afterData?.client_ip || i18n.t('replay.unknownIp', { defaultValue: 'unknown IP' })
        const passwordNote =
            afterData?.password_note || i18n.t('replay.unknownpassword', { defaultValue: 'unknown password' })
        const name = logItem.detail?.name || i18n.t('replay.sessionRecording', { defaultValue: 'session recording' })

        return {
            description: (
                <Trans
                    i18nKey="replay.shareLoginSuccess"
                    values={{ ip: clientIp, name, password: passwordNote }}
                    components={{ Bold: <strong />, NameBold: <b /> }}
                    defaults="<Bold>Anonymous user</Bold> successfully authenticated to shared session recording <NameBold>{{ name }}</NameBold> from {{ ip }} using password <Bold>{{ password }}</Bold>"
                />
            ),
        }
    }

    if (logItem.activity === 'share_login_failed') {
        const afterData = logItem.detail.changes?.[0]?.after as any
        const clientIp = afterData?.client_ip || i18n.t('replay.unknownIp', { defaultValue: 'unknown IP' })
        const name = logItem.detail?.name || i18n.t('replay.sessionRecording', { defaultValue: 'session recording' })

        return {
            description: (
                <Trans
                    i18nKey="replay.shareLoginFailed"
                    values={{ ip: clientIp, name }}
                    components={{ Bold: <strong />, NameBold: <b /> }}
                    defaults="<Bold>Anonymous user</Bold> failed to authenticate to shared session recording <NameBold>{{ name }}</NameBold> from {{ ip }}"
                />
            ),
        }
    }

    // Fall back to default describer for other activities like 'deleted', 'created', etc.
    return defaultDescriber(logItem, asNotification)
}
