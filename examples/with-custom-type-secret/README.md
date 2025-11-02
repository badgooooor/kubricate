# Example: With Custom Type Secret

This example demonstrates how to use **CustomTypeSecretProvider** to manage Kubernetes secrets with custom types in your deployments.

## 📖 Overview

CustomTypeSecretProvider allows you to create Kubernetes secrets with **user-defined types** and **flexible key/value pairs**, unlike built-in types like `kubernetes.io/basic-auth` which have fixed schemas.

This example shows:
1. **Custom secret type definition** - Create a secret with type `vendor.com/api-credentials`
2. **Allowed keys validation** - Restrict which keys can be stored using `allowedKeys`
3. **Individual key injection** - Inject specific keys as environment variables
4. **Type-safe secret management** - Validation ensures only permitted keys are used

## 🏗️ What's Included

### Stacks

- **namespace** - Default namespace (`kubricate-with-custom-type-secret`)
- **vendorIntegrationApp** - Application using vendor API credentials with custom secret type

### Features Demonstrated

- ✅ Custom Kubernetes Secret type (`vendor.com/api-credentials`)
- ✅ `allowedKeys` validation for type safety
- ✅ Individual key injection with `.inject('env', { key: '...' })`
- ✅ Multiple keys from the same custom-type secret
- ✅ JSON-based secret format

## 🚀 Quick Start

### 1. Setup Environment Variables

Copy the example environment file and customize it:

```bash
cp .env.example .env
```

Edit `.env` to set your credentials:

```bash
# Vendor API Configuration (custom type: vendor.com/api-credentials)
VENDOR_API_CONFIG={"api_key":"YOUR_API_KEY_HERE","api_endpoint":"https://api.vendor.example.com","api_timeout":"30"}
```

### 2. Generate Kubernetes Manifests

Run the following command to generate resources:

```bash
pnpm --filter=@examples/with-custom-type-secret kubricate generate
```

Or from the example directory:

```bash
pnpm kbr generate
```

### 3. Review Generated Resources

Check the `output/` directory for generated YAML files:

```bash
ls -la output/
```

You should see:
- `namespace.yml` - Namespace definition
- `vendorIntegrationApp.yml` - Application with custom-type secret injection

## 📋 Generated Resources Explained

### Vendor Integration App (Custom Type Secret)

The application injects individual keys from a custom-type secret:

```typescript
c.secrets('VENDOR_API_CONFIG')
  .forName('VENDOR_API_KEY')
  .inject('env', { key: 'api_key' });

c.secrets('VENDOR_API_CONFIG')
  .forName('VENDOR_API_ENDPOINT')
  .inject('env', { key: 'api_endpoint' });

c.secrets('VENDOR_API_CONFIG')
  .forName('VENDOR_API_TIMEOUT')
  .inject('env', { key: 'api_timeout' });
```

**Generated YAML**:
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: vendor-api-secret
  namespace: kubricate-with-custom-type-secret
type: vendor.com/api-credentials
data:
  api_key: <base64-encoded-value>
  api_endpoint: <base64-encoded-value>
  api_timeout: <base64-encoded-value>
---
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      containers:
      - name: vendor-integration
        env:
        - name: VENDOR_API_KEY
          valueFrom:
            secretKeyRef:
              name: vendor-api-secret
              key: api_key
        - name: VENDOR_API_ENDPOINT
          valueFrom:
            secretKeyRef:
              name: vendor-api-secret
              key: api_endpoint
        - name: VENDOR_API_TIMEOUT
          valueFrom:
            secretKeyRef:
              name: vendor-api-secret
              key: api_timeout
