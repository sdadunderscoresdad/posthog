import {
    ActivityLogItem,
    ActivityLogUserName,
    HumanizedChange,
    defaultDescriber,
} from 'lib/components/ActivityLog/humanizeActivity'
import { UserNameWithEmail } from 'lib/components/ActivityLog/UserNameWithEmail'
import { OrganizationMembershipLevel } from 'lib/constants'
import { i18n } from 'lib/i18n/i18n'
import { Link } from 'lib/lemon-ui/Link'
import { membershipLevelToName } from 'lib/utils/permissioning'
import { urls } from 'scenes/urls'

const nameOrLinkToOrganization = (name?: string | null): string | JSX.Element => {
    let displayName = name || i18n.t('settingsActivity.organization', { defaultValue: 'Organization' })

    if (displayName.length > 32) {
        displayName = displayName.slice(0, 32) + '...'
    }

    return <Link to={urls.settings('organization')}>{displayName}</Link>
}

export function organizationActivityDescriber(logItem: ActivityLogItem, asNotification?: boolean): HumanizedChange {
    if (logItem.scope === 'OrganizationMembership') {
        return organizationMembershipActivityDescriber(logItem, asNotification)
    }
    if (logItem.scope === 'OrganizationInvite') {
        return organizationInviteActivityDescriber(logItem, asNotification)
    }
    if (logItem.activity == 'created') {
        return {
            description: (
                <>
                    <ActivityLogUserName logItem={logItem} />{' '}
                    {i18n.t('settingsActivity.organization.created', { defaultValue: 'created the organization' })}{' '}
                    <strong>{nameOrLinkToOrganization(logItem?.detail.name)}</strong>
                </>
            ),
        }
    }

    if (logItem.activity == 'deleted') {
        return {
            description: (
                <>
                    <ActivityLogUserName logItem={logItem} />{' '}
                    {i18n.t('settingsActivity.organization.deleted', { defaultValue: 'deleted the organization' })}{' '}
                    <strong>
                        {logItem.detail.name ||
                            i18n.t('settingsActivity.organization', { defaultValue: 'Organization' })}
                    </strong>
                </>
            ),
        }
    }

    if (logItem.activity == 'updated') {
        const changes = logItem.detail.changes || []

        if (changes.length === 1) {
            const change = changes[0]
            const changeDescription = (
                <>
                    {i18n.t('settingsActivity.updatedWithField', { defaultValue: 'updated the' })}{' '}
                    <strong>{change.field}</strong>
                </>
            )

            return {
                description: (
                    <>
                        <ActivityLogUserName logItem={logItem} /> {changeDescription}{' '}
                        {i18n.t('settingsActivity.forOrganization', { defaultValue: 'for organization' })}{' '}
                        {nameOrLinkToOrganization(logItem?.detail.name)}
                    </>
                ),
            }
        } else if (changes.length > 1) {
            return {
                description: (
                    <>
                        <ActivityLogUserName logItem={logItem} />{' '}
                        {i18n.t('settingsActivity.updated', { defaultValue: 'updated' })}{' '}
                        <strong>
                            {i18n.t('settingsActivity.settingsCount', {
                                count: changes.length,
                                defaultValue_one: '{{ count }} setting',
                                defaultValue_other: '{{ count }} settings',
                            })}
                        </strong>{' '}
                        {i18n.t('settingsActivity.forOrganization', { defaultValue: 'for organization' })}
                        {nameOrLinkToOrganization(logItem?.detail.name)}
                    </>
                ),
            }
        }
    }

    return defaultDescriber(logItem, asNotification, nameOrLinkToOrganization(logItem?.detail.name))
}

