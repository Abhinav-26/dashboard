import React, { Component, createContext } from 'react'
import { ChangeCIPayloadType, PipelineContext, WorkflowEditProps, WorkflowEditState } from './types'
import { Route, Switch, withRouter, NavLink } from 'react-router-dom'
import { URLS, AppConfigStatus, ViewType, DOCUMENTATION } from '../../config'
import {
    showError,
    Progressing,
    ErrorScreenManager,
    DeleteDialog,
    InfoColourBar,
    ConditionalWrap,
    TippyCustomized,
    TippyTheme,
} from '@devtron-labs/devtron-fe-common-lib'
import { importComponentFromFELibrary } from '../common'
import { toast } from 'react-toastify'
import { Workflow } from './Workflow'
import { getCreateWorkflows } from '../app/details/triggerView/workflow.service'
import { deleteWorkflow } from './service'
import AddWorkflow from './CreateWorkflow'
import CIPipeline from '../CIPipelineN/CIPipeline'
import emptyWorkflow from '../../assets/img/ic-empty-workflow@3x.png'
import LinkedCIPipeline from '../ciPipeline/LinkedCIPipelineEdit'
import LinkedCIPipelineView from '../ciPipeline/LinkedCIPipelineView'
import { ReactComponent as Error } from '../../assets/icons/ic-error-exclamation.svg'
import { ReactComponent as HelpIcon } from '../../assets/icons/ic-help.svg'
import { ReactComponent as CloseIcon } from '../../assets/icons/ic-cross.svg'
import { ReactComponent as ICHelpOutline } from '../../assets/img/ic-help-outline.svg'
import { ReactComponent as ICAddWhite } from '../../assets/icons/ic-add.svg'
import { getHostURLConfiguration, isGitOpsModuleInstalledAndConfigured } from '../../services/service'
import './workflowEditor.scss'
import { PipelineType, WorkflowNodeType } from '../app/details/triggerView/types'
import CDSuccessModal from './CDSuccessModal'
import NoGitOpsConfiguredWarning from './NoGitOpsConfiguredWarning'
import { WebhookDetailsModal } from '../ciPipeline/Webhook/WebhookDetailsModal'
import DeprecatedWarningModal from './DeprecatedWarningModal'
import nojobs from '../../assets/img/empty-joblist@2x.png'
import NewCDPipeline from '../cdPipeline/NewCDPipeline'
import Tippy from '@tippyjs/react'
import { WORKFLOW_EDITOR_HEADER_TIPPY } from './workflowEditor.constants'
import WorkflowOptionsModal from './WorkflowOptionsModal'

export const pipelineContext = createContext<PipelineContext>(null)
const SyncEnvironment = importComponentFromFELibrary('SyncEnvironment')

// TODO: Remove all the checks for envList instead use cachedCDConfigResponse
class WorkflowEdit extends Component<WorkflowEditProps, WorkflowEditState> {
    workflowTimer = null

    constructor(props) {
        super(props)
        this.state = {
            code: 0,
            view: ViewType.LOADING,
            workflows: [],
            appName: '',
            allCINodeMap: new Map(),
            allDeploymentNodeMap: new Map(),
            showDeleteDialog: false,
            showCIMenu: false,
            hostURLConfig: undefined,
            cIMenuPosition: {
                top: 0,
                left: 0,
            },
            workflowId: 0,
            allCINodesMap: undefined,
            showSuccessScreen: false,
            showNoGitOpsWarningPopup: false,
            cdLink: '',
            noGitOpsConfiguration: false,
            showOpenCIPipelineBanner:
                typeof Storage !== 'undefined' && localStorage.getItem('takeMeThereClicked') === '1',
            envToShowWebhookTippy: -1,
            filteredCIPipelines: [],
            envIds: [],
            showWorkflowOptionsModal: false,
            cachedCDConfigResponse: {
                pipelines: [],
                appId: 0,
            },
            blackListedCI: {},
            changeCIPayload: null,
        }
        this.hideWebhookTippy = this.hideWebhookTippy.bind(this)
    }

    componentDidMount() {
        this.getWorkflows()
    }

