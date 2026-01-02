// app/guest-test/layout.tsx
import TestNavbar from './components/TestNavbar';

export default function GuestTestLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TestNavbar />
      <main className="px-6">{children}</main>
    </>
  );
}
