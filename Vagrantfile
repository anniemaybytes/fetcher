# -*- mode: ruby -*-
# vi: set ft=ruby :

ENV["LC_ALL"] = "en_US.UTF-8"

Vagrant.configure(2) do |config|
  # box
  config.vm.box = "debian/buster64"
  config.vm.box_version = ">= 10.0.0"

  # custom
  config.vm.graceful_halt_timeout = 30

  # network
  config.vm.network "forwarded_port", guest: 8080, host_ip: "127.0.0.1", host: 5808

  # synced folders
  config.vm.synced_folder "./", "/code",
    owner: "vagrant",
    group: "vagrant",
    mount_options: ["dmode=775,fmode=775"]
  config.vm.synced_folder "./vagrant", "/vagrantroot"
  config.vm.synced_folder ".", "/vagrant", type: "rsync", disabled: true

  # virtualbox-specific overrides
  config.vm.provider :virtualbox do |v, override|
    v.check_guest_additions = true
    v.functional_vboxsf     = true
    v.memory = 1024
    v.customize ["modifyvm", :id, "--vram", "16"]
    v.customize ["modifyvm", :id, "--paravirtprovider", "default"]
  end

  # provision scripts
  config.vm.provision "shell", path: "./vagrant/provision.sh"
  config.vm.provision "shell", run: "always", path: "./vagrant/provision_update.sh"
end