    componentWillUnmount() {
        this.removeTakeMeThereClickedItem()
        if (this.workflowTimer) {
            clearTimeout(this.workflowTimer)
        }
    }

    componentDidUpdate(prevProps) {
        if (prevProps.filteredEnvIds !== this.props.filteredEnvIds) {
            this.getWorkflows()
        }
    }

    removeTakeMeThereClickedItem = () => {
        if (typeof Storage !== 'undefined' && localStorage.getItem('takeMeThereClicked')) {
            localStorage.removeItem('takeMeThereClicked')
            this.setState({
                showOpenCIPipelineBanner: false,
            })
        }
    }

    getWorkflows = () => {
        this.getHostURLConfig()
        this.checkGitOpsConfiguration()
        getCreateWorkflows(this.props.match.params.appId, this.props.isJobView, this.props.filteredEnvIds)
            .then((result) => {
                const allCINodeMap = new Map()
                const allDeploymentNodeMap = new Map()
                let isDeletionInProgress
                const _envIds = []
                for (const workFlow of result.workflows) {
                    for (const node of workFlow.nodes) {
                        if (node.type === WorkflowNodeType.CI) {
                            allCINodeMap.set(node.id, node)
                        } else if (node.type === WorkflowNodeType.CD) {
                            _envIds.push(node.environmentId)
                            if (
                                node.parentPipelineType === PipelineType.WEBHOOK &&
                                this.state.envToShowWebhookTippy === node.environmentId
                            ) {
                                workFlow.showTippy = true
                            }
                            if (!isDeletionInProgress && node.deploymentAppDeleteRequest) {
                                isDeletionInProgress = true
                            }
                            allDeploymentNodeMap.set(node.id, node)
                        }
                    }
                }
                if (isDeletionInProgress) {
                    this.workflowTimer = setTimeout(this.getWorkflows, 10000)
                }
                this.setState({
                    appName: result.appName,
                    workflows: result.workflows,
                    allCINodeMap: allCINodeMap,
                    allDeploymentNodeMap: allDeploymentNodeMap,
                    view: ViewType.FORM,
                    envToShowWebhookTippy: -1,
                    filteredCIPipelines: result.filteredCIPipelines,
                    envIds: _envIds,
                    cachedCDConfigResponse: result.cachedCDConfigResponse ?? {
                        pipelines: [],
                        appId: 0,
                    },
                    blackListedCI: result.blackListedCI ?? {},
                })
            })
            .catch((errors) => {
                showError(errors)
                this.setState({ view: ViewType.ERROR, code: errors.code })
            })
    }

    getHostURLConfig() {
        getHostURLConfiguration()
            .then((response) => {
                this.setState({ hostURLConfig: response.result })
            })
            .catch((error) => {})
    }

    async checkGitOpsConfiguration(): Promise<void> {
        try {
            const { result } = await isGitOpsModuleInstalledAndConfigured()
            if (result.isInstalled && !result.isConfigured) {
                this.setState({ noGitOpsConfiguration: true })
            }
        } catch (error) {}
    }

    showDeleteDialog = (workflowId: number) => {
        this.setState({ workflowId, showDeleteDialog: true })
    }

    handleChangeCI = (changeCIPayload: ChangeCIPayloadType) => {
        this.setState({ changeCIPayload, showWorkflowOptionsModal: true })
    }

    // TODO: Remove this
    toggleCIMenu = (event) => {
        if (this.props.filteredEnvIds) {
            return
        }
        const { top, left } = event.target.getBoundingClientRect()
        this.setState({
            cIMenuPosition: {
                top: top,
                left: left,
            },
            showCIMenu: !this.state.showCIMenu,
        })
    }

    handleNewPipelineModal = () => {
        if (this.props.filteredEnvIds) {
            return
        }

        // This is meant for newPipeline
        this.setState({ showWorkflowOptionsModal: true, changeCIPayload: null })
    }

    handleCloseWorkflowOptionsModal = () => {
        // Not setting changeCIPayload to null as it is used in the routes as props
        this.setState({ showWorkflowOptionsModal: false })
    }

