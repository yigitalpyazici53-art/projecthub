import type { Metadata } from "next";
import { publicMetadata } from "@/utils/seo";
import { LegalDoc, Section, P, UL, A } from "@/components/legal/LegalDoc";
import { CONTACT_EMAIL, CONTROLLER_LOCATION, CONTROLLER_NAME, POLICY_UPDATED } from "@/utils/legal";

export const metadata: Metadata = publicMetadata({
  title: "Terms of Service",
  description:
    "The rules for using ProjectHub: 18+ only, be respectful, don't spam or impersonate others, and build cool things.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <LegalDoc
      title="Terms of Service"
      lead={
        <>
          These are the ground rules for using ProjectHub, operated by {CONTROLLER_NAME}, {CONTROLLER_LOCATION}. By
          creating an account, submitting the application form or using the service you agree to them.
        </>
      }
      updated={POLICY_UPDATED}
      seeAlso={[
        { href: "/privacy", label: "Privacy Policy" },
        { href: "/kvkk", label: "KVKK Aydınlatma Metni" },
        { href: "/cookies", label: "Cookie Policy" },
        { href: "/contact", label: "Contact" },
      ]}
    >
      <Section title="1. You must be 18 or older" id="age">
        <P>
          ProjectHub is only for people aged <strong>18 and over</strong>. By creating an account or submitting the
          application form you confirm that you are at least 18. We delete accounts that we learn belong to someone
          under 18. If you see a profile that appears to belong to a minor, please report it.
        </P>
      </Section>

      <Section title="2. Who ProjectHub is for">
        <P>
          ProjectHub is for university students and early-career builders who want to show their work, meet
          collaborators and post projects. You must provide accurate information about yourself and keep your
          account credentials secure. One person, one account.
        </P>
      </Section>

      <Section title="3. Acceptable use">
        <P>When using ProjectHub, you agree <strong>not</strong> to:</P>
        <UL>
          <li>Spam other users, send unsolicited bulk messages, or mass-send connection requests.</li>
          <li>Harass, bully, threaten, or discriminate against anyone on the platform.</li>
          <li>Impersonate another person, organization, or university.</li>
          <li>Post illegal, abusive, hateful, sexual, or deliberately misleading content.</li>
          <li>Share other people&apos;s personal data without their permission.</li>
          <li>Scrape, crawl, or abuse the platform with automated tools.</li>
          <li>Attempt to break security, bypass access controls, or disrupt the service.</li>
        </UL>
        <P>
          You can message only people you&apos;re connected with. Use <strong>Report</strong> on a profile or in a
          conversation to tell us about content or behaviour that breaks these rules, and <strong>Block</strong> to
          stop someone from messaging you or sending you connection requests. We review every report and may remove
          content or suspend or delete accounts that violate these rules.
        </P>
      </Section>

      <Section title="4. Your content">
        <P>
          You&apos;re responsible for what you post: your profile, projects, applications, and messages. You keep
          ownership of your content, and you grant ProjectHub a limited license to host and display it on the
          platform as needed to run the service. Your public profile and projects are visible to everyone unless you
          hide your profile; see the <A href="/privacy#visibility">Privacy Policy</A>.
        </P>
      </Section>

      <Section title="5. Early-stage service, provided as-is">
        <P>
          ProjectHub is an early-stage product. Features may change, break, or be removed as we iterate. The service
          is provided <strong>as-is</strong> and <strong>as-available</strong>, without warranties of any kind,
          either express or implied, including fitness for a particular purpose, reliability, accuracy, or
          non-infringement.
        </P>
        <P>
          To the maximum extent permitted by law, ProjectHub and its operator are not liable for indirect,
          incidental, or consequential damages arising from your use of the service. Nothing in these terms limits
          rights you have under mandatory consumer protection law.
        </P>
      </Section>

      <Section title="6. Deleting your account">
        <P>
          You can stop using ProjectHub at any time and delete your account yourself in{" "}
          <A href="/profile/edit#delete-account">Profile settings → Delete account</A>. We may also suspend or
          delete accounts that break these terms or put other users at risk.
        </P>
      </Section>

      <Section title="7. Changes">
        <P>
          When we change these terms materially we update the date above and ask you to confirm the new version the
          next time you use ProjectHub.
        </P>
      </Section>

      <Section title="8. Governing law">
        <P>
          These terms are governed by the laws of the Republic of Türkiye. Any disputes shall be subject to the
          jurisdiction of the competent courts in Türkiye.
        </P>
      </Section>

      <Section title="9. Contact">
        <P>
          Questions, concerns, or reports of abuse? Email <A href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</A>.
        </P>
      </Section>
    </LegalDoc>
  );
}
