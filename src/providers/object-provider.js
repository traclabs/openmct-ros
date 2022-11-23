import { OBJECT_TYPES, NAMESPACE, ROOT_KEY } from '../const';
import ROSLIB from 'roslib';

export default class RosObjectProvider {
    constructor(openmct, url) {
        this.openmct = openmct;
        this.url = url;
        this.namespace = NAMESPACE;
        this.rootObject = null;
        this.dictionary = {};
        this.fetchRosTopicsPromise = null;

        this.#initialize();
    }

    #initialize() {
        this.rootObject = this.#createRootObject();
    }

    onRosError(error) {
        console.error(`🚨 error with ros`, error);
    }

    onRosConnection() {
        console.debug(`🍉 Connected to ROS`);
    }

    getRosTopics(ros) {
        let topicsClient = new ROSLIB.Service({
            ros,
            name: '/rosapi/topics',
            serviceType: 'rosapi/Topics'
        });

        const request = new ROSLIB.ServiceRequest();

        return new Promise(resolve => {
            topicsClient.callService(request, (result) => {
                console.debug('🥕 Result for service call on ' + topicsClient.name + ': ', result);
                resolve(result);
            });
        });
    }

    async #fetchFromRos() {
        console.debug(`👺 Should be Fetching ROS Topics from ${this.url}`);
        const ros = new ROSLIB.Ros();
        ros.on('connection', this.onRosConnection);
        ros.on('error', this.onRosError);
        ros.connect(this.url);

        const {topics} = await this.getRosTopics(ros);
        topics.forEach(topic => {
            this.#addRosTopic(topic, this.rootObject);
        });
    }

    #loadRosDictionary() {
        if (!this.fetchRosTopicsPromise) {
            this.fetchRosTopicsPromise = this.#fetchFromRos();
        }

        return this.fetchRosTopicsPromise;
    }

    #createRootObject() {
        const rootObject = {
            identifier: {
                key: ROOT_KEY,
                namespace: this.namespace
            },
            name: 'ROS Topics',
            type: 'folder',
            location: 'ROOT',
            composition: []
        };
        this.#addObject(rootObject);

        return rootObject;
    }

    async get(identifier) {
        const { key } = identifier;
        await this.#loadRosDictionary();
        const object = this.dictionary[key];

        return object;
    }

    supportsSearchType(type) {
        // return type === this.openmct.objects.SEARCH_TYPES.OBJECTS;
        // TODO: support object search by querying ROS
        return false;
    }

    // eslint-disable-next-line require-await
    async search(query, options) {
        return [];
    }

    #addObject(object) {
        this.dictionary[object.identifier.key] = object;
    }

    // eslint-disable-next-line require-await
    async #addRosTopic(rosTopic, parent) {
        const santizedName = rosTopic.replace(/\//g, '.').slice(1);
        const id = santizedName;
        const topicTitle = santizedName;

        const location = this.openmct.objects.makeKeyString({
            key: parent.identifier.key,
            namespace: parent.identifier.namespace
        });
        const obj = {
            identifier: {
                key: id,
                namespace: this.namespace
            },
            type: OBJECT_TYPES.ROS_TOPIC_TYPE,
            name: topicTitle,
            location: location,
            configuration: {},
            telemetry: {
                values: [{
                    key: 'utc',
                    source: 'timestamp',
                    name: 'Timestamp',
                    format: 'iso',
                    hints: {
                        domain: 1
                    }
                }]
            }
        };

        this.#addObject(obj);

        parent.composition.push(obj.identifier);
    }
}
