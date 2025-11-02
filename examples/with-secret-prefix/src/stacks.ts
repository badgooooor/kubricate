import { namespaceTemplate, simpleAppTemplate } from '@kubricate/stacks';
import { Stack } from 'kubricate';

import { secretManager } from './setup-secrets';
import { config } from './shared-config';

const namespace = Stack.fromTemplate(namespaceTemplate, {
  name: config.namespace,
});

const apiServiceApp = Stack.fromTemplate(simpleAppTemplate, {
  namespace: config.namespace,
  imageName: 'nginx',
  name: 'my-app',
}).useSecrets(secretManager, c => {
  c.secrets('API_CREDENTIALS').forName('API_USERNAME').inject('env', { key: 'username' });
  c.secrets('API_CREDENTIALS').forName('API_PASSWORD').inject('env', { key: 'password' });
});

export default {
  namespace,
  apiServiceApp,
};
