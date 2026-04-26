export default function Home() {
  return (
    <main style={styles.page}>

      {/* HERO */}
      <section style={styles.hero}>
        <h1 style={styles.h1}>
          We Deliver High-Intent Roofing Customers to Your Business
        </h1>

        <p style={styles.subtext}>
          RoofFlow connects roofing contractors with homeowners actively requesting estimates — 
          then filters, qualifies, and delivers them directly into your pipeline.
        </p>

        <div style={styles.ctaRow}>
          <a href="/apply" style={styles.primaryBtn}>Get Qualified Leads</a>
          <a href="#pricing" style={styles.secondaryBtn}>View Plans</a>
        </div>

        <p style={styles.micro}>
          No shared leads. No cold traffic. No wasted ad spend.
        </p>
      </section>

      {/* TRUST STRIP */}
      <section style={styles.trust}>
        <p>
          Built for roofing contractors across North America — focused on high-intent homeowner demand, not random traffic.
        </p>
      </section>

      {/* VALUE PROP */}
      <section style={styles.section}>
        <h2 style={styles.h2}>Why Contractors Choose RoofFlow</h2>

        <div style={styles.grid}>
          <div style={styles.card}>
            <h3>Qualified Homeowner Requests</h3>
            <p>
              Every lead is filtered for intent, location, and urgency before it reaches your pipeline.
            </p>
          </div>

          <div style={styles.card}>
            <h3>Booked Estimates, Not Clicks</h3>
            <p>
              We focus on delivering real appointment opportunities — not raw traffic or low-quality form fills.
            </p>
          </div>

          <div style={styles.card}>
            <h3>Territory Protection</h3>
            <p>
              Each service area is limited to a small number of contractors to reduce competition and increase close rates.
            </p>
          </div>
        </div>
      </section>

      {/* COMPETITOR POSITIONING */}
      <section style={styles.sectionDark}>
        <h2 style={styles.h2}>Why RoofFlow Outperforms Ads & Lead Lists</h2>

        <div style={styles.grid}>
          <div style={styles.card}>
            <h3>Google Ads</h3>
            <p>
              Expensive clicks, unpredictable leads, and high competition.
            </p>
          </div>

          <div style={styles.card}>
            <h3>Facebook Leads</h3>
            <p>
              Low intent homeowners with inconsistent buying urgency.
            </p>
          </div>

          <div style={styles.cardHighlight}>
            <h3>RoofFlow</h3>
            <p>
              Homeowners actively requesting roofing estimates, pre-qualified before delivery.
            </p>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section style={styles.section}>
        <h2 style={styles.h2}>Contractor Feedback</h2>

        <div style={styles.grid}>
          <div style={styles.testimonial}>
            “The leads are serious. We stopped wasting time on unqualified calls immediately.”
            <span> — Roofing Contractor, Alberta</span>
          </div>

          <div style={styles.testimonial}>
            “First month we booked more inspections than we used to get in a full quarter.”
            <span> — Roofing Business Owner</span>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={styles.section}>
        <h2 style={styles.h2}>Simple Monthly Plans</h2>

        <div style={styles.grid}>
          <div style={styles.card}>
            <h3>Starter</h3>
            <p>$499 / month</p>
            <p>5–10 qualified appointments</p>
          </div>

          <div style={styles.cardHighlight}>
            <h3>Growth</h3>
            <p>$999 / month</p>
            <p>15–30 booked estimates</p>
            <p>Priority lead routing</p>
          </div>

          <div style={styles.card}>
            <h3>Domination</h3>
            <p>$1,999 / month</p>
            <p>High-volume + exclusive territory access</p>
          </div>
        </div>

        <div style={{ marginTop: 20, textAlign: "center" }}>
          <a href="/apply" style={styles.primaryBtn}>
            Start Receiving Leads
          </a>
        </div>
      </section>

      {/* FAQ */}
      <section style={styles.sectionDark}>
        <h2 style={styles.h2}>Frequently Asked Questions</h2>

        <div style={styles.faq}>
          <p>
            <b>Are leads exclusive?</b><br />
            Yes — each territory is limited to a small number of contractors.
          </p>

          <p>
            <b>Do you guarantee sales?</b><br />
            We guarantee qualified homeowner appointments, not final sales.
          </p>

          <p>
            <b>How fast do leads come in?</b><br />
            Typically within 24–72 hours after activation.
          </p>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={styles.hero}>
        <h2 style={styles.h2}>Ready to fill your schedule with real jobs?</h2>

        <a href="/apply" style={styles.primaryBtn}>
          Apply Now
        </a>

        <p style={styles.micro}>
          Start receiving qualified roofing appointments in your area.
        </p>
      </section>

    </main>
  );
}
