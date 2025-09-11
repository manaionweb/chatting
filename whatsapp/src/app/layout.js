// src/app/layout.js
import './globals.css';

export const metadata = {
  title: 'WhatsApp Chatbot UI',
  description: 'A WhatsApp-like chatbot UI developed by Aion Web Tech.',
  icons: {
    icon: '/favicon.ico', // You'll need to place a favicon.ico in your `public` directory
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}