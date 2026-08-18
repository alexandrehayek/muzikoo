import type { Metadata } from 'next';
import UpdatePasswordClient from './UpdatePasswordClient';

export const metadata: Metadata = {
  title: "Set New Password - Muzikoo Player",
  description: "Set a new password for your Muzikoo Player account.",
  openGraph: {
    title: "Set New Password - Muzikoo Player",
    description: "Set a new password for your Muzikoo Player account.",
    type: "website",
    siteName: "Muzikoo.com",
    url: "https://muzikoo.com/update-password",
  },
};

export default function UpdatePasswordPage() {
  return <UpdatePasswordClient />;
}
