import Link from "next/link";

export default function AuthCallbackPage() {
  return (
    <main className="mx-auto min-h-screen max-w-lg space-y-4 px-6 py-12">
      <h1 className="text-primary text-3xl">سائن ان مکمل</h1>
      <p className="text-muted">
        اگر Google سائن ان کامیاب ہوا تو پروفائل پر جائیں اور پیش رفت ضم کریں۔
      </p>
      <Link href="/auth/profile" className="text-primary underline">
        پروفائل
      </Link>
    </main>
  );
}