    deleteWorkflow = (appId?: string, workflowId?: number) => {
        deleteWorkflow(appId || this.props.match.params.appId, workflowId || this.state.workflowId)
            .then((response) => {
                if (response.status.toLowerCase() === 'ok') {
                    this.setState({ showDeleteDialog: false })
                    toast.success('Workflow Deleted')
                    this.getWorkflows()
                    this.props.getWorkflows()
                }
            })
            .catch((errors) => {
                showError(errors)
            })
    }

    handleCISelect = (workflowId: number | string, type: 'EXTERNAL-CI' | 'CI' | 'LINKED-CI' | 'JOB-CI') => {
        let link = `${URLS.APP}/${this.props.match.params.appId}/edit/workflow/${workflowId}`
        switch (type) {
            case 'CI':
                link = `${link}/ci-pipeline/0`
                break
            case 'EXTERNAL-CI':
                link = `${link}/external-ci`
                break
            case 'LINKED-CI':
                link = `${link}/linked-ci`
                break
            case 'JOB-CI':
                link = `${link}/ci-job/0`
                break
        }
        this.props.history.push(link)
    }

    addCIPipeline = (type: 'EXTERNAL-CI' | 'CI' | 'LINKED-CI' | 'JOB-CI', workflowId?: number | string) => {
        this.handleCISelect(workflowId || 0, type)
    }

    addWebhookCD = (workflowId?: number | string) => {
        this.props.history.push(
            `${URLS.APP}/${this.props.match.params.appId}/${URLS.APP_CONFIG}/${URLS.APP_WORKFLOW_CONFIG}/${
                workflowId || 0
            }/${PipelineType.WEBHOOK.toLowerCase()}/0/${URLS.APP_CD_CONFIG}/0/build`,
        )
    }

    addLinkedCD = (workflowId?: number | string) => {
        this.props.history.push(
            `${URLS.APP}/${this.props.match.params.appId}/${URLS.APP_CONFIG}/${URLS.APP_WORKFLOW_CONFIG}/${
                workflowId ?? 0
            }/${URLS.LINKED_CD}/0`,
        )
    }

    handleCDSelect = (
        workflowId: number | string,
        ciPipelineId: number | string,
        parentPipelineType: string,
        parentPipelineId?: number | string,
        isWebhookCD?: boolean,
    ) => {
        const ciURL = isWebhookCD
            ? `${PipelineType.WEBHOOK.toLowerCase()}/0`
            : `${URLS.APP_CI_CONFIG.toLowerCase()}/${ciPipelineId}`
        const LINK = `${URLS.APP}/${this.props.match.params.appId}/${URLS.APP_CONFIG}/${URLS.APP_WORKFLOW_CONFIG}/${workflowId}/${ciURL}/${URLS.APP_CD_CONFIG}/0/build?parentPipelineType=${parentPipelineType}&parentPipelineId=${parentPipelineId}`
        if (this.state.noGitOpsConfiguration) {
            this.setState({
                showNoGitOpsWarningPopup: true,
                cdLink: LINK,
            })
        } else {
            this.props.history.push(LINK)
        }
    }

    openCreateWorkflow = (): string => {
        return `${this.props.match.url}/edit`
    }

    openEditWorkflow = (event, workflowId: number): string => {
        return `${this.props.match.url}/${workflowId}/edit`
    }

    closeAddWorkflow = () => {
        this.props.history.push(
            `${this.props.isJobView ? URLS.JOB : URLS.APP}/${this.props.match.params.appId}/${URLS.APP_CONFIG}/${
                URLS.APP_WORKFLOW_CONFIG
            }`,
        )
        this.props.getWorkflows()
    }

    closePipeline = (
        showSuccessCD?: boolean,
        environmentId?: number,
        environmentName?: string,
        successTitle?: string,
        showWebhookTippy?: boolean,
    ) => {
        const _url = `${this.props.isJobView ? URLS.JOB : URLS.APP}/${this.props.match.params.appId}/${
            URLS.APP_CONFIG
        }/${URLS.APP_WORKFLOW_CONFIG}`
        this.props.history.push(_url)
        if (showSuccessCD) {
            setTimeout(() => {
                this.setState({
                    showSuccessScreen: true,
                    environmentId: environmentId,
                    environmentName: environmentName,
                    successTitle: successTitle,
                })
            }, 700)
        }

        //update isCDpipeline in AppCompose
        if (!this.props.isCDPipeline) {
            this.props.respondOnSuccess()
        }
        if (showWebhookTippy) {
            this.setState({ envToShowWebhookTippy: environmentId })
        }
        this.setState({ changeCIPayload: null })
    }

