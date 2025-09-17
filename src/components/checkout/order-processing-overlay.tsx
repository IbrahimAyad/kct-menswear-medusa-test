'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Package, CheckCircle, Loader2, Lock } from 'lucide-react';
import { useEffect, useState } from 'react';

interface OrderProcessingOverlayProps {
  isVisible: boolean;
  currentStep?: number;
  totalSteps?: number;
}

const processingSteps = [
  { 
    id: 'payment',
    title: 'Securing Payment',
    subtitle: 'Your payment is being processed securely',
    icon: Lock,
    color: 'blue'
  },
  { 
    id: 'verify',
    title: 'Verifying Order',
    subtitle: 'Confirming product availability',
    icon: Shield,
    color: 'purple'
  },
  { 
    id: 'create',
    title: 'Creating Order',
    subtitle: 'Finalizing your purchase details',
    icon: Package,
    color: 'orange'
  },
  { 
    id: 'confirm',
    title: 'Order Confirmed',
    subtitle: 'Your order has been successfully placed',
    icon: CheckCircle,
    color: 'green'
  }
];

export function OrderProcessingOverlay({ 
  isVisible,
  currentStep = 0,
  totalSteps = 4
}: OrderProcessingOverlayProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!isVisible) {
      setActiveStep(0);
      setShowSuccess(false);
      return;
    }

    // Auto-progress through steps (more realistic timing)
    const stepDuration = 2500; // 2.5 seconds per step
    const timer = setInterval(() => {
      setActiveStep(prev => {
        if (prev >= processingSteps.length - 1) {
          setShowSuccess(true);
          clearInterval(timer);
          return prev;
        }
        return prev + 1;
      });
    }, stepDuration);

    return () => clearInterval(timer);
  }, [isVisible]);

  const currentStepData = processingSteps[activeStep];

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50"
          />

          {/* Content Overlay */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
              {/* Progress Bar */}
              <div className="mb-8">
                <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: '0%' }}
                    animate={{ width: `${((activeStep + 1) / processingSteps.length) * 100}%` }}
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
                  />
                </div>
                <div className="flex justify-between mt-2">
                  {processingSteps.map((step, index) => (
                    <div
                      key={step.id}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        index <= activeStep
                          ? 'bg-purple-600'
                          : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Icon Animation */}
              <div className="flex justify-center mb-6">
                <motion.div
                  key={currentStepData.id}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 0.5, type: 'spring' }}
                  className={`
                    w-20 h-20 rounded-full flex items-center justify-center
                    ${currentStepData.color === 'blue' ? 'bg-blue-100' : ''}
                    ${currentStepData.color === 'purple' ? 'bg-purple-100' : ''}
                    ${currentStepData.color === 'orange' ? 'bg-orange-100' : ''}
                    ${currentStepData.color === 'green' ? 'bg-green-100' : ''}
                  `}
                >
                  {activeStep < processingSteps.length - 1 ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    >
                      <currentStepData.icon 
                        className={`
                          w-10 h-10
                          ${currentStepData.color === 'blue' ? 'text-blue-600' : ''}
                          ${currentStepData.color === 'purple' ? 'text-purple-600' : ''}
                          ${currentStepData.color === 'orange' ? 'text-orange-600' : ''}
                          ${currentStepData.color === 'green' ? 'text-green-600' : ''}
                        `}
                      />
                    </motion.div>
                  ) : (
                    <currentStepData.icon 
                      className="w-10 h-10 text-green-600"
                    />
                  )}
                </motion.div>
              </div>

              {/* Text Content */}
              <motion.div
                key={`text-${currentStepData.id}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="text-center"
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {currentStepData.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {currentStepData.subtitle}
                </p>
              </motion.div>

              {/* Security Badge */}
              <div className="mt-8 flex items-center justify-center gap-2 text-xs text-gray-500">
                <Shield className="w-3 h-3" />
                <span>Secure & Encrypted Transaction</span>
              </div>

              {/* Loading Dots */}
              {activeStep < processingSteps.length - 1 && (
                <div className="flex justify-center gap-1 mt-6">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0.3 }}
                      animate={{ opacity: 1 }}
                      transition={{
                        duration: 0.6,
                        repeat: Infinity,
                        repeatType: 'reverse',
                        delay: i * 0.2,
                      }}
                      className="w-2 h-2 bg-purple-600 rounded-full"
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}