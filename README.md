# ROS Plugin for Open MCT
This project provides a plugin for connecting Open MCT to ROS 2 (and maybe ROS 1).
<img width="1448" alt="Open MCT with ROS" src="https://github.com/traclabs/openmct-ros/assets/9853862/65188f91-1b86-4054-91b9-11b3eb8b8039">

# Requirements
This plugin requires rosbridge_suite > [1.3.2](https://github.com/RobotWebTools/rosbridge_suite/releases/tag/1.3.2)

# Installation

## Building the client
Get the latest [Node 18](https://nodejs.org/en/download)

Then run:
```
git clone git@bitbucket.org:traclabs/openmct-ros.git
cd openmct-ros
npm install
npm run build:example
npm start
```

This should build the example and run the Open MCT development server. After the server has started, launch a web browser pointing to http://localhost:9091/ 
This will start the Open MCT web application connected to a running `rosbridge_server` on `ws://rosmachine:9090`.
Note you can change the hostname/IP of the `rosbridge_server` in `example/index.js`.

## Testing plugin

### Prerequisites
* Download [Docker](https://www.docker.com/) in some fashion
* Ensure you've followed the guide to allow your [X11 server](http://wiki.ros.org/docker/Tutorials/GUI) to allow for connection.
    * Note on MacOS, ensure 'Allow connections from network clients' has been set in its preferences

### Running Test
1. Launch `openmct-ros-dev-server`, `rosbridge_server`, `turtlesim`, and [turtlesim_controller](https://github.com/DominikN/ros2_docker_examples) by running:
```
docker compose up
```
2. wait a moment for everything to initialize. You should see the `turtlesim` window appear and circling.
3. Refresh your browser pointing to http://localhost:9091/ - it should automatically connect and display a list of ROS topics.
