# Supabase migrations

Jalankan migration secara berurutan melalui Supabase SQL Editor atau koneksi database langsung.

| File | Perubahan |
| --- | --- |
| `schema.sql` | Skema lengkap untuk instalasi baru. Tidak perlu menjalankan migration 001–006 setelah file ini. |
| `migrations/001_likes.sql` | Tabel like. |
| `migrations/002_comment_threads_and_reactions.sql` | Thread komentar, badge penulis, dan reaksi. |
| `migrations/003_profiles_and_avatars.sql` | Profil admin/tim dan avatar komentar. |
| `migrations/004_team_and_profiles.sql` | Anggota tim, profil lengkap, dan kontributor update. |
| `migrations/005_private_server_data.sql` | Menutup akses browser langsung ke tabel sensitif dan mengaktifkan RLS `team_members`. |
| `migrations/006_durable_abuse_controls.sql` | Rate limiter database serta deduplikasi like/reaksi berbasis hash. |

Migration menggunakan operasi idempotent sebisa mungkin sehingga aman dijalankan ulang. Migration 005 dan 006 harus aktif sebelum deployment kode yang memakai `ABUSE_HASH_SECRET`; urutannya:

1. Tambahkan `ABUSE_HASH_SECRET` ke environment server.
2. Jalankan migration 005.
3. Jalankan migration 006.
4. Deploy aplikasi.
5. Uji komentar, like, reaksi, login tim, dan feed publik.

## Menjalankan melalui koneksi database

```bash
psql "<connection-string>" -v ON_ERROR_STOP=1 \
  -f supabase/migrations/005_private_server_data.sql
psql "<connection-string>" -v ON_ERROR_STOP=1 \
  -f supabase/migrations/006_durable_abuse_controls.sql
```

Connection string tersedia di Supabase Dashboard pada Project Settings, Database, Connection string. Jangan simpan connection string atau password database di repository.