    closeSyncEnvironment = () => {
        // Its going to be there in APP only
        this.props.history.push(
            `${URLS.APP}/${this.props.match.params.appId}/${URLS.APP_CONFIG}/${URLS.APP_WORKFLOW_CONFIG}`,
        )
        this.setState({ changeCIPayload: null })
    }

    hideNoGitOpsWarning = (isContinueWithHelm: boolean) => {
        this.setState({ showNoGitOpsWarningPopup: false })
        if (isContinueWithHelm) {
            this.props.history.push(this.state.cdLink)
        }
    }

    renderDeleteDialog = () => {
        const wf = this.state.workflows.find((wf) => wf.id === this.state.workflowId)
        if (this.state.showDeleteDialog) {
            return (
                <DeleteDialog
                    title={`Delete '${wf?.name}' ?`}
                    description={`Are you sure you want to delete this workflow from '${this.state.appName}'?`}
                    closeDelete={() => this.setState({ showDeleteDialog: false })}
                    delete={this.deleteWorkflow}
                />
            )
        }
    }

    closeSuccessPopup = () => {
        this.setState({ showSuccessScreen: false })
    }

    getLen = (): number => {
        const ciNode = this.state.allCINodeMap.get(this.props.match.params.ciPipelineId)
        return ciNode?.downstreams?.length || 0
    }

    //TODO: dynamic routes for ci-pipeline
    renderRouter() {
        return (
            <Switch>
                <Route
                    path={`${this.props.match.path}/edit`}
                    render={({ location, history, match }: { location: any; history: any; match: any }) => {
                        return (
                            <AddWorkflow
                                match={match}
                                history={history}
                                location={location}
                                name={this.state.appName}
                                onClose={this.closeAddWorkflow}
                                getWorkflows={this.getWorkflows}
                            />
                        )
                    }}
                />
                {!this.props.isJobView && (
                    <Route
                        path={[URLS.APP_LINKED_CI_CONFIG, URLS.APP_CI_CONFIG, PipelineType.WEBHOOK].map(
                            (pipeline) =>
                                `${this.props.match.path}/${pipeline}/:ciPipelineId/cd-pipeline/:cdPipelineId`,
                        )}
                        render={({ location, match }: { location: any; match: any }) => {
                            return (
                                <NewCDPipeline
                                    match={match}
                                    location={location}
                                    appName={this.state.appName}
                                    close={this.closePipeline}
                                    getWorkflows={this.getWorkflows}
                                    refreshParentWorkflows={this.props.getWorkflows}
                                    envIds={this.state.envIds}
                                    isLastNode={
                                        this.state.allDeploymentNodeMap.get(match.params.cdPipelineId)?.['isLast']
                                    }
                                />
                            )
                        }}
                    />
                )}
                <Route
                    path={[URLS.APP_JOB_CI_CONFIG, URLS.APP_CI_CONFIG].map(
                        (ciPipeline) => `${this.props.match.path}/${ciPipeline}/:ciPipelineId`,
                    )}
                    render={({ location, match }: { location: any; match: any }) => {
                        let isJobCI = false
                        if (location.pathname.indexOf(URLS.APP_JOB_CI_CONFIG) >= 0) {
                            isJobCI = true
                        }
                        return (
                            <CIPipeline
                                appName={this.state.appName}
                                connectCDPipelines={this.getLen()}
                                close={this.closePipeline}
                                getWorkflows={this.getWorkflows}
                                deleteWorkflow={this.deleteWorkflow}
                                isJobView={this.props.isJobView}
                                isJobCI={isJobCI}
                                changeCIPayload={this.state.changeCIPayload}
                            />
                        )
                    }}
                />
                <Route path={`${this.props.match.path}/deprecated-warning`}>
                    <DeprecatedWarningModal closePopup={this.closePipeline} />
                </Route>
                {!this.props.isJobView && [
                    <Route
                        key={`${this.props.match.path}/webhook/`}
                        path={`${this.props.match.path}/webhook/:webhookId`}
                    >
                        <WebhookDetailsModal close={this.closePipeline} />
                    </Route>,
                    <Route
                        key={`${this.props.match.path}/linked-ci/`}
                        path={`${this.props.match.path}/linked-ci/:ciPipelineId`}
                        render={({ location, history, match }: { location: any; history: any; match: any }) => {
                            return (
                                <LinkedCIPipelineView
                                    match={match}
                                    history={history}
                                    location={location}
                                    appName={this.state.appName}
                                    connectCDPipelines={this.getLen()}
                                    close={this.closePipeline}
                                    getWorkflows={this.getWorkflows}
                                    deleteWorkflow={this.deleteWorkflow}
                                />
                            )
                        }}
                    />,
                    <Route
                        key={`${this.props.match.path}/linked-ci`}
                        path={`${this.props.match.path}/linked-ci`}
                        render={({ location, history, match }: { location: any; history: any; match: any }) => {
                            return (
                                <LinkedCIPipeline
                                    match={match}
                                    history={history}
                                    location={location}
                                    appName={this.state.appName}
                                    connectCDPipelines={0}
                                    close={this.closePipeline}
                                    getWorkflows={this.getWorkflows}
                                    changeCIPayload={this.state.changeCIPayload}
                                />
                            )
                        }}
                    />,

                    ...(SyncEnvironment
                        ? [
                              <Route
                                  key={`${this.props.match.path}/${URLS.LINKED_CD}/`}
                                  path={`${this.props.match.path}/${URLS.LINKED_CD}/`}
                              >
                                  <SyncEnvironment
                                      closeModal={this.closeSyncEnvironment}
                                      appId={this.props.match.params.appId}
                                      cdPipelines={this.state.cachedCDConfigResponse.pipelines ?? []}
                                      blackListedIds={this.state.blackListedCI ?? {}}
                                  />
                              </Route>,
                          ]
                        : []),
                ]}
            </Switch>
        )
    }