function organizationMembershipActivityDescriber(logItem: ActivityLogItem, asNotification?: boolean): HumanizedChange {
    const context = logItem?.detail?.context
    const userEmail = context?.user_email || ''
    const userName = context?.user_name || userEmail
    const organizationName =
        context?.organization_name || i18n.t('settingsActivity.theOrganization', { defaultValue: 'the organization' })

    if (logItem.activity == 'created') {
        return {
            description: (
                <>
                    <ActivityLogUserName logItem={logItem} />{' '}
                    {i18n.t('settingsActivity.membership.addedUser', { defaultValue: 'added user' })}{' '}
                    <strong>
                        {userName} ({userEmail})
                    </strong>{' '}
                    {i18n.t('settingsActivity.membership.toOrganization', { defaultValue: 'to organization' })}
                    {nameOrLinkToOrganization(organizationName)}
                </>
            ),
        }
    }

    if (logItem.activity == 'deleted') {
        return {
            description: (
                <>
                    <ActivityLogUserName logItem={logItem} />{' '}
                    {i18n.t('settingsActivity.membership.removedUser', { defaultValue: 'removed user' })}{' '}
                    <strong>
                        {userName} ({userEmail})
                    </strong>{' '}
                    {i18n.t('settingsActivity.membership.fromOrganization', { defaultValue: 'from organization' })}{' '}
                    {nameOrLinkToOrganization(organizationName)}
                </>
            ),
        }
    }

    if (logItem.activity == 'updated') {
        const changes = logItem.detail.changes || []
        const levelChange = changes.find((c) => c.field === 'level')

        if (levelChange) {
            const beforeLevel =
                membershipLevelToName.get(levelChange.before as OrganizationMembershipLevel) || levelChange.before
            const afterLevel =
                membershipLevelToName.get(levelChange.after as OrganizationMembershipLevel) || levelChange.after

            return {
                description: (
                    <>
                        <ActivityLogUserName logItem={logItem} />{' '}
                        {i18n.t('settingsActivity.membership.changed', { defaultValue: 'changed' })}{' '}
                        <strong>
                            {userName} ({userEmail})
                        </strong>
                        {i18n.t('settingsActivity.membership.roleFrom', { defaultValue: "'s role from" })}{' '}
                        <strong>{String(beforeLevel)}</strong>{' '}
                        {i18n.t('settingsActivity.membership.to', { defaultValue: 'to' })}{' '}
                        <strong>{String(afterLevel)}</strong>{' '}
                        {i18n.t('settingsActivity.membership.inOrganization', { defaultValue: 'in organization' })}
                        {nameOrLinkToOrganization(organizationName)}
                    </>
                ),
            }
        }

        return {
            description: (
                <>
                    <ActivityLogUserName logItem={logItem} />{' '}
                    {i18n.t('settingsActivity.updated', { defaultValue: 'updated' })}{' '}
                    <strong>
                        {userName} ({userEmail})
                    </strong>
                    {i18n.t('settingsActivity.membership.membershipInOrganization', {
                        defaultValue: "'s membership in organization",
                    })}{' '}
                    {nameOrLinkToOrganization(organizationName)}
                </>
            ),
        }
    }

    return defaultDescriber(logItem, asNotification)
}

