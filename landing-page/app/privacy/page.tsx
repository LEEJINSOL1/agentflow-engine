export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-24">
      <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
      <p className="mt-4 text-gray-400 text-sm">Last updated: August 28, 2026</p>
      <div className="mt-8 space-y-6 text-gray-400 text-sm leading-relaxed">
        <p>
          AgentFlow Engine (&quot;we&quot;, &quot;our&quot;) respects your privacy.
          This policy describes how we collect, use, and protect information when
          you use our website and services.
        </p>
        <section>
          <h2 className="text-lg font-semibold text-white mb-2">
            Information We Collect
          </h2>
          <p>
            We may collect contact information (email) when you reach out to us,
            and usage data (API requests, latency metrics) when you use our
            inference services.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-white mb-2">
            How We Use Information
          </h2>
          <p>
            We use collected information to provide and improve our services,
            respond to inquiries, and ensure system reliability.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-white mb-2">Contact</h2>
          <p>
            For privacy-related questions:{" "}
            <a
              href="mailto:contact@agentflowengine.com"
              className="text-blue-400 hover:underline"
            >
              contact@agentflowengine.com
            </a>
          </p>
        </section>
      </div>
      <a href="/" className="mt-12 inline-block text-sm text-blue-400 hover:underline">
        ← Back to home
      </a>
    </main>
  );
}
