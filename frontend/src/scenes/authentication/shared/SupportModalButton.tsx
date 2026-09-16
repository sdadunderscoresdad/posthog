import { useActions, useValues } from 'kea'

import { IconBug, IconQuestion } from '@posthog/icons'
import { LemonButton } from '@posthog/lemon-ui'

import { SupportTicketKind, supportLogic } from 'lib/components/Support/supportLogic'
import { i18n } from 'lib/i18n/i18n'
import { preflightLogic } from 'scenes/PreflightCheck/preflightLogic'

interface SupportModalButtonProps {
    name?: string
    email?: string
    kind?: SupportTicketKind
    billingIssue?: boolean
    label?: string
}

export function SupportModalButton({
    name,
    email,
    kind = 'bug',
    billingIssue = false,
    label,
}: SupportModalButtonProps): JSX.Element | null {
    const { openSupportForm } = useActions(supportLogic)
    const { preflight } = useValues(preflightLogic)

    return preflight?.cloud ? ( // We don't provide support for self-hosted instances
        <>
            <div className="text-center">
                <LemonButton
                    onClick={() => {
                        openSupportForm({
                            name,
                            email,
                            kind,
                            billing_issue: billingIssue,
                        })
                    }}
                    icon={kind === 'bug' ? <IconBug /> : <IconQuestion />}
                    size="small"
                >
                    <span className="text-secondary">
                        {label ?? i18n.t('support.reportAnIssue', { defaultValue: 'Report an issue' })}
                    </span>
                </LemonButton>
            </div>
        </>
    ) : null
}