function organizationInviteActivityDescriber(logItem: ActivityLogItem, asNotification?: boolean): HumanizedChange {
    const context = logItem?.detail?.context
    const targetEmail = context?.target_email || ''
    const organizationName =
        context?.organization_name || i18n.t('settingsActivity.theOrganization', { defaultValue: 'the organization' })
    const level = context?.level || 'member'
    // The context names whoever created the invite, who is not always the person who acted on this
    // row, so the email must come from the same context as the name. A system or impersonated row
    // hides it, as the actor's name and avatar do.
    const inviterEmail = logItem.is_system || logItem.was_impersonated ? undefined : context?.inviter_user_email
    const inviter = context?.inviter_user_name ? (
        <UserNameWithEmail name={context.inviter_user_name} email={inviterEmail} />
    ) : (
        <ActivityLogUserName logItem={logItem} />
    )

    if (logItem.activity == 'created') {
        return {
            description: (
                <>
                    {inviter} {i18n.t('settingsActivity.invite.sent', { defaultValue: 'sent an invitation to' })}{' '}
                    <strong>{targetEmail}</strong>{' '}
                    {i18n.t('settingsActivity.invite.toJoinOrganization', { defaultValue: 'to join organization' })}{' '}
                    {nameOrLinkToOrganization(organizationName)}{' '}
                    {i18n.t('settingsActivity.invite.as', { defaultValue: 'as' })} <strong>{level}</strong>
                </>
            ),
        }
    }

    if (logItem.activity == 'deleted') {
        return {
            description: (
                <>
                    {inviter}{' '}
                    {i18n.t('settingsActivity.invite.revoked', { defaultValue: 'revoked the invitation for' })}{' '}
                    <strong>{targetEmail}</strong>{' '}
                    {i18n.t('settingsActivity.invite.toJoinOrganization', { defaultValue: 'to join organization' })}{' '}
                    {nameOrLinkToOrganization(organizationName)}
                </>
            ),
        }
    }

    if (logItem.activity == 'updated') {
        const changes = logItem.detail.changes || []

        if (changes.length === 1) {
            const change = changes[0]
            const changeDescription = (
                <>
                    {i18n.t('settingsActivity.updated', { defaultValue: 'updated' })} <strong>{change.field}</strong>
                </>
            )

            return {
                description: (
                    <>
                        {inviter} {changeDescription}{' '}
                        {i18n.t('settingsActivity.invite.forInvitationSentTo', {
                            defaultValue: 'for the invitation sent to',
                        })}{' '}
                        <strong>{targetEmail}</strong>{' '}
                        {i18n.t('settingsActivity.invite.toJoinOrganization', { defaultValue: 'to join organization' })}
                        {nameOrLinkToOrganization(organizationName)}
                    </>
                ),
            }
        } else if (changes.length > 1) {
            return {
                description: (
                    <>
                        {inviter} {i18n.t('settingsActivity.updated', { defaultValue: 'updated' })}{' '}
                        <strong>
                            {i18n.t('settingsActivity.settingsCount', {
                                count: changes.length,
                                defaultValue_one: '{{ count }} setting',
                                defaultValue_other: '{{ count }} settings',
                            })}
                        </strong>{' '}
                        {i18n.t('settingsActivity.invite.forInvitationSentTo', {
                            defaultValue: 'for the invitation sent to',
                        })}{' '}
                        <strong>{targetEmail}</strong>{' '}
                        {i18n.t('settingsActivity.invite.toJoinOrganization', { defaultValue: 'to join organization' })}{' '}
                        {nameOrLinkToOrganization(organizationName)}
                    </>
                ),
            }
        }
    }

    return defaultDescriber(logItem, asNotification)
}

