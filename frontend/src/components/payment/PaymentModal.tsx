import React, { useState } from 'react';

interface PaymentModalProps {
  courseTitle: string;
  price: number;
  thumbnailKey?: string;
  difficultyLevel?: string;
  onClose: () => void;
  onProceed: (paymentMethod: string) => void;
  isProcessing: boolean;
}

const PAYMENT_METHODS = [
  { id: 'netbanking', label: 'Netbanking', icon: 'account_balance', description: 'All major Indian banks supported' },
  { id: 'card', label: 'Credit / Debit Card', icon: 'credit_card', description: 'Visa, MasterCard, RuPay, Maestro' },
  { id: 'upi', label: 'UPI', icon: 'qr_code_scanner', description: 'Google Pay, PhonePe, Paytm & more' },
  { id: 'wallet', label: 'Wallets', icon: 'account_balance_wallet', description: 'Mobikwik, Freecharge & others' }
];

export default function PaymentModal({ courseTitle, price, thumbnailKey, difficultyLevel, onClose, onProceed, isProcessing }: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<string>('netbanking');
  const [paymentStep, setPaymentStep] = useState<'select_method' | 'enter_card'>('select_method');

  // Remove restrictions since we will handle them custom now
  const isRestricted = false;

  const handleProceed = () => {
    if (selectedMethod === 'card' && paymentStep === 'select_method') {
      setPaymentStep('enter_card');
    } else {
      onProceed(selectedMethod);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
      <div 
        className="bg-white rounded-[32px] w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh] animate-in zoom-in-95 duration-400"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Column: Course Preview */}
        <div className="w-full md:w-5/12 bg-surface-container-highest text-white relative hidden md:flex flex-col">
          {thumbnailKey ? (
            <>
              <img src={thumbnailKey} alt={courseTitle} className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20"></div>
            </>
          ) : (
            <div className="absolute inset-0 bg-primary/20"></div>
          )}
          
          <div className="relative z-10 flex flex-col h-full p-8 md:p-12">
            <div className="mb-auto">
              <span className="bg-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-white shadow-lg inline-block">
                {difficultyLevel || 'Premium Course'}
              </span>
            </div>
            
            <div className="mt-auto">
              <h2 className="text-3xl font-display-md font-bold text-white mb-2 leading-tight">
                {courseTitle}
              </h2>
              <div className="flex items-end gap-3 mt-6">
                <span className="text-text-secondary text-sm font-medium uppercase tracking-widest">Total Amount</span>
                <span className="text-4xl font-display-lg font-bold text-white">₹{price.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Payment Options */}
        <div className="w-full md:w-7/12 flex flex-col h-full max-h-[90vh]">
          {/* Header */}
          <div className="p-6 md:p-8 border-b border-outline-variant/30 flex justify-between items-center bg-white shrink-0">
            {paymentStep === 'enter_card' && (
              <button 
                onClick={() => setPaymentStep('select_method')}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container-lowest text-text-secondary transition-colors shrink-0"
              >
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
            )}
            <div>
              <h2 className="text-2xl font-display-md font-bold text-on-surface">
                {paymentStep === 'select_method' ? 'Select Payment Method' : 'Enter Card Details'}
              </h2>
              <p className="text-sm text-text-secondary mt-1">Complete your secure checkout.</p>
            </div>
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container-lowest text-text-secondary transition-colors shrink-0 ml-auto"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          
          {/* Methods List */}
          <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1 bg-surface-container-lowest/50">
            {/* Mobile-only summary since left column is hidden */}
            <div className="md:hidden mb-6 bg-surface-container-low p-4 rounded-2xl border border-outline-variant/30 flex items-center justify-between">
              <div className="flex-1 pr-4">
                <span className="text-[10px] uppercase tracking-widest font-bold text-text-secondary">Enrolling in</span>
                <h3 className="font-bold text-on-surface text-sm line-clamp-1">{courseTitle}</h3>
              </div>
              <div className="text-right shrink-0 border-l border-outline-variant/30 pl-4">
                <span className="text-[10px] uppercase tracking-widest font-bold text-text-secondary">Total</span>
                <div className="font-display-md text-xl font-bold text-primary">₹{price.toFixed(2)}</div>
              </div>
            </div>

            {paymentStep === 'select_method' ? (
              <>
                <div className="space-y-4">
                  {PAYMENT_METHODS.map((method) => (
                    <label 
                      key={method.id}
                      className={`relative flex flex-col p-4 md:p-5 rounded-2xl cursor-pointer border-2 transition-all duration-200 ${
                        selectedMethod === method.id 
                          ? 'border-primary bg-primary/5 shadow-md shadow-primary/5' 
                          : 'border-outline-variant/30 bg-white hover:bg-surface-container-lowest hover:border-outline-variant/50'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className="flex-1 flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                            selectedMethod === method.id ? 'bg-primary text-white' : 'bg-surface-container-low text-text-secondary'
                          }`}>
                            <span className="material-symbols-outlined text-[24px]">{method.icon}</span>
                          </div>
                          <div>
                            <h4 className={`font-bold text-[15px] ${selectedMethod === method.id ? 'text-primary' : 'text-on-surface'}`}>
                              {method.label}
                            </h4>
                            <p className="text-xs text-text-secondary mt-1">{method.description}</p>
                          </div>
                        </div>
                        
                        <div className="shrink-0 flex items-center justify-center w-6 h-6 ml-4">
                          <input 
                            type="radio" 
                            name="payment_method" 
                            value={method.id}
                            checked={selectedMethod === method.id}
                            onChange={() => setSelectedMethod(method.id)}
                            className="w-5 h-5 accent-primary cursor-pointer"
                          />
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
                
                <div className="mt-8 flex items-center justify-center gap-2 text-[11px] text-text-secondary font-medium uppercase tracking-widest">
                  <span className="material-symbols-outlined text-[14px] text-green-600">lock</span>
                  256-bit Secure Encrypted Transaction
                </div>
              </>
            ) : (
              <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                <div>
                  <label className="block text-sm font-bold text-text-secondary mb-2">Card Number</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary">credit_card</span>
                    <input 
                      type="text" 
                      placeholder="0000 0000 0000 0000" 
                      className="w-full bg-white border border-outline-variant/50 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-medium"
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-bold text-text-secondary mb-2">Expiry Date</label>
                    <input 
                      type="text" 
                      placeholder="MM/YY" 
                      className="w-full bg-white border border-outline-variant/50 rounded-xl py-3 px-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-medium"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-bold text-text-secondary mb-2">CVV</label>
                    <div className="relative">
                      <input 
                        type="password" 
                        placeholder="123" 
                        maxLength={4}
                        className="w-full bg-white border border-outline-variant/50 rounded-xl py-3 px-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-medium"
                      />
                      <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary text-[18px]">help</span>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-text-secondary mb-2">Cardholder Name</label>
                  <input 
                    type="text" 
                    placeholder="Name on card" 
                    className="w-full bg-white border border-outline-variant/50 rounded-xl py-3 px-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-medium"
                  />
                </div>
              </div>
            )}
          </div>
          
          {/* Footer Action */}
          <div className="p-6 md:p-8 border-t border-outline-variant/30 bg-white shrink-0">
            <button 
              onClick={handleProceed}
              disabled={isProcessing}
              className={`w-full py-4 rounded-xl font-bold text-lg flex justify-center items-center gap-2 transition-all bg-primary text-white shadow-lg hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-1 disabled:opacity-70 disabled:hover:translate-y-0`}
            >
              {isProcessing ? (
                <>
                  <span className="material-symbols-outlined animate-spin">refresh</span>
                  Processing Securely...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">
                    {paymentStep === 'enter_card' ? 'lock' : 'payments'}
                  </span>
                  {paymentStep === 'enter_card' ? `Pay Securely ₹${price.toFixed(2)}` : 'Continue'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
