'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Swal from 'sweetalert2';
import 'react-quill/dist/quill.snow.css';

interface EmailBlast {
  _id: string;
  messageHtml: string;
  messageText: string;
  mode?: 'blast' | 'test';
  testRecipients?: string[];
  recipientCount: number;
  successCount: number;
  failedCount: number;
  status: 'sent' | 'partial' | 'failed';
  createdAt: string;
  sentAt: string;
}

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

export default function EmailBlastPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [emailBlastEnabled, setEmailBlastEnabled] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [blasts, setBlasts] = useState<EmailBlast[]>([]);
  const [messageHtml, setMessageHtml] = useState('<p></p>');
  const [isTestMode, setIsTestMode] = useState(false);
  const [testEmails, setTestEmails] = useState('');
  const quillModules = useMemo(
    () => ({
      toolbar: [
        [{ header: [2, 3, false] }],
        ['bold', 'italic', 'underline'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link'],
        ['clean'],
      ],
    }),
    []
  );

  const quillFormats = ['header', 'bold', 'italic', 'underline', 'list', 'bullet', 'link'];

  useEffect(() => {
    fetchConfig();
    fetchBlasts();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/users/config');
      if (response.status === 401) {
        router.push('/login');
        return;
      }
      if (!response.ok) return;
      const data = await response.json();
      const enabled = data.emailBlastEnabled === true;
      setEmailBlastEnabled(enabled);
      if (!enabled) {
        await Swal.fire({
          title: 'Email blast disabled',
          text: 'This feature is currently disabled by environment settings.',
          icon: 'info',
          confirmButtonColor: '#ea580c',
        });
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Fetch config error:', error);
    }
  };

  const fetchBlasts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/email-blasts');
      if (response.status === 401) {
        router.push('/login');
        return;
      }
      if (response.status === 403) {
        setEmailBlastEnabled(false);
        router.push('/dashboard');
        return;
      }
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to load blasts');
      setBlasts(data.blasts || []);
    } catch (error) {
      console.error('Fetch blasts error:', error);
      Swal.fire({
        title: 'Error',
        text: 'Failed to load email blasts.',
        icon: 'error',
        confirmButtonColor: '#ea580c',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleSendBlast = async () => {
    const plainText = messageHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!plainText) {
      Swal.fire({
        title: 'Message required',
        text: 'Please enter an email message before sending.',
        icon: 'warning',
        confirmButtonColor: '#ea580c',
      });
      return;
    }

    const confirmation = await Swal.fire({
      title: 'Send email blast?',
      text: isTestMode
        ? 'This will send only to the test email address(es) you provided.'
        : 'This will send the message to all registered users.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, send now',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#ea580c',
      cancelButtonColor: '#6b7280',
    });

    if (!confirmation.isConfirmed) return;

    setIsSending(true);
    try {
      const response = await fetch('/api/email-blasts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageHtml, isTestMode, testEmails }),
      });
      const data = await response.json();

      if (response.status === 401) {
        router.push('/login');
        return;
      }

      if (!response.ok) throw new Error(data.error || 'Failed to send email blast');

      await Swal.fire({
        title: isTestMode ? 'Test email sent' : 'Email blast sent',
        text: `Sent to ${data.blast?.successCount ?? 0} recipient(s).`,
        icon: 'success',
        confirmButtonColor: '#ea580c',
      });

      setShowModal(false);
      setMessageHtml('<p></p>');
      setIsTestMode(false);
      setTestEmails('');
      fetchBlasts();
    } catch (error) {
      console.error('Send blast error:', error);
      Swal.fire({
        title: 'Send failed',
        text: error instanceof Error ? error.message : 'Failed to send email blast.',
        icon: 'error',
        confirmButtonColor: '#ea580c',
      });
    } finally {
      setIsSending(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusStyle = (status: EmailBlast['status']) => {
    if (status === 'sent') return 'bg-green-100 text-green-800';
    if (status === 'partial') return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 font-druk">User Dashboard</h1>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-3 py-1.5 rounded-md text-sm font-fira-sans border border-orange-500 text-orange-600 hover:bg-orange-50 transition-colors"
              >
                Users
              </button>
              {emailBlastEnabled && (
                <button
                  onClick={() => router.push('/dashboard/email-blast')}
                  className="px-3 py-1.5 rounded-md text-sm font-fira-sans bg-orange-600 text-white hover:bg-orange-700 transition-colors"
                >
                  Email Blast
                </button>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-fira-sans"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 flex flex-wrap justify-between items-center gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 font-druk">Email Blast</h2>
            <p className="text-sm text-gray-600 font-sweet-sans">
              Create and send announcements to all registered users.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-fira-sans"
          >
            Create Email Blast
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 font-druk">Sent Messages</h3>
          </div>
          {isLoading ? (
            <div className="p-8 text-center text-gray-500 font-sweet-sans">Loading messages...</div>
          ) : blasts.length === 0 ? (
            <div className="p-8 text-center text-gray-500 font-sweet-sans">No email blasts sent yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-fira-sans">
                      Message
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-fira-sans">
                      Mode
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-fira-sans">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-fira-sans">
                      Recipients
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-fira-sans">
                      Sent At
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {blasts.map((blast) => (
                    <tr key={blast._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-700 font-sweet-sans max-w-xl">
                        <p className="max-h-16 overflow-hidden">{blast.messageText}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-sweet-sans">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            blast.mode === 'test' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                          }`}
                        >
                          {blast.mode === 'test' ? 'test' : 'blast'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-sweet-sans">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusStyle(blast.status)}`}>
                          {blast.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-sweet-sans">
                        {blast.successCount}/{blast.recipientCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-sweet-sans">
                        {formatDate(blast.sentAt || blast.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-6xl">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 font-druk">Create Email Blast</h3>
              <button
                onClick={() => setShowModal(false)}
                disabled={isSending}
                className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 font-sweet-sans mb-4">
                Compose your message on the left and check live preview on the right.
              </p>
              <div className="mb-4 p-4 rounded-md border border-gray-200 bg-gray-50">
                <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-800 font-fira-sans">
                  <input
                    type="checkbox"
                    checked={isTestMode}
                    onChange={(e) => setIsTestMode(e.target.checked)}
                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                  Send as test email only
                </label>
                {isTestMode && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1 font-fira-sans">
                      Test recipient emails (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={testEmails}
                      onChange={(e) => setTestEmails(e.target.value)}
                      placeholder="name1@example.com, name2@example.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 font-sweet-sans text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1 font-sweet-sans">
                      When enabled, the message will not be sent to users in the database.
                    </p>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-semibold text-gray-800 font-fira-sans mb-2">Editor</h4>
                  <ReactQuill
                    theme="snow"
                    value={messageHtml}
                    onChange={setMessageHtml}
                    modules={quillModules}
                    formats={quillFormats}
                    className="font-sweet-sans"
                  />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-800 font-fira-sans mb-2">Live Preview</h4>
                  <div className="min-h-60 max-h-[420px] overflow-y-auto border border-gray-300 rounded-md p-4 bg-gray-50">
                    {messageHtml.replace(/<[^>]+>/g, '').trim() ? (
                      <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: messageHtml }} />
                    ) : (
                      <p className="text-sm text-gray-500 font-sweet-sans">Your email preview will appear here.</p>
                    )}
                  </div>
                </div>
              </div>
              <style jsx global>{`
                .ql-editor {
                  min-height: 240px;
                }
              `}</style>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                disabled={isSending}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-fira-sans disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSendBlast}
                disabled={isSending}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-fira-sans disabled:opacity-50"
              >
                {isSending ? 'Sending...' : 'Send Email Blast'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
