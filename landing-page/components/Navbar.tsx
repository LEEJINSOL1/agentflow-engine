import { Zap } from "lucide-react";

const links = [
  { href: "#benchmark", label: "Benchmark" },
  { href: "#architecture", label: "Architecture" },
  { href: "#api", label: "API" },
];

export default function Navbar() {
  return (
    <header className="fixed top-0 z-50 w-full border-b border-gray-800/50 bg-[#030712]/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <a href="#" className="flex items-center gap-2 font-semibold text-white">
          <Zap className="h-5 w-5 text-blue-400" />
          AgentFlow
        </a>
        <nav className="hidden sm:flex items-center gap-6">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <a
          href="mailto:contact@agentflowengine.com"
          className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
        >
          Contact
        </a>
      </div>
    </header>
  );
}
