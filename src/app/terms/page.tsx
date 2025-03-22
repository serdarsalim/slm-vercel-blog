"use client";

import { Suspense } from 'react';
import { motion } from "framer-motion";
import Link from "next/link";

// Main page component with Suspense boundary
export default function Terms() {
  // Ensure we're using a simple wrapper component with minimal client-side logic
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white relative overflow-hidden">
      {/* Static elements can go outside Suspense */}
      
      {/* Wrap the client component in Suspense */}
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-lg font-medium">Loading...</p>
        </div>
      }>
        <TermsContent />
      </Suspense>
    </div>
  );
}

// Separate client component for all dynamic content
function TermsContent() {
  return (
    <main className="relative z-10 flex flex-col items-center justify-center px-6 py-24">
      <motion.div
        className="relative z-10 max-w-4xl mb-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-4xl md:text-5xl font-extrabold tracking-tight text-center"
        >
          Terms and Conditions
        </motion.h1>

        <motion.p
          className="text-lg mt-6 text-gray-500 dark:text-gray-400 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          Last Updated: March 14, 2025
        </motion.p>
      </motion.div>

      <motion.div 
        className="relative z-10 max-w-4xl text-left space-y-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-300 mb-4">1. Google Services Disclaimer</h2>
          <p className="mb-4 text-gray-700 dark:text-gray-200">
            Sheets Master is not affiliated with, endorsed by, sponsored by, or connected to Google LLC in any way. 
            Google Sheets™, Google Drive™, and related marks and logos are trademarks of Google LLC. Our templates 
            are independently created and maintained to work with Google's services.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-300 mb-4">2. Template License</h2>
          <p className="mb-3 text-gray-700 dark:text-gray-200">Purchase of a template grants you a non-exclusive, non-transferable, single-user license to:</p>
          <ul className="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-200 space-y-2">
            <li>Use the template for personal or business purposes</li>
            <li>Make modifications to suit your needs</li>
            <li>Create copies for backup purposes</li>
          </ul>
          <p className="mb-3 text-gray-700 dark:text-gray-200">You may not:</p>
          <ul className="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-200 space-y-2">
            <li>Resell, distribute, or transfer the template to others</li>
            <li>Include the template in a product for redistribution</li>
            <li>Share premium templates publicly</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-300 mb-4">3. Pricing and Payments</h2>
          <p className="mb-4 text-gray-700 dark:text-gray-200">
            All prices are in USD and are subject to change without notice. Payment is required before template access 
            is granted to paid templates. We use secure third-party payment processors and do not store credit card information.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-300 mb-4">4. Refund Policy</h2>
          <p className="mb-4 text-gray-700 dark:text-gray-200">
            Due to the digital nature of our products, all sales are final. No refunds will be issued unless:
          </p>
          <ul className="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-200 space-y-2">
            <li>The template is permanently inaccessible</li>
            <li>The template significantly fails to function as described</li>
          </ul>
          <p className="mb-4 text-gray-700 dark:text-gray-200">
            Refund requests must be submitted within 7 days of purchase. We reserve the right to deny refunds 
            if we determine the request is not valid.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-300 mb-4">5. Disclaimer of Warranties</h2>
          <p className="mb-4 text-gray-700 dark:text-gray-200">
            Templates are provided "as is" without warranty of any kind. While we strive for excellence, we do not 
            guarantee that templates will meet your specific requirements or be error-free. You assume all risks 
            associated with using our templates.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-300 mb-4">6. Limitation of Liability</h2>
          <p className="mb-4 text-gray-700 dark:text-gray-200">
            Sheets Master shall not be liable for any indirect, incidental, special, consequential, or punitive 
            damages resulting from the use or inability to use our templates.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-300 mb-4">7. Updates to Terms</h2>
          <p className="mb-4 text-gray-700 dark:text-gray-200">
            We reserve the right to modify these terms at any time. Changes will be effective immediately upon 
            posting to our website. Your continued use of our templates constitutes acceptance of any modifications 
            to these terms.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-300 mb-4">8. Contact</h2>
          <p className="mb-4 text-gray-700 dark:text-gray-200">
            For questions about these terms, please contact us at support@premiumsheets.com
          </p>
        </section>
      </motion.div>
    </main>
  );
}