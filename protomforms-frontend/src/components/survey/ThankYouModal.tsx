import React, { useEffect, useState } from 'react';
import Confetti from 'react-confetti';
import { CheckCircle2, X } from 'lucide-react';

interface ThankYouModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string | null;
  progressiveNumber?: number;
}

const ThankYouModal: React.FC<ThankYouModalProps> = ({
  isOpen,
  onClose,
  message,
  progressiveNumber,
}) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      // Stop confetti after 5 seconds
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isOpen) return null;

  const displayMessage = message || 'Grazie per la tua risposta!';

  return (
    <>
      {/* Confetti Effect */}
      {showConfetti && (
        <Confetti
          width={dimensions.width}
          height={dimensions.height}
          recycle={false}
          numberOfPieces={500}
          gravity={0.3}
        />
      )}

      {/* Modal Overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300"
        onClick={onClose}
      >
        {/* Modal Content */}
        <div
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative animate-in zoom-in-95 slide-in-from-bottom-4 duration-500"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Chiudi"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Success Icon */}
          <div className="flex justify-center mb-6 animate-in zoom-in duration-700 delay-200">
            <div className="relative">
              <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping" />
              <div className="relative bg-green-500 rounded-full p-4">
                <CheckCircle2 className="w-12 h-12 text-white" strokeWidth={2.5} />
              </div>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-4 animate-in slide-in-from-bottom-2 duration-500 delay-300">
            Risposta Inviata!
          </h2>

          {/* Custom Message */}
          <p className="text-center text-gray-600 text-lg mb-6 leading-relaxed animate-in slide-in-from-bottom-2 duration-500 delay-400">
            {displayMessage}
          </p>

          {/* Progressive Number */}
          {progressiveNumber && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-6 animate-in slide-in-from-bottom-2 duration-500 delay-500">
              <div className="flex items-center justify-center gap-2">
                <span className="text-gray-600 text-sm font-medium">
                  Sei il numero
                </span>
                <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {progressiveNumber}
                </span>
              </div>
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl animate-in slide-in-from-bottom-2 duration-500 delay-600"
          >
            Vedi le tue risposte
          </button>
        </div>
      </div>
    </>
  );
};

export default ThankYouModal;
