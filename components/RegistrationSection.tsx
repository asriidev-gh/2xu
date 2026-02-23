'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Swal from 'sweetalert2';
import { RACE_CATEGORY_NAMES, RACE_CATEGORY_PRICES } from '@/components/RaceCategoriesSection';

type RegistrationSectionProps = {
  selectedCategory?: string;
  onCategoryApplied?: () => void;
};

export default function RegistrationSection({ selectedCategory = '', onCategoryApplied }: RegistrationSectionProps) {
  const registrationSectionRef = useRef<HTMLElement>(null);
  const [isRegistrationVisible, setIsRegistrationVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    contact: '',
    gender: '',
    birthday: '',
    raceCategory: '',
    affiliations: '',
    promotional: false,
    teamMember1Name: '',
    teamMember1Birthday: '',
    teamMember1Gender: '',
    teamMember1Contact: '',
    teamMember2Name: '',
    teamMember2Birthday: '',
    teamMember2Gender: '',
    teamMember2Contact: '',
    teamMember3Name: '',
    teamMember3Birthday: '',
    teamMember3Gender: '',
    teamMember3Contact: '',
    teamMember4Name: '',
    teamMember4Birthday: '',
    teamMember4Gender: '',
    teamMember4Contact: ''
  });

  const isTeam = formData.raceCategory === 'Team Category';
  const teamMemberKeys = ([1, 2, 3, 4] as const);

  // Auto-fill race category when user clicks a category card and scrolls here
  useEffect(() => {
    if (selectedCategory) {
      setFormData((prev) => ({ ...prev, raceCategory: selectedCategory }));
      onCategoryApplied?.();
    }
  }, [selectedCategory, onCategoryApplied]);

  // Trigger animations when Registration section comes into view
  useEffect(() => {
    const sectionEl = registrationSectionRef.current;
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

    if (sectionEl) {
      observer.observe(sectionEl);
    }

    return () => {
      if (sectionEl) {
        observer.unobserve(sectionEl);
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
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const isTeam = formData.raceCategory === 'Team Category';
      const payload = isTeam
        ? {
            email: formData.email,
            raceCategory: formData.raceCategory,
            affiliations: formData.affiliations,
            promotional: formData.promotional,
            teamMembers: teamMemberKeys.map((num) => ({
              name: formData[`teamMember${num}Name`],
              birthday: formData[`teamMember${num}Birthday`],
              gender: formData[`teamMember${num}Gender`],
              contact: formData[`teamMember${num}Contact`]
            }))
          }
        : formData;

      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const contentType = response.headers.get('content-type');
      let data: { success?: boolean; error?: string; message?: string } = {};
      if (contentType?.includes('application/json')) {
        try {
          data = await response.json();
        } catch {
          throw new Error('Invalid response from server. Please try again.');
        }
      } else {
        throw new Error('Server error. Please try again later.');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit registration');
      }

      // Success - Show SweetAlert2
      await Swal.fire({
        title: 'Success!',
        text: 'Registration submitted successfully! We will contact you soon.',
        icon: 'success',
        confirmButtonText: 'OK',
        confirmButtonColor: '#ea580c', // Orange-600 color
        allowOutsideClick: false,
        allowEscapeKey: false,
        allowEnterKey: true,
        showCloseButton: false,
        buttonsStyling: true,
        customClass: {
          confirmButton: 'font-fira-sans'
        }
      });
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        contact: '',
        gender: '',
        birthday: '',
        raceCategory: '',
        affiliations: '',
        promotional: false,
        teamMember1Name: '',
        teamMember1Birthday: '',
        teamMember1Gender: '',
        teamMember1Contact: '',
        teamMember2Name: '',
        teamMember2Birthday: '',
        teamMember2Gender: '',
        teamMember2Contact: '',
        teamMember3Name: '',
        teamMember3Birthday: '',
        teamMember3Gender: '',
        teamMember3Contact: '',
        teamMember4Name: '',
        teamMember4Birthday: '',
        teamMember4Gender: '',
        teamMember4Contact: ''
      });
    } catch (error) {
      console.error('Registration error:', error);
      await Swal.fire({
        title: 'Error!',
        text: error instanceof Error ? error.message : 'Failed to submit registration. Please try again.',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#ea580c',
        allowOutsideClick: false,
        allowEscapeKey: false,
        allowEnterKey: true,
        showCloseButton: false,
        buttonsStyling: true,
        customClass: {
          confirmButton: 'font-fira-sans'
        }
      });
    } finally {
      setIsSubmitting(false);
    }
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
                {/* Race Experience first so form adapts */}
                <div>
                  <label htmlFor="raceCategory" className="block text-sm font-semibold text-gray-700 mb-2 font-fira-sans">
                    Race Experience <span className="text-orange-600">*</span>
                  </label>
                  <select
                    id="raceCategory"
                    name="raceCategory"
                    value={formData.raceCategory}
                    onChange={handleSelectChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all font-sweet-sans text-gray-900 bg-white"
                  >
                    <option value="">Select race experience</option>
                    {RACE_CATEGORY_NAMES.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                {isTeam ? (
                  /* ——— Team registration: one email + 4 member cards ——— */
                  <>
                    <div className="rounded-xl border-2 border-orange-200 bg-orange-50/50 p-4">
                      <p className="text-sm text-gray-700 font-fira-sans mb-4">
                        Enter team contact email and details for each of the 4 members.
                      </p>
                      <div>
                        <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2 font-fira-sans">
                          Team contact email <span className="text-orange-600">*</span>
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
                    </div>

                    {teamMemberKeys.map((num) => (
                      <div
                        key={num}
                        className="rounded-xl border-2 border-gray-200 bg-gray-50/80 p-5 sm:p-6 space-y-4"
                      >
                        <h3 className="text-base font-bold text-gray-900 font-fira-sans flex items-center gap-2">
                          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-500 text-white text-sm">
                            {num}
                          </span>
                          Team Member {num}
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="sm:col-span-2">
                            <label htmlFor={`teamMember${num}Name`} className="block text-sm font-semibold text-gray-700 mb-1 font-fira-sans">
                              Full Name <span className="text-orange-600">*</span>
                            </label>
                            <input
                              type="text"
                              id={`teamMember${num}Name`}
                              name={`teamMember${num}Name`}
                              value={formData[`teamMember${num}Name`]}
                              onChange={handleInputChange}
                              required
                              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all font-sweet-sans text-gray-900"
                              placeholder="Full name"
                            />
                          </div>
                          <div>
                            <label htmlFor={`teamMember${num}Birthday`} className="block text-sm font-semibold text-gray-700 mb-1 font-fira-sans">
                              Birthday <span className="text-orange-600">*</span>
                            </label>
                            <input
                              type="date"
                              id={`teamMember${num}Birthday`}
                              name={`teamMember${num}Birthday`}
                              value={formData[`teamMember${num}Birthday`]}
                              onChange={handleInputChange}
                              required
                              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all font-sweet-sans text-gray-900"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2 font-fira-sans">
                              Gender <span className="text-orange-600">*</span>
                            </label>
                            <div className="flex gap-4">
                              <label className="flex items-center cursor-pointer group">
                                <input
                                  type="radio"
                                  name={`teamMember${num}Gender`}
                                  value="Male"
                                  checked={formData[`teamMember${num}Gender`] === 'Male'}
                                  onChange={handleRadioChange}
                                  required
                                  className="w-5 h-5 text-orange-600 border-gray-300 focus:ring-orange-500 focus:ring-2"
                                />
                                <span className="ml-2 text-gray-700 font-sweet-sans group-hover:text-orange-600 transition-colors">Male</span>
                              </label>
                              <label className="flex items-center cursor-pointer group">
                                <input
                                  type="radio"
                                  name={`teamMember${num}Gender`}
                                  value="Female"
                                  checked={formData[`teamMember${num}Gender`] === 'Female'}
                                  onChange={handleRadioChange}
                                  required
                                  className="w-5 h-5 text-orange-600 border-gray-300 focus:ring-orange-500 focus:ring-2"
                                />
                                <span className="ml-2 text-gray-700 font-sweet-sans group-hover:text-orange-600 transition-colors">Female</span>
                              </label>
                            </div>
                          </div>
                          <div className="sm:col-span-2">
                            <label htmlFor={`teamMember${num}Contact`} className="block text-sm font-semibold text-gray-700 mb-1 font-fira-sans">
                              Contact Number <span className="text-orange-600">*</span>
                            </label>
                            <input
                              type="tel"
                              id={`teamMember${num}Contact`}
                              name={`teamMember${num}Contact`}
                              value={formData[`teamMember${num}Contact`]}
                              onChange={handleInputChange}
                              required
                              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all font-sweet-sans text-gray-900"
                              placeholder="+63 XXX XXX XXXX"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  /* ——— Individual registration ——— */
                  <>
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
                  </>
                )}

                {/* Affiliations Field (Optional, Required when Team Category) */}
                <div>
                  <label htmlFor="affiliations" className="block text-sm font-semibold text-gray-700 mb-2 font-fira-sans">
                    Affiliations / Club Organization / Team{' '}
                    {formData.raceCategory === 'Team Category' ? (
                      <span className="text-orange-600">(Required)</span>
                    ) : (
                      <span className="text-gray-400 text-xs">(Optional)</span>
                    )}
                  </label>
                  <input
                    type="text"
                    id="affiliations"
                    name="affiliations"
                    value={formData.affiliations}
                    onChange={handleInputChange}
                    required={formData.raceCategory === 'Team Category'}
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

                {/* Payment Instructions */}
                <div className="rounded-xl border-2 border-orange-200 bg-orange-50/80 p-6 space-y-4">
                  <h3 className="text-lg font-bold text-gray-900 font-fira-sans flex items-center gap-2">
                    <span className="text-orange-600">Payment Instructions</span>
                  </h3>
                  {formData.raceCategory && RACE_CATEGORY_PRICES[formData.raceCategory] && (
                    <div className="rounded-lg bg-white border border-orange-200 px-4 py-3">
                      <p className="text-sm font-semibold text-gray-700 font-fira-sans mb-1">Amount to pay</p>
                      <p className="text-xl font-bold text-orange-600 font-druk">
                        {RACE_CATEGORY_PRICES[formData.raceCategory].pricePhp}
                        <span className="text-base font-sweet-sans font-normal text-gray-600 ml-2">
                          (approx. {RACE_CATEGORY_PRICES[formData.raceCategory].priceUsd} USD)
                        </span>
                      </p>
                    </div>
                  )}
                  {(!formData.raceCategory || !RACE_CATEGORY_PRICES[formData.raceCategory]) && (
                    <p className="text-sm text-gray-600 font-sweet-sans">
                      Select a race category above to see the amount to pay.
                    </p>
                  )}
                  <div className="flex flex-col sm:flex-row gap-6 items-start flex-wrap">
                    <div className="flex-shrink-0 p-3 bg-white rounded-lg border border-orange-100 shadow-sm flex flex-col items-center">
                      <Image
                        src="/images/payment-options/gcash.jpg"
                        alt="GCash QR Code"
                        width={180}
                        height={180}
                        className="w-[180px] h-[180px] object-contain"
                      />
                      <p className="text-sm font-semibold text-gray-700 text-center mt-2 font-sweet-sans">GCash</p>
                      <a
                        href="/images/payment-options/gcash.jpg"
                        download="gcash-qr.jpg"
                        className="md:hidden mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white text-sm font-semibold rounded-lg hover:bg-orange-700 transition-colors font-fira-sans"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download QR
                      </a>
                    </div>
                    <div className="flex-shrink-0 p-3 bg-white rounded-lg border border-orange-100 shadow-sm flex flex-col items-center">
                      <Image
                        src="/images/payment-options/bank-transfer.jpg"
                        alt="Bank Transfer QR Code"
                        width={180}
                        height={180}
                        className="w-[180px] h-[180px] object-contain"
                      />
                      <p className="text-sm font-semibold text-gray-700 text-center mt-2 font-sweet-sans">Gotyme Bank Transfer</p>
                      <a
                        href="/images/payment-options/bank-transfer.jpg"
                        download="gotyme-bank-transfer-qr.jpg"
                        className="md:hidden mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white text-sm font-semibold rounded-lg hover:bg-orange-700 transition-colors font-fira-sans"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download QR
                      </a>
                    </div>
                    <div className="flex-1 min-w-[200px] space-y-2">
                      <p className="text-gray-700 font-sweet-sans">
                        After completing your registration, please send your proof of payment to complete the process.
                      </p>
                      <p className="text-gray-800 font-semibold font-fira-sans">
                        Email your proof of payment to:{' '}
                        <a
                          href="mailto:1@oneofakindasia.com"
                          className="text-orange-600 hover:text-orange-700 underline"
                        >
                          1@oneofakindasia.com
                        </a>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-orange-600 to-orange-500 text-white px-8 py-4 rounded-full font-bold text-lg hover:from-orange-700 hover:to-orange-600 transition-all transform hover:scale-105 shadow-lg font-fira-sans disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Registration'}
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