    renderNewBuildPipelineButton() {
        return (
            <ConditionalWrap
                condition={!!this.props.filteredEnvIds}
                wrap={(children) => (
                    <Tippy
                        className="default-tt w-200"
                        arrow={false}
                        placement="top"
                        content="Cannot add new workflow or deployment pipelines when environment filter is applied."
                    >
                        {children}
                    </Tippy>
                )}
            >
                <button
                    type="button"
                    className={`cta flexbox dc__align-items-center pt-6 pr-10 pb-6 pl-8 dc__gap-6 h-32 ${
                        this.props.filteredEnvIds ? 'dc__disabled' : ''
                    }`}
                    data-testid="new-workflow-button"
                    onClick={this.handleNewPipelineModal}
                >
                    <div className="flexbox dc__content-space dc__align-items-center h-20">
                        <ICAddWhite className="icon-dim-18 mr-5" />
                        <p className="m-0 fs-13 lh-20 cn-0">New workflow</p>
                    </div>
                </button>
            </ConditionalWrap>
        )
    }

    openCreateModal = () => {
        this.props.history.push(`${URLS.JOB}/${this.props.match.params.appId}/edit/workflow/0/ci-pipeline/0`)
    }

    renderNewJobPipelineButton = () => {
        return (
            <button
                type="button"
                className="cta flexbox dc__align-items-center pt-6 pr-10 pb-6 pl-8 dc__gap-6 h-32"
                data-testid="job-pipeline-button"
                onClick={this.openCreateModal}
            >
                <div className="flexbox dc__content-space dc__align-items-center h-20">
                    <ICAddWhite className="icon-dim-18 mr-5" />
                    <p className="m-0 fs-13 lh-20 cn-0">Job pipeline</p>
                </div>
            </button>
        )
    }

