import { i18n } from 'lib/i18n/i18n'

/**
 * Read through `i18n` rather than kept as a module constant, because a message resolved at import
 * time keeps whatever language the module happened to load in.
 */
function webAuthnErrorMessage(name: string): string | undefined {
    switch (name) {
        case 'NotAllowedError':
            return i18n.t('settings.user.passkeys.errors.notAllowed', {
                defaultValue: 'Operation was cancelled or timed out.',
            })
        case 'InvalidStateError':
            return i18n.t('settings.user.passkeys.errors.invalidState', {
                defaultValue: 'This passkey is already registered.',
            })
        case 'SecurityError':
            return i18n.t('settings.user.passkeys.errors.security', {
                defaultValue: 'Security error occurred. Please try again.',
            })
        case 'AbortError':
            return i18n.t('settings.user.passkeys.errors.aborted', { defaultValue: 'Operation was cancelled.' })
        default:
            return undefined
    }
}

const WEBAUTHN_CANCELLATION_ERROR_NAMES = new Set(['NotAllowedError', 'AbortError'])

// SimpleWebAuthn surfaces user cancellations and authenticator timeouts as
// `NotAllowedError`/`AbortError`, sometimes wrapped under an `error` property.
// These are expected outcomes — never display them as errors or capture them
// in exception tracking.
export function isWebAuthnCancellation(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
        return false
    }
    const name = (error as { name?: unknown }).name
    if (typeof name === 'string' && WEBAUTHN_CANCELLATION_ERROR_NAMES.has(name)) {
        return true
    }
    const nestedName = (error as { error?: { name?: unknown } }).error?.name
    return typeof nestedName === 'string' && WEBAUTHN_CANCELLATION_ERROR_NAMES.has(nestedName)
}

export function getPasskeyErrorMessage(error: any, defaultMessage?: string): string {
    if (error?.name) {
        const message = webAuthnErrorMessage(error.name)
        if (message) {
            return message
        }
    }

    if (error?.detail) {
        return error.detail
    }

    if (error?.message) {
        return error.message
    }

    return (
        defaultMessage ??
        i18n.t('settings.user.passkeys.errors.generic', {
            defaultValue: 'Passkey authentication failed. Please try again.',
        })
    )
}
