export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-24">
      <h1 className="text-3xl font-bold text-white">Terms of Service</h1>
      <p className="mt-4 text-gray-400 text-sm">Last updated: August 28, 2026</p>
      <div className="mt-8 space-y-6 text-gray-400 text-sm leading-relaxed">
        <p>
          By accessing AgentFlow Engine services, you agree to these terms.
          Please read them carefully.
        </p>
        <section>
          <h2 className="text-lg font-semibold text-white mb-2">Service</h2>
          <p>
            AgentFlow Engine provides distributed LLM inference APIs for
            autonomous AI agents. Services are provided &quot;as is&quot; during
            beta periods.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-white mb-2">Acceptable Use</h2>
          <p>
            You agree not to misuse our services, including attempts to disrupt
            infrastructure, violate applicable laws, or infringe on others&apos;
            rights.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-white mb-2">Contact</h2>
          <p>
            Questions about these terms:{" "}
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
