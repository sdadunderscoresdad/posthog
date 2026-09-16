import { useActions, useValues } from 'kea'
import { Trans, useTranslation } from 'react-i18next'

import { IconRefresh } from '@posthog/icons'
import { LemonButton, ProfilePicture } from '@posthog/lemon-ui'

import { GRAVATAR_MANAGE_URL } from 'lib/utils/gravatar'
import { urls } from 'scenes/urls'
import { userLogic } from 'scenes/userLogic'

import { GravatarStatus, profilePictureLogic } from './profilePictureLogic'

function gravatarDescription(status: GravatarStatus, email: string): JSX.Element {
    const values = { email }
    const components = { Email: <span className="ph-no-capture" /> }
    switch (status) {
        case 'unknown':
            return (
                <Trans
                    i18nKey="settings.user.profilePicture.checking"
                    values={values}
                    components={components}
                    defaults="Checking Gravatar for <Email>{{ email }}</Email>."
                />
            )
        case 'found':
            return (
                <Trans
                    i18nKey="settings.user.profilePicture.found"
                    values={values}
                    components={components}
                    defaults="This picture comes from Gravatar, matched to <Email>{{ email }}</Email>. Change it there, then check again to see it here."
                />
            )
        case 'missing':
            return (
                <Trans
                    i18nKey="settings.user.profilePicture.missing"
                    values={values}
                    components={components}
                    defaults="No picture yet. Add one on Gravatar for <Email>{{ email }}</Email> and it shows here and anywhere teammates see you."
                />
            )
    }
}

export function ProfilePictureSettings(): JSX.Element {
    const { t } = useTranslation()
    const { user } = useValues(userLogic)
    const { gravatarStatus, gravatarChecking, gravatarEmail, gravatarRefreshKey, usesHedgehogAsProfilePicture } =
        useValues(profilePictureLogic)
    const { recheckGravatar } = useActions(profilePictureLogic)

    const email = user?.email || t('settings.user.profilePicture.yourEmail', { defaultValue: 'your email' })

    return (
        <div className="flex items-center gap-4">
            <ProfilePicture
                key={`${gravatarEmail}:${gravatarRefreshKey}`}
                user={user}
                size="xxl"
                refreshKey={gravatarRefreshKey}
            />
            <div className="flex min-w-0 flex-col gap-2">
                {usesHedgehogAsProfilePicture ? (
                    <>
                        <p className="m-0 text-sm text-secondary">
                            {t('settings.user.profilePicture.hedgehogInUse', {
                                defaultValue:
                                    'Your hedgehog is your profile picture. Turn that off to show your Gravatar instead.',
                            })}
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <LemonButton
                                type="secondary"
                                to={urls.settings('user-customization', 'hedgehog-mode')}
                                data-attr="settings-profile-picture-hedgehog"
                            >
                                {t('settings.user.profilePicture.hedgehogSettings', {
                                    defaultValue: 'Hedgehog mode settings',
                                })}
                            </LemonButton>
                        </div>
                    </>
                ) : (
                    <>
                        <p className="m-0 text-sm text-secondary">{gravatarDescription(gravatarStatus, email)}</p>
                        <div className="flex flex-wrap gap-2">
                            <LemonButton
                                type="secondary"
                                to={GRAVATAR_MANAGE_URL}
                                targetBlank
                                data-attr="settings-profile-picture-gravatar"
                            >
                                {gravatarStatus === 'found'
                                    ? t('settings.user.profilePicture.changeOnGravatar', {
                                          defaultValue: 'Change on Gravatar',
                                      })
                                    : t('settings.user.profilePicture.addOnGravatar', {
                                          defaultValue: 'Add on Gravatar',
                                      })}
                            </LemonButton>
                            <LemonButton
                                type="secondary"
                                icon={<IconRefresh />}
                                loading={gravatarChecking}
                                onClick={recheckGravatar}
                                data-attr="settings-profile-picture-refresh"
                            >
                                {t('settings.user.profilePicture.recheck', { defaultValue: 'Check again' })}
                            </LemonButton>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
