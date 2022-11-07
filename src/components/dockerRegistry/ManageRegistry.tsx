import React, { useState } from 'react'
import { ReactComponent as Question } from '../../assets/icons/ic-help-outline.svg'
import { ReactComponent as Close } from '../../assets/icons/ic-cross.svg'
import { ReactComponent as Bulb } from '../../assets/icons/ic-slant-bulb.svg'
import { ReactComponent as Check } from '../../assets/icons/misc/checkGreen.svg'
import { ReactComponent as Document } from '../../assets/icons/ic-document.svg'
import { ReactComponent as Add } from '../../assets/icons/ic-add.svg'
import { ReactComponent as Edit } from '../../assets/icons/ic-pencil.svg'
import error from '../../assets/icons/misc/errorInfo.svg'
import Select, { components } from 'react-select'
import { ClearIndicator, multiSelectStyles, MultiValueRemove, Option, RadioGroup } from '../common'
import InfoColourBar from '../common/infocolourBar/InfoColourbar'
import { ReactComponent as Warn } from '../../assets/icons/ic-warning.svg'
import { ReactComponent as DropDownIcon } from '../../assets/icons/appstatus/ic-chevron-down.svg'
import { CredentialType, ManageRegistryType } from './dockerType'
import { ReactComponent as HelpIcon } from '../../assets/icons/ic-help.svg'
import TippyWhite from '../common/TippyWhite'

