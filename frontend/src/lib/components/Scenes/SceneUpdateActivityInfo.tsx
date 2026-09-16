import { useTranslation } from 'react-i18next'

import { ProfilePicture } from 'lib/lemon-ui/ProfilePicture'

import { ScenePanelLabel } from '~/layout/scenes/SceneLayout'
import { UserBasicType } from '~/types'

import { TZLabel } from '../TZLabel'

interface SceneActivityIndicatorProps {
    prefix?: string
    at?: string
    by?: UserBasicType | null | undefined
}

export function SceneActivityIndicator({ at, by, prefix }: SceneActivityIndicatorProps): JSX.Element | null {
    const { t } = useTranslation()
    const label = prefix ?? t('sceneActivity.lastModified', { defaultValue: 'Last modified' })

    return at || by ? (
        <ScenePanelLabel title={label}>
            <span className="flex items-center gap-1 whitespace-normal flex-wrap">
                {at && <TZLabel time={at} className="w-fit" />}
                {by && (
                    <>
                        <span className="text-secondary">{t('sceneActivity.by', { defaultValue: 'by' })}</span>
                        <ProfilePicture user={by} showName size="md" />
                    </>
                )}
            </span>
        </ScenePanelLabel>
    ) : null
}
