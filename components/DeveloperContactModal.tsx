'use client';

import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';

type DeveloperContactModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const initialForm = {
  name: '',
  email: '',
  contact: '',
  message: '',
};

export default function DeveloperContactModal({ isOpen, onClose }: DeveloperContactModalProps) {
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setForm(initialForm);
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/developer-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const contentType = response.headers.get('content-type');
      let data: { error?: string } = {};
      if (contentType?.includes('application/json')) {
        data = await response.json();
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      setForm(initialForm);
      onClose();
      await Swal.fire({
        title: 'Message sent',
        text: 'Thanks for reaching out. The developer will get back to you soon.',
        icon: 'success',
        confirmButtonText: 'OK',
        confirmButtonColor: '#ea580c',
        customClass: { confirmButton: 'font-fira-sans' },
      });
    } catch (error) {
      await Swal.fire({
        title: 'Could not send',
        text: error instanceof Error ? error.message : 'Please try again later.',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#ea580c',
        customClass: { confirmButton: 'font-fira-sans' },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60"
      role="dialog"
      aria-modal="true"
      aria-labelledby="developer-contact-title"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-lg max-h-[min(92vh,92dvh)] overflow-y-auto rounded-2xl bg-white shadow-2xl border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleClose}
          disabled={isSubmitting}
          className="absolute right-3 top-3 z-10 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 disabled:opacity-50"
          aria-label="Close contact form"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="px-6 pb-6 pt-8 sm:px-8">
          <h2 id="developer-contact-title" className="text-2xl font-bold text-gray-900 font-druk pr-10">
            Contact Developer
          </h2>
          <p className="mt-2 text-sm text-gray-600 font-sweet-sans">
            Send a message to the site developer. Include how we can reach you back.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="developer-contact-name" className="block text-sm font-semibold text-gray-700 mb-1.5 font-fira-sans">
                Name <span className="text-orange-600">*</span>
              </label>
              <input
                id="developer-contact-name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                required
                autoComplete="name"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all font-sweet-sans text-gray-900"
                placeholder="Your full name"
              />
            </div>

            <div>
              <label htmlFor="developer-contact-email" className="block text-sm font-semibold text-gray-700 mb-1.5 font-fira-sans">
                Email <span className="text-orange-600">*</span>
              </label>
              <input
                id="developer-contact-email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all font-sweet-sans text-gray-900"
                placeholder="your.email@example.com"
              />
            </div>

            <div>
              <label htmlFor="developer-contact-contact" className="block text-sm font-semibold text-gray-700 mb-1.5 font-fira-sans">
                Contact number <span className="text-orange-600">*</span>
              </label>
              <input
                id="developer-contact-contact"
                name="contact"
                type="tel"
                value={form.contact}
                onChange={handleChange}
                required
                autoComplete="tel"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all font-sweet-sans text-gray-900"
                placeholder="Landline or mobile number"
              />
            </div>

            <div>
              <label htmlFor="developer-contact-message" className="block text-sm font-semibold text-gray-700 mb-1.5 font-fira-sans">
                Message <span className="text-orange-600">*</span>
              </label>
              <textarea
                id="developer-contact-message"
                name="message"
                value={form.message}
                onChange={handleChange}
                required
                rows={5}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all font-sweet-sans text-gray-900 resize-y min-h-[120px]"
                placeholder="How can we help?"
              />
            </div>

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-5 py-3 rounded-lg border border-gray-300 text-gray-700 font-semibold font-fira-sans transition hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-5 py-3 rounded-lg bg-orange-600 text-white font-semibold font-fira-sans transition hover:bg-orange-700 disabled:opacity-60"
              >
                {isSubmitting ? 'Sending…' : 'Send message'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
