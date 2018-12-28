# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure(2) do |config|
  config.vm.box = "puphpet/debian75-x64"
  config.vm.synced_folder "./vagrant", "/vagrantroot"

  config.vm.provider :vmware_fusion do |v, override|
    v.vmx['memsize'] = '1024'
    v.vmx['numvcpus'] = '2'
    override.vm.synced_folder "./", "/code", type: "rsync", rsync__exclude: ".git/"
  end

  config.vm.provider :virtualbox do |v, override|
    v.check_guest_additions = true
    v.functional_vboxsf     = true
    v.memory = 1024
    override.vm.graceful_halt_timeout = 30
    override.vm.synced_folder "./", "/code"
  end

  config.vm.provision "shell", path: "./vagrant/provision.sh"
end
