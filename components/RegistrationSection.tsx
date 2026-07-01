'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Swal from 'sweetalert2';
import { PUBLIC_RACE_CATEGORY_NAMES, SPEED_DISTANCES, SPEED_DISTANCES_OPTIONS_TEXT } from '@/components/RaceCategoriesSection';
import { BasecampExperienceList } from '@/components/BasecampExperienceList';
import { computeRegistrationPaymentAmount } from '@/lib/registrationPaymentAmount';
import { PUBLIC_RACE_CATEGORY_SET, usesSpeedBasedPricing } from '@/lib/raceCategories';
import { normalizePhilippinesContact, PH_MOBILE_PREFIX, isPhilippinesContactIncomplete } from '@/lib/normalizePhilippinesContact';
import {
  isAdvocatePromoCode,
  isFcAdvocatePromoCode,
  isMissionStrongPromoCode,
  isSpecialAthletesPromoCode,
} from '@/lib/promoCodes';
import { formatVipSpeedRatePhp } from '@/lib/basecampExperience';

type RegistrationSectionProps = {
  selectedCategory?: string;
  onCategoryApplied?: () => void;
};

const T_SHIRT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

// Promo formats:
// - Advocate code: SPS2XU + digits (bypasses payment proof)
// - Founders Club: FC000001–FC000500 (₱1,500 VIP Speed Rate, payment still required)
// - Special code: SPSUAAPElite + digits (Athletes Category only)
const PROMO_MAX_LENGTH = 20;

/** Jan 1 of (current calendar year − years), for HTML date inputs (YYYY-MM-DD). */
function defaultBirthdayJan1YearsAgo(years: number): string {
  const y = new Date().getFullYear() - years;
  return `${y}-01-01`;
}

function createInitialFormData() {
  const b = defaultBirthdayJan1YearsAgo(13);
  return {
    name: '',
    email: '',
    contact: '',
    gender: '',
    birthday: b,
    raceCategory: '',
    speedDistance: '',
    affiliations: '',
    promotional: false,
    waiverAccepted: false,
    paymentProofSent: false,
    tShirtSize: '',
    promoCode: '',
    teamMember1Name: '',
    teamMember1Birthday: b,
    teamMember1Gender: '',
    teamMember1Contact: '',
    teamMember1TShirtSize: '',
    teamMember2Name: '',
    teamMember2Birthday: b,
    teamMember2Gender: '',
    teamMember2Contact: '',
    teamMember2TShirtSize: '',
    teamMember3Name: '',
    teamMember3Birthday: b,
    teamMember3Gender: '',
    teamMember3Contact: '',
    teamMember3TShirtSize: '',
    teamMember4Name: '',
    teamMember4Birthday: b,
    teamMember4Gender: '',
    teamMember4Contact: '',
    teamMember4TShirtSize: '',
  };
}

function buildClientSignupContext() {
  if (typeof window === 'undefined') return undefined;
  return {
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
    language: navigator.language,
  };
}

