export enum RepositoryLicenseType {
  RepositoryLicenseTypeApache = 'Apache-2.0',
  RepositoryLicenseTypeMIT = 'MIT',
  RepositoryLicenseTypeGPL = 'GPL-3.0-or-later',
}

export enum ModalityType {
  ModalityTypeText = 'Text',
  ModalityTypeImage = 'Image',
}

export enum InferenceType {
  InferenceTypeText2Text = 'Text-to-Text',
  InferenceTypeText2Image = 'Text-to-Image',
  InferenceTypeImage2Text = 'Image-to-Text',
  InferenceTypeImage2Image = 'Image-to-Image',
}

export enum RepositoryType {
  RepositoryTypeUnknown = 'Unknown',
  RepositoryTypeModel = 'Model',
  RepositoryTypeDataset = 'Dataset',
  RepositoryTypeCode = 'Code',
}

export enum JobStatusType {
  JobStatusTypeRunning = 'Running',
  JobStatusTypeFinished = 'Succeeded',
  JobStatusTypeFailed = 'Failed',
  JobStatusTypeRemoved = 'Removed'
}

export enum ServiceStatusType {
  JobStatusTypePassing = 'passing',
  JobStatusTypeFailing = 'failing',
}
