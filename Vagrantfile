# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure(2) do |config|
  # box
  config.vm.box = "debian/buster64"
  config.vm.box_version = ">= 10.0.0"

  # synced folders
  config.vm.synced_folder "./", "/code",
    owner: "vagrant",
    group: "www-data",
    mount_options: ["dmode=775,fmode=775"]
  config.vm.synced_folder "./vagrant", "/vagrantroot"
  config.vm.synced_folder ".", "/vagrant", type: "rsync", disabled: true

  config.vm.provider :vmware_fusion do |v, override|
    v.vmx['memsize'] = '1024'
    override.vm.synced_folder "./", "/code", type: "rsync", rsync__exclude: ".git/"
  end

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
end