```

## 🔐 Secret Management

### Format

CustomTypeSecretProvider expects secrets in JSON format with flexible key/value pairs:

```json
{
  "api_key": "your-api-key",
  "api_endpoint": "https://api.vendor.example.com",
  "api_timeout": "30"
}
```

### Loading Secrets

In this example, secrets are loaded from `.env` file using `EnvConnector`:

```typescript
export const secretManager = new SecretManager()
  .addConnector('EnvConnector', new EnvConnector())
  // Provider for vendor API credentials with custom type
  .addProvider(
    'VendorApiProvider',
    new CustomTypeSecretProvider({
      name: 'vendor-api-secret',
      namespace: config.namespace,
      secretType: 'vendor.com/api-credentials',
      // Optional: restrict allowed keys for type safety
      allowedKeys: ['api_key', 'api_endpoint', 'api_timeout'],
    })
  )
  .setDefaultConnector('EnvConnector')
  .setDefaultProvider('VendorApiProvider')
  .addSecret({
    name: 'VENDOR_API_CONFIG',
    provider: 'VendorApiProvider',
  });
```

### Configuration Options

**Required**:
- `name` - Kubernetes Secret resource name
- `secretType` - Custom secret type (e.g., `vendor.com/api-credentials`)

**Optional**:
- `namespace` - Kubernetes namespace (defaults to `'default'`)
- `allowedKeys` - Array of permitted keys for validation (enforces type safety)

### The `allowedKeys` Feature

The `allowedKeys` option provides **type safety** by restricting which keys can be stored in the secret:

```typescript
new CustomTypeSecretProvider({
  name: 'vendor-api-secret',
  secretType: 'vendor.com/api-credentials',
  allowedKeys: ['api_key', 'api_endpoint', 'api_timeout'],
})
```

**Benefits**:
- ✅ **Validation** - Attempting to use a key not in `allowedKeys` will fail at build time
- ✅ **Type Safety** - Prevents typos and enforces schema compliance
- ✅ **Documentation** - `allowedKeys` serves as self-documentation for the secret schema

**Example**:
```typescript
// ✅ Allowed - key is in allowedKeys
.inject('env', { key: 'api_key' })

// ❌ Rejected - key is NOT in allowedKeys
.inject('env', { key: 'invalid_key' })
// Error: Key 'invalid_key' is not allowed. Allowed keys: api_key, api_endpoint, api_timeout
```

If `allowedKeys` is not specified, **any key** can be used (no validation).

## 🎯 Use Cases

CustomTypeSecretProvider is ideal for:

- 🔌 **Third-Party Integrations** - Vendor APIs with custom authentication schemes
- 🏢 **Internal Conventions** - Organization-specific secret type naming
- 🔐 **Flexible Secrets** - Key/value secrets that don't fit standard Kubernetes types
- 📦 **Custom Operators** - Secrets for custom Kubernetes operators expecting specific types
- 🌐 **Multi-Field Credentials** - Credentials with more than username/password (API key + endpoint + config)

## 📚 Key Concepts

### Custom Secret Types

Kubernetes allows custom secret types in the format:
- **Domain-based**: `vendor.com/api-credentials`, `example.org/database-config`
- **Custom prefix**: `mycompany/custom-auth`, `internal/service-token`

Custom types are useful when:
1. Integrating with third-party systems expecting specific secret types
2. Following organizational naming conventions
3. Using custom Kubernetes operators that recognize specific types
4. Documenting secret purpose through the type field

### Individual Key Injection

CustomTypeSecretProvider supports **individual key injection** using the `env` strategy:

```typescript
c.secrets('VENDOR_API_CONFIG')
  .forName('CUSTOM_ENV_NAME')  // Environment variable name
  .inject('env', { key: 'api_key' });  // Key from secret
