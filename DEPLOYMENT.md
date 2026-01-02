# Panduan Deployment (Setup Hosting)

Panduan ini menjelaskan cara melakukan deploy aplikasi **Solusi Gadai Kita** ke server VPS (Virtual Private Server) menggunakan Docker.

## Persyaratan
- Server VPS (Ubuntu 20.04/22.04 LTS direkomendasikan)
- Akses ke terminal server (SSH)
- Domain (opsional, tapi disarankan untuk production)

## Langkah 1: Persiapan Server & Install Docker

Login ke VPS Anda via SSH, kemudian jalankan perintah berikut untuk menginstall Docker:

```bash
# Update repository
sudo apt update && sudo apt upgrade -y

# Install paket yang dibutuhkan
sudo apt install apt-transport-https ca-certificates curl software-properties-common -y

# Tambahkan GPG key Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Tambahkan repository Docker
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io docker-compose-plugin -y

# Cek status Docker
sudo systemctl status docker
```

## Langkah 2: Upload / Clone Project

Anda bisa meng-upload source code project ini ke server menggunakan `scp`, `git clone`, atau FTP. 
Asumsikan project berada di direktori `~/solusi-gadai-kita`.

## Langkah 3: Konfigurasi Environment

Edit file `docker-compose.prod.yml` jika perlu, atau pastikan environment variable di dalamnya sudah sesuai (terutama password database dan secret key).

> [!IMPORTANT]
> Jangan lupa mengganti `JWT_SECRET` dan `POSTGRES_PASSWORD` dengan password yang kuat dan aman untuk production.

## Langkah 4: Menjalankan Aplikasi

Masuk ke direktori project dan jalankan perintah Docker Compose:

```bash
cd ~/solusi-gadai-kita

# Build dan jalankan container di background
docker compose -f docker-compose.prod.yml up -d --build
```

Docker akan:
1. Membuiild image untuk Web (Next.js) dan API (NestJS).
2. Mendownload image Postgres.
3. Menjalankan semua service.

## Langkah 5: Verifikasi

Cek apakah semua container berjalan:

```bash
docker compose -f docker-compose.prod.yml ps
```

Anda harusnya melihat 3 container: `solusi-gadai-web`, `solusi-gadai-api`, dan `solusi-gadai-postgres` dengan status `Up`.

### Akses Aplikasi
- **Web App**: `http://IP-SERVER-ANDA:3000`
- **API**: `http://IP-SERVER-ANDA:3001`

Jika menggunakan firewall (UFW), pastikan port tersebut dibuka:
```bash
sudo ufw allow 3000
sudo ufw allow 3001
sudo ufw allow 22/tcp # Jangan lupa SSH
sudo ufw enable
```

## Langkah 6: Running Database Migration

Setelah database berjalan, kita perlu menyiapkan tabel-tabelnya. Kita bisa menjalankan perintah migrasi dari dalam container API.

```bash
docker exec -it solusi-gadai-api npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma
```

Jika ingin mengisi data awal (seeding):
```bash
docker exec -it solusi-gadai-api npx prisma db seed
```
(Pastikan perintah seed dikonfigurasi dengan benar di `package.json` root atau api).

---
**Selesai!** Aplikasi Anda sekarang sudah online.
