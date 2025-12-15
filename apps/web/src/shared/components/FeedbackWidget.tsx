'use client';

import { useState } from 'react';

export function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          message,
          email: email || null,
          source_page: typeof window !== 'undefined' ? window.location.pathname : '/',
          user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        }),
      });

      if (response.ok) {
        setIsSubmitted(true);
        setTimeout(() => {
          setIsOpen(false);
          setIsSubmitted(false);
          setMessage('');
          setEmail('');
          setRating(0);
        }, 2500);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to send feedback');
      }
    } catch (err) {
      console.error('Feedback submission failed:', err);
      setError('Failed to send feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = () => {
    return (
      <div className="flex gap-1 justify-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            className="p-1 transition-transform hover:scale-110"
          >
            <svg
              className={`w-8 h-8 transition-colors ${
                star <= (hoverRating || rating)
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-gray-300 fill-gray-300'
              }`}
              viewBox="0 0 24 24"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </button>
        ))}
      </div>
    );
  };

  return (
    <>
      {/* Floating Feedback Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-blue-600 to-blue-800 text-white px-4 py-2.5 rounded-full shadow-lg hover:scale-105 transition-transform flex items-center gap-2 border border-blue-500"
        aria-label="Send Feedback"
        title="Send Feedback"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
        <span className="text-sm font-medium">Feedback</span>
      </button>

      {/* Feedback Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-gradient-to-b from-blue-900 to-blue-950 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-blue-700"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-blue-900 p-4 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold">Send Feedback</h3>
                <p className="text-sm text-blue-900/70">Help us improve Bible Games</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-blue-900/20 p-2 rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {isSubmitted ? (
                <div className="text-center py-8">
                  <div className="text-5xl mb-4">🎉</div>
                  <h4 className="text-xl font-bold text-yellow-400 mb-2">Thank You!</h4>
                  <p className="text-blue-200">Your feedback has been received.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Star Rating */}
                  <div>
                    <label className="block text-sm font-medium text-blue-200 mb-3 text-center">
                      How would you rate your experience?
                    </label>
                    {renderStars()}
                    {rating > 0 && (
                      <p className="text-center text-yellow-400 text-sm mt-2">
                        {rating === 1 && 'Poor'}
                        {rating === 2 && 'Fair'}
                        {rating === 3 && 'Good'}
                        {rating === 4 && 'Very Good'}
                        {rating === 5 && 'Excellent!'}
                      </p>
                    )}
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-medium text-blue-200 mb-2">
                      What&apos;s on your mind? *
                    </label>
                    <textarea
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={4}
                      placeholder="Tell us what you think, report a bug, or suggest an improvement..."
                      className="w-full px-3 py-2 bg-blue-900/50 border border-blue-600 rounded-lg text-white placeholder-blue-400 focus:ring-2 focus:ring-yellow-400 focus:border-transparent resize-none"
                    />
                  </div>

                  {/* Email (optional) */}
                  <div>
                    <label className="block text-sm font-medium text-blue-200 mb-2">
                      Email (optional)
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full px-3 py-2 bg-blue-900/50 border border-blue-600 rounded-lg text-white placeholder-blue-400 focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    />
                    <p className="text-xs text-blue-400 mt-1">
                      Only if you&apos;d like us to follow up
                    </p>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="bg-red-900/50 border border-red-600 rounded-lg p-3 text-red-200 text-sm">
                      {error}
                    </div>
                  )}

                  {/* Current Page Info */}
                  <div className="bg-blue-950/50 rounded-lg p-3 text-xs text-blue-400">
                    <span className="font-medium">Page:</span> {typeof window !== 'undefined' ? window.location.pathname : '/'}
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isSubmitting || !message.trim()}
                    className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-blue-900 py-3 rounded-lg font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-900 border-t-transparent"></div>
                        Sending...
                      </>
                    ) : (
                      'Send Feedback'
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
