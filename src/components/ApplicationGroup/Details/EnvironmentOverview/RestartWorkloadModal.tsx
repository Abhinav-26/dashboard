import React, { useEffect, useState } from 'react'
import {
    ButtonWithLoader,
    CHECKBOX_VALUE,
    Checkbox,
    Drawer,
    GenericEmptyState,
    InfoColourBar,
    noop,
    showError,
    stopPropagation,
    useSearchString,
} from '@devtron-labs/devtron-fe-common-lib'
import { useHistory } from 'react-router-dom'
import {
    AppInfoMetaDataDTO,
    BulkRotatePodsMetaData,
    ResourceIdentifierDTO,
    ResourceMetaData,
    ResourcesMetaDataMap,
    RestartWorkloadModalProps,
} from '../../AppGroup.types'
import { ReactComponent as MechanicalIcon } from '../../../../assets/img/ic-mechanical-operation.svg'
import { ReactComponent as InfoIcon } from '../../../../assets/icons/info-filled.svg'
import { ReactComponent as Close } from '../../../../assets/icons/ic-close.svg'
import { ReactComponent as DropdownIcon } from '../../../../assets/icons/ic-arrow-left.svg'
import { getMockRestartWorkloadRotatePods } from './service'
import { APP_DETAILS_TEXT } from './constants'
import './envOverview.scss'
import { RestartStatusListDrawer } from './RestartStatusListDrawer'

