export default function Pricing() {
  return (
    <main className="bg-white text-gray-900">

      <section className="max-w-5xl mx-auto px-6 py-20 text-center">
        <h1 className="text-4xl font-bold">
          Simple Monthly Access
        </h1>

        <p className="mt-4 text-gray-600">
          Exclusive roofing lead access per territory. No shared leads.
        </p>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24 grid md:grid-cols-3 gap-6">

        <div className="border rounded-xl p-6">
          <h2 className="font-bold">Starter</h2>
          <p className="text-gray-600">$499 / month</p>
          <p className="text-sm text-gray-500">5–10 qualified requests</p>
        </div>

        <div className="border-2 border-black rounded-xl p-6">
          <h2 className="font-bold">Growth</h2>
          <p className="text-gray-600">$999 / month</p>
          <p className="text-sm text-gray-500">15–30 booked opportunities</p>
        </div>

        <div className="border rounded-xl p-6">
          <h2 className="font-bold">Domination</h2>
          <p className="text-gray-600">$1,999 / month</p>
          <p className="text-sm text-gray-500">Exclusive territory control</p>
        </div>

      </section>

    </main>
  );
}
