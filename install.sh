#!/bin/bash

# Log the output of this script
exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1

# Make the EC2 instance rerun the user data script on reboot
rm -f /var/lib/cloud/instances/*/sem/config_scripts_user

# Script to install this onto a fresh Amazon EC2 server
yum update -y

# Add node repo to yum
curl --silent --location https://rpm.nodesource.com/setup_14.x | sudo bash -

# Install node
yum install -y nodejs

# Install git
yum install -y git

# Clone this rep
rm -rf aws-ses-queue
git clone https://github.com/PureGero/aws-ses-queue.git aws-ses-queue

# Install dependenices
npm install aws-ses-queue

# Run it
node aws-ses-queue