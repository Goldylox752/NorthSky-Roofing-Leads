app.get("/", (req, res) => {
  res.send(`
    <html>
      <head>
        <title>NorthSky Flow OS</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          body {
            margin: 0;
            font-family: Arial, sans-serif;
            background: #0f172a;
            color: white;
          }

          .container {
            max-width: 1000px;
            margin: 0 auto;
            padding: 60px 20px;
            text-align: center;
          }

          .hero h1 {
            font-size: 42px;
            margin-bottom: 10px;
          }

          .hero p {
            font-size: 18px;
            color: #cbd5e1;
            margin-bottom: 30px;
          }

          .btn {
            display: inline-block;
            padding: 14px 22px;
            background: #22c55e;
            color: white;
            text-decoration: none;
            border-radius: 10px;
            font-weight: bold;
          }

          .section {
            margin-top: 60px;
          }

          .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
            gap: 20px;
            margin-top: 30px;
          }

          .card {
            background: #1e293b;
            padding: 20px;
            border-radius: 12px;
          }

          .price {
            font-size: 28px;
            font-weight: bold;
            margin: 10px 0;
          }

          .small {
            color: #94a3b8;
            font-size: 14px;
          }
        </style>
      </head>

      <body>
        <div class="container">

          <!-- HERO -->
          <div class="hero">
            <h1>🚀 NorthSky Flow OS</h1>
            <p>Automate leads. Capture payments. Scale your business with AI.</p>
            <a class="btn" href="/api/payments/checkout">Get Started</a>
          </div>

          <!-- FEATURES -->
          <div class="section">
            <h2>⚡ What You Get</h2>
            <div class="grid">
              <div class="card">
                <h3>Smart Lead Engine</h3>
                <p class="small">Automatically scores and prices every lead.</p>
              </div>

              <div class="card">
                <h3>Stripe Payments</h3>
                <p class="small">Instant checkout + automated activation.</p>
              </div>

              <div class="card">
                <h3>Automation System</h3>
                <p class="small">Hands-free lead distribution workflow.</p>
              </div>
            </div>
          </div>

          <!-- PRICING -->
          <div class="section">
            <h2>💰 Pricing</h2>

            <div class="grid">
              <div class="card">
                <h3>Starter</h3>
                <div class="price">$49</div>
                <p class="small">Basic lead access + automation</p>
              </div>

              <div class="card">
                <h3>Pro</h3>
                <div class="price">$99</div>
                <p class="small">Higher quality leads + priority system</p>
              </div>

              <div class="card">
                <h3>Elite</h3>
                <div class="price">$199</div>
                <p class="small">Premium leads + full automation</p>
              </div>
            </div>
          </div>

          <!-- CTA -->
          <div class="section">
            <h2>Ready to Scale?</h2>
            <p class="small">Start generating revenue automatically today.</p>
            <a class="btn" href="/health">View System Status</a>
          </div>

        </div>
      </body>
    </html>
  `);
});