import { resolveApiRootBaseUrl } from '$lib/api/core/client';

const backendUrl = resolveApiRootBaseUrl() ?? 'http://localhost:8080';

export default backendUrl;
