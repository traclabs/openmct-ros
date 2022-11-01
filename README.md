# ROS Plugin for Open MCT
This project provides a plugin for connecting Open MCT to ROS.

## Running the example

An example is provided in this repository that can be configured to run against any ROS installation.

### Prerequisites
* [A git client](https://git-scm.com/)
* [NodeJS](https://nodejs.org/)

### Compatibility
* Supported NodeJS available in our package.json's `engine` key.
* Minimum Supported Open MCT version in our package.json's `peerDependencies` key.

### Installation
```
git clone git@bitbucket.org:traclabs/openmct-ros.git
cd openmct-ros
npm install
npm run build:example
npm start
```

This should build the example, and launch a web browser with Open MCT connected to a locally running ROS Server.

## Using the Open MCT-ROS plugin in your own project

When building an application with Open MCT, we strongly advise building with Open MCT as a dependency, rather than 
building your project from the Open MCT source. Please refer to 
[our guidance on this](https://github.com/nasa/openmct/blob/master/API.md#starting-an-open-mct-application).

### Installing the plugin

The Open MCT - ROS adapter can be included as an ES6 module using an import statement. If you are using Webpack it 
can be imported using only the package name, otherwise the full path to the dependency should be used.

eg.

#### Using Webpack
```
import installRosPlugin from 'openmct-ros';
```

#### Using native ES6 imports:
```
import installRosPlugin from 'node_modules/openmct-ros/dist/openmct-ros.js'
```

The plugin can then be installed and configured like so:
```
openmct.install(installRosPlugin({
    "rosBridgeEndpoint": "ws://localhost:8085/",
}));
```