    // TODO: Enhance this function as well
    renderEmptyState() {
        return (
            <div className="create-here">
                {this.props.isJobView ? (
                    <img src={nojobs} width="250" height="200" alt="create-job-workflow" />
                ) : (
                    <img src={emptyWorkflow} alt="create-app-workflow" height="200" />
                )}
                <h1 className="form__title form__title--workflow-editor">Workflows</h1>
                <p className="form__subtitle form__subtitle--workflow-editor">
                    {this.props.isJobView
                        ? 'Configure job pipelines to be executed. Pipelines can be configured to be triggered automatically based on code change or time.'
                        : 'Workflows consist of pipelines from build to deployment stages of an application.'}
                    <br />
                    {!this.props.isJobView && (
                        <a
                            className="dc__link"
                            data-testid="learn-more-about-creating-workflow-link"
                            href={DOCUMENTATION.APP_CREATE_WORKFLOW}
                            target="blank"
                            rel="noreferrer noopener"
                        >
                            Learn about creating workflows
                        </a>
                    )}
                </p>
                {this.props.isJobView ? this.renderNewJobPipelineButton() : this.renderNewBuildPipelineButton()}
            </div>
        )
    }

    renderHostErrorMessage() {
        if (!this.state.hostURLConfig || this.state.hostURLConfig.value !== window.location.origin) {
            return (
                <div className="br-4 bw-1 er-2 pt-10 pb-10 pl-16 pr-16 bcr-1 mb-16 flex left">
                    <Error className="icon-dim-20 mr-8" />
                    <div className="cn-9 fs-13">
                        Host url is not configured or is incorrect. Reach out to your DevOps team (super-admin) to
                        &nbsp;
                        <NavLink className="dc__link-bold" to={URLS.GLOBAL_CONFIG_HOST_URL}>
                            Review and update
                        </NavLink>
                    </div>
                </div>
            )
        }
    }

    hideWebhookTippy() {
        const _wf = this.state.workflows.map((wf) => {
            return { ...wf, showTippy: false }
        })
        this.setState({ workflows: _wf })
    }

    renderWorkflows() {
        return this.state.workflows.map((wf) => {
            return (
                <Workflow
                    id={wf.id}
                    key={wf.id}
                    name={wf.name}
                    startX={wf.startX}
                    startY={wf.startY}
                    width={wf.width}
                    height={wf.height}
                    nodes={wf.nodes}
                    history={this.props.history}
                    location={this.props.location}
                    match={this.props.match}
                    handleCDSelect={this.handleCDSelect}
                    handleCISelect={this.handleCISelect}
                    openEditWorkflow={this.openEditWorkflow}
                    showDeleteDialog={this.showDeleteDialog}
                    addCIPipeline={this.addCIPipeline}
                    addWebhookCD={this.addWebhookCD}
                    showWebhookTippy={wf.showTippy}
                    hideWebhookTippy={this.hideWebhookTippy}
                    isJobView={this.props.isJobView}
                    envList={this.props.envList}
                    filteredCIPipelines={this.state.filteredCIPipelines}
                    addNewPipelineBlocked={!!this.props.filteredEnvIds}
                    handleChangeCI={this.handleChangeCI}
                />
            )
        })
    }

    renderOpenCIPipelineBanner = () => {
        return (
            <div className="open-cipipeline-banner dc__position-abs">
                <InfoColourBar
                    classname="bcv-5 cn-9 lh-20"
                    message={
                        <div className="flex fs-13 fw-4 lh-20 cn-0">
                            Open a build pipeline to override
                            <CloseIcon
                                className="icon-dim-12 fcn-0 ml-8 cursor"
                                onClick={this.removeTakeMeThereClickedItem}
                            />
                        </div>
                    }
                    Icon={HelpIcon}
                    iconSize={20}
                    iconClass="fcn-0"
                />
            </div>
        )
    }

