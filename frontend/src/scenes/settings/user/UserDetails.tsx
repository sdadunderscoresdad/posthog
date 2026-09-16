import { useActions, useValues } from 'kea'
import { Form } from 'kea-forms'
import { useTranslation } from 'react-i18next'

import { LemonButton } from 'lib/lemon-ui/LemonButton'
import { LemonField } from 'lib/lemon-ui/LemonField'
import { LemonInput } from 'lib/lemon-ui/LemonInput/LemonInput'
import { emailChangeVerificationLogic } from 'scenes/settings/user/emailChangeVerificationLogic'
import { EmailChangeVerificationModal } from 'scenes/settings/user/EmailChangeVerificationModal'
import { userLogic } from 'scenes/userLogic'

export function UserDetails(): JSX.Element {
    const { t } = useTranslation()
    const { userLoading, isUserDetailsSubmitting, userDetailsChanged, user } = useValues(userLogic)
    const { cancelEmailChangeRequest } = useActions(userLogic)
    const { openModal } = useActions(emailChangeVerificationLogic)

    return (
        <>
            <EmailChangeVerificationModal />
            <Form
                logic={userLogic}
                formKey="userDetails"
                enableFormOnSubmit
                className="deprecated-space-y-4"
                style={{
                    maxWidth: '28rem',
                }}
            >
                <LemonField
                    name="first_name"
                    label={t('settings.user.details.firstName', { defaultValue: 'First name' })}
                >
                    <LemonInput
                        className="ph-ignore-input"
                        data-attr="settings-update-first-name"
                        placeholder={t('settings.user.details.firstNamePlaceholder', { defaultValue: 'Jane' })}
                        disabled={userLoading}
                    />
                </LemonField>

                <LemonField name="last_name" label={t('settings.user.details.lastName', { defaultValue: 'Last name' })}>
                    <LemonInput
                        className="ph-ignore-input"
                        data-attr="settings-update-last-name"
                        placeholder={t('settings.user.details.lastNamePlaceholder', { defaultValue: 'Doe' })}
                        disabled={userLoading}
                    />
                </LemonField>

                <LemonField name="email" label={t('settings.user.details.email', { defaultValue: 'Email' })}>
                    <LemonInput
                        className="ph-ignore-input"
                        data-attr="settings-update-email"
                        placeholder="email@yourcompany.com"
                        disabled={userLoading}
                    />
                </LemonField>
                {user?.pending_email && (
                    <div className="flex flex-row gap-2">
                        <div className="text-danger text-xs font-medium mt-1.25">
                            {t('settings.user.details.pendingVerification', {
                                defaultValue: 'Pending verification for {{ email }}',
                                email: user.pending_email,
                            })}
                        </div>
                        <LemonButton
                            type="tertiary"
                            size="xsmall"
                            data-attr="enter-email-verification-code-button"
                            onClick={openModal}
                        >
                            {t('settings.user.details.enterCode', { defaultValue: 'Enter verification code' })}
                        </LemonButton>
                        <LemonButton
                            type="tertiary"
                            size="xsmall"
                            data-attr="cancel-email-change-request-button"
                            onClick={cancelEmailChangeRequest}
                        >
                            {t('settings.user.details.cancelChange', { defaultValue: 'Cancel change' })}
                        </LemonButton>
                    </div>
                )}

                <LemonButton
                    type="primary"
                    htmlType="submit"
                    loading={isUserDetailsSubmitting}
                    disabled={!userDetailsChanged}
                    data-attr="user-details-submit-bottom"
                >
                    {t('settings.user.details.save', { defaultValue: 'Save name and email' })}
                </LemonButton>
            </Form>
        </>
    )
}
