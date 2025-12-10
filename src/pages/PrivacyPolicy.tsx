import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link to="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: December 10, 2025</p>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              SocialScope ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our conversation analysis service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
            <h3 className="text-lg font-medium mt-4 mb-2">Account Information</h3>
            <p className="text-muted-foreground leading-relaxed">
              When you create an account, we collect your email address and display name.
            </p>
            
            <h3 className="text-lg font-medium mt-4 mb-2">Audio Recordings</h3>
            <p className="text-muted-foreground leading-relaxed">
              When you use our analysis feature, you upload audio recordings of conversations. <strong>Audio files are processed in real-time and immediately deleted after transcription.</strong> We do not store your audio files on our servers.
            </p>
            
            <h3 className="text-lg font-medium mt-4 mb-2">Transcripts and Analysis</h3>
            <p className="text-muted-foreground leading-relaxed">
              We store the text transcripts and AI-generated analysis results so you can access your conversation insights over time. This data is associated with your account and protected by encryption.
            </p>

            <h3 className="text-lg font-medium mt-4 mb-2">Voice Samples (Optional)</h3>
            <p className="text-muted-foreground leading-relaxed">
              If you choose to register your voice for speaker identification, we securely store voice samples. You can delete these at any time through your settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>To provide and maintain our conversation analysis service</li>
              <li>To process and analyze your uploaded audio for insights</li>
              <li>To track your progress and provide personalized recommendations</li>
              <li>To process your subscription payments via Stripe</li>
              <li>To communicate with you about your account or service updates</li>
              <li>To improve our AI models and service quality (using anonymized, aggregated data only)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Payment Processing</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use Stripe to process subscription payments. We do not store your credit card information. Please refer to <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Stripe's Privacy Policy</a> for information on how they handle your payment data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Data Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement industry-standard security measures including:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-2">
              <li>Encryption of data in transit (TLS/SSL)</li>
              <li>Encryption of data at rest</li>
              <li>Row-level security policies for database access</li>
              <li>Secure authentication with Supabase Auth</li>
              <li>Regular security audits and updates</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              <strong>Audio files:</strong> Deleted immediately after processing.<br />
              <strong>Transcripts and analysis:</strong> Retained until you delete them or close your account.<br />
              <strong>Account data:</strong> Retained until you request account deletion.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed">You have the right to:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-2">
              <li>Access your personal data</li>
              <li>Delete your conversation history and saved reports</li>
              <li>Delete your voice samples</li>
              <li>Export your data</li>
              <li>Close your account and have all data deleted</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Third-Party Services</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use the following third-party services:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-2">
              <li><strong>Supabase:</strong> Database and authentication</li>
              <li><strong>Stripe:</strong> Payment processing</li>
              <li><strong>AI Services:</strong> Transcription and analysis (data is processed but not stored)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Children's Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our service is not intended for users under 13 years of age. We do not knowingly collect personal information from children under 13.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