    render() {
        if (this.props.configStatus === AppConfigStatus.LOADING || this.state.view === ViewType.LOADING) {
            return <Progressing pageLoader />
        } else if (this.state.view === ViewType.ERROR) {
            return (
                <div className="dc__loading-wrapper">
                    <ErrorScreenManager code={this.state.code} />
                </div>
            )
        } else if (
            this.state.view === ViewType.FORM &&
            this.props.configStatus >= AppConfigStatus.LOADING &&
            !this.state.workflows.length
        ) {
            return (
                <>
                    {this.renderRouter()}
                    <div className="mt-16 ml-20 mr-20 mb-16">{this.renderHostErrorMessage()}</div>
                    {this.renderEmptyState()}
                    {this.state.showSuccessScreen && (
                        <CDSuccessModal
                            appId={this.props.match.params.appId}
                            envId={this.state.environmentId}
                            envName={this.state.environmentName}
                            closeSuccessPopup={this.closeSuccessPopup}
                            successTitle={this.state.successTitle}
                        />
                    )}
                    {this.state.showWorkflowOptionsModal && (
                        <WorkflowOptionsModal
                            handleCloseWorkflowOptionsModal={this.handleCloseWorkflowOptionsModal}
                            addWebhookCD={this.addWebhookCD}
                            addCIPipeline={this.addCIPipeline}
                            addLinkedCD={this.addLinkedCD}
                            showLinkedCDSource={this.state.cachedCDConfigResponse?.pipelines?.length > 0}
                            changeCIPayload={this.state.changeCIPayload}
                        />
                    )}
                </>
            )
        } else {
            return (
                <div className="workflow-editor bcn-0" data-testid="workflow-editor-page">
                    <div className="flex dc__content-space pb-16">
                        <div className="flex dc__gap-8 dc__content-start">
                            <h1 className="m-0 cn-9 fs-16 fw-6">Workflow Editor</h1>

                            <TippyCustomized
                                theme={TippyTheme.white}
                                className="w-300 h-100 dc__align-left"
                                placement="right"
                                Icon={HelpIcon}
                                iconClass="fcv-5"
                                heading={WORKFLOW_EDITOR_HEADER_TIPPY.HEADING}
                                infoText={
                                    this.props.isJobView
                                        ? WORKFLOW_EDITOR_HEADER_TIPPY.INFO_TEXT.JOB_VIEW
                                        : WORKFLOW_EDITOR_HEADER_TIPPY.INFO_TEXT.DEFAULT
                                }
                                showCloseButton
                                trigger="click"
                                interactive
                                documentationLink={
                                    this.props.isJobView
                                        ? DOCUMENTATION.JOB_WORKFLOW_EDITOR
                                        : DOCUMENTATION.APP_CREATE_WORKFLOW
                                }
                                documentationLinkText={WORKFLOW_EDITOR_HEADER_TIPPY.DOCUMENTATION_LINK_TEXT}
                            >
                                <button
                                    className="p-0 h-20 dc__no-background dc__no-border dc__outline-none-imp flex"
                                    type="button"
                                >
                                    <ICHelpOutline className="icon-dim-16" />
                                </button>
                            </TippyCustomized>
                        </div>

                        {this.props.isJobView ? this.renderNewJobPipelineButton() : this.renderNewBuildPipelineButton()}
                    </div>

                    {this.renderRouter()}
                    {this.renderHostErrorMessage()}
                    {this.renderWorkflows()}
                    {this.renderDeleteDialog()}
                    {this.state.showSuccessScreen && (
                        <CDSuccessModal
                            appId={this.props.match.params.appId}
                            envId={this.state.environmentId}
                            envName={this.state.environmentName}
                            closeSuccessPopup={this.closeSuccessPopup}
                            successTitle={this.state.successTitle}
                        />
                    )}
                    {this.state.showNoGitOpsWarningPopup && (
                        <NoGitOpsConfiguredWarning closePopup={this.hideNoGitOpsWarning} />
                    )}

                    {this.state.showWorkflowOptionsModal && (
                        <WorkflowOptionsModal
                            handleCloseWorkflowOptionsModal={this.handleCloseWorkflowOptionsModal}
                            addWebhookCD={this.addWebhookCD}
                            addCIPipeline={this.addCIPipeline}
                            addLinkedCD={this.addLinkedCD}
                            showLinkedCDSource={this.state.cachedCDConfigResponse?.pipelines?.length > 0}
                            changeCIPayload={this.state.changeCIPayload}
                        />
                    )}
                    {this.state.showOpenCIPipelineBanner && this.renderOpenCIPipelineBanner()}
                </div>
            )
        }
    }
}

export default withRouter(WorkflowEdit)
