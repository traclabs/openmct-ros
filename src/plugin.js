import RosObjectProvider from './providers/object-provider.js';

import { OBJECT_TYPES, NAMESPACE, ROOT_KEY } from './const';

export default function installRosPlugin(configuration) {
    return function install(openmct) {

        openmct.install(openmct.plugins.ISOTimeFormat());

        const objectProvider = new RosObjectProvider(
            openmct,
            configuration.rosBridgeEndpoint
        );

        openmct.objects.addRoot({
            namespace: NAMESPACE,
            key: ROOT_KEY
        });

        openmct.objects.addProvider(NAMESPACE, objectProvider);

        openmct.types.addType(OBJECT_TYPES.PROCEDURE_TYPE, {
            name: 'Ros Topic',
            description: 'A Ros Topic',
            cssClass: 'icon-dictionary'
        });
    };
}
