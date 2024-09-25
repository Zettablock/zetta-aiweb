/* eslint-disable no-else-return */
import { InferenceType, ModalityType, RepositoryLicenseType } from './types';

export const inferenceTypeOptions = [
  {
    value: InferenceType.InferenceTypeText2Text,
    label: 'Text Generation',
  },
  {
    value: InferenceType.InferenceTypeText2Image,
    label: 'Text-to-Image',
  },
  {
    value: InferenceType.InferenceTypeImage2Text,
    label: 'Image-to-Text',
  },
  {
    value: InferenceType.InferenceTypeImage2Image,
    label: 'Image-to-Image',
  },
];

export const modalityTypeOptions = [
  {
    value: ModalityType.ModalityTypeText,
    label: 'Text',
  },
  {
    value: ModalityType.ModalityTypeImage,
    label: 'Image',
  },
];

export const licenseOptions = [
  {
    title:
      'The Apache 2.0 license very clearly allows commercial use. The sole major difference between Apache 2.0 and, say, MIT is that Apache 2.0 prevents you from using the trademark of the entity that created the original software that you are modifying.',
    value: RepositoryLicenseType.RepositoryLicenseTypeApache,
    label: 'Apache',
  },
  {
    title:
      'The GNU General Public License is a series of widely used free software licenses, or copyleft, that guarantee end users the four freedoms to run, study, share, and modify the software.',
    value: RepositoryLicenseType.RepositoryLicenseTypeGPL,
    label: 'GPL',
  },
  {
    title:
      'The MIT License is a permissive software license originating at the Massachusetts Institute of Technology in the late 1980s. As a permissive license, it puts very few restrictions on reuse and therefore has high license compatibility.',
    value: RepositoryLicenseType.RepositoryLicenseTypeMIT,
    label: 'MIT',
  },
];

export function getOrgInfoByName(name = '') {
  const str = name.toLocaleLowerCase();
  if (str.includes('meta') || str.includes('llama')) {
    return ['meta', '/assets/aicons/meta.png'];
  } else if (str.includes('amazon') || str.includes('claude')) {
    return ['amazon', '/assets/aicons/amazon.png'];
  } else if (str.includes('google') || str.includes('gemma')) {
    return ['google', '/assets/aicons/google.png'];
  } else if (str.includes('gpt') || str.includes('rola')) {
    return ['openai', '/assets/aicons/openai.png'];
  } else if (str.includes('microsoft') || str.includes('phi')) {
    return ['microsoft', '/assets/aicons/microsoft.png'];
  } else if (str.includes('stable')) {
    return ['stable', '/assets/aicons/stable.png'];
  }
  return ['zettablock', '/assets/icons/favicon.png'];
}
