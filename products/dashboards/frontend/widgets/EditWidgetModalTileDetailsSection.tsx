import { LemonTextArea } from '@posthog/lemon-ui'

import { i18n } from 'lib/i18n/i18n'
import { LemonField } from 'lib/lemon-ui/LemonField/LemonField'
import { LemonInput } from 'lib/lemon-ui/LemonInput/LemonInput'

type EditWidgetModalTileDetailsSectionProps = {
    tileName: string
    tileDescription: string
    defaultTitle: string
    saving: boolean
    setTileName: (value: string) => void
    setTileDescription: (value: string) => void
}

export function EditWidgetModalTileDetailsSection({
    tileName,
    tileDescription,
    defaultTitle,
    saving,
    setTileName,
    setTileDescription,
}: EditWidgetModalTileDetailsSectionProps): JSX.Element {
    return (
        <section className="flex flex-col gap-3">
            <h5 className="text-sm font-semibold m-0">
                {i18n.t('dashboardWidgets.editModal.tileDetails', { defaultValue: 'Tile details' })}
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <LemonField.Pure
                    className="sm:col-span-2"
                    label={i18n.t('dashboardWidgets.editModal.tileNameLabel', { defaultValue: 'Title' })}
                    help={i18n.t('dashboardWidgets.editModal.tileNameHelp', {
                        defaultValue: 'Shown on the tile. Leave empty to use the default title.',
                    })}
                >
                    <LemonInput
                        value={tileName}
                        onChange={setTileName}
                        placeholder={defaultTitle}
                        maxLength={400}
                        disabled={saving}
                    />
                </LemonField.Pure>
                <LemonField.Pure
                    className="sm:col-span-2"
                    label={i18n.t('dashboardWidgets.editModal.descriptionLabel', { defaultValue: 'Description' })}
                    help={i18n.t('dashboardWidgets.editModal.descriptionHelp', {
                        defaultValue: 'Shown under the tile title. Supports markdown. Leave empty to hide.',
                    })}
                >
                    <LemonTextArea
                        value={tileDescription}
                        onChange={setTileDescription}
                        placeholder={i18n.t('dashboardWidgets.editModal.descriptionPlaceholder', {
                            defaultValue: 'Enter description (optional)',
                        })}
                        minRows={2}
                        disabled={saving}
                    />
                </LemonField.Pure>
            </div>
        </section>
    )
}
