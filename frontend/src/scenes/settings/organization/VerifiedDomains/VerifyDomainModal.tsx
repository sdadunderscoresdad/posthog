import { useActions, useValues } from 'kea'
import { useTranslation } from 'react-i18next'

import { CopyToClipboardInline } from 'lib/components/CopyToClipboard'
import { LemonButton } from 'lib/lemon-ui/LemonButton'
import { LemonField } from 'lib/lemon-ui/LemonField'
import { LemonModal } from 'lib/lemon-ui/LemonModal'
import { LemonTag } from 'lib/lemon-ui/LemonTag/LemonTag'

import { verifiedDomainsLogic } from './verifiedDomainsLogic'

export function VerifyDomainModal(): JSX.Element {
    const { t } = useTranslation()
    const { domainBeingVerified, updatingDomainLoading } = useValues(verifiedDomainsLogic)
    const { setVerifyModal, verifyDomain } = useActions(verifiedDomainsLogic)
    const challengeName = `_posthog-challenge.${domainBeingVerified?.domain}.`

    return (
        <LemonModal
            isOpen={!!domainBeingVerified}
            onClose={() => setVerifyModal(null)}
            title={t('settings.organization.verifiedDomains.verifyTitle', { defaultValue: 'Verify your domain' })}
            description={
                <>
                    <LemonTag className="uppercase">{domainBeingVerified?.domain || ''}</LemonTag>
                    <p>
                        {t('settings.organization.verifiedDomains.verifyDescription', {
                            defaultValue: 'To verify your domain, you need to add a record to your DNS zone.',
                        })}
                    </p>
                </>
            }
            footer={
                <>
                    <LemonButton type="secondary" onClick={() => setVerifyModal(null)}>
                        {t('settings.organization.verifiedDomains.verifyLater', { defaultValue: 'Verify later' })}
                    </LemonButton>
                    <LemonButton type="primary" disabled={updatingDomainLoading} onClick={verifyDomain}>
                        {t('settings.organization.verifiedDomains.verify', { defaultValue: 'Verify' })}
                    </LemonButton>
                </>
            }
        >
            <div>
                <ol>
                    <li>
                        {t('settings.organization.verifiedDomains.stepSignIn', {
                            defaultValue: 'Sign in to your DNS provider.',
                        })}
                    </li>
                    <li>
                        {t('settings.organization.verifiedDomains.stepAddRecord', {
                            defaultValue: 'Add the following TXT record.',
                        })}
                        <div className="my-4 deprecated-space-y-2">
                            <LemonField.Pure
                                label={t('settings.organization.verifiedDomains.name', { defaultValue: 'Name' })}
                            >
                                <div className="flex items-center gap-2">
                                    <div className="border rounded p-2 h-10 flex-1">{challengeName}</div>
                                    <CopyToClipboardInline explicitValue={challengeName} selectable={true} />
                                </div>
                            </LemonField.Pure>

                            <LemonField.Pure
                                label={t('settings.organization.verifiedDomains.value', {
                                    defaultValue: 'Value or content',
                                })}
                            >
                                <div className="flex items-center gap-2">
                                    <div className="border rounded p-2 h-10 flex-1">
                                        {domainBeingVerified?.verification_challenge}
                                    </div>
                                    {domainBeingVerified && (
                                        <CopyToClipboardInline
                                            explicitValue={domainBeingVerified.verification_challenge}
                                            selectable={true}
                                        />
                                    )}
                                </div>
                            </LemonField.Pure>
                            <LemonField.Pure
                                label={t('settings.organization.verifiedDomains.ttl', { defaultValue: 'TTL' })}
                            >
                                <div className="flex items-center gap-2">
                                    <div className="border rounded p-2 h-10 flex-1">
                                        {t('settings.organization.verifiedDomains.defaultTtl', {
                                            defaultValue: 'Default or 3600',
                                        })}
                                    </div>
                                    <CopyToClipboardInline explicitValue="3600" selectable={true} />
                                </div>
                            </LemonField.Pure>
                        </div>
                    </li>
                    <li>
                        {t('settings.organization.verifiedDomains.stepPressVerify', {
                            defaultValue: 'Press verify below.',
                        })}
                    </li>
                </ol>
            </div>
        </LemonModal>
    )
}
