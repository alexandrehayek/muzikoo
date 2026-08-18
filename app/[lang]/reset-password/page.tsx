import type { Metadata } from 'next';
import UpdatePasswordClient from '../update-password/UpdatePasswordClient';

export const metadata: Metadata = {
  title: "Reset Password - Muzikoo Player",
  description: "Reset your Muzikoo Player account password.",
  openGraph: {
    title: "Reset Password - Muzikoo Player",
    description: "Reset your Muzikoo Player account password.",
    type: "website",
    siteName: "Muzikoo.com",
    url: "https://muzikoo.com/reset-password",
  },
};

export default function ResetPasswordPage() {
  return <UpdatePasswordClient />;
}
