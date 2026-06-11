import type { Metadata } from "next";
import { JetBrains_Mono, Noto_Sans_JP } from "next/font/google";
import "./globals.css";

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

const notoSansJp = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "ONE PROMPT BATTLE",
  description: "1回の命令で、AIを支配しろ。1回だけのプロンプトでAIから最高の回答を引き出すバトルゲーム。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className={`${jetbrains.variable} ${notoSansJp.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
