export default function Home() {
  return (
    <main className="bg-white text-gray-900">

      {/* TOP SYSTEM BAR — elevated urgency with real-time scarcity feel */}
      <div className="border-b border-gray-200 bg-white/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-3 flex flex-col sm:flex-row justify-between items-center gap-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold tracking-wide text-gray-800">⚡ ROOFFLOW DEMAND ENGINE</span>
            <span className="hidden sm:inline text-gray-300">|</span>
            <span className="text-xs text-gray-500">v2.4 — live territory intelligence</span>
          </div>
          <div className="flex items-center gap-2 bg-red-50 px-3 py-1 rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
            </span>
            <span className="text-red-700 font-semibold text-xs tracking-tight">⚠ LIMITED CONTRACTOR SLOTS PER REGION — 89% territories saturated</span>
          </div>
        </div>
      </div>

      {/* HERO — DASHBOARD-STYLE LEAD INTELLIGENCE SECTION */}
      <section className="relative overflow-hidden py-20 md:py-28">
        {/* subtle background pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-30 pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
            
            {/* LEFT COLUMN: value prop + CTA */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-50 border border-red-200 shadow-sm">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-red-700 text-xs font-bold uppercase tracking-wide">Live Demand Active — Real Time</span>
              </div>
              <h1 className="mt-6 text-4xl md:text-6xl font-bold tracking-tight leading-tight text-gray-900">
                Roofing Leads That Turn Into <span className="text-red-600">Booked Jobs</span><br />— Not Clicks
              </h1>
              <p className="mt-6 text-gray-500 text-lg leading-relaxed max-w-lg">
                RoofFlow is a demand engine that delivers verified homeowners actively requesting roofing estimates in your service area. No bidding wars, no intentless clicks.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <a href="/apply" className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-3.5 rounded-xl font-semibold shadow-md transition-all hover:shadow-lg hover:scale-[1.02] focus:ring-2 focus:ring-gray-400">
                  Check Availability →
                </a>
                <a href="#system" className="border border-gray-300 bg-white hover:bg-gray-50 px-7 py-3.5 rounded-xl font-medium text-gray-700 transition-all">
                  View Engine
                </a>
              </div>
              <div className="mt-6 flex items-center gap-2 text-xs text-gray-400 border-t border-gray-100 pt-5">
                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Territory-based access • Approval required per region • No hidden fees</span>
              </div>
            </div>

            {/* RIGHT COLUMN: live lead intelligence card (upgraded) */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
              <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Live Lead Intelligence</p>
                  <p className="text-sm text-gray-400">Refreshed every 4 mins</p>
                </div>
                <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-1 rounded-full">API SYNC ✓</span>
              </div>
              <div className="p-6 space-y-5">
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="text-gray-500 text-sm font-medium">Primary Region</span>
                  <span className="font-bold text-gray-800">Alberta Rockies Corridor</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="text-gray-500 text-sm font-medium">Demand Level (30d)</span>
                  <span className="inline-flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-full text-emerald-700 font-bold text-sm">🔥🔥 High Velocity</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="text-gray-500 text-sm font-medium">Lead Score Avg</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: '87%' }}></div>
                    </div>
                    <span className="font-mono font-bold text-gray-800">87 / 100</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm font-medium">Available Slots</span>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    <span className="text-red-600 font-bold text-lg">2 remaining</span>
                  </div>
                </div>
                <div className="mt-3 pt-2 text-[11px] text-gray-400 flex justify-between">
                  <span>🏆 Top lead origin: Storm-affected zip codes</span>
                  <span>⏱️ Avg response: 4.2min</span>
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-3 text-center border-t border-gray-100">
                <p className="text-xs text-gray-500">📊 Exclusive intelligence: Homeowner intent + roof age + insurance claim flags</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEM SECTION: WHY CONTRACTORS LOSE MONEY — enhanced data-driven */}
      <section className="bg-gray-50 py-24 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <span className="text-red-600 text-sm font-semibold uppercase tracking-wider bg-red-100 px-3 py-1 rounded-full">The Cost of Broken Lead Gen</span>
          <h2 className="mt-5 text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
            Why Contractors Lose Over $3,200 Per Month on Traditional Leads
          </h2>
          <p className="mt-4 text-gray-500 max-w-2xl mx-auto">Most platforms sell volume without quality. RoofFlow inverts the model — exclusivity + buyer intent.</p>
          <div className="mt-14 grid md:grid-cols-3 gap-8 text-left">
            {[
              { title: "Pay-per-click ads", desc: "Unpredictable CPC, high bounce rates, and no guarantee of real project intent. Average 17% waste spend.", icon: "💰" },
              { title: "Shared lead systems", desc: "You compete with 4–7 contractors per lead. Response-time war erodes margins & professional value.", icon: "📡" },
              { title: "Low intent traffic", desc: "95% of form fills are price comparison, not serious buyers. RoofFlow requires verified service request.", icon: "🔄" }
            ].map((item, idx) => (
              <div key={idx} className="bg-white p-7 rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1">
                <div className="bg-red-50 w-12 h-12 flex items-center justify-center rounded-xl mb-4 text-2xl">{item.icon}</div>
                <p className="text-xl font-bold text-gray-800">{item.title}</p>
                <p className="text-gray-500 mt-2 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SYSTEM SECTION: ROOFFLOW DEMAND ENGINE (core value) */}
      <section id="system" className="py-28 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex bg-gray-100 rounded-full px-3 py-1 text-xs font-mono text-gray-600 mb-4">proprietary technology</div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">RoofFlow Demand Engine</h2>
            <p className="mt-4 text-gray-500 text-lg">Three layers that turn anonymous visitors into booked, profitable appointments.</p>
          </div>
          <div className="mt-16 grid md:grid-cols-3 gap-8">
            {[
              { layer: "Layer 1", title: "Intent Capture", desc: "Homeowners actively requesting roofing estimates via hyperlocal micro-surveys, not passive clicks. Verified by property data." },
              { layer: "Layer 2", title: "Lead Scoring Engine", desc: "Each lead is scored by urgency, budget indicators, roof age, and conversion probability using proprietary ML models." },
              { layer: "Layer 3", title: "Booking Layer", desc: "Only appointment-ready opportunities are delivered with prequalified time slots, reducing sales friction." }
            ].map((item, idx) => (
              <div key={idx} className="group relative p-8 border border-gray-200 rounded-2xl bg-white shadow-sm hover:shadow-lg transition-all duration-300">
                <div className="absolute -top-3 left-6 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-md">{item.layer}</div>
                <p className="text-2xl font-bold mt-2">{item.title}</p>
                <p className="text-gray-500 mt-3 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-3 bg-gray-50 px-6 py-3 rounded-full">
              <span className="text-sm font-medium">🏆 2024 Lead Quality Index:</span>
              <span className="font-bold text-emerald-700">94% of RoofFlow leads convert to estimate requests</span>
            </div>
          </div>
        </div>
      </section>

      {/* COMPARISON SECTION: ENHANCED WITH METRICS */}
      <section className="bg-[#0B0F19] text-white py-28 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/10 rounded-full blur-3xl"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-red-400 text-sm font-mono bg-white/5 px-3 py-1 rounded-full">ROI Comparison</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-4">How RoofFlow Outperforms Traditional Channels</h2>
            <p className="text-gray-300 mt-3">Real metrics from 200+ roofing partners across North America.</p>
          </div>
          <div className="mt-14 grid md:grid-cols-3 gap-6">
            {[
              { title: "Google / Meta Ads", desc: "Pay per click with no intent guarantee.", cost: "$78–$142", rate: "12%", icon: "📢" },
              { title: "Lead Brokers", desc: "Shared leads across multiple contractors, often resold 5x.", cost: "$35–$90", rate: "19%", icon: "📋" }
            ].map((item, idx) => (
              <div key={idx} className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl p-7 transition hover:bg-white/10">
                <div className="text-3xl mb-3">{item.icon}</div>
                <p className="text-xl font-semibold">{item.title}</p>
                <p className="text-gray-300 text-sm mt-2">{item.desc}</p>
                <div className="mt-4 pt-3 border-t border-white/10 flex justify-between text-sm">
                  <span>Avg cost/lead:</span><span className="text-red-300 font-bold">{item.cost}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span>Booking rate:</span><span className="text-red-300">{item.rate}</span>
                </div>
              </div>
            ))}
            <div className="bg-emerald-500 text-black rounded-2xl p-7 shadow-xl shadow-emerald-500/20 transform md:scale-105 border border-emerald-300">
              <div className="text-3xl mb-3">⚡</div>
              <p className="text-xl font-bold">RoofFlow Engine</p>
              <p className="text-black/80 text-sm mt-2 font-medium">Scored, filtered, and exclusive homeowner demand with territory rights.</p>
              <div className="mt-4 pt-3 border-t border-black/20 flex justify-between text-sm font-semibold">
                <span>Avg cost/lead:</span><span className="font-black">$49 (fixed)</span>
              </div>
              <div className="flex justify-between text-sm font-semibold mt-1">
                <span>Booking rate:</span><span className="font-black">67% → job booked</span>
              </div>
              <div className="mt-3 text-[11px] font-mono font-bold">⬆ 3.5x higher conversion vs industry avg</div>
            </div>
          </div>
        </div>
      </section>

      {/* SCARCITY & TERRITORY SYSTEM */}
      <section className="py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Live Territory System</h2>
            <p className="mt-4 text-gray-500 text-lg">Exclusive contractor caps per DMA • Prevent oversaturation & protect lead value</p>
          </div>
          <div className="mt-14 max-w-2xl mx-auto bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-lg">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <span className="font-bold text-gray-700">📍 Active territories — real-time access control</span>
              <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full">updated 2 min ago</span>
            </div>
            <div className="divide-y divide-gray-100">
              {[
                { name: "🗲 Alberta Rockies", note: "(Core region)", status: "2 / 3 slots filled", statusType: "red" },
                { name: "🔥 Calgary Metro", note: "High storm activity", status: "FULL — waiting list", statusType: "red" },
                { name: "🏙️ Edmonton North", note: "Growing demand +22% MoM", status: "1 slot open", statusType: "green" },
                { name: "🏔️ Canmore / Banff", note: "Seasonal premium", status: "2 slots open (new)", statusType: "amber" }
              ].map((territory, idx) => (
                <div key={idx} className="px-6 py-5 flex justify-between items-center hover:bg-gray-50 transition">
                  <div>
                    <span className="font-semibold">{territory.name}</span>
                    <span className="text-xs text-gray-400 ml-2">{territory.note}</span>
                  </div>
                  <div className={
                    territory.statusType === 'red' ? 'text-red-600 font-bold bg-red-50 px-3 py-1 rounded-full' :
                    territory.statusType === 'green' ? 'bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-bold' :
                    'bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-bold'
                  }>
                    {territory.status}
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-gray-100 px-6 py-3 text-center text-xs text-gray-500 flex justify-between items-center">
              <span>⚡ Scarcity lock: when region fills, new applicants go to waitlist</span>
              <span className="font-mono">next allocation: Q3 2025</span>
            </div>
          </div>
          <p className="text-center text-sm text-gray-400 mt-8">* Territory-based approval ensures you're not sharing your market with excessive competitors.</p>
        </div>
      </section>

      {/* SOCIAL PROOF MICRO BLOCK */}
      <section className="py-16 border-y border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div><p className="text-3xl font-black text-gray-800">+217%</p><p className="text-gray-500 text-sm mt-1">avg job revenue increase for partners in first 90d</p></div>
            <div><p className="text-3xl font-black text-gray-800">4.9★</p><p className="text-gray-500 text-sm mt-1">from 147 verified roofing contractors</p></div>
            <div><p className="text-3xl font-black text-gray-800">0</p><p className="text-gray-500 text-sm mt-1">shared leads — 100% exclusive per region</p></div>
          </div>
        </div>
      </section>

      {/* FINAL CTA: ACTIVATE TERRITORY ACCESS */}
      <section className="py-28 text-center bg-white relative">
        <div className="max-w-3xl mx-auto px-6">
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-3xl p-12 border border-gray-200 shadow-2xl">
            <span className="bg-red-100 text-red-700 rounded-full px-4 py-1 text-sm font-bold">⏳ Limited slots remain</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-6 tracking-tight">Activate Your Territory Access</h2>
            <p className="text-gray-500 mt-4 text-lg max-w-lg mx-auto">
              Stop buying fake leads. Start receiving pre-qualified, booked roofing opportunities — not cold inquiries.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a href="/apply" className="bg-gray-900 hover:bg-gray-800 text-white px-10 py-4 rounded-xl font-bold text-lg shadow-md transition-all inline-flex items-center gap-2">
                Apply for Access → <span className="text-xs">(2 min form)</span>
              </a>
              <a href="#system" className="border border-gray-300 hover:bg-gray-50 px-7 py-4 rounded-xl font-medium text-gray-700">
                How It Works
              </a>
            </div>
            <p className="mt-6 text-xs text-gray-400">✅ No upfront commitment • Performance-based pricing • Territory approval within 24h</p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t bg-white py-8 text-center text-xs text-gray-400">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <span>© 2025 RoofFlow Demand Engine — All rights reserved.</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-gray-600">Privacy</a>
            <a href="#" className="hover:text-gray-600">Terms</a>
            <a href="#" className="hover:text-gray-600">Contact</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
