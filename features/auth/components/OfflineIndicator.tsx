"use client";

import { useEffect, useState } from "react";

export function OfflineIndicator() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    function update() {
      setOnline(navigator.onLine);
    }
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (online) {
    return null;
  }

  return (
    <div
      className="border-warning/40 bg-warning/10 text-foreground rounded-xl border px-3 py-2 text-sm"
      role="status"
      aria-live="polite"
    >
      آف لائن موڈ — قراءت جاری رکھیں؛ ہم آہنگی بعد میں ہوگی۔
    </div>
  );
}
