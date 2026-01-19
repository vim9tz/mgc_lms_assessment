"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Code2, ShieldCheck, Cpu, CheckCircle2 } from "lucide-react";

export default function AssessmentLoading() {
  const [step, setStep] = useState(0);

  // Simulate a progress sequence for better UX since real loading is just one state
  useEffect(() => {
    const timer1 = setTimeout(() => setStep(1), 800);
    const timer2 = setTimeout(() => setStep(2), 2000); // Give it a bit more time to feel "real"
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const steps = [
    { 
      text: "Verifying secure access token...", 
      icon: <ShieldCheck size={32} className="text-indigo-500" />,
      subtext: "Authenticating your session"
    },
    { 
      text: "Initializing assessment environment...", 
      icon: <Cpu size={32} className="text-blue-500" />,
      subtext: "Preparing code editor and runtimes"
    },
    { 
      text: "Finalizing setup...", 
      icon: <Code2 size={32} className="text-emerald-500" />,
      subtext: "Almost ready"
    }
  ];

  const currentStep = steps[Math.min(step, steps.length - 1)];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white w-screen h-screen overflow-hidden">
      {/* Background with Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-50 via-white to-white opacity-80" />
      
      {/* Dynamic Background Circles */}
      <motion.div 
         animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
         transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
         className="absolute -top-20 -left-20 w-96 h-96 bg-purple-100 rounded-full blur-3xl opacity-30" 
      />
      <motion.div 
         animate={{ scale: [1, 1.2, 1], rotate: [0, -5, 5, 0] }}
         transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
         className="absolute -bottom-20 -right-20 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-30" 
      />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md p-10 flex flex-col items-center bg-white/40 backdrop-blur-xl rounded-3xl border border-white/50 shadow-2xl"
      >
        
        {/* Animated Icon Container */}
        <div className="relative mb-8 w-24 h-24 flex items-center justify-center">
           {/* Ripple effects */}
           <motion.div 
             animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
             transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
             className="absolute inset-0 rounded-full bg-indigo-100"
           />
           <motion.div 
             animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.1, 0.5] }}
             transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
             className="absolute inset-2 rounded-full bg-indigo-200"
           />
           
           {/* Main Icon with Morph/Transition */}
           <motion.div
             key={step}
             initial={{ scale: 0.8, opacity: 0, rotate: -20, y: 10 }}
             animate={{ scale: 1, opacity: 1, rotate: 0, y: 0 }}
             exit={{ scale: 0.8, opacity: 0, rotate: 20, y: -10 }}
             transition={{ type: "spring", stiffness: 300, damping: 20 }}
             className="relative z-10 bg-white p-4 rounded-2xl shadow-lg border border-indigo-50"
           >
             {currentStep.icon}
           </motion.div>
        </div>

        {/* Text Animations */}
        <div className="text-center h-24 w-full">
           <AnimatePresence mode="wait">
             <motion.div
               key={step}
               initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
               animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
               exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
               transition={{ duration: 0.4 }}
               className="flex flex-col items-center"
             >
               <h2 className="text-xl font-bold text-slate-800 mb-2">{currentStep.text}</h2>
               <p className="text-sm text-slate-500 font-medium">{currentStep.subtext}</p>
             </motion.div>
           </AnimatePresence>
        </div>

        {/* Custom Progress Bar */}
        <div className="w-full max-w-[280px] h-1.5 bg-gray-200/50 rounded-full overflow-hidden mt-4 relative">
            <motion.div 
               className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
               initial={{ width: "0%" }}
               animate={{ width: step === 0 ? "30%" : step === 1 ? "75%" : "100%" }}
               transition={{ duration: 1, ease: "easeInOut" }}
            />
        </div>
        
        {/* Footer info */}
        <motion.p 
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 0.5 }}
           className="mt-10 text-[10px] text-indigo-300 font-bold tracking-[0.2em] uppercase"
        >
           Secure Assessment Platform
        </motion.p>
      </motion.div>
    </div>
  );
}
