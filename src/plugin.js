import RosConnection from './utils/RosConnection.js';
import RosObjectProvider from './providers/ObjectProvider.js';
import RealtimeTelemetryProvider from './providers/RealtimeTelemetryProvider.js';
import { OBJECT_TYPES, NAMESPACE, ROOT_KEY } from './const';

export default function installRosPlugin(configuration) {
    return function install(openmct) {

        openmct.install(openmct.plugins.ISOTimeFormat());

        openmct.types.addType(OBJECT_TYPES.ROS_TOPIC_TYPE, {
            name: 'ROS Topic',
            description: 'A ROS Topic',
            cssClass: 'icon-dictionary'
        });

        openmct.types.addType(OBJECT_TYPES.ROS_AGGREGATE_MESSAGE, {
            name: 'ROS Aggregate Message',
            description: 'A ROS Aggregate Message',
            cssClass: 'icon-telemetry-aggregate'
        });

        openmct.types.addType(OBJECT_TYPES.ROS_LEAF_MESSAGE, {
            name: 'ROS Leaf Message',
            description: 'A ROS Leaf Message',
            cssClass: 'icon-telemetry'
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