```

**Required**:
- ✅ Must use `.forName()` to specify environment variable name
- ✅ Must provide `key` parameter matching a key in the secret

**Note**: Unlike `OpaqueSecretProvider`, CustomTypeSecretProvider does **not** support `envFrom` (bulk injection) because custom types typically have specific schemas and selective key usage is preferred.

### Multiple Secrets with Same Provider

Unlike `BasicAuthSecretProvider`, CustomTypeSecretProvider can handle **multiple secrets** with different keys in the same provider instance, as long as the keys don't conflict:

```typescript
.addProvider('VendorApiProvider', new CustomTypeSecretProvider({
  name: 'vendor-api-secret',
  secretType: 'vendor.com/api-credentials',
  allowedKeys: ['api_key', 'api_endpoint', 'api_timeout'],
}))
.addSecret({ name: 'VENDOR_API_CONFIG', provider: 'VendorApiProvider' });
```

However, if you need to create **multiple Kubernetes Secret resources** with different custom types, use separate provider instances:

```typescript
.addProvider('VendorApiProvider', new CustomTypeSecretProvider({
  name: 'vendor-api-secret',
  secretType: 'vendor.com/api-credentials',
  allowedKeys: ['api_key', 'api_endpoint'],
}))
.addProvider('PaymentProvider', new CustomTypeSecretProvider({
  name: 'payment-secret',
  secretType: 'payment.example.com/credentials',
  allowedKeys: ['merchant_id', 'api_secret'],
}))
.addSecret({ name: 'VENDOR_CONFIG', provider: 'VendorApiProvider' })
.addSecret({ name: 'PAYMENT_CONFIG', provider: 'PaymentProvider' });
```

## 🧪 Testing the Example

### 1. Validate Configuration

```bash
pnpm kbr generate
```

### 2. Check Generated Secrets

```bash
cat output/vendorIntegrationApp.yml | grep -A 10 "kind: Secret"
```

You should see the custom secret type:
```yaml
type: vendor.com/api-credentials
```

### 3. Verify Environment Variables

```bash
cat output/vendorIntegrationApp.yml | grep -A 15 "env:"
```

## 🔍 Troubleshooting

### Error: Missing targetName

```
Error: [CustomTypeSecretProvider] Missing targetName (.forName) for env injection.
```

**Solution**: Add `.forName('ENV_VAR_NAME')` before `.inject()`:

```typescript
c.secrets('VENDOR_API_CONFIG')
  .forName('VENDOR_API_KEY')  // ← Add this
  .inject('env', { key: 'api_key' });
```

### Error: Key not allowed

```
Error: [CustomTypeSecretProvider] Key 'invalid_key' is not allowed. Allowed keys: api_key, api_endpoint, api_timeout
```

**Solution**: Only use keys defined in `allowedKeys`:

```typescript
// ✅ Correct - key is in allowedKeys
.inject('env', { key: 'api_key' })

// ❌ Invalid - key not in allowedKeys
.inject('env', { key: 'invalid_key' })
```

### Error: Missing key parameter

```
Error: [CustomTypeSecretProvider] 'key' is required for env injection.
```

**Solution**: Provide the `key` parameter:

```typescript
.inject('env', { key: 'api_key' })  // ✅ Correct
.inject('env')                       // ❌ Missing key
```

### Error: Secret type is required

```
Error: [CustomTypeSecretProvider] secretType is required
```

**Solution**: Provide a `secretType` when creating the provider:

```typescript
new CustomTypeSecretProvider({
  name: 'vendor-api-secret',
  secretType: 'vendor.com/api-credentials',  // ← Required
})
```

## 📖 Documentation

For more information about secret management in Kubricate:

- [Official Documentation](https://kubricate.thaitype.dev)
- [Secret Management Guide](../../docs/secrets.md)
- [CustomTypeSecretProvider API](../../packages/plugin-kubernetes/README.md)

## 🤝 Related Examples

- [with-secret-manager](../with-secret-manager) - General secret management example
- [with-basic-auth-secret](../with-basic-auth-secret) - BasicAuthSecretProvider example
- [with-stack-template](../with-stack-template) - Basic stack creation

## 📝 Notes

- CustomTypeSecretProvider is part of `@kubricate/plugin-kubernetes` package
- Secrets are base64-encoded automatically by Kubernetes
- Custom secret types follow the format `domain/type-name`
- The `allowedKeys` feature is optional but highly recommended for type safety
- Unlike built-in types, custom types can have any number of keys