function ManageRegistry({
    clusterOption,
    blackList,
    setBlackList,
    whiteList,
    setWhiteList,
    blackListEnabled,
    setBlackListEnabled,
    credentialsType,
    setCredentialType,
    credentialValue,
    setCredentialValue,
    onClickHideManageModal,
    appliedClusterList,
    ignoredClusterList,
    customCredential,
    setCustomCredential,
    setErrorValidation,
    errorValidation,
}: ManageRegistryType) {
    const [showAlertBar, setAlertBar] = useState<boolean>(false)

    const toggleBlackListEnabled = () => {
        setBlackListEnabled(!blackListEnabled)
    }
    const onClickAlertEditConfirmation = (): void => {
        if (whiteList.length > 0) {
            setWhiteList([])
        }
        if (blackList.length > 0) {
            setBlackList([])
        }
        toggleBlackListEnabled()
        onClickHideAlertInfo()
    }

    const onClickShowAlertInfo = () => {
        setAlertBar(true)
    }

    const onClickHideAlertInfo = (): void => {
        setAlertBar(false)
    }

    const getPlaceholder = (): string => {
        console.log(blackList, whiteList)
        const isWhiteList = whiteList.length > 0
        if ((whiteList.length === 0 && blackList.length === clusterOption.length ) || (blackList.length === 0 && whiteList.length === clusterOption.length)) {
            return 'None'
        } else if (isWhiteList) {
            return `Cluster except ${appliedClusterList}`
        } else {
            return `All Cluster except ${ignoredClusterList}`
        }
    }

    const renderActionButton = (): JSX.Element => {
        return <Close className="cursor icon-dim-16" onClick={onClickHideAlertInfo} />
    }

    const renderAlertMessage = () => {
        return (
            <>
                If you want to edit this, {blackListEnabled ? 'above' : 'below'} selection will not be applicable.
                <span className="cb-5 cursor ml-4 fw-6" onClick={onClickAlertEditConfirmation}>
                    Confirm to edit
                </span>
            </>
        )
    }

    const renderEditAlert = (): JSX.Element => {
        return (
            <InfoColourBar
                classname="warn"
                Icon={Warn}
                message={renderAlertMessage()}
                iconClass="warning-icon"
                renderActionButton={renderActionButton}
            />
        )
    }

    const renderNoSelectionView = (): JSX.Element => {
        return (
            <div className="flex dc__content-space en-2 bw-1 bcn-1 br-4 pl-10 pr-10 pt-8 pb-8">
                <div className="bcn-1 cursor-not-allowed">{getPlaceholder()}</div>
                <Edit className="cursor icon-dim-16" onClick={onClickShowAlertInfo} />
            </div>
        )
    }

    const renderNotDefinedView = (key: string): JSX.Element => {
        return (
            <div className="flex dc__content-space en-2 bw-1 bcn-1 br-4 pl-10 pr-10 pt-8 pb-8">
                <div className="bcn-1 cursor-not-allowed">Not defined</div>
                <Edit className="cursor icon-dim-16" onClick={toggleBlackListEnabled} />
            </div>
        )
    }

    const MultiValueChipContainer = ({ validator, ...props }) => {
        const { children, data, innerProps, selectProps } = props
        const { label, value } = data
        if (props.selectProps.value.length === props.selectProps.options.length && value !== '-1') {
            return null
        }
        return (
            <components.MultiValueContainer {...{ data, innerProps, selectProps }}>
                <div className={`flex fs-12 pl-4 pr-4`}>
                    <div className="cn-9">{label}</div>
                </div>
                {children[1]}
            </components.MultiValueContainer>
        )
    }

    const onBlackListClusterSelection = (_selectedOption, ...args) => {
        setBlackList((_selectedOption || []) as any)
        const areAllOptionsSelected = _selectedOption.findIndex((option) => option.value === '-1') !== -1
        if (args[0].action === 'remove-value' && args[0].removedValue.value === '-1') {
            setBlackList([])
        } else if (
            (args[0].action === 'select-option' && args[0].option.value === '-1') ||
            (!areAllOptionsSelected && _selectedOption.length === clusterOption.length - 1)
        ) {
            setBlackList(clusterOption)
        } else if (areAllOptionsSelected) {
            setBlackList(_selectedOption.filter((option) => option.value !== '-1'))
        }
    }

    const onWhiteListClusterSelection = (_selectedOption, ...args) => {
        setWhiteList((_selectedOption || []) as any)
        const areAllOptionsSelected = _selectedOption.findIndex((option) => option.value === '-1') !== -1
        if (args[0].action === 'remove-value' && args[0].removedValue.value === '-1') {
            setWhiteList([])
        } else if (
            (args[0].action === 'select-option' && args[0].option.value === '-1') ||
            (!areAllOptionsSelected && _selectedOption.length === clusterOption.length - 1)
        ) {
            setWhiteList(clusterOption)
        } else if (areAllOptionsSelected) {
            setWhiteList(_selectedOption.filter((option) => option.value !== '-1'))
        }
    }

    const renderIgnoredCluster = (): JSX.Element => {
        if (whiteList.length > 0) {
            return renderNoSelectionView()
        } else if (whiteList.length === 0 && !blackListEnabled) {
            return renderNotDefinedView('blacklist')
        } else {
            return (
                <Select
                    isDisabled={whiteList.length > 0}
                    placeholder= 'Select cluster'
                    components={{
                        MultiValueContainer: ({ ...props }) => <MultiValueChipContainer {...props} validator={null} />,
                        DropdownIndicator: null,
                        ClearIndicator,
                        MultiValueRemove,
                        Option,
                    }}
                    styles={{
                        ...multiSelectStyles,
                        multiValue: (base) => ({
                            ...base,
                            border: `1px solid var(--N200)`,
                            borderRadius: `4px`,
                            background: 'white',
                            height: '30px',
                            margin: '0 8px 0 0',
                            padding: '1px',
                        }),
                    }}
                    closeMenuOnSelect={false}
                    isMulti
                    name="blacklist"
                    options={clusterOption}
                    hideSelectedOptions={false}
                    value={blackList}
                    onChange={(selected, { ...args }) => onBlackListClusterSelection(selected, { ...args })}
                />
            )
        }
    }

    const renderAppliedCluster = (): JSX.Element => {
        if (blackList.length > 0) {
            return renderNoSelectionView()
        } else if (blackList.length === 0 && blackListEnabled) {
            return renderNotDefinedView('whitelist')
        } else if (blackList.length === 0) {
            return (
                <Select
                    components={{
                        MultiValueContainer: ({ ...props }) => <MultiValueChipContainer {...props} validator={null} />,
                        DropdownIndicator: null,
                        ClearIndicator,
                        MultiValueRemove,
                        Option,
                    }}
                    placeholder= 'Select cluster'
                    isDisabled={blackList.length > 0}
                    styles={{
                        ...multiSelectStyles,
                        multiValue: (base) => ({
                            ...base,
                            border: `1px solid var(--N200)`,
                            borderRadius: `4px`,
                            background: 'white',
                            height: '30px',
                            margin: '0 8px 0 0',
                            padding: '1px',
                        }),
                    }}
                    closeMenuOnSelect={false}
                    isMulti
                    name="whitelist"
                    options={clusterOption}
                    hideSelectedOptions={false}
                    value={whiteList}
                    onChange={(selected, { ...args }) => onWhiteListClusterSelection(selected, { ...args })}
                />
            )
        }
    }

    const onHandleCredentialTypeChange = (e) => {
        setCredentialType(e.target.value)
    }

    const onClickSpecifyImagePullSecret = (e) => {
        if (credentialsType === CredentialType.NAME) {
            setCredentialValue(e.target.value)
            if (!e.target.value) {
                setErrorValidation(true)
                return null
            } else {
                setErrorValidation(false)
            }
        } else {
            setCustomCredential({
                ...customCredential,
                [e.target.name]: e.target.value,
            })
        }
    }

    return (
        <div className="en-2 bw-1 br-4 fs-13 mb-20">
            <div
                className="p-16 dc__border-bottom flex dc__content-space"
                style={{ backgroundColor: 'var(--N50)' }}
                onClick={onClickHideManageModal}
            >
                <div className="flex left">
                    <div className="fw-6">Manage access of registry credentials</div>
                    <TippyWhite
                                className="w-332"
                                placement="top"
                                Icon={HelpIcon}
                                iconClass="fcv-5"
                                heading="Manage access of registry credentials"
                                infoText="Clusters need permission to pull container image from private repository in
                                            the registry. You can control which clusters have access to the pull image
                                            from private repositories.
                                        "
                                showCloseButton={true}
                                trigger="click"
                                interactive={true}
                            >
                                <Question className="icon-dim-16 fcn-6 ml-4 cursor" />
                            </TippyWhite>
                </div>
                <DropDownIcon className="icon-dim-24 rotate pointer" />
            </div>
            <div className="p-16">
                <div className="flex left cr-5 mb-6">
                    <Close className="icon-dim-16 fcr-5 mr-4" /> Do not inject credentials to clusters
                </div>
                {showAlertBar && !blackListEnabled && whiteList.length > 0 ? renderEditAlert() : renderIgnoredCluster()}

                <div className="flex left cg-5 mt-16 mb-6">
                    <Check className="icon-dim-16 mr-4" /> Auto-inject credentials to clusters
                </div>

                {showAlertBar && blackListEnabled && blackList.length > 0 ? renderEditAlert() : renderAppliedCluster()}

                <div className="dc__border-top mb-20 mt-20" />

                <div className="flex left mb-16 cn-7">
                    <Bulb className="icon-dim-16 mr-8" />
                    Define credentials
                </div>
                <div className="flex left mb-16">
                    <RadioGroup
                        className="gui-yaml-switch"
                        name="credentials"
                        initialTab={
                            credentialsType === CredentialType.SAME_AS_REGISTRY
                                ? CredentialType.SAME_AS_REGISTRY
                                : credentialsType === CredentialType.NAME
                                ? CredentialType.NAME
                                : CredentialType.CUSTOM_CREDENTIAL=''
                        }
                        disabled={false}
                        onChange={onHandleCredentialTypeChange}
                    >
                        <RadioGroup.Radio
                            value={CredentialType.SAME_AS_REGISTRY}
                            canSelect={credentialValue !== CredentialType.SAME_AS_REGISTRY}
                        >
                            <Document className="icon-dim-12 fcn-7 mr-8" />
                            Same as registry credentials
                        </RadioGroup.Radio>
                        <RadioGroup.Radio
                            value={CredentialType.NAME}
                            canSelect={credentialValue !== CredentialType.NAME}
                        >
                            <Bulb className="icon-dim-12 mr-8" /> Specify Image Pull Secret
                        </RadioGroup.Radio>
                        <RadioGroup.Radio
                            value={CredentialType.CUSTOM_CREDENTIAL}
                            canSelect={credentialValue !== CredentialType.CUSTOM_CREDENTIAL}
                        >
                            <Add className="icon-dim-16 fcn-7 mr-8" />
                            Create Image Pull secret
                        </RadioGroup.Radio>
                    </RadioGroup>
                </div>
                {credentialsType === CredentialType.SAME_AS_REGISTRY && (
                    <div className="cn-7">
                        Registry credentials will be auto injected to have accessed by selected clusters
                    </div>
                )}
                {credentialsType === CredentialType.NAME && (
                    <>
                        <div>
                            <input
                                tabIndex={2}
                                placeholder="Name"
                                className="form__input"
                                name={CredentialType.NAME}
                                value={credentialValue}
                                onChange={onClickSpecifyImagePullSecret}
                                autoFocus
                                autoComplete="off"
                            />
                        </div>
                        {errorValidation && (
                            <span className="form__error">
                                <img src={error} alt="" className="form__icon" />
                                This is a required Field
                            </span>
                        )}
                    </>
                )}
                {credentialsType === CredentialType.CUSTOM_CREDENTIAL && (
                    <div className="cn-7 ">
                        <div className="flexbox w-100 mb-16">
                            <div className="w-50 mr-8">
                                <div className="mb-6"> Registry URL</div>
                                <input
                                    tabIndex={3}
                                    placeholder="Enter registry URL"
                                    className="form__input"
                                    name="server"
                                    value={customCredential?.server}
                                    onChange={onClickSpecifyImagePullSecret}
                                    autoFocus
                                    autoComplete="off"
                                />
                            </div>
                            <div className="w-50">
                                <div className="mb-6">Email</div>
                                <input
                                    tabIndex={4}
                                    placeholder="Enter Email"
                                    className="form__input"
                                    name="email"
                                    value={customCredential?.email}
                                    onChange={onClickSpecifyImagePullSecret}
                                    autoFocus
                                    autoComplete="off"
                                />
                            </div>
                        </div>
                        <div className="flexbox w-100">
                            <div className="w-50 mr-8">
                                <div className="mb-6">Username</div>
                                <input
                                    tabIndex={5}
                                    placeholder="Enter username"
                                    className="form__input"
                                    name="username"
                                    value={customCredential?.username}
                                    onChange={onClickSpecifyImagePullSecret}
                                    autoFocus
                                    autoComplete="off"
                                />
                            </div>
                            <div className="w-50">
                                <div className="mb-6">Password</div>
                                <input
                                    tabIndex={6}
                                    placeholder="Enter password"
                                    className="form__input"
                                    name="password"
                                    value={customCredential?.password}
                                    onChange={onClickSpecifyImagePullSecret}
                                    autoFocus
                                    autoComplete="off"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default ManageRegistry
