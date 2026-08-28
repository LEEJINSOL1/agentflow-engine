import ApiDocs from "@/components/ApiDocs";
import Architecture from "@/components/Architecture";
import Benchmark from "@/components/Benchmark";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import Navbar from "@/components/Navbar";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Benchmark />
        <Architecture />
        <ApiDocs />
      </main>
      <Footer />
    </>
  );
}
