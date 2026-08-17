# Supabase migrations

Run these in order on the project database (Supabase Dashboard -> SQL Editor,
or via a DB connection).

| File | Apa yang ditambahkan |
| --- | --- |
| `schema.sql` | Skema lengkap dari nol (fresh setup). |
| `migrations/001_likes.sql` | Tabel `likes` (untuk proyek lama). |
| `migrations/002_comment_threads_and_reactions.sql` | Kolom `parent_id` + `author_badge` di `comments`, tabel `comment_reactions` (untuk proyek lama). |

Semua file idempotent (`create if not exists`, `drop policy if exists`),
jadi aman dijalankan ulang.

## Menjalankan lewat koneksi DB (psql)

```bash
psql "postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres" \
  -f supabase/schema.sql
psql "<connection-string>" -f supabase/migrations/001_likes.sql
psql "<connection-string>" -f supabase/migrations/002_comment_threads_and_reactions.sql
```

Connection string bisa diambil di Supabase Dashboard -> Project Settings ->
Database -> Connection string (pakai password yang direveal).
