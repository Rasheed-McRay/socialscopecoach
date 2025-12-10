import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link to="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last updated: December 10, 2025</p>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using SocialScope ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, you may not access the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
            <p className="text-muted-foreground leading-relaxed">
              SocialScope is an AI-powered conversation analysis platform that helps users improve their communication skills. The Service includes:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-2">
              <li>Audio transcription and analysis</li>
              <li>AI-generated insights and feedback on conversations</li>
              <li>Progress tracking and skill development tools</li>
              <li>Daily practice prompts and exercises</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
            <p className="text-muted-foreground leading-relaxed">
              To use certain features of the Service, you must create an account. You are responsible for:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-2">
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Providing accurate and complete information</li>
              <li>Notifying us immediately of any unauthorized use</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Subscription and Payment</h2>
            <h3 className="text-lg font-medium mt-4 mb-2">Free Tier</h3>
            <p className="text-muted-foreground leading-relaxed">
              Free accounts include limited daily conversation analyses. Usage limits reset each calendar day.
            </p>
            
            <h3 className="text-lg font-medium mt-4 mb-2">Pro Subscription</h3>
            <p className="text-muted-foreground leading-relaxed">
              Pro subscriptions are billed monthly and provide enhanced features including additional analyses per billing period and access to premium features.
            </p>

            <h3 className="text-lg font-medium mt-4 mb-2">Cancellation</h3>
            <p className="text-muted-foreground leading-relaxed">
              You may cancel your subscription at any time through your account settings or the Stripe customer portal. Upon cancellation, you will retain access to Pro features until the end of your current billing period.
            </p>

            <h3 className="text-lg font-medium mt-4 mb-2">Refunds</h3>
            <p className="text-muted-foreground leading-relaxed">
              Due to the digital nature of our Service, refunds are generally not provided. However, we may consider refund requests on a case-by-case basis within 7 days of purchase.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Acceptable Use</h2>
            <p className="text-muted-foreground leading-relaxed">You agree not to:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-2">
              <li>Upload audio recordings without consent from all parties</li>
              <li>Use the Service for illegal purposes or to violate others' rights</li>
              <li>Attempt to circumvent usage limits or security measures</li>
              <li>Share your account credentials with others</li>
              <li>Use automated systems to access the Service without permission</li>
              <li>Upload content that is harmful, offensive, or violates third-party rights</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Content Ownership</h2>
            <h3 className="text-lg font-medium mt-4 mb-2">Your Content</h3>
            <p className="text-muted-foreground leading-relaxed">
              You retain ownership of the audio recordings and content you upload. By uploading content, you grant us a limited license to process it for providing the Service.
            </p>
            
            <h3 className="text-lg font-medium mt-4 mb-2">AI-Generated Analysis</h3>
            <p className="text-muted-foreground leading-relaxed">
              The AI-generated analysis, insights, and recommendations are provided as tools for self-improvement. You may use these for personal purposes. We retain intellectual property rights in our analysis methodology and algorithms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Disclaimer of Warranties</h2>
            <p className="text-muted-foreground leading-relaxed">
              THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. We do not guarantee that:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-2">
              <li>The Service will be uninterrupted or error-free</li>
              <li>AI analysis will be 100% accurate</li>
              <li>Results will meet your specific expectations</li>
              <li>Transcriptions will be perfectly accurate</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Our AI analysis is for educational and self-improvement purposes only and should not be considered professional advice.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, SOCIALSCOPE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your use of the Service is also governed by our{" "}
              <Link to="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
              , which is incorporated into these Terms by reference.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Modifications to Service</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to modify or discontinue the Service (or any part thereof) at any time, with or without notice. We shall not be liable to you or any third party for any modification, suspension, or discontinuance of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Termination</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may terminate or suspend your account immediately, without prior notice, if you breach these Terms. Upon termination, your right to use the Service will cease immediately. You may delete your account at any time through your settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to update these Terms at any time. We will notify you of material changes by posting the new Terms on this page. Your continued use of the Service after changes constitutes acceptance of the modified Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">13. Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of the United States, without regard to its conflict of law provisions.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
