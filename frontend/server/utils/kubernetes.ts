import { KubeConfig, AppsV1Api, CoreV1Api, NetworkingV1Api, BatchV1Api } from '@kubernetes/client-node';

export function createK8sClients() {
    const kc = new KubeConfig();

    kc.loadFromDefault();

    return {
        appsV1Api: kc.makeApiClient(AppsV1Api),
        coreV1Api: kc.makeApiClient(CoreV1Api),
        networkingV1Api: kc.makeApiClient(NetworkingV1Api),
        batchV1Api: kc.makeApiClient(BatchV1Api),
    };
}