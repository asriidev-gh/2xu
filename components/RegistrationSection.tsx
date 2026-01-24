'use client';

import { useEffect, useRef, useState } from 'react';

export default function RegistrationSection() {
  const registrationSectionRef = useRef<HTMLElement>(null);
  const [isRegistrationVisible, setIsRegistrationVisible] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    contact: '',
    gender: '',
    birthday: '',
    affiliations: '',
    promotional: false
  });

  // Trigger animations when Registration section comes into view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.1) {
            setIsRegistrationVisible(true);
          } else {
            setIsRegistrationVisible(false);
          }
        });
      },
      { 
        threshold: [0, 0.1, 0.5, 1.0],
        rootMargin: '-50px 0px -50px 0px'
      }
    );

    if (registrationSectionRef.current) {
      observer.observe(registrationSectionRef.current);
    }

    return () => {
      if (registrationSectionRef.current) {
        observer.unobserve(registrationSectionRef.current);
      }
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      gender: e.target.value
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Handle form submission here
    console.log('Form submitted:', formData);
    alert('Registration submitted successfully! We will contact you soon.');
    // Reset form
    setFormData({
      name: '',
      email: '',
      contact: '',
      gender: '',
      birthday: '',
      affiliations: '',
      promotional: false
    });
  };

  return (
    <section 
      ref={registrationSectionRef} 
      id="registration" 
      className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 via-white to-gray-50 relative overflow-hidden"
    >
      {/* Decorative background elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 w-72 h-72 bg-orange-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-yellow-500 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto max-w-4xl relative z-10">
        {/* Section Header */}
        <div className={`text-center mb-12 ${isRegistrationVisible ? 'animate-fade-in' : 'animate-fade-out opacity-0'}`} style={{ animationDelay: '0.2s' }}>
          <div className="inline-block px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-500 rounded-full mb-4 shadow-lg">
            <span className="text-white font-semibold text-sm font-fira-sans uppercase tracking-wide">Join Us</span>
          </div>
          <h2 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-4 font-druk drop-shadow-sm">
            Register Now
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-orange-500 to-yellow-500 mx-auto rounded-full mb-6"></div>
          <p className="text-gray-600 max-w-2xl mx-auto font-sweet-sans text-lg">
            Be part of the premier running event in Asia. Fill out the form below to register.
          </p>
        </div>

        {/* Registration Form */}
        <div className={`${isRegistrationVisible ? 'animate-fade-in' : 'animate-fade-out opacity-0'}`} style={{ animationDelay: '0.4s' }}>
          <div className="relative">
            {/* Card with gradient glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-yellow-500/10 rounded-3xl blur-2xl"></div>
            
            {/* Form Card */}
            <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl p-8 lg:p-12 shadow-2xl border border-gray-100">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name Field */}
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2 font-fira-sans">
                    Full Name <span className="text-orange-600">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all font-sweet-sans text-gray-900"
                    placeholder="Enter your full name"
                  />
                </div>

                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2 font-fira-sans">
                    Email Address <span className="text-orange-600">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all font-sweet-sans text-gray-900"
                    placeholder="your.email@example.com"
                  />
                </div>

                {/* Contact Field */}
                <div>
                  <label htmlFor="contact" className="block text-sm font-semibold text-gray-700 mb-2 font-fira-sans">
                    Contact Number <span className="text-orange-600">*</span>
                  </label>
                  <input
                    type="tel"
                    id="contact"
                    name="contact"
                    value={formData.contact}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all font-sweet-sans text-gray-900"
                    placeholder="+63 XXX XXX XXXX"
                  />
                </div>

                {/* Gender Field */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3 font-fira-sans">
                    Gender <span className="text-orange-600">*</span>
                  </label>
                  <div className="flex gap-6">
                    <label className="flex items-center cursor-pointer group">
                      <input
                        type="radio"
                        name="gender"
                        value="Male"
                        checked={formData.gender === 'Male'}
                        onChange={handleRadioChange}
                        required
                        className="w-5 h-5 text-orange-600 border-gray-300 focus:ring-orange-500 focus:ring-2"
                      />
                      <span className="ml-2 text-gray-700 font-sweet-sans group-hover:text-orange-600 transition-colors">Male</span>
                    </label>
                    <label className="flex items-center cursor-pointer group">
                      <input
                        type="radio"
                        name="gender"
                        value="Female"
                        checked={formData.gender === 'Female'}
                        onChange={handleRadioChange}
                        required
                        className="w-5 h-5 text-orange-600 border-gray-300 focus:ring-orange-500 focus:ring-2"
                      />
                      <span className="ml-2 text-gray-700 font-sweet-sans group-hover:text-orange-600 transition-colors">Female</span>
                    </label>
                  </div>
                </div>

                {/* Birthday Field */}
                <div>
                  <label htmlFor="birthday" className="block text-sm font-semibold text-gray-700 mb-2 font-fira-sans">
                    Birthday <span className="text-orange-600">*</span>
                  </label>
                  <input
                    type="date"
                    id="birthday"
                    name="birthday"
                    value={formData.birthday}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all font-sweet-sans text-gray-900"
                  />
                </div>

                {/* Affiliations Field (Optional) */}
                <div>
                  <label htmlFor="affiliations" className="block text-sm font-semibold text-gray-700 mb-2 font-fira-sans">
                    Affiliations / Club Organization <span className="text-gray-400 text-xs">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    id="affiliations"
                    name="affiliations"
                    value={formData.affiliations}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all font-sweet-sans text-gray-900"
                    placeholder="Your club or organization name"
                  />
                </div>

                {/* Promotional Checkbox */}
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      type="checkbox"
                      id="promotional"
                      name="promotional"
                      checked={formData.promotional}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
                    />
                  </div>
                  <label htmlFor="promotional" className="ml-3 text-sm text-gray-700 font-sweet-sans cursor-pointer">
                    I would like to receive promotional emails and updates about upcoming events
                  </label>
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-orange-600 to-orange-500 text-white px-8 py-4 rounded-full font-bold text-lg hover:from-orange-700 hover:to-orange-600 transition-all transform hover:scale-105 shadow-lg font-fira-sans"
                  >
                    Submit Registration
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

