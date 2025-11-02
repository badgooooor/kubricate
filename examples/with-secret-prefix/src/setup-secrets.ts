import { EnvConnector } from '@kubricate/plugin-env';
import { BasicAuthSecretProvider } from '@kubricate/plugin-kubernetes';
import { SecretManager } from 'kubricate';

import { config } from './shared-config';

export const secretManager = new SecretManager()
  // Connect env with prefix
  .addConnector(
    'EnvConnector',
    new EnvConnector({
      prefix: 'CUSTOM_PREFIX_',
    })
  )
  // Provide for API credentials
  .addProvider(
    'ApiCredentialsProvider',
    new BasicAuthSecretProvider({
      name: 'api-credentials',
      namespace: config.namespace,
    })
  )
  // Add basic auth credentials for API access
  .addSecret({
    name: 'API_CREDENTIALS',
    provider: 'ApiCredentialsProvider',
  });
