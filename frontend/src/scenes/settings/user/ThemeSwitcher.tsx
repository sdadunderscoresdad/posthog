import { useActions, useValues } from 'kea'
import { router } from 'kea-router'
import { useTranslation } from 'react-i18next'

import { IconDay, IconLaptop, IconNight, IconPalette } from '@posthog/icons'
import { LemonSelect, LemonSelectOptions, LemonSelectProps } from '@posthog/lemon-ui'

import { urls } from 'scenes/urls'
import { userLogic } from 'scenes/userLogic'

import { themeLogic } from '~/layout/navigation-3000/themeLogic'

export function ThemeSwitcher({
    onlyLabel,
    ...props
}: Partial<LemonSelectProps<any>> & { onlyLabel?: boolean }): JSX.Element {
    const { t } = useTranslation()
    const { themeMode } = useValues(userLogic)
    const { updateUser } = useActions(userLogic)
    const { customCssEnabled } = useValues(themeLogic)

    const themeOptions: LemonSelectOptions<string> = [
        {
            options: [
                {
                    icon: <IconDay />,
                    value: 'light',
                    label: t('settings.user.theme.light', { defaultValue: 'Light mode' }),
                },
                {
                    icon: <IconNight />,
                    value: 'dark',
                    label: t('settings.user.theme.dark', { defaultValue: 'Dark mode' }),
                },
                {
                    icon: <IconLaptop />,
                    value: 'system',
                    label: t('settings.user.theme.system', { defaultValue: 'Sync with system' }),
                },
            ],
        },
    ]

    if (customCssEnabled) {
        themeOptions.push({
            options: [
                {
                    icon: <IconPalette />,
                    value: 'custom',
                    label: t('settings.user.theme.customCss', { defaultValue: 'Edit custom CSS' }),
                },
            ],
        })
    }

    return (
        <LemonSelect
            options={themeOptions}
            value={themeMode}
            renderButtonContent={(leaf) => {
                const labelText = leaf
                    ? leaf.label
                    : t('settings.user.theme.system', { defaultValue: 'Sync with system' })
                return onlyLabel ? (
                    labelText
                ) : (
                    <>
                        <span className="flex-1 flex justify-between items-baseline gap-4">
                            <span>{t('settings.user.theme.colorTheme', { defaultValue: 'Color theme' })}</span>
                            <span className="font-normal text-xs">
                                {leaf
                                    ? leaf.label
                                    : t('settings.user.theme.system', { defaultValue: 'Sync with system' })}
                            </span>
                        </span>
                    </>
                )
            }}
            onChange={(value) => {
                if (value === 'custom') {
                    router.actions.push(urls.customCss())
                } else {
                    updateUser({ theme_mode: value })
                }
            }}
            dropdownPlacement="right-start"
            dropdownMatchSelectWidth={false}
            {...props}
        />
    )
}
