import React, { useEffect, useState } from 'react'
import './appDetails.scss'
import { useLocation, useParams } from 'react-router'
import { AppStreamData, AppType } from './appDetails.type'
import IndexStore from './index.store'
import EnvironmentStatusComponent from './sourceInfo/environmentStatus/EnvironmentStatus.component'
import EnvironmentSelectorComponent from './sourceInfo/EnvironmentSelector.component'
import SyncErrorComponent from './SyncError.component'
import { useEventSource } from '../../common'
import { AppLevelExternalLinks } from '../../externalLinks/ExternalLinks.component'
import NodeTreeDetailTab from './NodeTreeDetailTab'
import { ExternalLink, OptionTypeWithIcon } from '../../externalLinks/ExternalLinks.type'
import { getSaveTelemetry } from './appDetails.api'
import { DEFAULT_STATUS, DEPLOYMENT_STATUS_QUERY_PARAM } from '../../../config'
import {
    DeploymentStatusDetailsBreakdownDataType,
    DeploymentStatusDetailsType,
} from '../../app/details/appDetails/appDetails.type'
import { processDeploymentStatusDetailsData } from '../../app/details/appDetails/utils'
import { getDeploymentStatusDetail } from '../../app/details/appDetails/appDetails.service'
import DeploymentStatusDetailModal from '../../app/details/appDetails/DeploymentStatusDetailModal'

const AppDetailsComponent = ({
    externalLinks,
    monitoringTools,
    isExternalApp,
    _init,
    isPollingRequired = true,
}: {
    externalLinks: ExternalLink[]
    monitoringTools: OptionTypeWithIcon[]
    isExternalApp: boolean
    _init?: () => void
    isPollingRequired?: boolean
}) => {
    const params = useParams<{ appId: string; envId: string; nodeType: string }>()
    const [streamData, setStreamData] = useState<AppStreamData>(null)
    const appDetails = IndexStore.getAppDetails()
    const Host = process.env.REACT_APP_ORCHESTRATOR_ROOT
    const [pollingIntervalID, setPollingIntervalID] = useState(null)
    const location = useLocation()
    const [deploymentStatusDetailsBreakdownData, setDeploymentStatusDetailsBreakdownData] =
        useState<DeploymentStatusDetailsBreakdownDataType>({
            ...processDeploymentStatusDetailsData(),
            deploymentStatus: DEFAULT_STATUS,
            deploymentStatusText: DEFAULT_STATUS,
        })
    let deploymentStatusTimer = null

    const clearDeploymentStatusTimer = (): void => {
        if (deploymentStatusTimer) {
            clearTimeout(deploymentStatusTimer)
        }
    }

    async function callAppDetailsAPI() {
        try {
            getDeploymentStatusDetail('34', '1').then((res) => {
                setDeploymentStatusDetailsBreakdownData(processDeploymentStatusDetailsData(res.result))
            })
        } catch (error) {}
    }

    // useInterval(polling, interval);
    useEffect(() => {
        if (isPollingRequired) {
            callAppDetailsAPI()
            const intervalID = setInterval(callAppDetailsAPI, 30000)
            setPollingIntervalID(intervalID)
        } else {
            clearPollingInterval()
        }
    }, [isPollingRequired])

    useEffect(() => {
        return () => {
            clearPollingInterval()
        }
    }, [pollingIntervalID])

    function clearPollingInterval() {
        if (pollingIntervalID) {
            clearInterval(pollingIntervalID)
        }
    }
    useEffect(() => {
        return () => {
            clearDeploymentStatusTimer()
        }
    }, [])

    useEffect(() => {
        if (appDetails?.appType === AppType.EXTERNAL_HELM_CHART && params.appId) {
            getSaveTelemetry(params.appId)
        }
    }, [])

    const getDeploymentDetailStepsData = (): void => {
        getDeploymentStatusDetail(params.appId, params.envId).then((deploymentStatusDetailRes) => {
            processDeploymentStatusData(deploymentStatusDetailRes.result)
        })
    }

    const processDeploymentStatusData = (deploymentStatusDetailRes: DeploymentStatusDetailsType): void => {
        const processedDeploymentStatusDetailsData = processDeploymentStatusDetailsData(deploymentStatusDetailRes)
        clearDeploymentStatusTimer()
        if (processedDeploymentStatusDetailsData.deploymentStatus === 'inprogress') {
            deploymentStatusTimer = setTimeout(() => {
                getDeploymentDetailStepsData()
            }, 10000)
        }
        setDeploymentStatusDetailsBreakdownData(processedDeploymentStatusDetailsData)
    }

    // if app type not of EA, then call stream API
    const syncSSE = useEventSource(
        `${Host}/api/v1/applications/stream?name=${appDetails?.appName}-${appDetails?.environmentName}`,
        [params.appId, params.envId],
        !!appDetails?.appName &&
            !!appDetails?.environmentName &&
            appDetails?.appType?.toString() != AppType.EXTERNAL_HELM_CHART.toString(),
        (event) => setStreamData(JSON.parse(event.data)),
    )

    return (
        <div className="helm-details">
            <div>
                <EnvironmentSelectorComponent isExternalApp={isExternalApp} _init={_init} />
                {!appDetails.deploymentAppDeleteRequest && (
                    <EnvironmentStatusComponent
                        appStreamData={streamData}
                        deploymentStatusDetailsBreakdownData={deploymentStatusDetailsBreakdownData}
                    />
                )}
            </div>

            <SyncErrorComponent appStreamData={streamData} />
            {!appDetails.deploymentAppDeleteRequest && (
                <AppLevelExternalLinks
                    helmAppDetails={appDetails}
                    externalLinks={externalLinks}
                    monitoringTools={monitoringTools}
                />
            )}
            <NodeTreeDetailTab
                appDetails={appDetails}
                externalLinks={externalLinks}
                monitoringTools={monitoringTools}
            />
             {location.search.includes(DEPLOYMENT_STATUS_QUERY_PARAM) && (
                <DeploymentStatusDetailModal
                    appName={appDetails.appName}
                    environmentName={appDetails.environmentName}
                    streamData={streamData}
                    deploymentStatusDetailsBreakdownData={deploymentStatusDetailsBreakdownData}
                />
            )}
        </div>
    )
}

export default AppDetailsComponent
