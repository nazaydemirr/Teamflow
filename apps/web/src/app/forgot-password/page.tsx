import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--background)] p-6">
      <div className="max-w-md text-center">
        <h1 className="font-[var(--font-fraunces)] text-2xl text-[var(--text-navy)]">Sifremi unuttum</h1>
        <p className="mt-3 text-[15px] text-[var(--text-slate)]">
          Firebase Authentication e-posta sifirlama yakinda aktiflestirilecek. Simdilik Google/GitHub ile giris kullanabilirsiniz.
        </p>
        <Link href="/" className="mt-6 inline-block text-sm font-semibold text-[var(--flow-blue)] hover:underline">
          Giris sayfasina don
        </Link>
      </div>
    </main>
  );
}
