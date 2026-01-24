'use client';

export default function PartnersSection() {
  return (
    <section id="partners" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center font-fira-sans">Partners</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Partner logos will go here */}
          <div className="bg-gray-100 rounded-lg p-6 h-32 flex items-center justify-center">
            <p className="text-gray-500 text-sm">Partner Logo</p>
          </div>
          <div className="bg-gray-100 rounded-lg p-6 h-32 flex items-center justify-center">
            <p className="text-gray-500 text-sm">Partner Logo</p>
          </div>
          <div className="bg-gray-100 rounded-lg p-6 h-32 flex items-center justify-center">
            <p className="text-gray-500 text-sm">Partner Logo</p>
          </div>
          <div className="bg-gray-100 rounded-lg p-6 h-32 flex items-center justify-center">
            <p className="text-gray-500 text-sm">Partner Logo</p>
          </div>
        </div>
      </div>
    </section>
  );
}

