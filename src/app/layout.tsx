import type { Metadata } from "next";
import { Inter, League_Spartan, Poppins } from "next/font/google";
import "./globals.css";

const spartan = League_Spartan({ subsets: ["latin"], variable: "--nf-spartan", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--nf-inter", display: "swap" });
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--nf-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "YumQuick",
  description: "Peça seu lanche de forma rápida.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${spartan.variable} ${inter.variable} ${poppins.variable}`}>
      <body className="bg-branco-suave font-sans text-marrom antialiased">
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:rounded focus:bg-white focus:p-3"
        >
          Ir para o conteúdo
        </a>
        {/* <main> fica aqui: as páginas NÃO devem criar outro <main> */}
        <main id="conteudo">{children}</main>
      </body>
    </html>
  );
}
