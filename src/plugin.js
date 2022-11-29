import RosConnection from './utils/RosConnection.js';
import RosObjectProvider from './providers/ObjectProvider.js';
import RealtimeTelemetryProvider from './providers/RealtimeTelemetryProvider.js';
import { OBJECT_TYPES, NAMESPACE, ROOT_KEY } from './const';

export default function installRosPlugin(configuration) {
    return function install(openmct) {

        openmct.install(openmct.plugins.ISOTimeFormat());

        openmct.types.addType(OBJECT_TYPES.ROS_TOPIC_TYPE, {
            name: 'Ros Topic',
            description: 'A Ros Topic',
            cssClass: 'icon-dictionary'
        });

        const rosConnection = new RosConnection(configuration.rosBridgeEndpoint);

        const objectProvider = new RosObjectProvider(
            openmct,
            rosConnection
        );

        openmct.objects.addRoot({
            namespace: NAMESPACE,
            key: ROOT_KEY
        });

        openmct.objects.addProvider(NAMESPACE, objectProvider);

        const realTimeTelemetryProvider = new RealtimeTelemetryProvider(
            openmct,
            rosConnection
        );

        openmct.telemetry.addProvider(realTimeTelemetryProvider);
    };
}
