# 🐧 Arch Linux

- [📚 WIKI](README)
  - [💻 Software](software/README)
    - [🐧 Arch Linux](software/arch)

----

```bash
mkfs.fat -F32 /dev/sda1
mkfs.ext4 /dev/sda1
```

```bash
mkfs.fat -F32 /dev/nvme0n1p1
```

```bash
sudo pacman -S dosfstools
```

```bash
pacstrap -K /mnt base linux linux-firmware grub efibootmgr
```

```bash
grub-install --target=x86_64-efi --efi-directory=/boot/efi --bootloader-id=GRUB
```

```bash
grub-mkconfig -o /boot/grub/grub.cfg
```
