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

This should build the example and run the Open MCT development server. After the server has started, launch a web browser pointing to http://localhost:9090/ 
This will start the Open MCT web application connected to a running `rosbridge_server` on `ws://rosmachine:9090`.
Note you can change the hostname/IP of the `rosbridge_server` in `example/index.js`.

## Using the "fixed" `rosbridge_server`
1. First install [ROS2 Humble Hawksbill](https://docs.ros.org/en/foxy/Releases/Release-Humble-Hawksbill.html) on an Ubuntu machine. This repository will eventually provide a Docker file to do this, but right you'll need a VM.
```bash
mkdir -p ~/ros2_ws/src
cd ros2_ws
rosdep install -i --from-path src --rosdistro humble -y
colcon build --symlink-install
```
2. Then open a new terminal:
```bash
# load humble install
source /opt/ros/humble/setup.bash
# load our overlay
cd ros2_ws/
source install/local_setup.bash
ros2 launch rosbridge_server rosbridge_websocket_launch.xml
```

## Running turtlesim
1. Launch good ol' `turtlesim` like so:
```bash
ros2 run turtlesim turtlesim_node
```
2. Refresh your browser pointing to http://localhost:9090/ - it should automatically connect and display a list of ROS topics.
