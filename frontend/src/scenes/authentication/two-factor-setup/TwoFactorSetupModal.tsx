import { useActions, useValues } from 'kea'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { LemonBanner, LemonDivider } from '@posthog/lemon-ui'

import { OrganizationMenu } from 'lib/components/Account/OrganizationMenu'
import { i18n } from 'lib/i18n/i18n'
import { LemonModal } from 'lib/lemon-ui/LemonModal'
import { membersLogic } from 'scenes/organization/membersLogic'
import { userLogic } from 'scenes/userLogic'

import { twoFactorLogic } from './twoFactorLogic'
import { TwoFactorSetup } from './TwoFactorSetup'

export function TwoFactorSetupModal(): JSX.Element {
    const { t } = useTranslation()
    const { isTwoFactorSetupModalOpen, forceOpenTwoFactorSetupModal, startSetup, canSwitchOrg } =
        useValues(twoFactorLogic)
    const { closeTwoFactorSetupModal } = useActions(twoFactorLogic)
    const [showOrgDropdown, setShowOrgDropdown] = useState(false)

    // Determine if this is setup mode (has secret) or verification mode (no secret)
    const isSetupMode = !!startSetup?.secret
    const title = isSetupMode
        ? t('twoFactorSetup.setUpTitle', { defaultValue: 'Set up two-factor authentication' })
        : t('twoFactorSetup.requiredTitle', { defaultValue: 'Two-factor authentication required' })

    return (
        <LemonModal
            title={title}
            isOpen={isTwoFactorSetupModalOpen || forceOpenTwoFactorSetupModal}
            onClose={!forceOpenTwoFactorSetupModal ? () => closeTwoFactorSetupModal() : undefined}
            closable={!forceOpenTwoFactorSetupModal}
        >
            <div className="max-w-md">
                {forceOpenTwoFactorSetupModal && (
                    <LemonBanner className="mb-4" type="warning">
                        {isSetupMode
                            ? i18n.t('twoFactorSetup.requiredBannerSetup', {
                                  defaultValue: 'Your organization requires you to set up 2FA.',
                              })
                            : i18n.t('twoFactorSetup.requiredBannerVerify', {
                                  defaultValue:
                                      'Your organization requires two-factor authentication. Please verify using your authenticator app.',
                              })}
                    </LemonBanner>
                )}
                <p>
                    {isSetupMode
                        ? i18n.t('twoFactorSetup.scanQrCode', {
                              defaultValue:
                                  'Use an authenticator app like Google Authenticator or 1Password to scan the QR code below.',
                          })
                        : i18n.t('twoFactorSetup.enterAuthenticatorCode', {
                              defaultValue:
                                  'Enter the 6-digit code from your authenticator app to verify your identity.',
                          })}
                </p>
                <TwoFactorSetup
                    onSuccess={() => {
                        closeTwoFactorSetupModal()
                        userLogic.actions.loadUser()
                        membersLogic.actions.loadAllMembers()
                    }}
                />

                <LemonDivider />

                {canSwitchOrg && (
                    <div className="flex flex-col items-center gap-1 mt-4">
                        <div className="text-muted-alt text-xs">
                            {t('twoFactorSetup.or', { defaultValue: 'or' })}{' '}
                            <button
                                type="button"
                                className="text-muted-alt cursor-pointer underline hover:text-muted"
                                onClick={() => setShowOrgDropdown(true)}
                            >
                                {t('twoFactorSetup.changeOrganization', { defaultValue: 'change your organization' })}
                            </button>
                        </div>
                        {showOrgDropdown && <OrganizationMenu allowCreate={false} />}
                    </div>
                )}
            </div>
        </LemonModal>
    )
}
