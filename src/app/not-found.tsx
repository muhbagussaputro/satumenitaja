import Link from "next/link";

export default function NotFound() {
  return (
    <div className="error-box">
      <h1>Halaman tidak ditemukan</h1>
      <p>Periksa nomor surah atau kembali ke daftar surah.</p>
      <Link className="btn btn-primary" href="/">
        Kembali ke Beranda
      </Link>
    </div>
  );
}
