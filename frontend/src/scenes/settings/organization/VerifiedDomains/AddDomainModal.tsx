import { useActions, useValues } from 'kea'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { LemonInput } from '@posthog/lemon-ui'

import { DOMAIN_REGEX } from 'lib/constants'
import { LemonButton } from 'lib/lemon-ui/LemonButton'
import { LemonModal } from 'lib/lemon-ui/LemonModal'

import { verifiedDomainsLogic } from './verifiedDomainsLogic'

export function AddDomainModal(): JSX.Element {
    const { t } = useTranslation()
    const { addModalShown, verifiedDomainsLoading } = useValues(verifiedDomainsLogic)
    const { hideAddDomainModal, addVerifiedDomain } = useActions(verifiedDomainsLogic)
    const [newDomain, setNewDomain] = useState('')
    const [submitted, setSubmitted] = useState(false)

    const errored = !newDomain || !newDomain.match(DOMAIN_REGEX)

    const clean = (): void => {
        setNewDomain('')
        setSubmitted(false)
    }

    const handleClose = (): void => {
        hideAddDomainModal()
        clean()
    }

    const handleSubmit = (): void => {
        setSubmitted(true)
        if (!errored) {
            addVerifiedDomain(newDomain)
            clean()
        }
    }

    return (
        <LemonModal
            onClose={handleClose}
            isOpen={addModalShown}
            title={t('settings.organization.verifiedDomains.addModalTitle', {
                defaultValue: 'Add authentication domain',
            })}
            footer={
                <LemonButton
                    type="primary"
                    disabled={newDomain === '' || (submitted && errored) || verifiedDomainsLoading}
                    onClick={handleSubmit}
                >
                    {t('settings.organization.verifiedDomains.addDomain', { defaultValue: 'Add domain' })}
                </LemonButton>
            }
        >
            <LemonInput
                placeholder={t('settings.organization.verifiedDomains.domainPlaceholder', {
                    defaultValue: 'posthog.com',
                })}
                autoFocus
                value={newDomain}
                onChange={setNewDomain}
                onPressEnter={handleSubmit}
            />
            {submitted && errored && (
                <span className="text-danger text-xs">
                    {t('settings.organization.verifiedDomains.invalidDomain', {
                        defaultValue: 'Please enter a valid domain or subdomain name (e.g. my.posthog.com)',
                    })}
                </span>
            )}
        </LemonModal>
    )
}