export const RestartWorkloadModal = ({ selectedAppIds, envName, envId }: RestartWorkloadModalProps) => {
    const [bulkRotatePodsMap, setBulkRotatePodsMap] = useState<Record<number, BulkRotatePodsMetaData>>({})
    const [expandedAppIds, setExpandedAppIds] = useState<number[]>([])
    const [restartLoader, setRestartLoader] = useState<boolean>(false)
    const [selectAllApps, setSelectAllApps] = useState({
        isChecked: false,
        value: null,
        collapseAll: true,
    })
    const { searchParams } = useSearchString()
    const history = useHistory()
    const [showStatusModal, setShowStatusModal] = useState(false)

    const toggleStatusModal = () => {
        setShowStatusModal((prev) => !prev)
    }

    const closeDrawer = () => {
        const newParams = {
            ...searchParams,
            modal: '',
        }
        history.replace({ search: new URLSearchParams(newParams).toString() })
    }

    const getPodsToRotate = async () => {
        const _bulkRotatePodsMap: Record<number, BulkRotatePodsMetaData> = {}
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        getMockRestartWorkloadRotatePods(selectedAppIds, envId).then((response) => {
            const _restartPodMap = response.result.restartPodMap
            // Iterate over the restartPodMap and create a bulkRotatePodsMap
            Object.keys(_restartPodMap).forEach((appId) => {
                const _resourcesMetaDataMap: ResourcesMetaDataMap = {}

                const appInfoObject: AppInfoMetaDataDTO = _restartPodMap[appId]
                appInfoObject.resourceIdentifiers.forEach((resourceIdentifier: ResourceIdentifierDTO) => {
                    const kindNameKey: string = `${resourceIdentifier.groupVersionKind.Kind}/${resourceIdentifier.name}`
                    const _resourceMetaData: ResourceMetaData = {
                        group: resourceIdentifier.groupVersionKind.Group,
                        kind: resourceIdentifier.groupVersionKind.Kind,
                        version: resourceIdentifier.groupVersionKind.Version,
                        name: resourceIdentifier.name,
                        containsError: resourceIdentifier.containsError,
                        errorMessage: resourceIdentifier.errorMessage,
                        isChecked: false,
                        value: null,
                    }

                    // inserting in the resourceMetaDataMap
                    _resourcesMetaDataMap[kindNameKey] = _resourceMetaData
                })
                const _bulkRotatePodsMetaData: BulkRotatePodsMetaData = {
                    resources: _resourcesMetaDataMap,
                    appName: appInfoObject.appName,
                    isChecked: false,
                    value: null,
                }
                _bulkRotatePodsMap[+appId] = _bulkRotatePodsMetaData
            })
            setBulkRotatePodsMap(_bulkRotatePodsMap)
        })
    }

    useEffect(() => {
        setRestartLoader(true)
        try {
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            getPodsToRotate()
        } catch (err) {
            showError(err)
        } finally {
            setRestartLoader(false)
        }
    }, [])

    const toggleWorkloadCollapse = (appId?: number) => {
        if (expandedAppIds.includes(appId)) {
            setExpandedAppIds(expandedAppIds.filter((id) => id !== appId))
        } else {
            setExpandedAppIds([...expandedAppIds, appId])
        }
    }

    const renderHeaderSection = (): JSX.Element => {
        return (
            <div className="flex dc__content-space dc__border-bottom pt-16 pr-20 pb-16 pl-20">
                <div className="fs-16 fw-6">
                    {` Restart workloads '${selectedAppIds.length} applications' on '${envName}'`}
                </div>
                <Close className="icon-dim-24 cursor" onClick={closeDrawer} />
            </div>
        )
    }

    const toggleAllWorkloads = () => {
        setSelectAllApps({
            ...selectAllApps,
            collapseAll: !selectAllApps.collapseAll,
        })
    }

    const handleWorkloadSelection = (
        appId: number,
        _kindName: string,
        key: APP_DETAILS_TEXT.APP_NAME | APP_DETAILS_TEXT.KIND_NAME | APP_DETAILS_TEXT.ALL,
    ) => {
        const _bulkRotatePodsMap = { ...bulkRotatePodsMap }
        if (key === APP_DETAILS_TEXT.APP_NAME && _bulkRotatePodsMap[appId].appName) {
            _bulkRotatePodsMap[appId].isChecked = _bulkRotatePodsMap[appId].value !== CHECKBOX_VALUE.CHECKED
            _bulkRotatePodsMap[appId].value = _bulkRotatePodsMap[appId].isChecked && CHECKBOX_VALUE.CHECKED

            // handling app level value for checkbox
            Object.keys(_bulkRotatePodsMap[appId].resources).forEach((kindName) => {
                _bulkRotatePodsMap[appId].resources[kindName].isChecked = _bulkRotatePodsMap[appId].isChecked
                _bulkRotatePodsMap[appId].resources[kindName].value = _bulkRotatePodsMap[appId].value
                    ? CHECKBOX_VALUE.CHECKED
                    : null
            })
        }
        if (key === APP_DETAILS_TEXT.KIND_NAME && _bulkRotatePodsMap[appId].resources[_kindName]) {
            // handling resource level value for checkbox
            _bulkRotatePodsMap[appId].resources[_kindName].isChecked =
                !_bulkRotatePodsMap[appId].resources[_kindName].isChecked
            _bulkRotatePodsMap[appId].resources[_kindName].value = _bulkRotatePodsMap[appId].resources[_kindName]
                .isChecked
                ? CHECKBOX_VALUE.CHECKED
                : null
            // handling app level value for checkbox
            // eslint-disable-next-line no-nested-ternary
            _bulkRotatePodsMap[appId].value = Object.values(_bulkRotatePodsMap[appId].resources).every(
                (_resource) => _resource.isChecked,
            )
                ? CHECKBOX_VALUE.CHECKED
                : Object.values(_bulkRotatePodsMap[appId].resources).some((_resource) => _resource.isChecked)
                  ? CHECKBOX_VALUE.INTERMEDIATE
                  : null
            _bulkRotatePodsMap[appId].isChecked =
                _bulkRotatePodsMap[appId].value === CHECKBOX_VALUE.CHECKED ||
                _bulkRotatePodsMap[appId].value === CHECKBOX_VALUE.INTERMEDIATE
        }
        setBulkRotatePodsMap(_bulkRotatePodsMap)
    }

    const renderWorkloadTableHeader = () => (
        <div className="flex dc__content-space pl-16 pr-16">
            <Checkbox
                rootClassName="mt-3 mb-3"
                dataTestId="enforce-policy"
                isChecked={selectAllApps.isChecked}
                value={selectAllApps.value}
                onChange={toggleAllWorkloads}
                onClick={stopPropagation}
                name={APP_DETAILS_TEXT.KIND_NAME}
            />
            <div
                className="flex dc__content-space pt-8 pb-8 fs-12 fw-6 cn-7 dc__border-bottom-n1 w-100"
                onClick={toggleAllWorkloads}
            >
                <div>{APP_DETAILS_TEXT.APPLICATIONS}</div>
                <div className="flex dc__gap-4">
                    {APP_DETAILS_TEXT.EXPAND_ALL}
                    <DropdownIcon className="icon-dim-16 rotate dc__flip-270" />
                </div>
            </div>
        </div>
    )

    const renderWorkloadDetails = (appId: number, appName: string, resources: ResourcesMetaDataMap) => {
        if (!expandedAppIds.includes(appId) || appName !== bulkRotatePodsMap[appId].appName) {
            return null
        }
        if (Object.keys(resources).length === 0) {
            return (
                <div className="dc__border-left cn-7 p-8 ml-8">
                    <div className="dc__border-dashed p-20 flex center bc-n50">
                        <div className="w-300 flex dc__align-center">
                            No workloads found. ‘{appName}’ is not deployed on ‘{envName}’
                        </div>
                    </div>
                </div>
            )
        }

        return (
            <div className="dc__gap-4 pl-8">
                {Object.keys(resources).map((kindName) => {
                    const { isChecked } = resources[kindName]
                    return (
                        <div
                            key={kindName}
                            data-testid="workload-details"
                            className="flex left dc__border-left cursor"
                            onClick={() => handleWorkloadSelection(appId, kindName, APP_DETAILS_TEXT.KIND_NAME)}
                        >
                            <div
                                className={`app-group-kind-name-row p-8 flex left w-100 ml-8 ${isChecked ? 'bc-b50' : 'bcn-0'}`}
                            >
                                <Checkbox
                                    rootClassName="mt-3 mb-3"
                                    dataTestId="enforce-policy"
                                    isChecked={bulkRotatePodsMap[appId].resources[kindName].isChecked}
                                    value={bulkRotatePodsMap[appId].resources[kindName].value}
                                    onChange={noop}
                                    onClick={stopPropagation}
                                    name={APP_DETAILS_TEXT.KIND_NAME}
                                />
                                {kindName}
                            </div>
                        </div>
                    )
                })}
            </div>
        )
    }

    const renderRestartWorkloadModalListItems = () =>
        Object.keys(bulkRotatePodsMap).map((appId) => {
            return (
                <div className="pl-16 pr-16">
                    <div key={appId} className="flex dc__content-space pt-12 pb-12 cursor">
                        <Checkbox
                            rootClassName="mt-3 mb-3"
                            dataTestId="enforce-policy"
                            isChecked={bulkRotatePodsMap[appId].isChecked}
                            value={bulkRotatePodsMap[appId].value}
                            onClick={stopPropagation}
                            name={APP_DETAILS_TEXT.APP_NAME}
                            onChange={() =>
                                handleWorkloadSelection(
                                    +appId,
                                    bulkRotatePodsMap[appId].appName,
                                    APP_DETAILS_TEXT.APP_NAME,
                                )
                            }
                        />
                        <div className="flex dc__content-space w-100" onClick={() => toggleWorkloadCollapse(+appId)}>
                            <span className="fw-6">{bulkRotatePodsMap[appId].appName}</span>
                            <div className="flex dc__gap-4">
                                {Object.keys(bulkRotatePodsMap[appId].resources).length} workload
                                <DropdownIcon className="icon-dim-16 rotate dc__flip-270 rotate" />
                            </div>
                        </div>
                    </div>
                    {renderWorkloadDetails(
                        +appId,
                        bulkRotatePodsMap[appId].appName,
                        bulkRotatePodsMap[appId].resources,
                    )}
                </div>
            )
        })

    const renderRestartWorkloadModalList = () => {
        if (showStatusModal) {
            return <RestartStatusListDrawer bulkRotatePodsMap={bulkRotatePodsMap} />
        }

        return (
            <div className="flexbox-col dc__gap-12">
                {renderWorkloadTableHeader()}
                {renderRestartWorkloadModalListItems()}
            </div>
        )
    }
    const renderFooterSection = () => {
        return (
            <div className="dc__position-abs dc__bottom-12 w-100 pl-20 pr-20 pt-16 pr-16 dc__border-top">
                <div className="flex dc__content-end w-100 dc__align-end dc__gap-12 ">
                    <button
                        type="button"
                        onClick={closeDrawer}
                        className="flex bcn-0 dc__border-radius-4-imp h-36 pl-16 pr-16 pt-8 pb-8 dc__border"
                    >
                        Cancel
                    </button>
                    <ButtonWithLoader
                        rootClassName="cta flex h-36 pl-16 pr-16 pt-8 pb-8 dc__border-radius-4-imp"
                        isLoading={restartLoader}
                        onClick={toggleStatusModal}
                    >
                        {APP_DETAILS_TEXT.RESTART_WORKLOAD}
                    </ButtonWithLoader>
                </div>
            </div>
        )
    }

    return (
        <Drawer onEscape={closeDrawer} position="right" width="800" parentClassName="h-100">
            <div onClick={stopPropagation} className="bcn-0 h-100 cn-9">
                {restartLoader ? (
                    <GenericEmptyState
                        title={`Fetching workload for ${selectedAppIds.length} Applications`}
                        subTitle="Restarting workloads"
                        SvgImage={MechanicalIcon}
                    />
                ) : (
                    <>
                        {renderHeaderSection()}
                        {!showStatusModal && (
                            <InfoColourBar
                                message={APP_DETAILS_TEXT.APP_GROUP_INFO_TEXT}
                                classname="info_bar dc__no-border-radius dc__no-top-border"
                                Icon={InfoIcon}
                            />
                        )}
                        {renderRestartWorkloadModalList()}
                        {renderFooterSection()}
                    </>
                )}
            </div>
        </Drawer>
    )
}
