#!/usr/bin/env sh

# Install essentials
apt update
apt upgrade -y
yes | unminimize
apt install -y sudo build-essential python3.9 openssh-server curl wget nano

# User Creation & Block root account and disable root login through ssh
sudo useradd -p $(openssl passwd -1 '{TARGET_PASSWORD}') '{TARGET_USERNAME}'
adduser '{TARGET_USERNAME}' sudo

# Comment auth of chsh temporary, change shell, and recover auth.
sed -i "/auth       required   pam_shells.so/ s/^/# /" /etc/pam.d/chsh
chsh -s /bin/bash '{TARGET_USERNAME}'
chsh -s /sbin/nologin root
sed -i "/auth       required   pam_shells.so/ s/# *//" /etc/pam.d/chsh

echo "PermitRootLogin no" >> /etc/ssh/sshd_config
service ssh restart

# Make root not login-able
usermod -p '*' root
