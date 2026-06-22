import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function SiteLayout({
                                     children,
                                   }: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <div>
        <Header />
        <main className="flex-grow">
          {children}
        </main>
        <Footer />
      </div>
  );
}
