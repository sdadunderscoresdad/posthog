import { useValues } from 'kea'
import { router } from 'kea-router'
import { Trans, useTranslation } from 'react-i18next'

import { LemonButton } from '@posthog/lemon-ui'

import { getCookie } from 'lib/api'
import { BridgePage } from 'lib/components/BridgePage/BridgePage'
import { IconErrorOutline } from 'lib/lemon-ui/icons'
import { SceneExport } from 'scenes/sceneTypes'

export const scene: SceneExport = {
    component: VercelLinkError,
}

export function VercelLinkError(): JSX.Element {
    const { t } = useTranslation()
    const { searchParams } = useValues(router)

    const expectedEmail = searchParams.expected_email
    const currentEmail = searchParams.current_email || 'your current account'
    const code = searchParams.code
    const state = searchParams.state

    const nextUrl =
        code && state
            ? `/login/vercel?mode=sso&code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`
            : null
    const submitLogout = (): void => {
        const form = document.createElement('form')
        form.method = 'POST'
        form.action = '/logout'
        form.style.display = 'none'

        const csrfInput = document.createElement('input')
        csrfInput.type = 'hidden'
        csrfInput.name = 'csrfmiddlewaretoken'
        csrfInput.value = getCookie('posthog_csrftoken') || ''
        form.appendChild(csrfInput)

        if (nextUrl) {
            const nextInput = document.createElement('input')
            nextInput.type = 'hidden'
            nextInput.name = 'next'
            nextInput.value = nextUrl
            form.appendChild(nextInput)
        }

        document.body.appendChild(form)
        form.submit()
    }

    return (
        <BridgePage view="vercel-link-error">
            <div className="text-center mb-4">
                <IconErrorOutline className="text-warning text-4xl" />
            </div>
            <h2 className="text-center">{t('vercelLinkError.title', { defaultValue: 'Account mismatch' })}</h2>
            <div className="text-center mb-6">
                <p className="mb-2">
                    <Trans
                        i18nKey="vercelLinkError.signedInAs"
                        values={{
                            currentEmail,
                            expected:
                                expectedEmail ??
                                t('vercelLinkError.differentAccount', {
                                    defaultValue: 'a different account',
                                }),
                        }}
                        components={{ Strong: <strong /> }}
                        defaults="You're currently logged in as <Strong>{{ currentEmail }}</Strong>, but your Vercel account is linked to <Strong>{{ expected }}</Strong>."
                    />
                </p>
                <p>
                    {t('vercelLinkError.instruction', {
                        defaultValue: 'To complete Vercel SSO, please log out and sign in with the correct account.',
                    })}
                </p>
            </div>
            <div className="flex flex-col gap-2">
                <LemonButton fullWidth type="primary" center onClick={submitLogout}>
                    {expectedEmail
                        ? t('vercelLinkError.logOutWith', {
                              defaultValue: 'Log out and continue with {{ email }}',
                              email: expectedEmail,
                          })
                        : t('vercelLinkError.logOut', { defaultValue: 'Log out and continue' })}
                </LemonButton>
                <LemonButton fullWidth type="secondary" center to="/">
                    {t('settings.cancel', { defaultValue: 'Cancel' })}
                </LemonButton>
            </div>
        </BridgePage>
    )
}

export default VercelLinkError