export function organizationDomainActivityDescriber(
    logItem: ActivityLogItem,
    asNotification?: boolean
): HumanizedChange {
    const context = logItem.detail.context
    const domainName = context?.domain || i18n.t('settingsActivity.domain.unknown', { defaultValue: 'unknown domain' })

    if (logItem.activity === 'updated') {
        const changes = logItem.detail.changes || []
        const hasScimEnabledChange = changes.some((c) => c.field === 'SCIM provisioning')

        const descriptions: JSX.Element[] = []
        for (const change of changes) {
            if (change.field === 'SCIM provisioning') {
                descriptions.push(
                    <>
                        {change.after
                            ? i18n.t('settingsActivity.domain.enabled', { defaultValue: 'enabled' })
                            : i18n.t('settingsActivity.domain.disabled', { defaultValue: 'disabled' })}{' '}
                        <strong>
                            {i18n.t('settingsActivity.domain.scimProvisioning', {
                                defaultValue: 'SCIM provisioning',
                            })}
                        </strong>{' '}
                        {i18n.t('settingsActivity.domain.forDomain', { defaultValue: 'for domain' })}{' '}
                        <strong>{domainName}</strong>
                    </>
                )
            } else if (change.field === 'scim_bearer_token') {
                if (!hasScimEnabledChange) {
                    descriptions.push(
                        <>
                            {i18n.t('settingsActivity.domain.rotated', { defaultValue: 'rotated the' })}{' '}
                            <strong>SCIM bearer token</strong>{' '}
                            {i18n.t('settingsActivity.domain.forDomain', { defaultValue: 'for domain' })}{' '}
                            <strong>{domainName}</strong>
                        </>
                    )
                }
            } else {
                descriptions.push(
                    <>
                        {i18n.t('settingsActivity.updated', { defaultValue: 'updated' })}{' '}
                        <strong>{change.field}</strong>{' '}
                        {i18n.t('settingsActivity.domain.forDomain', { defaultValue: 'for domain' })}{' '}
                        <strong>{domainName}</strong>
                    </>
                )
            }
        }

        if (descriptions.length > 0) {
            return {
                description: (
                    <>
                        <ActivityLogUserName logItem={logItem} />{' '}
                        {descriptions.length === 1 ? (
                            descriptions[0]
                        ) : (
                            <ul>
                                {descriptions.map((d, i) => (
                                    <li key={i}>{d}</li>
                                ))}
                            </ul>
                        )}
                    </>
                ),
            }
        }
    }

    if (logItem.activity === 'deleted') {
        return {
            description: (
                <>
                    <ActivityLogUserName logItem={logItem} />{' '}
                    {i18n.t('settingsActivity.domain.deleted', { defaultValue: 'deleted domain' })}{' '}
                    <strong>{domainName}</strong>
                </>
            ),
        }
    }

    if (logItem.activity === 'created') {
        return {
            description: (
                <>
                    <ActivityLogUserName logItem={logItem} />{' '}
                    {i18n.t('settingsActivity.domain.added', { defaultValue: 'added domain' })}{' '}
                    <strong>{domainName}</strong>
                </>
            ),
        }
    }

    return defaultDescriber(logItem, asNotification, domainName)
}

export function legalDocumentActivityDescriber(logItem: ActivityLogItem, asNotification?: boolean): HumanizedChange {
    const detail = logItem.detail as {
        name?: string | null
        context?: { document_type?: string; company_name?: string }
    }
    const documentType =
        detail.context?.document_type || i18n.t('settingsActivity.legalDocument.document', { defaultValue: 'document' })
    const companyName =
        detail.context?.company_name ||
        detail.name ||
        i18n.t('settingsActivity.legalDocument.company', { defaultValue: 'company' })
    const article =
        documentType === 'BAA' || documentType === 'DPA'
            ? i18n.t('settingsActivity.legalDocument.articleA', { defaultValue: 'a' })
            : i18n.t('settingsActivity.legalDocument.articleThe', { defaultValue: 'the' })

    if (logItem.activity === 'created') {
        return {
            description: (
                <>
                    <ActivityLogUserName logItem={logItem} />{' '}
                    {i18n.t('settingsActivity.legalDocument.generated', { defaultValue: 'generated' })} {article}{' '}
                    <strong>{documentType}</strong> {i18n.t('settingsActivity.for', { defaultValue: 'for' })}{' '}
                    <strong>{companyName}</strong>
                </>
            ),
        }
    }

    if (logItem.activity === 'deleted') {
        return {
            description: (
                <>
                    <ActivityLogUserName logItem={logItem} />{' '}
                    {i18n.t('settingsActivity.legalDocument.deleted', { defaultValue: 'deleted' })} {article}{' '}
                    <strong>{documentType}</strong> {i18n.t('settingsActivity.for', { defaultValue: 'for' })}{' '}
                    <strong>{companyName}</strong>
                </>
            ),
        }
    }

    return defaultDescriber(
        logItem,
        asNotification,
        i18n.t('settingsActivity.legalDocument.descriptor', {
            defaultValue: '{{ document }} for {{ company }}',
            document: documentType,
            company: companyName,
        })
    )
}