export default function RegistrationSection({ selectedCategory = '', onCategoryApplied }: RegistrationSectionProps) {
  const registrationSectionRef = useRef<HTMLElement>(null);
  const [isRegistrationVisible, setIsRegistrationVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState(() => createInitialFormData());

  const [promoCodeValid, setPromoCodeValid] = useState<boolean | null>(null);
  const [promoCodeError, setPromoCodeError] = useState('');
  const [isCheckingPromoCode, setIsCheckingPromoCode] = useState(false);
  const [paymentProofUrl, setPaymentProofUrl] = useState('');
  const [paymentProofUploading, setPaymentProofUploading] = useState(false);
  const [paymentProofUploadError, setPaymentProofUploadError] = useState('');
  const [paymentProofMethod, setPaymentProofMethod] = useState<'email' | 'upload' | null>(null);
  const paymentProofFileInputRef = useRef<HTMLInputElement>(null);

  const isTeam = formData.raceCategory === 'Team Category';
  const isDuo = formData.raceCategory === 'The Speed Duo - 2XU pair';
  const isGroupCategory = isTeam || isDuo;
  const memberKeys = (isTeam ? [1, 2, 3, 4] : isDuo ? [1, 2] : []) as Array<1 | 2 | 3 | 4>;
  const isSpecialPromoApplied =
    promoCodeValid === true && isSpecialAthletesPromoCode(formData.promoCode);
  const isMissionStrong500Applied =
    promoCodeValid === true && isMissionStrongPromoCode(formData.promoCode);
  const isFcPromoApplied =
    promoCodeValid === true && isFcAdvocatePromoCode(formData.promoCode);
  const promoForPayment = promoCodeValid === true ? formData.promoCode : '';
  const paymentAmount = formData.raceCategory
    ? computeRegistrationPaymentAmount(
        formData.raceCategory,
        promoForPayment,
        formData.speedDistance
      )
    : null;
  const needsSpeedForPrice =
    !!formData.raceCategory && usesSpeedBasedPricing(formData.raceCategory) && !formData.speedDistance;
  const finalPricePhpDisplay = paymentAmount ? `₱${paymentAmount.phpAmount.toLocaleString('en-PH')}` : '';
  const finalPriceUsdDisplay = paymentAmount?.usdDisplay ?? '';
  const hasValidAdvocateCode =
    promoCodeValid === true && isAdvocatePromoCode(formData.promoCode);
  const requiresPaymentProof = !hasValidAdvocateCode;
  const paymentProofComplete = formData.paymentProofSent || paymentProofUrl.trim().length > 0;
  const submitBlockedByPayment = requiresPaymentProof && !paymentProofComplete;

  // Auto-fill race category when user clicks a category card and scrolls here
  useEffect(() => {
    if (!selectedCategory || !PUBLIC_RACE_CATEGORY_SET.has(selectedCategory)) return;
    setFormData((prev) => ({
      ...prev,
      raceCategory: selectedCategory,
    }));
    onCategoryApplied?.();
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
    
    if (name === 'promoCode') {
      const upper = value.toUpperCase().slice(0, PROMO_MAX_LENGTH);
      setFormData(prev => ({ ...prev, promoCode: upper }));
      // Validate on blur only; while typing, clear previous validation state.
      setPromoCodeValid(null);
      setPromoCodeError('');
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePaymentProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setPaymentProofUploadError('');
    setPaymentProofUploading(true);
    try {
      const uploadData = new FormData();
      uploadData.append('file', file);
      const response = await fetch('/api/upload/payment-proof', {
        method: 'POST',
        body: uploadData,
      });
      const data = await response.json();
      if (!response.ok || typeof data.url !== 'string') {
        throw new Error(data.error || 'Failed to upload payment screenshot');
      }
      setPaymentProofUrl(data.url);
      setPaymentProofMethod('upload');
      setFormData((prev) => ({ ...prev, paymentProofSent: false }));
    } catch (error) {
      setPaymentProofUploadError(
        error instanceof Error ? error.message : 'Failed to upload payment screenshot'
      );
    } finally {
      setPaymentProofUploading(false);
    }
  };

  const selectPaymentProofEmail = () => {
    setPaymentProofMethod('email');
    setPaymentProofUrl('');
    setPaymentProofUploadError('');
    setFormData((prev) => ({ ...prev, paymentProofSent: false }));
  };

  const selectPaymentProofUpload = () => {
    setPaymentProofMethod('upload');
    setFormData((prev) => ({ ...prev, paymentProofSent: false }));
    setPaymentProofUploadError('');
  };

  const validatePromoCode = async (
    trimmed: string,
    raceCategory: string
  ): Promise<boolean | null> => {
    if (trimmed.length === 0) {
      setPromoCodeValid(null);
      setPromoCodeError('');
      return null;
    }

    setIsCheckingPromoCode(true);
    try {
      const response = await fetch('/api/register/validate-promo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          promoCode: trimmed,
          raceCategory,
        }),
      });

      const contentType = response.headers.get('content-type');
      let data: { valid?: boolean; error?: string } = {};
      if (contentType?.includes('application/json')) {
        data = await response.json();
      }

      if (!response.ok || data.valid !== true) {
        setPromoCodeValid(false);
        setPromoCodeError(data.error || 'Invalid Promo Code');
        return false;
      }

      setPromoCodeValid(true);
      setPromoCodeError('');
      return true;
    } catch {
      setPromoCodeValid(false);
      setPromoCodeError('Unable to validate promo code right now. Please try again.');
      return false;
    } finally {
      setIsCheckingPromoCode(false);
    }
  };

  const handlePromoBlur = async () => {
    await validatePromoCode(formData.promoCode.trim(), formData.raceCategory);
  };

  const confirmProceedWithoutInvalidAdvocateCode = async () => {
    const proceed = await Swal.fire({
      title: 'Advocate code invalid',
      text: 'This advocate code has already been used and is no longer valid. Do you want to proceed with your registration without it?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Proceed',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#ea580c',
      cancelButtonColor: '#6b7280',
      customClass: { confirmButton: 'font-fira-sans', cancelButton: 'font-fira-sans' },
    });
    return proceed.isConfirmed;
  };

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    const isRaceCategoryChange = name === 'raceCategory';
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (isRaceCategoryChange && prev.promoCode.trim().length > 0) {
        setPromoCodeValid(null);
        setPromoCodeError('');
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.waiverAccepted) {
      await Swal.fire({
        title: 'Waiver required',
        text: 'Please read and accept the Participant Digital Waiver before submitting.',
        icon: 'warning',
        confirmButtonText: 'OK',
        confirmButtonColor: '#ea580c',
        customClass: { confirmButton: 'font-fira-sans' },
      });
      return;
    }

    if (submitBlockedByPayment) {
      await Swal.fire({
        title: 'Payment proof required',
        text:
          paymentProofMethod == null
            ? 'Choose Email proof or Upload screenshot in Step 3, then complete that option.'
            : paymentProofMethod === 'email'
              ? 'Please check the box confirming you already emailed your proof of payment.'
              : 'Please upload your payment screenshot before submitting.',
        icon: 'warning',
        confirmButtonText: 'OK',
        confirmButtonColor: '#ea580c',
        customClass: { confirmButton: 'font-fira-sans' },
      });
      return;
    }

    const advocateCodeTrimmed = formData.promoCode.trim();

    if (advocateCodeTrimmed.length > 0) {
      let advocateValid = promoCodeValid;
      if (advocateValid === null) {
        advocateValid = await validatePromoCode(advocateCodeTrimmed, formData.raceCategory);
      }
      if (advocateValid === false) {
        const proceed = await confirmProceedWithoutInvalidAdvocateCode();
        if (!proceed) {
          return;
        }
      }
    }

    setIsSubmitting(true);

    try {
      const isTeam = formData.raceCategory === 'Team Category';
      const isDuo = formData.raceCategory === 'The Speed Duo - 2XU pair';
      const groupMemberKeys = (isTeam ? [1, 2, 3, 4] : isDuo ? [1, 2] : []) as Array<1 | 2 | 3 | 4>;

      if (groupMemberKeys.length === 0) {
        if (isPhilippinesContactIncomplete(normalizePhilippinesContact(formData.contact))) {
          await Swal.fire({
            title: 'Mobile number required',
            text: `Enter your mobile number (digits only; ${PH_MOBILE_PREFIX} is added when you submit).`,
            icon: 'warning',
            confirmButtonText: 'OK',
            confirmButtonColor: '#ea580c',
            customClass: { confirmButton: 'font-fira-sans' },
          });
          setIsSubmitting(false);
          return;
        }
      } else {
        for (const num of groupMemberKeys) {
          if (
            isPhilippinesContactIncomplete(
              normalizePhilippinesContact(formData[`teamMember${num}Contact`])
            )
          ) {
            await Swal.fire({
              title: 'Mobile number required',
              text: `Enter a mobile number for ${isDuo ? 'Duo' : 'Team'} member ${num} (digits after ${PH_MOBILE_PREFIX}).`,
              icon: 'warning',
              confirmButtonText: 'OK',
              confirmButtonColor: '#ea580c',
              customClass: { confirmButton: 'font-fira-sans' },
            });
            setIsSubmitting(false);
            return;
          }
        }
      }

      // Only save promo code when it was validated as valid; otherwise save registration without it
      const promoToSave = promoCodeValid === true ? formData.promoCode : '';
      const clientContext = buildClientSignupContext();
      const payload = groupMemberKeys.length > 0
        ? {
            email: formData.email,
            raceCategory: formData.raceCategory,
            affiliations: formData.affiliations,
            promotional: formData.promotional,
            waiverAccepted: formData.waiverAccepted,
            paymentProofSent: formData.paymentProofSent,
            paymentProofUrl: paymentProofUrl || undefined,
            promoCode: promoToSave || undefined,
            speedDistance: formData.speedDistance,
            clientContext,
            teamMembers: groupMemberKeys.map((num) => ({
              name: formData[`teamMember${num}Name`],
              birthday: formData[`teamMember${num}Birthday`],
              gender: formData[`teamMember${num}Gender`],
              contact: normalizePhilippinesContact(formData[`teamMember${num}Contact`]),
              tShirtSize: formData[`teamMember${num}TShirtSize`],
            })),
          }
        : {
            ...formData,
            contact: normalizePhilippinesContact(formData.contact),
            waiverAccepted: formData.waiverAccepted,
            paymentProofSent: formData.paymentProofSent,
            paymentProofUrl: paymentProofUrl || undefined,
            promoCode: promoToSave,
            clientContext,
          };

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
      setFormData(createInitialFormData());
      setPaymentProofUrl('');
      setPaymentProofMethod(null);
      setPaymentProofUploadError('');
      setPromoCodeValid(null);
      setPromoCodeError('');
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
            Secure your spots now!
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
                    {PUBLIC_RACE_CATEGORY_NAMES.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.raceCategory && (
                  <div>
                    <label
                      htmlFor="speedDistance"
                      className="block text-sm font-semibold text-gray-700 mb-2 font-fira-sans"
                    >
                      Speed option <span className="text-orange-600">*</span>
                    </label>
                    <select
                      id="speedDistance"
                      name="speedDistance"
                      value={formData.speedDistance}
                      onChange={handleSelectChange}
                      required
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all font-sweet-sans text-gray-900 bg-white"
                    >
                      <option value="">Select distance ({SPEED_DISTANCES_OPTIONS_TEXT})</option>
                      {SPEED_DISTANCES.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {isGroupCategory ? (
                  /* ——— Group registration: one email + member cards ——— */
                  <>
                    <div className="rounded-xl border-2 border-orange-200 bg-orange-50/50 p-4">
                      <p className="text-sm text-gray-700 font-fira-sans mb-4">
                        Enter {isDuo ? 'duo' : 'team'} contact email and details for each of the {memberKeys.length} members.
                      </p>
                      <div>
                        <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2 font-fira-sans">
                          {isDuo ? 'Duo contact email' : 'Team contact email'} <span className="text-orange-600">*</span>
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

                    {memberKeys.map((num) => (
                      <div
                        key={num}
                        className="rounded-xl border-2 border-gray-200 bg-gray-50/80 p-5 sm:p-6 space-y-4"
                      >
                        <h3 className="text-base font-bold text-gray-900 font-fira-sans flex items-center gap-2">
                          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-500 text-white text-sm">
                            {num}
                          </span>
                          {isDuo ? 'Duo Member' : 'Team Member'} {num}
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
                              Mobile number <span className="text-orange-600">*</span>
                            </label>
                            <div className="flex rounded-lg border border-gray-300 bg-white overflow-hidden focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 transition-all">
                              <span className="px-3 sm:px-4 py-3 bg-gray-50 text-gray-800 font-sweet-sans text-sm border-r border-gray-200 shrink-0 tabular-nums">
                                {PH_MOBILE_PREFIX}
                              </span>
                              <input
                                type="tel"
                                id={`teamMember${num}Contact`}
                                name={`teamMember${num}Contact`}
                                inputMode="tel"
                                autoComplete="tel-national"
                                value={formData[`teamMember${num}Contact`]}
                                onChange={handleInputChange}
                                required
                                className="flex-1 min-w-0 px-4 py-3 border-0 font-sweet-sans text-gray-900 focus:ring-0 focus:outline-none placeholder:text-gray-400"
                                placeholder="Ex. (966-123-4567)"
                              />
                            </div>
                          </div>
                          <div>
                            <label htmlFor={`teamMember${num}TShirtSize`} className="block text-sm font-semibold text-gray-700 mb-1 font-fira-sans">
                              Top size <span className="text-orange-600">*</span>
                            </label>
                            <select
                              id={`teamMember${num}TShirtSize`}
                              name={`teamMember${num}TShirtSize`}
                              value={formData[`teamMember${num}TShirtSize`]}
                              onChange={handleSelectChange}
                              required
                              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all font-sweet-sans text-gray-900 bg-white"
                            >
                              <option value="">Select size</option>
                              {T_SHIRT_SIZES.map((size) => (
                                <option key={size} value={size}>{size}</option>
                              ))}
                            </select>
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
                        Mobile number <span className="text-orange-600">*</span>
                      </label>
                      <div className="flex rounded-lg border border-gray-300 bg-white overflow-hidden focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 transition-all">
                        <span className="px-3 sm:px-4 py-3 bg-gray-50 text-gray-800 font-sweet-sans text-sm border-r border-gray-200 shrink-0 tabular-nums">
                          {PH_MOBILE_PREFIX}
                        </span>
                        <input
                          type="tel"
                          id="contact"
                          name="contact"
                          inputMode="tel"
                          autoComplete="tel-national"
                          value={formData.contact}
                          onChange={handleInputChange}
                          required
                          className="flex-1 min-w-0 px-4 py-3 border-0 font-sweet-sans text-gray-900 focus:ring-0 focus:outline-none placeholder:text-gray-400"
                          placeholder="Ex. (966-123-4567)"
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-500 font-sweet-sans">
                        Country code {PH_MOBILE_PREFIX} is added automatically when you submit.
                      </p>
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

                    <div>
                      <label htmlFor="tShirtSize" className="block text-sm font-semibold text-gray-700 mb-2 font-fira-sans">
                        Top size <span className="text-orange-600">*</span>
                      </label>
                      <select
                        id="tShirtSize"
                        name="tShirtSize"
                        value={formData.tShirtSize}
                        onChange={handleSelectChange}
                        required
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all font-sweet-sans text-gray-900 bg-white"
                      >
                        <option value="">Select size</option>
                        {T_SHIRT_SIZES.map((size) => (
                          <option key={size} value={size}>{size}</option>
                        ))}
                      </select>
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

                {/* Advocate / promo code (optional) */}
                <div>
                  <label htmlFor="promoCode" className="block text-sm font-semibold text-gray-700 mb-2 font-fira-sans">
                    Advocate / promo code <span className="text-gray-400 text-xs font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="promoCode"
                      name="promoCode"
                      value={formData.promoCode}
                      onChange={handleInputChange}
                      onBlur={handlePromoBlur}
                      maxLength={PROMO_MAX_LENGTH}
                      placeholder="e.g. SPS2XU1 or FC000001"
                      className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-orange-500/20 transition-all font-sweet-sans text-gray-900 pr-12 ${
                        promoCodeValid === true
                          ? 'border-green-500 bg-green-50/50'
                          : promoCodeValid === false
                            ? 'border-red-400 focus:border-orange-500 bg-white'
                            : 'border-gray-300 focus:border-orange-500 bg-white'
                      }`}
                    />
                    {promoCodeValid === true && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600" aria-hidden="true">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    )}
                  </div>
                  {isCheckingPromoCode && (
                    <p className="mt-1.5 text-sm text-gray-500 font-sweet-sans">Checking promo code...</p>
                  )}
                  {promoCodeValid === false && (
                    <p className="mt-1.5 text-sm text-red-600 font-sweet-sans">
                      {promoCodeError || 'Invalid Promo Code'}
                    </p>
                  )}
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

                {/* Participant Digital Waiver — must accept before submit */}
                <div className="rounded-xl border-2 border-gray-200 bg-gray-50/80 p-5 sm:p-6 space-y-4">
                  <h3 className="text-base font-bold text-gray-900 font-fira-sans">
                    SPEED SERIES POWERED BY 2XU — Participant Digital Waiver
                  </h3>
                  <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-700 font-sweet-sans leading-relaxed">
                    <p className="mb-3">
                      By checking this box, I confirm that I am physically prepared and voluntarily participating in
                      Speed Series Powered by 2XU. I understand that endurance events involve inherent physical
                      demands and risks, including the possibility of serious injury or other unforeseen medical
                      emergencies. I willingly assume full responsibility for my participation and release the
                      organizers, sponsors, and affiliated parties from claims arising from risks inherent to the event, to
                      the fullest extent permitted by law.
                    </p>
                    <p className="mb-3">
                      I authorize emergency medical assistance if necessary and accept responsibility for related costs.
                      I grant permission for the use of my name, image, likeness, and race results for promotional
                      purposes without compensation. I consent to the collection and processing of my personal data
                      for registration, timing, communication, and publication of official results.
                    </p>
                  </div>
                  <div className="flex items-start">
                    <div className="flex items-center h-5 shrink-0">
                      <input
                        type="checkbox"
                        id="waiverAccepted"
                        name="waiverAccepted"
                        checked={formData.waiverAccepted}
                        onChange={handleInputChange}
                        required
                        className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
                      />
                    </div>
                    <label htmlFor="waiverAccepted" className="ml-3 text-sm font-semibold text-gray-800 font-fira-sans cursor-pointer">
                      I have read, understood, and agree to this Waiver and Release. <span className="text-orange-600">*</span>
                    </label>
                  </div>
                </div>

                {/* Payment Instructions — required unless valid SPS2XU advocate code */}
                {requiresPaymentProof && (
                <div className="rounded-xl border-2 border-orange-200 bg-orange-50/80 p-6 space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 font-fira-sans">
                      <span className="text-orange-600">Payment Instructions</span>
                    </h3>
                    <p className="mt-1 text-sm text-gray-600 font-sweet-sans">
                      Scan to pay, then confirm your proof below to complete registration.
                    </p>
                  </div>

                  {/* Step 1 — Amount */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wide text-orange-700 font-fira-sans">
                      Step 1 · Amount to pay
                    </p>
                    {paymentAmount ? (
                      <div className="rounded-lg bg-white border border-orange-200 px-4 py-3">
                        <p className="text-xl font-bold text-orange-600 font-druk">
                          {finalPricePhpDisplay}
                          <span className="text-base font-sweet-sans font-normal text-gray-600 ml-2">
                            (approx. {finalPriceUsdDisplay} USD)
                          </span>
                        </p>
                        {isSpecialPromoApplied && (
                          <p className="mt-1 text-xs text-green-700 font-sweet-sans">
                            Promo code SPSUAAPElite applied.
                          </p>
                        )}
                        {isFcPromoApplied && (
                          <div className="mt-3 rounded-lg border border-green-200 bg-green-50/80 px-3 py-3 text-left">
                            <p className="text-xs text-green-800 font-sweet-sans">
                              Promo code {formData.promoCode.trim().toUpperCase()} applied. Registration fee is{' '}
                              {formatVipSpeedRatePhp()} VIP Speed Rate.
                            </p>
                            <div className="mt-3 border-t border-green-200 pt-3">
                              <BasecampExperienceList variant="registration" showVipRate={false} />
                            </div>
                          </div>
                        )}
                        {isMissionStrong500Applied && (
                          <p className="mt-1 text-xs text-green-700 font-sweet-sans">
                            Promo code MissionStrong500 applied. ₱500 discount has been deducted.
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600 font-sweet-sans rounded-lg bg-white/80 border border-orange-100 px-4 py-3">
                        {needsSpeedForPrice
                          ? 'Select your speed option above to see the registration fee.'
                          : 'Select a race category above to see the amount to pay.'}
                      </p>
                    )}
                  </div>

                  {/* Step 2 — Scan to pay */}
                  <div className="space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-orange-700 font-fira-sans">
                      Step 2 · Scan to pay
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 bg-white rounded-lg border border-orange-100 shadow-sm flex flex-col items-center text-center">
                        <Image
                          src="/images/payment-options/gcash.jpg"
                          alt="GCash QR Code"
                          width={160}
                          height={160}
                          className="w-[160px] h-[160px] object-contain"
                        />
                        <p className="text-sm font-semibold text-gray-800 mt-2 font-fira-sans">GCash</p>
                        <a
                          href="/images/payment-options/gcash.jpg"
                          download="gcash-qr.jpg"
                          className="md:hidden mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 bg-orange-600 text-white text-sm font-semibold rounded-lg hover:bg-orange-700 transition-colors font-fira-sans"
                        >
                          Download QR
                        </a>
                      </div>
                      <div className="p-4 bg-white rounded-lg border border-orange-100 shadow-sm flex flex-col items-center text-center">
                        <Image
                          src="/images/payment-options/bank-transfer.jpg"
                          alt="Bank Transfer QR Code"
                          width={160}
                          height={160}
                          className="w-[160px] h-[160px] object-contain"
                        />
                        <p className="text-sm font-semibold text-gray-800 mt-2 font-fira-sans">Gotyme Bank Transfer</p>
                        <a
                          href="/images/payment-options/bank-transfer.jpg"
                          download="gotyme-bank-transfer-qr.jpg"
                          className="md:hidden mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 bg-orange-600 text-white text-sm font-semibold rounded-lg hover:bg-orange-700 transition-colors font-fira-sans"
                        >
                          Download QR
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Step 3 — Proof of payment */}
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-orange-700 font-fira-sans">
                        Step 3 · Confirm proof of payment
                      </p>
                      <p className="mt-2 text-sm text-gray-700 font-sweet-sans leading-relaxed">
                        After completing your registration, please send your proof of payment to complete the
                        process. Choose one option below:
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={selectPaymentProofEmail}
                        className={`text-left rounded-xl border-2 px-4 py-4 transition-all font-fira-sans ${
                          paymentProofMethod === 'email'
                            ? 'border-orange-500 bg-white shadow-md ring-2 ring-orange-200'
                            : 'border-orange-200 bg-white/70 hover:border-orange-400 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                              paymentProofMethod === 'email'
                                ? 'border-orange-600 bg-orange-600'
                                : 'border-gray-300 bg-white'
                            }`}
                            aria-hidden
                          >
                            {paymentProofMethod === 'email' && (
                              <span className="h-2 w-2 rounded-full bg-white" />
                            )}
                          </span>
                          <span>
                            <span className="block text-sm font-bold text-gray-900">Email proof</span>
                            <span className="mt-1 block text-xs text-gray-600 font-sweet-sans leading-snug">
                              Send to{' '}
                              <span className="font-semibold text-orange-700">1@oneofakindasia.com</span>
                            </span>
                          </span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={selectPaymentProofUpload}
                        className={`text-left rounded-xl border-2 px-4 py-4 transition-all font-fira-sans ${
                          paymentProofMethod === 'upload'
                            ? 'border-orange-500 bg-white shadow-md ring-2 ring-orange-200'
                            : 'border-orange-200 bg-white/70 hover:border-orange-400 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                              paymentProofMethod === 'upload'
                                ? 'border-orange-600 bg-orange-600'
                                : 'border-gray-300 bg-white'
                            }`}
                            aria-hidden
                          >
                            {paymentProofMethod === 'upload' && (
                              <span className="h-2 w-2 rounded-full bg-white" />
                            )}
                          </span>
                          <span>
                            <span className="block text-sm font-bold text-gray-900">Upload screenshot</span>
                            <span className="mt-1 block text-xs text-gray-600 font-sweet-sans leading-snug">
                              Attach your payment receipt here
                            </span>
                          </span>
                        </div>
                      </button>
                    </div>

                    {paymentProofMethod === 'email' && (
                      <div className="rounded-lg border border-orange-200 bg-white p-4 space-y-4">
                        <p className="text-sm text-gray-700 font-sweet-sans">
                          Email your proof of payment to:{' '}
                          <a
                            href="mailto:1@oneofakindasia.com"
                            className="font-semibold text-orange-600 hover:text-orange-700 underline"
                          >
                            1@oneofakindasia.com
                          </a>
                        </p>
                        <div className="flex items-start rounded-lg bg-orange-50/80 border border-orange-100 px-3 py-3">
                          <div className="flex items-center h-5 shrink-0">
                            <input
                              type="checkbox"
                              id="paymentProofSent"
                              name="paymentProofSent"
                              checked={formData.paymentProofSent}
                              onChange={(e) => {
                                handleInputChange(e);
                                if (e.target.checked) {
                                  setPaymentProofMethod('email');
                                }
                              }}
                              className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
                            />
                          </div>
                          <label
                            htmlFor="paymentProofSent"
                            className="ml-3 text-sm font-semibold text-gray-800 font-fira-sans cursor-pointer"
                          >
                            I already sent proof of payment thru email
                          </label>
                        </div>
                      </div>
                    )}

                    {paymentProofMethod === 'upload' && (
                      <div className="rounded-lg border border-orange-200 bg-white p-4 space-y-3">
                        <p className="text-sm text-gray-700 font-sweet-sans">
                          Upload a clear screenshot of your GCash or bank transfer receipt.
                        </p>
                        <input
                          ref={paymentProofFileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          className="hidden"
                          onChange={(e) => void handlePaymentProofUpload(e)}
                        />
                        {paymentProofUrl ? (
                          <div className="space-y-2">
                            <div className="inline-block rounded-lg border border-green-200 bg-green-50/50 p-2">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={paymentProofUrl}
                                alt="Uploaded payment proof"
                                className="max-h-44 w-auto rounded-md object-contain"
                              />
                            </div>
                            <p className="text-xs text-green-700 font-semibold font-sweet-sans">
                              Payment screenshot uploaded — you can submit registration.
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                setPaymentProofUrl('');
                                setPaymentProofUploadError('');
                              }}
                              className="text-xs font-semibold text-gray-600 hover:text-orange-600 font-fira-sans underline"
                            >
                              Remove and upload a different image
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => paymentProofFileInputRef.current?.click()}
                            disabled={paymentProofUploading}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 transition-colors font-fira-sans disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {paymentProofUploading ? 'Uploading…' : 'Choose payment screenshot'}
                          </button>
                        )}
                        {paymentProofUploadError && (
                          <p className="text-xs text-red-600 font-sweet-sans">{paymentProofUploadError}</p>
                        )}
                        <p className="text-xs text-gray-500 font-sweet-sans">JPG, PNG, or WebP · max 5 MB</p>
                      </div>
                    )}

                    {!paymentProofComplete && (
                      <p className="text-xs text-orange-800 font-sweet-sans rounded-lg bg-orange-100/80 border border-orange-200 px-3 py-2">
                        {paymentProofMethod == null
                          ? 'Select Email proof or Upload screenshot above, then complete that step to enable registration.'
                          : paymentProofMethod === 'email'
                            ? 'Check the box above once you have emailed your proof of payment.'
                            : 'Upload your payment screenshot to continue.'}
                      </p>
                    )}
                  </div>
                </div>
                )}

                {/* Submit Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting || isCheckingPromoCode || paymentProofUploading || submitBlockedByPayment}
                    title={
                      submitBlockedByPayment
                        ? 'Confirm payment by email or upload your payment screenshot first'
                        : undefined
                    }
                    className="w-full bg-gradient-to-r from-orange-600 to-orange-500 text-white px-8 py-4 rounded-full font-bold text-lg hover:from-orange-700 hover:to-orange-600 transition-all transform hover:scale-105 shadow-lg font-fira-sans disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isCheckingPromoCode
                      ? 'Checking advocate code...'
                      : isSubmitting
                        ? 'Submitting...'
                        : 'Submit Registration'}
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

