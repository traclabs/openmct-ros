# ROS Plugin for Open MCT
This project provides a plugin for connecting Open MCT to ROS.

# Installation

## Building the client
```
git clone git@bitbucket.org:traclabs/openmct-ros.git
cd openmct-ros
npm install
npm run build:example
npm start
```

This should build the example, and launch a web browser pointing to http://localhost:9000/ with Open MCT connected to a running `rosbridge_server` on `ws://rosmachine:9090`.
Note you can change the hostname/IP of the `rosbridge_server` in `example/index.js`.

## Running an example ROS with `rosbridge_server`
To run `rosbridge_server`:

1. First install [ROS2 Humble Hawksbill](https://docs.ros.org/en/foxy/Releases/Release-Humble-Hawksbill.html) on an Ubuntu machine. This repository will eventually provide a Docker file to do this, but right you'll need a VM.
1. Then launch an example ROS node, like `turtlesim` like so:
```bash
ros2 run turtlesim turtlesim_node
```
1. Then launch `rosbridge_server` like so:
```bash
ros2 launch rosbridge_server rosbridge_websocket_launch.xml
```

After launching `rosbridge_server`, refreshing the web browser should automatically connect and display a list of ROS topics.
