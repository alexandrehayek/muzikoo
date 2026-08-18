import type { Metadata } from 'next';
import ForgotPasswordClient from './ForgotPasswordClient';

export const metadata: Metadata = {
  title: "Forgot Password - Muzikoo Player",
  description: "Reset your Muzikoo Player account password.",
  openGraph: {
    title: "Forgot Password - Muzikoo Player",
    description: "Reset your Muzikoo Player account password.",
    type: "website",
    siteName: "Muzikoo.com",
    url: "https://muzikoo.com/forgot-password",
  },
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordClient />;
}
