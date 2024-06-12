import { InputFieldState } from '@devtron-labs/devtron-fe-common-lib'

export interface TLSConfigDTO {
    caData: string
    certData: string
    keyData: string
}

export interface TLSConnectionDTO {
    insecureSkipTLSVerify: boolean
    tlsConfig: TLSConfigDTO
}

export enum TLSConnectionFormActionType {
    TOGGLE_INSECURE_SKIP_TLS_VERIFY = 'TOGGLE_INSECURE_SKIP_TLS_VERIFY',
    UPDATE_CA_DATA = 'UPDATE_CA_DATA',
    UPDATE_CERT_DATA = 'UPDATE_CERT_DATA',
    UPDATE_KEY_DATA = 'UPDATE_KEY_DATA',
}

interface TLSConnectionHandleChangeParamsType {
    action: TLSConnectionFormActionType
    payload?: string
}

export interface TLSConnectionFormProps extends Pick<TLSConnectionDTO, 'insecureSkipTLSVerify'> {
    caData: InputFieldState<TLSConfigDTO['caData']>
    certData: InputFieldState<TLSConfigDTO['certData']>
    keyData: InputFieldState<TLSConfigDTO['keyData']>
    isCreateView: boolean
    handleChange: ({ action, payload }: TLSConnectionHandleChangeParamsType) => void
}

export interface TLSInputFieldProps extends Pick<TLSConnectionFormProps, 'handleChange'> {
    label: string
    id: string
    placeholder: string
    isSensitive: boolean
    value: string
    error: string
    updateAction:
        | TLSConnectionFormActionType.UPDATE_CA_DATA
        | TLSConnectionFormActionType.UPDATE_CERT_DATA
        | TLSConnectionFormActionType.UPDATE_KEY_DATA
}
