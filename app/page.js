import Script from "next/script";

export default function Home() {
  return (
    <>
      {/* Google Tag Manager */}
      <Script id="gtm-script" strategy="afterInteractive">
        {`
          (function(w,d,s,l,i){
            w[l]=w[l]||[];
            w[l].push({'gtm.start': new Date().getTime(), event:'gtm.js'});
            var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),
            dl=l!='dataLayer'?'&l='+l:'';
            j.async=true;
            j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
            f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','GTM-WQ67Z3XL');
        `}
      </Script>

      <main style={styles.page}>

        {/* HERO */}
        <section style={styles.hero}>
          <h1 style={styles.h1}>
            Fill Your Roofing Schedule With Qualified Homeowner Requests
          </h1>

          <p style={styles.subtext}>
            RoofFlow delivers high-intent homeowners actively requesting roofing estimates — directly into your pipeline so you can focus on closing, not chasing.
          </p>

          <div style={styles.ctaRow}>
            <a href="/apply" style={styles.primaryBtn}>Get Qualified Leads</a>
            <a href="#how-it-works" style={styles.secondaryBtn}>How It Works</a>
          </div>

          <p style={styles.micro}>
            Exclusive territories. Pre-qualified homeowners. No shared leads.
          </p>
        </section>

        {/* TRUST */}
        <section style={styles.trust}>
          <p>
            Built for roofing contractors across North America — focused on real demand, not clicks or cold traffic.
          </p>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" style={styles.section}>
          <h2 style={styles.h2}>How RoofFlow Works</h2>

          <div style={styles.grid}>
            <div style={styles.card}>
              <h3>1. Demand Capture</h3>
              <p>Homeowners actively request roofing estimates through targeted channels.</p>
            </div>

            <div style={styles.card}>
              <h3>2. Qualification Layer</h3>
              <p>Every request is filtered for intent, urgency, and service location.</p>
            </div>

            <div style={styles.card}>
              <h3>3. Pipeline Delivery</h3>
              <p>You receive ready-to-book opportunities directly into your system.</p>
            </div>
          </div>
        </section>

        {/* POSITIONING */}
        <section style={styles.sectionDark}>
          <h2 style={styles.h2}>Why Contractors Switch</h2>

          <div style={styles.grid}>
            <div style={styles.card}>
              <h3>Google Ads</h3>
              <p>Expensive clicks, inconsistent quality, heavy competition.</p>
            </div>

            <div style={styles.card}>
              <h3>Facebook Leads</h3>
              <p>Low intent and unpredictable buying urgency.</p>
            </div>

            <div style={styles.cardHighlight}>
              <h3>RoofFlow</h3>
              <p>Pre-qualified homeowners actively requesting estimates.</p>
            </div>
          </div>
        </section>

        {/* RESULTS */}
        <section style={styles.section}>
          <h2 style={styles.h2}>Early Results</h2>

          <div style={styles.grid}>
            <div style={styles.testimonial}>
              “We stopped wasting time on junk leads. Every call has intent.”
              <span> — Contractor, Alberta</span>
            </div>

            <div style={styles.testimonial}>
              “We started booking inspections within days.”
              <span> — Roofing Owner</span>
            </div>
          </div>
        </section>

        {/* DIFFERENTIATION */}
        <section style={styles.section}>
          <h2 style={styles.h2}>Why RoofFlow Wins</h2>

          <div style={styles.grid}>
            <div style={styles.card}>
              <h3>Intent-Based</h3>
              <p>Only real homeowner demand — no clicks or fluff.</p>
            </div>

            <div style={styles.card}>
              <h3>Territory Control</h3>
              <p>Limited contractor access per region.</p>
            </div>

            <div style={styles.card}>
              <h3>Appointment-Ready</h3>
              <p>Built for inspections, not raw inquiries.</p>
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" style={styles.section}>
          <h2 style={styles.h2}>Simple Monthly Access</h2>

          <div style={styles.grid}>
            <div style={styles.card}>
              <h3>Starter</h3>
              <p>$499 / month</p>
              <p>5–10 qualified requests</p>
            </div>

            <div style={styles.cardHighlight}>
              <h3>Growth</h3>
              <p>$999 / month</p>
              <p>15–30 booked opportunities</p>
            </div>

            <div style={styles.card}>
              <h3>Domination</h3>
              <p>$1,999 / month</p>
              <p>High-volume + exclusive access</p>
            </div>
          </div>

          <div style={{ marginTop: 20, textAlign: "center" }}>
            <a href="/apply" style={styles.primaryBtn}>
              Apply for Access
            </a>
          </div>
        </section>

        {/* FAQ */}
        <section style={styles.sectionDark}>
          <h2 style={styles.h2}>FAQ</h2>

          <div style={styles.faq}>
            <p><b>Exclusive leads?</b><br />Yes — limited per territory.</p>
            <p><b>Guaranteed sales?</b><br />No — we deliver qualified opportunities.</p>
            <p><b>Speed?</b><br />Typically 24–72 hours after activation.</p>
          </div>
        </section>

        {/* FINAL CTA */}
        <section style={styles.hero}>
          <h2 style={styles.h2}>
            Ready to fill your pipeline?
          </h2>

          <a href="/apply" style={styles.primaryBtn}>
            Get Access Now
          </a>

          <p style={styles.micro}>
            Start receiving qualified roofing opportunities.
          </p>
        </section>

      </main>
    </>
  );
}
