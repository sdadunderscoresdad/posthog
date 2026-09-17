import { useActions, useValues } from 'kea'
import { Field, Form } from 'kea-forms'

import { ButtonTileCard } from 'lib/components/Cards/ButtonTileCard/ButtonTileCard'
import { buttonTileCardModalLogic } from 'lib/components/Cards/ButtonTileCard/buttonTileCardModalLogic'
import { i18n } from 'lib/i18n/i18n'
import { LemonButton } from 'lib/lemon-ui/LemonButton'
import { LemonInput } from 'lib/lemon-ui/LemonInput'
import { LemonModal } from 'lib/lemon-ui/LemonModal'
import { LemonSegmentedButton } from 'lib/lemon-ui/LemonSegmentedButton'
import { LemonSwitch } from 'lib/lemon-ui/LemonSwitch'

import { DashboardPlacement, DashboardTile, DashboardTileIdOrNew, DashboardType, QueryBasedInsightModel } from '~/types'

export function ButtonTileCardModal({
    isOpen,
    onClose,
    dashboard,
    buttonTileId,
}: {
    isOpen: boolean
    onClose: () => void
    dashboard: DashboardType<QueryBasedInsightModel>
    buttonTileId: DashboardTileIdOrNew
}): JSX.Element {
    const isNewTile = buttonTileId === null
    const modalLogic = buttonTileCardModalLogic({ dashboard, buttonTileId, onClose })
    const { buttonTile, isButtonTileSubmitting, buttonTileValidationErrors } = useValues(modalLogic)
    const { submitButtonTile, resetButtonTile } = useActions(modalLogic)

    const handleClose = (): void => {
        resetButtonTile()
        onClose()
    }

    const firstError = buttonTileValidationErrors.url || buttonTileValidationErrors.text
    const previewTile: DashboardTile<QueryBasedInsightModel> = {
        id: buttonTileId ?? 0,
        color: null,
        button_tile: {
            ...buttonTile,
            text: buttonTile.text || i18n.t('cardEditor.clickMe', { defaultValue: 'Click me' }),
        },
        transparent_background: buttonTile.transparent_background,
    }

    return (
        <LemonModal
            closable={true}
            isOpen={isOpen}
            title={
                isNewTile
                    ? i18n.t('cardEditor.addLink', { defaultValue: 'Add link' })
                    : i18n.t('cardEditor.editLink', { defaultValue: 'Edit link' })
            }
            onClose={handleClose}
            footer={
                <>
                    <LemonButton
                        disabledReason={
                            isButtonTileSubmitting
                                ? i18n.t('cardEditor.cannotCancelInProgress', {
                                      defaultValue: 'Cannot cancel in progress',
                                  })
                                : null
                        }
                        type="secondary"
                        onClick={handleClose}
                    >
                        {i18n.t('common.cancel', { defaultValue: 'Cancel' })}
                    </LemonButton>
                    <LemonButton
                        disabledReason={firstError as string | null}
                        loading={isButtonTileSubmitting}
                        form="button-tile-form"
                        htmlType="submit"
                        type="primary"
                        onClick={submitButtonTile}
                        data-attr={isNewTile ? 'save-new-button-tile' : 'edit-button-tile'}
                    >
                        {i18n.t('cardEditor.save', { defaultValue: 'Save' })}
                    </LemonButton>
                </>
            }
        >
            <Form
                logic={buttonTileCardModalLogic}
                props={{ dashboard, buttonTileId }}
                formKey="buttonTile"
                id="button-tile-form"
                enableFormOnSubmit
            >
                <div className="flex flex-col gap-4">
                    <Field name="url" label={i18n.t('cardEditor.url', { defaultValue: 'URL' })}>
                        <LemonInput
                            placeholder={i18n.t('cardEditor.urlPlaceholder', {
                                defaultValue: 'https://example.com or /dashboards',
                            })}
                            data-attr="button-tile-url"
                            autoFocus
                        />
                    </Field>
                    <Field name="text" label={i18n.t('cardEditor.linkText', { defaultValue: 'Link text' })}>
                        <LemonInput
                            placeholder={i18n.t('cardEditor.clickMe', { defaultValue: 'Click me' })}
                            data-attr="button-tile-text"
                        />
                    </Field>
                    <Field
                        name="placement"
                        label={i18n.t('cardEditor.placementWithinTile', { defaultValue: 'Placement within tile' })}
                    >
                        <LemonSegmentedButton
                            options={[
                                { value: 'left', label: i18n.t('cardEditor.left', { defaultValue: 'Left' }) },
                                { value: 'right', label: i18n.t('cardEditor.right', { defaultValue: 'Right' }) },
                            ]}
                            data-attr="button-tile-placement"
                        />
                    </Field>
                    <Field name="style" label={i18n.t('cardEditor.style', { defaultValue: 'Style' })}>
                        <LemonSegmentedButton
                            options={[
                                { value: 'primary', label: i18n.t('cardEditor.primary', { defaultValue: 'Primary' }) },
                                {
                                    value: 'secondary',
                                    label: i18n.t('cardEditor.secondary', { defaultValue: 'Secondary' }),
                                },
                            ]}
                            data-attr="button-tile-style"
                        />
                    </Field>
                    <Field name="transparent_background" label="">
                        {({ value, onChange }) => (
                            <LemonSwitch
                                checked={value}
                                onChange={onChange}
                                label={i18n.t('cardEditor.transparentBackground', {
                                    defaultValue: 'Transparent background',
                                })}
                                data-attr="button-tile-transparent-background"
                            />
                        )}
                    </Field>
                    <div>
                        <h4 className="mb-2">{i18n.t('cardEditor.preview', { defaultValue: 'Preview' })}</h4>
                        <div className="pointer-events-none rounded bg-surface-secondary p-3">
                            <ButtonTileCard
                                buttonTile={previewTile}
                                placement={DashboardPlacement.Dashboard}
                                showEditingControls={false}
                                className="h-32 overflow-hidden [&_.LemonButton]:max-w-64 [&_.LemonButton__content]:truncate"
                            />
                        </div>
                    </div>
                </div>
            </Form>
        </LemonModal>
    )
}
