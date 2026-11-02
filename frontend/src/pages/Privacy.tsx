import { Link } from "react-router-dom";
import { ArrowLeft, Mail } from "lucide-react";
import Logo from "../components/Logo";

// Leave empty to hide the contact line.
const CONTACT = "thierrydonambi@gmail.com";
const CONTACT_OWNER = "lucienallaingaye@gmail.com";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-[#F0F2F9]">
      {/* Header */}
      <header className="border-b border-[#E6E7E8] bg-white">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo variant="dark" size={28} />
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-[#0070E0] hover:underline"
          >
            <ArrowLeft size={14} />
            Back to app
          </Link>
        </div>
      </header>

      {/* Body */}
      <main className="max-w-3xl mx-auto px-6 py-12">
        <article className="bg-white border border-[#E6E7E8] rounded-xl p-8 sm:p-10 space-y-8">
          <header className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-black">
              Privacy and terms
            </h1>
            <p className="text-sm text-[#686A6D]">
              Last updated for the PayPal × AI Hackathon build.
            </p>
          </header>

          <section className="space-y-3">
            <p className="text-sm text-[#686A6D] leading-6">
              <strong className="font-semibold text-black">
                PayPilot Shield is a sandbox demo.
              </strong>{" "}
              It uses the PayPal sandbox, so no real money moves. Please do not
              enter real personal, banking, or customer data.
            </p>
          </section>

          <Section title="What is stored">
            <ul className="list-disc pl-5 space-y-2 text-sm text-[#686A6D] leading-6 marker:text-[#686A6D]/50">
              <li>The owner account: email and a password hash (never the password).</li>
              <li>
                Your public signing key. The private key is created in your browser,
                cannot be exported, and never reaches the server.
              </li>
              <li>
                Suppliers, invoices (including payee emails and description text),
                payment requests, approvals, signed policies, and the audit log.
              </li>
              <li>
                Failed login attempts, with the visitor IP address and email, to
                limit guessing.
              </li>
            </ul>
          </Section>

          <Section title="Who else sees data">
            <ul className="list-disc pl-5 space-y-2 text-sm text-[#686A6D] leading-6 marker:text-[#686A6D]/50">
              <li>
                <strong className="font-semibold text-black">AI provider.</strong>{" "}
                When AI mode is on, your chat messages and the invoice details the
                agent looks up (number, supplier, amount, status, description) are
                sent to the AI provider, Groq. The rules engine, not the AI, decides
                payments.
              </li>
              <li>
                <strong className="font-semibold text-black">PayPal sandbox.</strong>{" "}
                Payout requests send the payee email and amount to PayPal.
              </li>
              <li>
                <strong className="font-semibold text-black">Google Fonts.</strong>{" "}
                Your browser loads fonts from Google, which sees your IP address.
              </li>
            </ul>
          </Section>

          <Section title="In your browser">
            <p className="text-sm text-[#686A6D] leading-6">
              Your login is an httpOnly, same-site session cookie that page scripts
              cannot read, and your email is kept in session storage until you sign
              out or close the tab. It is a login cookie only, not a tracking
              cookie. The signing key is kept in IndexedDB. There are no analytics
              or advertising trackers.
            </p>
          </Section>

          <Section title="Terms">
            <p className="text-sm text-[#686A6D] leading-6">
              Provided as is, for demonstration only, with no warranty. Demo data
              may be reset or deleted at any time.
            </p>
          </Section>

          {(CONTACT || CONTACT_OWNER) && (
            <Section title="Contact">
              <ul className="space-y-2 text-sm text-[#686A6D]">
                {CONTACT && (
                  <li className="flex items-center gap-2">
                    <Mail size={14} className="text-[#686A6D]" />
                    <a
                      href={`mailto:${CONTACT}`}
                      className="text-[#0070E0] hover:underline"
                    >
                      {CONTACT}
                    </a>
                  </li>
                )}
                {CONTACT_OWNER && (
                  <li className="flex items-center gap-2">
                    <Mail size={14} className="text-[#686A6D]" />
                    <a
                      href={`mailto:${CONTACT_OWNER}`}
                      className="text-[#0070E0] hover:underline"
                    >
                      {CONTACT_OWNER}
                    </a>
                  </li>
                )}
              </ul>
            </Section>
          )}
        </article>

        <p className="text-xs text-[#686A6D] text-center mt-8">
          © {new Date().getFullYear()} PayPilot · Built for the PayPal × AI Hackathon
        </p>
      </main>
    </div>
  );
}

/** Small helper so every section has the same header style + spacing. */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold tracking-tight text-black">{title}</h2>
      {children}
    </section>
  );
}