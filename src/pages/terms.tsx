import type { NextPage } from 'next'
import Head from 'next/head'
import { Typography } from '@mui/material'
import Link from 'next/link'
import MUILink from '@mui/material/Link'
import { AppRoutes } from '@/config/routes'
import { DISCORD_URL, HELP_CENTER_URL, TWITTER_URL } from '@/config/constants'
import { IS_OFFICIAL_HOST } from '@/config/constants'

const SafeTerms = () => (
  <div>
    <Typography variant="h1" mb={2}>
      Terms and Conditions
    </Typography>
    <p>Last updated: January 2024.</p>

    <h3>1. What is the scope of the Terms?</h3>
    <ol start={1}>
      <li>
        These Terms and Conditions (&ldquo;Terms&rdquo;) become part of any contract (&ldquo;Agreement&rdquo;) between
        you (&ldquo;you&rdquo;, &ldquo;yours&rdquo; or &ldquo;User&rdquo;) and Core Contributors GmbH (&ldquo;CC&rdquo;,
        &ldquo;we&rdquo;, &ldquo;our&rdquo; or &ldquo;us&rdquo;) provided we made these Terms accessible to you prior to
        entering into the Agreement and you consent to these Terms. We are a limited liability company registered with
        the commercial register of Berlin Charlottenburg under company number HRB 240421&nbsp;B, with its registered
        office at Gontardstraße 11, 10178 Berlin, Germany. You can contact us by writing to info@cc0x.dev.
      </li>
      <li>
        The Agreement is concluded by using the Mobile App, Web App and/or Browser Extension&nbsp;subject to these
        Terms.&nbsp;The use of our Services is only permitted to legal entities, partnerships and natural persons with
        unlimited legal capacity. In particular, minors are prohibited from using our Services.
      </li>
      <li>
        The application of your general terms and conditions is excluded. Your deviating, conflicting or supplementary
        general terms and conditions shall only become part of the Agreement if and to the extent that CC has expressly
        agreed to their application in writing. This consent requirement shall apply in any case, even if for example
        CC, being aware of your general terms and conditions, accepts payments by the contractual partner without
        reservations.
      </li>
      <li>
        We reserve the right to change these Terms at any time and without giving reasons, while considering and
        weighing your interests. The new Terms will be communicated to you in advance. They are considered as agreed
        upon if you do not object to their validity within 14 days after receipt of the notification. We will separately
        inform you about the essential changes, the possibility to object, the deadline and the consequences of
        inactivity. If you object, the current version of the Terms remains applicable. Our right to terminate the
        contract according to Clause 8 remains unaffected.
      </li>
    </ol>

    <h3>2. What do some of the capitalized terms mean in the Agreement?</h3>
    <ol start={1}>
      <li>
        &ldquo;Blockchain&rdquo; means a mathematically secured consensus ledger such as the Ethereum Virtual Machine,
        an Ethereum Virtual Machine compatible validation mechanism, or other decentralized validation mechanisms.
      </li>
      <li>
        &ldquo;Transaction&rdquo; means a change to the data set through a new entry in the continuous Blockchain.
      </li>
      <li>
        &ldquo;Smart Contract&rdquo; means a piece of source code deployed as an application on the Blockchain which can
        be executed, including self-execution of Transactions as well as execution triggered by 3rd parties.
      </li>
      <li>
        &ldquo;Token&rdquo; means a digital asset transferred in a Transaction, including ETH, ERC20, ERC721 and ERC1155
        tokens.
      </li>
      <li>
        &ldquo;Wallet&rdquo; means a cryptographic storage solution permitting you to store cryptographic assets by
        correlation of a (i) Public Key and (ii) a Private Key, or a Smart Contract to receive, manage and send Tokens.
      </li>
      <li>
        &ldquo;Recovery Phrase&rdquo; means a series of secret words used to generate one or more Private Keys and
        derived Public Keys.
      </li>
      <li>
        &ldquo;Public Key&rdquo; means a unique sequence of numbers and letters within the Blockchain to distinguish the
        network participants from each other.
      </li>
      <li>
        &ldquo;Private Key&rdquo; means a unique sequence of numbers and/or letters required to initiate a Blockchain
        Transaction and should only be known by the legal owner of the Wallet.
      </li>
    </ol>

    <h3>3. What are the Services offered?</h3>
    <p>
      Our services (&ldquo;Services&rdquo;) primarily consist of enabling users to create their Safe Accounts and
      ongoing interaction with it on the Blockchain.
    </p>
    <ol start={1}>
      <li>&ldquo;Safe Account&rdquo; </li>
    </ol>
    <p>
      A Safe Account is a modular, self-custodial (i.e. not supervised by us) smart contract-based wallet not provided
      by CC. Safe Accounts are{' '}
      <Link href="https://github.com/safe-global/safe-contracts/" passHref legacyBehavior>
        <MUILink target="_blank" rel="noreferrer">
          open-source
        </MUILink>
      </Link>
      &nbsp;released under LGPL-3.0.
    </p>
    <p>
      Smart contract wallet means, unlike a standard private key Wallet, that access control for authorizing any
      Transaction is defined in code. An example are multi-signature wallets which require that any Transaction must be
      signed by a minimum number of signing wallets whereby the specifics of the requirements to authorize a Transaction
      can be configured in code.{' '}
    </p>
    <p>
      Owners need to connect a signing wallet with a Safe Account. Safe Accounts are compatible inter alia with standard
      private key Wallets such as hardware wallets, browser extension wallets and mobile wallets that support
      WalletConnect.
    </p>
    <ol start={2}>
      <li>&ldquo;Safe App&rdquo;</li>
    </ol>
    <p>
      You may access Safe Accounts using the Super Account web app, mobile app for iOS and android, or the browser
      extension&nbsp;(each a &ldquo;Safe App&rdquo;). The Safe App may be used to manage your personal digital assets on
      Ethereum and other common EVM chains when you connect a Safe Account with third-party&nbsp;services (as defined
      below). The Safe App provides certain features that may be amended from time to time.{' '}
    </p>
    <ol start={3}>
      <li>&ldquo;Third-Party&nbsp;Safe Apps&rdquo;</li>
    </ol>
    <p>
      The Safe App allows you to connect Safe Accounts to third-party decentralized applications
      (&ldquo;Third-Party&nbsp;Safe Apps&rdquo;) and use third-party&nbsp;services such as from the decentralized
      finance sector, DAO Tools or services related to NFTs (&ldquo;Third-Party&nbsp;Services&quot;). The
      Third-Party&nbsp;Safe Apps are integrated in the user interface of the Safe App via inline framing. The provider
      of the Third-Party&nbsp;Safe App and related Third-Party Service is responsible for the operation of the service
      and the correctness, completeness and actuality of any information provided therein. We make a pre-selection of
      Third-Party&nbsp;Safe Apps that we show in the Safe App. However, we only perform a rough triage in advance for
      obvious problems and functionality in terms of loading time and resolution capability of the transactions.
      Accordingly, in the event of any (technical) issues concerning the Third-Party Services, the user must only
      contact the respective service provider directly. The terms of service, if any, shall be governed by the
      applicable contractual provisions between the User and the respective provider of the Third-Party&nbsp;Service.
      Accordingly, we are not liable in the event of a breach of contract, damage or loss related to the use of such
      Third-Party Service.
    </p>

    <h3>4. What do the Services not consist of?</h3>
    <p>Our Services do not&nbsp;consist of:</p>
    <ol start={1}>
      <li>
        activity regulated by the Federal Financial Supervisory Authority (BaFin) or any other regulatory agency in any
        jurisdiction;
      </li>
      <li>coverage underwritten by any regulatory agency&rsquo;s compensation scheme;</li>
      <li>
        custody of your Recovery Phrase, Private Keys, Tokens or the ability to remove or freeze your Tokens, i.e. a
        Safe Account is a self-custodial wallet;
      </li>
      <li>the storage or transmission of fiat currencies;</li>
      <li>
        back-up services to recover your Recovery Phrase or Private Keys, for whose safekeeping you are solely
        responsible; CC has no means to recover your access to your Tokens, when you lose access to your Safe Account;
      </li>
      <li>
        any form of legal, financial, investment, accounting, tax or other professional advice regarding Transactions
        and their suitability to you;{' '}
      </li>
      <li>
        the responsibility to monitor authorized Transactions or to check the correctness or completeness of
        Transactions before you are authorizing them.
      </li>
    </ol>

    <h3>5. What do you need to know about Third-Party Services?</h3>
    <ol start={1}>
      <li>
        We provide you the possibility to interact with your Safe Account through&nbsp;Third-Party Services. Any
        activities you engage in with, or services you receive from a third party is between you and that third party
        directly. The conditions of service provisions, if any, shall be governed by the applicable contractual
        provisions between you and the respective provider of the Third-Party Service.{' '}
      </li>
      <li>
        The Services rely in part on third-party and open-source software, including the Blockchain, and the continued
        development and support by third parties. There is no assurance or guarantee that those third parties will
        maintain their support of their software or that open-source software will continue to be maintained. This may
        have a material adverse effect on the Services.
      </li>
      <li>This means specifically:</li>
    </ol>
    <ul>
      <li>
        We do not have any oversight over your activities with Third-Party&nbsp;Services especially by using
        Third-Party&nbsp;Safe Apps, and therefore we do not and cannot make any representation regarding their
        appropriateness and suitability for you.
      </li>
      <li>
        Third-Party&nbsp;Services are not hosted, owned, controlled or maintained by us. We also do not participate in
        the Transaction and will not and cannot monitor, verify, censor or edit the functioning or content of any
        Third-Party Service.
      </li>
      <li>
        We have not conducted any security audit, bug bounty or formal verification (whether internal or external) of
        the Third-Party Services.
      </li>
      <li>
        We have no control over, do not recommend, endorse, or otherwise take a position on the integrity, functioning
        of, content and your use of Third-Party&nbsp;Services, whose sole responsibility lies with the person from whom
        such services or content originated.
      </li>
      <li>
        When you access or use Third-Party&nbsp;Services you accept that there are risks in doing so and that you alone
        assume any such risks when choosing to interact with them. We are not liable for any errors or omissions or for
        any damages or loss you might suffer through interacting with those Third-Party&nbsp;Services, such as
        Third-Party&nbsp;Safe Apps.
      </li>
      <li>
        You know of the inherent risks of cryptographic and Blockchain-based systems and the high volatility of Token
        markets. Transactions undertaken in the Blockchain are irrevocable and irreversible and there is no possibility
        to refund Token that have been deployed.
      </li>
      <li>
        You should read the license requirements, terms and conditions as well as privacy policy of each
        Third-Party&nbsp;Service that you access or use. Certain Third-Party&nbsp;Services may involve complex
        Transactions that entail a high degree of risk.
      </li>
      <li>
        If you contribute integrations to Third-Party&nbsp;Services, you are responsible for all content you contribute,
        in any manner, and you must have all rights necessary to do so, in the manner in which you contribute it. You
        are responsible for all your activity in connection with any such Third-Party&nbsp;Service.{' '}
      </li>
      <li>
        Your interactions with persons found on or through the Third-Party&nbsp;Service, including payment and delivery
        of goods and services, financial transactions, and any other terms associated with such dealings, are solely
        between you and such persons. You agree that we shall not be responsible or liable for any loss or damage of any
        sort incurred as the result of any such dealings.
      </li>
      <li>
        If there is a dispute between you and the Third-Party&nbsp;Service provider or/and other users of the
        Third-Party&nbsp;Service, you agree that we are under no obligation to become involved. In the event that you
        have a dispute with one or more other users, you release us, our officers, employees, agents, contractors and
        successors from claims, demands, and damages of every kind or nature, known or unknown, suspected or
        unsuspected, disclosed or undisclosed, arising out of or in any way related to such disputes and/or our
        Services.
      </li>
    </ul>

    <h3>6. What are the fees for the Services?</h3>
    <ol start={1}>
      <li>
        The use of the Safe App or Third-Party&nbsp;Safe Apps may cause fees, including network fees, as indicated in
        the respective app. CC has no control over the fees charged by the Third-Party Services. CC may change its own
        fees at any time. Price changes will be communicated to the User in due time before taking effect.
      </li>
      <li>
        The User is only entitled to offset and/or assert rights of retention if his counterclaims are legally
        established, undisputed or recognized by CC.
      </li>
    </ol>

    <h3>7. Are we responsible for the security of your Private Keys, Recovery Phrase or other credentials?</h3>
    <ol start={1}>
      <li>
        We shall not be responsible&nbsp;to secure your Private Keys, Recovery Phrase, credentials or other means of
        authorization of your wallet(s).
      </li>
      <li>
        You must own and control any wallet you use in connection with our Services. You are responsible for
        implementing all appropriate measures for securing any wallet you use, including any Private Key(s), Recovery
        Phrase, credentials or other means of authorization necessary to access such storage mechanism(s).
      </li>
      <li>
        We exclude any and all liability for any security breaches or other acts or omissions, which result in your loss
        of access or custody of any cryptographic assets stored thereon.
      </li>
    </ol>

    <h3>8. Can we terminate or limit your right to use our Services?</h3>
    <ol start={1}>
      <li>
        We may terminate the Agreement and refuse access to the Safe&nbsp;Apps at any time giving 30 days&rsquo; prior
        notice. The right of the parties to terminate the Agreement for cause remains unaffected. In case of our
        termination of the Agreement, you may no longer access your Safe Account via our Services. However, you may
        continue to access your Safe Account and any Tokens via a third-party wallet provider using your Recovery Phrase
        and Private Keys.
      </li>
      <li>
        We reserve the right to limit the use of the Safe&nbsp;Apps to a specified number of Users if necessary to
        protect or ensure the stability and integrity of the Services. We will only be able to limit access to the
        Services. At no time will we be able to limit or block access to or transfer your funds without your consent.
      </li>
    </ol>

    <h3>9. Can you terminate your Agreement with us?</h3>
    <p>You may terminate the Agreement at any time without notice.</p>
    <h3>10. What licenses and access do we grant to you?</h3>
    <ol start={1}>
      <li>
        All intellectual property rights in Safe Accounts and the Services throughout the world belong to us as owner or
        our licensors. Nothing in these Terms gives you any rights in respect of any intellectual property owned by us
        or our licensors and you acknowledge that you do not acquire any ownership rights by downloading the Safe App or
        any content from the Safe App.
      </li>
      <li>
        If you are a consumer we grant you a simple, limited license, but do not sell, to you the Services you download
        solely for your own personal, non-commercial use.{' '}
      </li>
    </ol>

    <h3>11. What can you expect from the Services and can we make changes to them?</h3>
    <ol start={1}>
      <li>
        Without limiting your mandatory warranties, we provide the Services to you &ldquo;as is&rdquo; and &ldquo;as
        available&rdquo; in relation to merchantability, fitness for a particular purpose, availability, security, title
        or non-infringement.{' '}
      </li>
      <li>
        If you use the Safe App via web browser, the strict liability of CC for damages (sec. 536a German Civil Code)
        for defects existing at the time of conclusion of the contract is precluded.{' '}
      </li>
      <li>The foregoing provisions will not limit CC&rsquo;s liability as defined in Clause 13. </li>
      <li>
        We reserve the right to change the format and features of the Services by making any updates to Services
        available for you to download or, where your device settings permit it, by automatic delivery of updates.
      </li>
      <li>
        You are not obliged to download the updated Services, but we may cease to provide and/or update prior versions
        of the Services and, depending on the nature of the update, in some circumstances you may not be able to
        continue using the Services until you have downloaded the updated version.
      </li>
      <li>
        We may cease to provide and/or update content to the Services, with or without notice to you, if it improves the
        Services we provide to you, or we need to do so for security, legal or any other reasons.
      </li>
    </ol>

    <h3>12. What do you agree, warrant and represent?</h3>
    <p>By using our Services you hereby agree, represent and warrant that:</p>
    <ol start={1}>
      <li>
        You are not a citizen, resident, or member of any jurisdiction or group that is subject to economic sanctions by
        the European Union or the United States or any other relevant jurisdiction.
      </li>
      <li>
        You do not appear on HMT Sanctions List, the U.S. Treasury Department&rsquo;s Office of Foreign Asset
        Control&rsquo;s sanctions lists, the U.S. commerce department&apos;s consolidated screening list, the EU
        consolidated list of persons, groups or entities subject to EU Financial Sanctions, nor do you act on behalf of
        a person sanctioned thereunder.
      </li>
      <li>You have read and understood these Terms and agree to be bound by its terms.</li>
      <li>
        Your usage of our Services is legal under the laws of your jurisdiction or under the laws of any other
        jurisdiction to which you may be subject.
      </li>
      <li>
        You won&rsquo;t use the Services or interact with the Services in a manner that violates any law or regulation,
        including, without limitation, any applicable export control laws.
      </li>
      <li>
        You understand the functionality, usage, storage, transmission mechanisms and intricacies associated with Tokens
        as well as wallet (including Safe Account) and Blockchains.
      </li>
      <li>
        You understand that Transactions on the Blockchain are irreversible and may not be erased and that your Safe
        Account address and Transactions are displayed permanently and publicly.
      </li>
      <li>
        You will comply with any applicable tax obligations in your jurisdiction arising from your use of the Services.
      </li>
      <li>
        You will not misuse or gain unauthorized access to our Services by knowingly introducing viruses, cross-site
        scripting, Trojan horses, worms, time-bombs, keystroke loggers, spyware, adware or any other harmful programs or
        similar computer code designed to adversely affect our Services and that in the event you do so or otherwise
        attack our Services, we reserve the right to report any such activity to the relevant law enforcement
        authorities and we will cooperate with those authorities as required.
      </li>
      <li>
        You won&rsquo;t access without authority, interfere with, damage or disrupt any part of our Services, any
        equipment or network on which our Services is stored, any software used in the provision of our Services or any
        equipment or network or software owned or used by any third party.
      </li>
      <li>
        You won&rsquo;t use our Services for activities that are unlawful or fraudulent or have such purpose or effect
        or otherwise support any activities that breach applicable local, national or international law or regulations.
      </li>
      <li>
        You won&rsquo;t use our Services to store, trade or transmit Tokens that are proceeds of criminal or fraudulent
        activity.
      </li>
      <li>
        You understand that the Services and the underlying Blockchain are in an early development stage and we
        accordingly do not guarantee an error-free process and give no price or liquidity guarantee.
      </li>
      <li>You are using the Services at your own risk.</li>
    </ol>

    <h3>13. What about our liability to you?</h3>
    <p>All our liability is excluded, except for the following:</p>

    <ol>
      <li>
        In the event of intent and gross negligence on our part, we are liable for damages – regardless of the legal
        grounds.
      </li>
      <li>
        In the event of negligence on our part, we are liable for damages resulting from injury to life, body or health.
      </li>
      <li>
        In the event of simple negligence on our part, we are only liable for damages resulting from the breach of an
        essential contractual duty (e.g. a duty, the performance of which enables the proper execution of the contract
        in the first place and on the compliance of which the contractual partner regularly relies and may rely),
        whereby our liability shall be limited to compensation of the foreseeable, typically occurring damage. Liability
        for the violation of a non-essential contractual duty is excluded.
      </li>
      <li>
        The liability for simple negligence only applies to the extent that we do not offer the Safe App and the
        Services free of charge (please note, in this context, that any service, network and/or transaction fees may be
        charged by third parties via the Blockchain and not necessarily by us). Conversely, this means that we are not
        liable in cases of simple negligence, when you obtain the Safe App or the service from us free of charge.
      </li>
      <li>
        The limitations of liability according to Clauses 13.2 to 13.4. do not apply as far as we have assumed a
        guarantee or we have fraudulently concealed a defect in the Services. These limitations of liability also do not
        apply to your claims according to the Product Liability Act (”Produkthaftungsgesetz”) and any applicable data
        privacy laws.
      </li>
      <li>
        If you suffer damages from the loss of data, we are not liable for this, as far as the damages would have been
        avoided by your regular and complete backup of all relevant data.
      </li>
      <li>
        In the event of disruptions to the technical infrastructure, the internet connection or a relevant Blockchain
        that we are not responsible for, we shall be exempt from our obligation to perform. This also applies if we are
        prevented from performing due to force majeure or other circumstances, the elimination of which is not possible
        or cannot be economically expected of CC.
      </li>
    </ol>

    <h3>14. What about viruses, bugs and security vulnerabilities?</h3>
    <ol start={1}>
      <li>We endeavor to provide our Service free from material bugs, security vulnerabilities or viruses.</li>
      <li>
        You are responsible for configuring your information technology and computer programmes to access our Services
        and to use your own virus protection software.
      </li>
      <li>If you become aware of any exploits, bugs or vulnerabilities, please inform bounty@safe.global.</li>
      <li>
        You must not misuse our Services by knowingly introducing material that is malicious or technologically harmful.
        If you do, your right to use our Services will cease immediately.
      </li>
    </ol>

    <h3>15. What if an event outside our control happens that affects our Services?</h3>
    <ol start={1}>
      <li>
        We may update and change our Services from time to time. We may suspend or withdraw or restrict the availability
        of all or any part of our Services for business, operational or regulatory reasons or because of a Force Majeure
        Event at no notice.
      </li>
      <li>
        A &ldquo;Force Majeure Event&rdquo; shall mean any event, circumstance or cause beyond our reasonable control,
        which prevents, hinders or delays the provision of our Services or makes their provision impossible or onerous,
        including, without limitation:
      </li>
    </ol>
    <ul>
      <li>acts of God, flood, storm, drought, earthquake or other natural disaster;</li>
      <li>epidemic or pandemic (for the avoidance of doubt, including the 2020 Coronavirus Pandemic);</li>
      <li>
        terrorist attack, hacking or cyber threats, civil war, civil commotion or riots, war, threat of or preparation
        for war, armed conflict, imposition of sanctions, embargo, or breaking off of diplomatic relations;
      </li>
      <li>
        equipment or software malfunction or bugs including network splits or forks or unexpected changes in the
        Blockchain, as well as hacks, phishing attacks, distributed denials of service or any other security attacks;
      </li>
      <li>nuclear, chemical or biological contamination;</li>
      <li>
        any law statutes, ordinances, rules, regulations, judgments, injunctions, orders and decrees or any action taken
        by a government or public authority, including without limitation imposing a prohibition, or failing to grant a
        necessary license or consent;
      </li>
      <li>collapse of buildings, breakdown of plant or machinery, fire, explosion or accident; and</li>
      <li>strike, industrial action or lockout.</li>
    </ul>
    <ol start={3}>
      <li>
        We shall not be liable or responsible to you, or be deemed to have defaulted under or breached this Agreement,
        for any failure or delay in the provision of the Services or the performance of this Agreement, if and to the
        extent such failure or delay is caused by or results from or is connected to acts beyond our reasonable control,
        including the occurrence of a Force Majeure Event.
      </li>
    </ol>

    <h3>16. Who is responsible for your tax liabilities?</h3>
    <p>
      You are solely responsible to determine if your use of the Services have tax implications, in particular income
      tax and capital gains tax relating to the purchase or sale of Tokens, for you. By using the Services you agree not
      to hold us liable for any tax liability associated with or arising from the operation of the Services or any other
      action or transaction related thereto.
    </p>

    <h3>17. What if a court disagrees with part of this Agreement?</h3>
    <p>
      Should individual provisions of these Terms be or become invalid or unenforceable in whole or in part, this shall
      not affect the validity of the remaining provisions. The invalid or unenforceable provision shall be replaced by
      the statutory provision. If there is no statutory provision or if the statutory provision would lead to an
      unacceptable result, the parties shall enter negotiations to replace the invalid or unenforceable provision with a
      valid provision that comes as close as possible to the economic purpose of the invalid or unenforceable provision.
    </p>

    <h3>18. What if we do not enforce certain rights under this Agreement?</h3>
    <p>
      Our failure to exercise or enforce any right or remedy provided under this Agreement or by law shall not
      constitute a waiver of that or any other right or remedy, nor shall it prevent or restrict any further exercise of
      that or any other right or remedy.
    </p>

    <h3>19. Do third parties have rights?</h3>
    <p>
      Unless it expressly states otherwise, this Agreement does not give rise to any third-party rights, which may be
      enforced against us.
    </p>

    <h3>20. Can this Agreement be assigned?</h3>
    <ol start={1}>
      <li>
        We are entitled to transfer our rights and obligations under the Agreement in whole or in part to third parties
        with a notice period of four weeks. In this case, you have the right to terminate the Agreement without notice.
      </li>
      <li>
        You shall not be entitled to assign this Agreement to any third party without our express prior written consent.
      </li>
    </ol>

    <h3>21. Which Clauses of this Agreement survive termination?</h3>
    <p>
      All covenants, agreements, representations and warranties made in this Agreement shall survive your acceptance of
      this Agreement and its termination.
    </p>

    <h3>22. Data Protection</h3>
    <p>
      We inform you about our processing of personal data, including the disclosure to third parties and your rights as
      an affected party, in the{' '}
      <Link href={AppRoutes.privacy} passHref legacyBehavior>
        <MUILink>Privacy Policy</MUILink>
      </Link>
      .
    </p>

    <h3>23. Which laws apply to the Agreement?</h3>
    <p>
      The Agreement including these Terms shall be governed by German law. The application of the UN Convention on
      Contracts for the International Sale of Goods is excluded. For consumers domiciled in another European country but
      Germany, the mandatory provisions of the consumer protection laws of the member state in which the consumer is
      domiciled shall also apply, provided that these are more advantageous for the consumer than the provisions of the
      German law.
    </p>

    <h3>24. How can you get support for Safe Accounts and tell us about any problems?</h3>
    <p>
      If you want to learn more about Safe Accounts or the Service or have any problems using them or have any
      complaints please get in touch via any of the following channels:
    </p>
    <ol start={1}>
      <li>
        Intercom:{' '}
        <Link href={HELP_CENTER_URL} passHref legacyBehavior>
          <MUILink target="_blank" rel="noreferrer">
            {HELP_CENTER_URL}
          </MUILink>
        </Link>
      </li>
      <li>
        Discord:{' '}
        <Link href={DISCORD_URL} passHref legacyBehavior>
          <MUILink target="_blank" rel="noreferrer">
            {DISCORD_URL}
          </MUILink>
        </Link>
      </li>
      <li>
        Twitter:{' '}
        <Link href={TWITTER_URL} passHref legacyBehavior>
          <MUILink target="_blank" rel="noreferrer">
            {TWITTER_URL}
          </MUILink>
        </Link>
      </li>
    </ol>

    <h3>25. Where is the place of legal proceedings?</h3>
    <p>
      For users who are merchants within the meaning of the German Commercial Code (Handelsgesetzbuch), a special fund
      (Sonderverm&ouml;gen) under public law or a legal person under public law, Berlin shall be the exclusive place of
      jurisdiction for all disputes arising from the contractual relationship.
    </p>

    <h3>26. Is this all?</h3>
    <p>
      These Terms constitute the entire agreement between you and us in relation to the Agreement&rsquo;s subject
      matter. It replaces and extinguishes any and all prior agreements, draft agreements, arrangements, warranties,
      statements, assurances, representations and undertakings of any nature made by, or on behalf of either of us,
      whether oral or written, public or private, in relation to that subject matter.
    </p>
  </div>
)

const Terms: NextPage = () => {
  return (
    <>
      <Head>
        <title>Super Account – Terms</title>
      </Head>

      <main>{IS_OFFICIAL_HOST && <SafeTerms />}</main>
    </>
  )
}

export default Terms
