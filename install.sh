#!/bin/bash

# Script to install this onto a fresh Amazon EC2 server
yum update -y

# Add node repo to yum
curl --silent --location https://rpm.nodesource.com/setup_14.x | sudo bash -

# Install node
sudo yum install -y nodejs

# Install git
yum install -y git

# Clone this rep
git clone https://github.com/PureGero/aws-ses-queue.git aws-ses-queue

# Install dependenices
npm install aws-ses-queue

# Run it
node aws-ses-queue