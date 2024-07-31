import type { MouseEventHandler, ReactNode } from 'react'
import type { NextPage } from 'next'
import Head from 'next/head'
import { IS_OFFICIAL_HOST } from '@/config/constants'

const SmoothScroll = ({ children }: { children: ReactNode }) => {
  const onClick: MouseEventHandler = (e) => {
    const anchor = (e.target as HTMLAnchorElement).getAttribute('href')
    if (anchor?.startsWith('#')) {
      e.preventDefault()
      const element = document.querySelector(anchor)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }

  return <div onClick={onClick}>{children}</div>
}

const SafePrivacyPolicy = () => (
  <SmoothScroll>
    <style jsx>{`
      ol {
        list-style: lower-alpha;
      }

      ol ol {
        list-style: lower-roman;
      }

      h4 {
        font-size: 1.1em;
      }

      h5 {
        font-size: 1em;
        margin-bottom: 0;
      }

      a {
        font-weight: 600;
        text-decoration: underline;
      }

      [id^='section-'] {
        scroll-margin-top: 60px;
      }
    `}</style>

    <h1>Privacy Policy</h1>
    <p>Last updated: January 2024.</p>
    <p>
      Your privacy is important to us. It is our policy to respect your privacy and comply with any applicable law and
      regulation regarding any personal information we may collect about you, including across our website,{' '}
      <a href="https://app.safe.global">https://app.safe.global</a>
      ,&nbsp;and other sites we own and operate as well as mobile applications we offer. Wherever possible, we have
      designed our website so that you may navigate and use our website without having to provide Personal Data.
    </p>
    <p>
      This Privacy Policy describes how we, as a controller, collect, use and share your personal data. It applies to
      personal data you voluntarily provide to us, or is automatically collected by us.{' '}
    </p>
    <p>
      In this policy, &quot;we&quot;, &quot;us&quot; and &quot;our&quot; refers to Core Contributors GmbH a company
      incorporated in Germany with its registered address at Gontardstraße 11, 10178 Berlin, Germany.&nbsp;Any data
      protection related questions you might have about how we handle your personal data or if you wish to exercise your
      data subject rights, please contact us by post or at privacy@cc0x.dev.{' '}
    </p>
    <p>
      In this Policy, &ldquo;personal data&rdquo; means any information relating to you as an identified or identifiable
      natural person (&ldquo;Data Subject&rdquo;); an identifiable natural person is one who can be identified, directly
      or indirectly, in particular by reference to an identifier such as a name, an online identifier or to one or more
      factors specific to your physical, physiological, genetic, mental, economic, cultural or social identity.
    </p>
    <p>
      In this Policy, &ldquo;processing&rdquo; means any operation or set of operations which is performed on personal
      data (as defined in this Privacy Policy) or on sets of personal data, whether or not by automated means, such as
      collection, recording, organization, structuring, storage, adaptation or alteration, retrieval, consultation, use,
      disclosure by transmission, dissemination or otherwise making available, alignment or combination, restriction,
      erasure or destruction.
    </p>
    <h3>1. Navigating this Policy</h3>
    <p>If you are viewing this policy online, you can click on the below links to jump to the relevant section:</p>
    <ol style={{ listStyle: 'arabic' }} start={2}>
      <li>
        <a href="#section-2">Glossary</a>
      </li>
      <li>
        <a href="#section-3">Your information and the Blockchain</a>
      </li>
      <li>
        <a href="#section-4">How We Use Personal Data</a>
      </li>
      <li>
        <a href="#section-5">Use of Third Party Applications</a>
      </li>
      <li>
        <a href="#section-6">Sharing Your Personal Data</a>
      </li>
      <li>
        <a href="#section-7">Transferring Your data outside of the EU</a>
      </li>
      <li>
        <a href="#section-8">Existence of Automated Decision-making</a>
      </li>
      <li>
        <a href="#section-9">Data Security</a>
      </li>
      <li>
        <a href="#section-10">Your Rights as a Data Subject</a>
      </li>
      <li>
        <a href="#section-11">Storing Personal Data</a>
      </li>
      <li>
        <a href="#section-12">Children’s data</a>
      </li>
      <li>
        <a href="#section-13">Changes to this Privacy Policy</a>
      </li>
      <li>
        <a href="#section-14">Contacts us</a>
      </li>
    </ol>
    <h3 id="section-2">2. Glossary</h3>
    <p>What do some of the capitalized terms mean in this policy?</p>
    <ol>
      <li>
        &ldquo;Blockchain&rdquo; means a mathematically secured consensus ledger such as the Ethereum Virtual Machine,
        an Ethereum Virtual Machine compatible validation mechanism, or other decentralized validation mechanisms.
      </li>
      <li>
        &ldquo;Transaction&rdquo; means a change to the data set through a new entry in the continuous Blockchain.
      </li>
      <li>
        &ldquo;Smart Contract&rdquo; is a piece of source code deployed as an application on the Blockchain which can be
        executed, including self-execution of Transactions as well as execution triggered by 3rd parties.
      </li>
      <li>
        &ldquo;Token&rdquo; is a digital asset transferred in a Transaction, including ETH, ERC20, ERC721 and ERC1155
        tokens.
      </li>
      <li>
        &ldquo;Wallet&rdquo; is a cryptographic storage solution permitting you to store cryptographic assets by
        correlation of a (i) Public Key and (ii) a Private Key or a Smart Contract to receive, manage and send Tokens.
      </li>
      <li>
        &ldquo;Recovery Phrase&rdquo; is a series of secret words used to generate one or more Private Keys and derived
        Public Keys.
      </li>
      <li>
        &ldquo;Public Key&rdquo; is a unique sequence of numbers and letters within the Blockchain to distinguish the
        network participants from each other.
      </li>
      <li>
        &ldquo;Private Key&rdquo; is a unique sequence of numbers and/or letters required to initiate a Blockchain
        Transaction and should only be known by the legal owner of the Wallet.
      </li>
      <li>
        &ldquo;Safe Account&rdquo; is a modular, self-custodial (i.e. not supervised by us) smart contract-based
        multi-signature Wallet. Safe Accounts are{' '}
        <a href="https://github.com/safe-global/safe-contracts/" target="_blank" rel="noreferrer">
          open-source
        </a>
        &nbsp;released under LGPL-3.0.
      </li>
      <li>
        &ldquo;{'SuperChain SA'}&rdquo; refers to a web-based graphical user interface for Safe Accounts as well as a
        mobile application on Android and iOS.
      </li>
      <li>
        &ldquo;Safe Account Transaction&rdquo; is a Transaction of a Safe Account, authorized by a user, typically via
        their Wallet.{' '}
      </li>
      <li>
        &ldquo;Profile&rdquo; means the Public Key and user provided, human readable label stored locally on the
        user&apos;s device.
      </li>
    </ol>
    <h3 id="section-3">3. Your information and the Blockchain</h3>
    <p>
      Blockchains, also known as distributed ledger technology (or simply &lsquo;DLT&rsquo;), are made up of digitally
      recorded data in a chain of packages called &lsquo;blocks&rsquo;. The manner in which these blocks are linked is
      chronological, meaning that the data is very difficult to alter once recorded. Since the ledger may be distributed
      all over the world (across several &lsquo;nodes&rsquo; which usually replicate the ledger) this means there is no
      single person making decisions or otherwise administering the system (such as an operator of a cloud computing
      system), and that there is no centralized place where it is located either.
    </p>
    <p>
      Accordingly, by design, records of a Blockchain cannot be changed or deleted and are said to be
      &lsquo;immutable&rsquo;. This may affect your ability to exercise your rights such as your right to erasure
      (&lsquo;right to be forgotten&rsquo;), or your rights to object or restrict processing of your personal data. Data
      on the Blockchain cannot be erased and cannot be changed. Although smart contracts may be used to revoke certain
      access rights, and some content may be made invisible to others, it is not deleted.
    </p>
    <p>
      In certain circumstances, in order to comply with our contractual obligations to you (such as delivery of Tokens)
      it will be necessary to write certain personal data, such as your Wallet address, onto the Blockchain; this is
      done through a smart contract and requires you to execute such transactions using your Wallet&rsquo;s Private Key.
    </p>
    <p>
      In most cases ultimate decisions to (i) transact on the Blockchain using your Wallet, as well as (ii) share the
      Public Key relating to your Wallet with anyone (including us) rests with you.
    </p>
    <p>
      IF YOU WANT TO ENSURE YOUR PRIVACY RIGHTS ARE NOT AFFECTED IN ANY WAY, YOU SHOULD NOT TRANSACT ON BLOCKCHAINS AS
      CERTAIN RIGHTS MAY NOT BE FULLY AVAILABLE OR EXERCISABLE BY YOU OR US DUE TO THE TECHNOLOGICAL INFRASTRUCTURE OF
      THE BLOCKCHAIN. IN PARTICULAR THE BLOCKCHAIN IS AVAILABLE TO THE PUBLIC AND ANY PERSONAL DATA SHARED ON THE
      BLOCKCHAIN WILL BECOME PUBLICLY AVAILABLE
    </p>
    <h3 id="section-4">4. How We Use Personal Data</h3>
    <h4>4.1. When visiting our website and using {'SuperChain SA'}</h4>
    <p>
      When visiting our website or using {'SuperChain SA'}, we may collect and process personal data. The data will be
      stored in different instances
    </p>
    <ol>
      <li>
        We connect the Wallet&nbsp;to the web app to identify the user via their public Wallet address. For this purpose
        we process:
        <ol>
          <li>public Wallet address and</li>
          <li>WalletConnect connection data</li>
        </ol>
      </li>
      <li>
        When you create a new Safe Account we process the following data to compose a Transaction based on your entered
        data to be approved by your Wallet:
        <ol>
          <li>your public Wallet address, </li>
          <li>account balance, </li>
          <li>smart contract address of the Safe Account,</li>
          <li>addresses of externally owned accounts&nbsp;and </li>
          <li>user activity</li>
        </ol>
      </li>
    </ol>
    <ol start={3}>
      <li>
        When you create a Profile for a new Safe Account we process the following data for the purpose of enabling you
        to view your Safe Account after creation as well as enabling you to view all co-owned Safe Accounts:
        <ol>
          <li>your public Wallet address and </li>
          <li>account balance</li>
        </ol>
      </li>
    </ol>
    <ol start={4}>
      <li>
        When you create a Profile for an existing Safe Account for the purpose of allowing you to view and use them in
        the {'SuperChain SA'}, we process your
        <ol>
          <li>public Wallet address, </li>
          <li>Safe Account balance, </li>
          <li>smart contract address of the Safe Account and</li>
          <li>Safe Account owner&apos;s public Wallet addresses</li>
        </ol>
      </li>
    </ol>
    <ol start={5}>
      <li>
        When you initiate a Safe Account Transaction&nbsp;we process the following data to compose the Transaction for
        you based on your entered data:{' '}
        <ol>
          <li>your public Wallet address and </li>
          <li>smart contract address of the Safe Account</li>
        </ol>
      </li>
    </ol>
    <ol start={6}>
      <li>
        When you sign a Safe Account Transaction&nbsp;we process the following data to enable you to sign the
        Transaction using your Wallet:
        <ol>
          <li>Safe Account balance, </li>
          <li>smart contract address of Safe Account and</li>
          <li>Safe Account owner&apos;s public Wallet addresses</li>
        </ol>
      </li>
    </ol>
    <ol start={7}>
      <li>
        To enable you to execute The transaction on the Blockchain we process:
        <ol>
          <li>your public Wallet address, </li>
          <li>Safe Account balance, </li>
          <li>smart contract address of the Safe Account, </li>
          <li>Safe Account owner&apos;s public Wallet addresses and </li>
          <li>Transactions signed by all Safe Account owners</li>
        </ol>
      </li>
    </ol>
    <ol start={8}>
      <li>
        When we collect relevant&nbsp;data&nbsp;from the Blockchain to display context information in the
        {`SuperChain SA`}
        we process:
        <ol>
          <li>your public Wallet address, </li>
          <li>account balance,</li>
          <li>account activity and</li>
          <li>Safe Account owner&apos;s Public wallet addresses</li>
        </ol>
      </li>
    </ol>
    <ol start={9}>
      <li>
        When we decode Transactions from the Blockchain for the purpose of providing Transaction information in a
        conveniently readable format, we process:
        <ol>
          <li>your public Wallet address </li>
          <li>account balance and </li>
          <li>account activity</li>
        </ol>
      </li>
    </ol>
    <ol start={10}>
      <li>
        When we maintain a user profile&nbsp;to provide you with a good user experience through Profiles and an address
        book we process:
        <ol>
          <li>your public Wallet address, </li>
          <li>label, </li>
          <li>smart contract address of the Safe Account, </li>
          <li>Safe Account owner&apos;s public wallet addresses, </li>
          <li>last used Wallet (for automatic reconnect), </li>
          <li>last used chain id, </li>
          <li>selected currency, </li>
          <li>theme and </li>
          <li>address format</li>
        </ol>
      </li>
    </ol>
    <p>The legal base for all these activities is the performance of the contract we have with you (GDPR Art.6.1b).</p>
    <p>
      THE DATA WILL BE STORED ON THE BLOCKCHAIN. GIVEN THE TECHNOLOGICAL DESIGN OF THE BLOCKCHAIN, AS EXPLAINED IN
      SECTION 2, THIS DATA WILL BECOME PUBLIC AND IT WILL NOT LIKELY BE POSSIBLE TO DELETE OR CHANGE THE DATA AT ANY
      GIVEN TIME.
    </p>
    <h4>4.2. Tracking</h4>
    <p>4.2.1 We will process the following personal data to analyze your behavior:</p>
    <ol>
      <li>IP address (will not be stored for EU users), </li>
      <li>session tracking, </li>
      <li>user behavior, </li>
      <li>wallet type, </li>
      <li>Safe Account address,</li>
      <li>Signer wallet address,</li>
      <li>device and browser user agent,</li>
      <li>user consent, </li>
      <li>operating system, </li>
      <li>referrers, </li>
      <li>user behavior: subpage, duration, and revisit, the date and time of access,</li>
    </ol>
    <p>
      In the case you have given consent, we will additionally store an analytics cookie on your device to identify you
      as a user across browsing sessions. The lawful basis for this processing is your consent (GDPR Art.6.1a) when
      agreeing to accept cookies.
    </p>
    <p>
      The collected data is solely used in the legitimate interest of improving our product and user experience. The
      data is stored only temporarily and is deleted after 14 months.
    </p>
    <p>
      We do not track any of the following:
      <ol>
        <li>Wallet signatures</li>
        <li>Granular transaction details</li>
      </ol>
    </p>
    <p>
      4.2.2 We conduct technical monitoring of your activity on the platform in order to ensure availability, integrity
      and robustness of the service. For this purpose we process your:
    </p>
    <ol>
      <li>IP addresses, </li>
      <li>meta and communication data, </li>
      <li>website access and </li>
      <li>log data</li>
    </ol>
    <p>
      The lawful basis for this processing is our legitimate interest (GDPR Art.6.1f) in ensuring the correctness of the
      service.
    </p>
    <p>4.2.3. Anonymized tracking</p>
    <p>
      We will anonymize the following personal data to gather anonymous user statistics on your browsing behavior on our
      website:
      <ol>
        <li>daily active users,</li>
        <li>new users acquired from a specific campaign,</li>
        <li>user journeys,</li>
        <li>number of users per country,</li>
        <li>difference in user behavior between mobile vs. web visitors.</li>
      </ol>
    </p>
    <p>
      The lawful basis for this processing is our legitimate interest (GDPR Art.6.1f) in improving our product and user
      experience.
    </p>
    <h4>4.3. When Participating in User Experience Research (UXR)</h4>
    <p>
      When you participate in our user experience research we may collect and process some personal data. This data may
      include:
    </p>
    <ol>
      <li>your name</li>
      <li>your email</li>
      <li>your phone type</li>
      <li>your occupation</li>
      <li>range of managed funds</li>
    </ol>
    <p>
      In addition, we may take a recording of you while testing {'SuperChain SA'} for internal and external use. The
      basis for this collection and processing is our legitimate business interest in monitoring and improving our
      services.
    </p>
    <p>
      The lawful basis for this processing is your consent as provided before participating in user experience research.
    </p>
    <h4>4.4. Publishing the app</h4>
    <p>4.4.1 Publishing the app on Google Play Store.</p>
    <p>We process the following information to enable you to download the app on smartphones running Android:</p>
    <ol>
      <li>google account and </li>
      <li>e-mail address</li>
    </ol>
    <p>4.4.2 Publishing the app on Apple App Store</p>
    <p>We process the following information to enable you to download the app on smartphones running iOS:</p>
    <ol>
      <li>apple account and </li>
      <li>e-mail address</li>
    </ol>
    <p>
      The lawful basis for these two processing activities is the performance of the contract we have with you (GDPR
      Art.6.1b).{' '}
    </p>
    <h4>4.5. Use of the app</h4>
    <p>4.5.1 We provide the app to you to enable you to use it. For this purpose we process your:</p>
    <ol>
      <li>mobile device information, </li>
      <li>http request caches and </li>
      <li>http request cookies</li>
    </ol>
    <p>
      4.5.2 In order to update you about changes in the app, we need to send you push notifications. For this purpose we
      process your:
    </p>
    <ol>
      <li>Transactions executed and failed, </li>
      <li>assets sent, </li>
      <li>assets received </li>
    </ol>
    <p>
      4.5.3 To provide support to you and notify you about outage resulting in unavailability of the service, we process
      your:
    </p>
    <ol>
      <li>pseudonymized user identifier</li>
    </ol>
    <p>
      4.5.4 In order to provide remote client configuration and control whether to inform about, recommend or force you
      to update your app or enable/disable certain app features we process your:
    </p>
    <ol>
      <li>User agent, </li>
      <li>app information (version, build number etc.), </li>
      <li>language, </li>
      <li>Country,</li>
      <li>Platform</li>
      <li>operating system</li>
      <li>Browser</li>
      <li>Device category</li>
      <li>User audience</li>
      <li>User property</li>
      <li>User in random percentage</li>
      <li>Imported segment</li>
      <li>date/time</li>
      <li>first open </li>
      <li>installation ID</li>
    </ol>
    <p>
      For all these activities (4.5.1-4.54) we rely on the legal base of performance of a contract (GDPR Art.6.1b) with
      you.{' '}
    </p>
    <p>4.5.5 Finally, to report errors and improve user experience we process your:</p>
    <ol>
      <li>User agent info (Browser, OS, device), </li>
      <li>URL that you were on (Can contain Safe Account address) and </li>
      <li>Error info: Time, stacktrace</li>
    </ol>
    <p>We rely on our legitimate interest (GDPR Art.6.1f) of ensuring product quality. </p>
    <p>
      4.5.6 We process your personal data to allow you to authenticate using your gmail account or AppleID and to create
      a signer wallet/owner account . For that purpose following personal data is processed:
    </p>
    <ol>
      <li>Anonymised device information and identifiers, e.g. IP address, cookie IDs, device type</li>
      <li>User account authentication information (e.g. username, password)</li>
      <li>
        Unique user identifier (e.g. a random string associated with authentication, at times can be email. If so,
        sensitive strings are processed but hashed and not stored)
      </li>
      <li>Connection and usage Information (e.g. logins to the application)</li>
    </ol>
    <p>
      For this processing, we rely on our legitimate interest (GDPR Art.6.1f) of facilitating the onboarding for users
      and ameliorating the user experience with regards to our product.
    </p>
    <p>
      4.5.7 Providing on and off-ramp services to enable you to top up your Safe Account with e.g. bank transfer, debit
      card, credit card. For this purpose MoonPay may process your:
    </p>
    <ol>
      <li>full name</li>
      <li>date of birth</li>
      <li>nationality</li>
      <li>gender</li>
      <li>signature</li>
      <li>utility bills</li>
      <li>photographs</li>
      <li>phone number</li>
      <li>home address</li>
      <li>email</li>
      <li>
        information about the transactions you make via MoonPay services (e.g. name of the recipient, your name, the
        amount, and/or timestamp)
      </li>
      <li>geo location/tracking details</li>
      <li>operating system</li>
      <li>personal IP address</li>
    </ol>
    <p>
      To conduct this activity we rely on our legitimate interest (GDPR Art.6.1f) of ameliorating the onboarding process
      and the user experience through providing an easier option to customers to fund their account.
    </p>
    <h4>4.6 Other uses of your Personal Data</h4>
    <p>
      We may process any of your Personal Data where it is necessary to establish, exercise, or defend legal claims. The
      legal basis for this is our legitimate interests, namely the protection and assertion of our legal rights, your
      legal rights and the legal rights of others.
    </p>
    <p>
      Further, we may process your Personal data where such processing is necessary in order for us to comply with a
      legal obligation to which we are subject. The legal basis for this processing is our legitimate interests, namely
      the protection and assertion of our legal rights.
    </p>
    <h3 id="section-5">5. Use of Third Party Applications</h3>
    <h4>5.1. Blockchain</h4>
    <p>
      When using Safe Accounts your smart contract address, Safe Account Transactions, addresses of signer accounts and
      ETH balances and token balances will be stored on the Blockchain. See section 2 of this Policy
    </p>
    <p>
      THE INFORMATION WILL BE DISPLAYED PERMANENTLY AND PUBLIC, THIS IS PART OF THE NATURE OF THE BLOCKCHAIN. IF YOU ARE
      NEW TO THIS FIELD, WE HIGHLY RECOMMEND INFORMING YOURSELF ABOUT THE BLOCKCHAIN TECHNOLOGY BEFORE USING OUR
      SERVICES.
    </p>
    <h4>5.2. Amazon Web Services</h4>
    <p>
      We use{' '}
      <a href="https://aws.amazon.com/" target="_blank" rel="noreferrer">
        Amazon Web Services (AWS)
      </a>
      &nbsp;to store log and database data as described in section 4.1.
    </p>
    <h4>5.3. Datadog</h4>
    <p>
      We use{' '}
      <a href="https://www.datadoghq.com/" target="_blank" rel="noreferrer">
        Datadog
      </a>
      &nbsp;to store log data as described in section 4.1.
    </p>
    <h4>5.4. Mobile app stores</h4>
    <p>
      {'SuperChain SA'} mobile apps are distributed via{' '}
      <a href="https://www.apple.com/app-store/" target="_blank" rel="noreferrer">
        Apple AppStore
      </a>
      &nbsp;and{' '}
      <a href="https://play.google.com/" target="_blank" rel="noreferrer">
        Google Play Store
      </a>
      . They most likely track user behavior when downloading apps from their stores as well as when using apps. We only
      have very limited access to that data. We can view aggregated statistics on installs and uninstalls. Grouping by
      device type, app version, language, carrier and country is possible.
    </p>
    <h4>5.5. Fingerprint/Touch ID/ Face ID</h4>
    <p>
      We enable the user to unlock the {'SuperChain SA'} mobile app via biometrics information (touch ID or face ID).
      This is a feature of the operating system. We do not store any of this data. Instead, the API of the operating
      system is used to validate the user input. If you have any further questions you should consult with your
      preferred mobile device provider or manufacturer.
    </p>
    <h4>5.6. Google Firebase</h4>
    <p>
      We use the following{' '}
      <a href="https://firebase.google.com/" target="_blank" rel="noreferrer">
        Google Firebase
      </a>
      &nbsp;services:
    </p>
    <ul>
      <li>
        Firebase Cloud Messaging: Provide updates to the user about changes in the mobile apps via push notifications.
      </li>
      <li>
        Firebase remote config: Inform users about, recommend or force user to update their mobile app or
        enabling/disabling certain app features. These settings are global for all users, no personalization is
        happening.
      </li>
      <li>Firebase crash reporting: Report errors and crashes to improve product and user experience.</li>
    </ul>
    <h4>5.7. WalletConnect</h4>
    <p>
      <a href="https://walletconnect.com/" target="_blank" rel="noreferrer">
        WalletConnect
      </a>
      &nbsp;is used to connect wallets to dapps using end-to-end encryption by scanning a QR code. We do not store any
      information collected by WalletConnect.{' '}
    </p>
    <h4>5.8. Sentry</h4>
    <p>
      We use{' '}
      <a href="https://sentry.io/" target="_blank" rel="noreferrer">
        Sentry
      </a>
      &nbsp;to collect error reports and crashes to improve product and user experience.{' '}
    </p>
    <h4>5.9. Beamer</h4>
    <p>
      We use{' '}
      <a href="https://www.getbeamer.com/" target="_blank" rel="noreferrer">
        Beamer
      </a>
      &nbsp;providing updates to the user about changes in the app. Beamer&apos;s purpose and function are further
      explained under the following link{' '}
      <a href="https://www.getbeamer.com/showcase/notification-center" target="_blank" rel="noreferrer">
        https://www.getbeamer.com/showcase/notification-center
      </a>
      .
    </p>
    <p>We do not store any information collected by Beamer.</p>
    <h4>5.10. Node providers</h4>
    <p>
      We use{' '}
      <a href="https://www.infura.io/" target="_blank" rel="noreferrer">
        Infura
      </a>
      &nbsp;and{' '}
      <a href="https://nodereal.io/" target="_blank" rel="noreferrer">
        Nodereal
      </a>
      &nbsp;to query public blockchain data from our backend services. All Safe Accounts are monitored, no
      personalization is happening and no user IP addresses are forwarded. Personal data processed are:
    </p>
    <ul>
      <li>Your smart contract address of the Safe;</li>
      <li>Transaction id/hash</li>
      <li>Transaction data</li>
    </ul>
    <h4>5.11. Tenderly</h4>
    <p>
      We use{' '}
      <a href="https://tenderly.co/" target="_blank" rel="noreferrer">
        Tenderly
      </a>
      &nbsp;to simulate blockchain transactions before they are executed. For that we send your smart contract address
      of your Safe Account and transaction data to Tenderly.
    </p>
    <h4>5.12. Internal communication</h4>
    <p>We use the following tools for internal communication. </p>
    <ul>
      <li>
        <a href="https://slack.com/" target="_blank" rel="noreferrer">
          Slack
        </a>
      </li>
      <li>
        <a href="https://workspace.google.com/" target="_blank" rel="noreferrer">
          Google Workspace
        </a>
      </li>
      <li>
        <a href="https://notion.so" target="_blank" rel="noreferrer">
          Notion
        </a>
      </li>
    </ul>
    <h4>5.13. Web3Auth</h4>
    <p>
      We use{' '}
      <a href="https://web3auth.io/" target="_blank" rel="noreferrer">
        Web3Auth
      </a>{' '}
      to create a signer wallet/an owner account by using the user&apos;s Gmail account or Apple ID information.
    </p>
    <h4>5.14. MoonPay</h4>
    <p>
      We use{' '}
      <a href="https://www.moonpay.com/" target="_blank" rel="noreferrer">
        MoonPay
      </a>{' '}
      to offer on-ramp and off-ramp services. For that purpose personal data is required for KYC/AML or other financial
      regulatory requirements. This data is encrypted by MoonPay.
    </p>
    <h4>5.15. Spindl</h4>
    <p>
      We use{' '}
      <a href="https://www.spindl.xyz" target="_blank" rel="noreferrer">
        Spindl
      </a>
      , a measurement and attribution solution for web3 that assists us in comprehending how users interact with
      different decentralized applications and our app and to enhance your experience with {`SuperChain SA`}. For
      enhanced privacy, data is stored for a period of 7 days after which it is securely deleted.
    </p>
    <h3 id="section-6">6. Sharing Your Personal Data</h3>
    <p>
      We may pass your information to our Business Partners, administration centers, third party service providers,
      agents, subcontractors and other associated organizations for the purposes of completing tasks and providing our
      services to you.
    </p>
    <p>
      In addition, when we use any other third-party service providers, we will disclose only the personal information
      that is necessary to deliver the service required and we will ensure that they keep your information secure and
      not use it for their own direct marketing purposes. In addition, we may transfer your personal information to a
      third party as part of a sale of some, or all, of our business and assets or as part of any business restructuring
      or reorganization, or if we are under a duty to disclose or share your personal data in order to comply with any
      legal obligation. However, we will take steps to ensure that your privacy rights continue to be protected.
    </p>
    <h3 id="section-7">7. Transferring Your data outside of the EU</h3>
    <p>
      Wherever possible we will choose service providers based in the EU. For those outside the EU, wherever possible we
      will configure data to be inside the EU. We concluded the new version of the Standard Contractual Clauses with
      these service providers (2021/914).
    </p>
    <p>Service providers in the US:</p>
    <ul>
      <li>Amazon Web Service Inc.</li>
      <li>Google LLC</li>
      <li>Data Dog Inc.</li>
      <li>Slack Technologies LLC</li>
      <li>Joincube Inc. (Beamer)</li>
      <li>Functional software Inc. (Sentry) </li>
      <li>Notion Labs Inc.</li>
      <li>ConsenSys Software Inc.</li>
    </ul>
    <p>Service providers in other countries outside of the EU:</p>
    <ul>
      <li>Tenderly d.o.o. is based in Serbia.</li>
      <li>Node Real PTE Ltd. is based in Singapore.</li>
      <li>Torus Labs PTE. Ltd. is based in Singapore.</li>
      <li>Eighteenth September Limited (“MoonPay”) in the Seychelles.</li>
    </ul>
    <p>
      HOWEVER, WHEN INTERACTING WITH THE BLOCKCHAIN, AS EXPLAINED ABOVE IN THIS POLICY, THE BLOCKCHAIN IS A GLOBAL
      DECENTRALIZED PUBLIC NETWORK AND ACCORDINGLY ANY PERSONAL DATA WRITTEN ONTO THE BLOCKCHAIN MAY BE TRANSFERRED AND
      STORED ACROSS THE GLOBE.
    </p>
    <h3 id="section-8">8. Existence of Automated Decision-making</h3>
    <p>We do not use automatic decision-making or profiling when processing Personal Data.</p>
    <h3 id="section-9">9. Data Security</h3>
    <p>
      We have put in place appropriate security measures to prevent your personal data from being accidentally lost,
      used or accessed in an unauthorized way, altered or disclosed. In addition, we limit access to your personal data
      to those employees, agents, contractors and other third parties who have a business need to know. They will only
      process your personal data on our instructions and they are subject to a duty of confidentiality.
    </p>
    <p>
      We have put in place procedures to deal with any suspected personal data breach and will notify you and any
      applicable regulator of a breach where we are legally required to do so.
    </p>
    <h3 id="section-10">10. Your Rights as a Data Subject</h3>
    <p>
      You have certain rights under applicable legislation, and in particular under Regulation EU 2016/679 (General Data
      Protection Regulation or &lsquo;GDPR&rsquo;). We explain these below. You can find out more about the GDPR and
      your rights by accessing the{' '}
      <a href="https://ec.europa.eu/info/law/law-topic/data-protection_en" target="_blank" rel="noreferrer">
        European Commission&rsquo;s website
      </a>
      . If you wish to exercise your data subject rights, please contact us by post or at privacy@cc0x.dev.
    </p>
    <h5>Right Information and access</h5>
    <p>
      You have a right to be informed about the processing of your personal data (and if you did not give it to us,
      information as to the source) and this Privacy Policy intends to provide the information. Of course, if you have
      any further questions you can contact us on the above details.
    </p>
    <h5>Right to rectification</h5>
    <p>
      You have the right to have any inaccurate personal information about you rectified and to have any incomplete
      personal information about you completed. You may also request that we restrict the processing of that
      information. The accuracy of your information is important to us. If you do not want us to use your Personal
      Information in the manner set out in this Privacy Policy, or need to advise us of any changes to your personal
      information, or would like any more information about the way in which we collect and use your Personal
      Information, please contact us at the above details.
    </p>
    <h5>Right to erasure (right to be &lsquo;forgotten&rsquo;)</h5>
    <p>
      You have the general right to request the erasure of your personal information in the following circumstances:
    </p>
    <ul>
      <li>the personal information is no longer necessary for the purpose for which it was collected;</li>
      <li>
        you withdraw your consent to consent based processing and no other legal justification for processing applies;
      </li>
      <li>you object to processing for direct marketing purposes;</li>
      <li>we unlawfully processed your personal information; and</li>
      <li>erasure is required to comply with a legal obligation that applies to us.</li>
    </ul>
    <p>
      HOWEVER, WHEN INTERACTING WITH THE BLOCKCHAIN WE MAY NOT BE ABLE TO ENSURE THAT YOUR PERSONAL DATA IS DELETED.
      THIS IS BECAUSE THE BLOCKCHAIN IS A PUBLIC DECENTRALIZED NETWORK AND BLOCKCHAIN TECHNOLOGY DOES NOT GENERALLY
      ALLOW FOR DATA TO BE DELETED AND YOUR RIGHT TO ERASURE MAY NOT BE ABLE TO BE FULLY ENFORCED. IN THESE
      CIRCUMSTANCES WE WILL ONLY BE ABLE TO ENSURE THAT ALL PERSONAL DATA THAT IS HELD BY US IS PERMANENTLY DELETED.
    </p>
    <p>We will proceed to comply with an erasure request without delay unless continued retention is necessary for:</p>
    <ul>
      <li>Exercising the right of freedom of expression and information;</li>
      <li>Complying with a legal obligation under EU or other applicable law;</li>
      <li>The performance of a task carried out in the public interest;</li>
      <li>
        Archiving purposes in the public interest, scientific or historical research purposes, or statistical purposes,
        under certain circumstances; and/or
      </li>
      <li>The establishment, exercise, or defense of legal claims.</li>
    </ul>
    <h5>Right to restrict processing and right to object to processing</h5>
    <p>You have a right to restrict processing of your personal information, such as where:</p>
    <ol>
      <li>you contest the accuracy of the personal information;</li>
      <li>
        where processing is unlawful you may request, instead of requesting erasure, that we restrict the use of the
        unlawfully processed personal information;
      </li>
      <li>
        we no longer need to process your personal information but need to retain your information for the
        establishment, exercise, or defense of legal claims.
      </li>
    </ol>
    <p>
      You also have the right to object to processing of your personal information under certain circumstances, such as
      where the processing is based on your consent and you withdraw that consent. This may impact the services we can
      provide and we will explain this to you if you decide to exercise this right.
    </p>
    <p>
      HOWEVER, WHEN INTERACTING WITH THE BLOCKCHAIN, AS IT IS A PUBLIC DECENTRALIZED NETWORK, WE WILL LIKELY NOT BE ABLE
      TO PREVENT EXTERNAL PARTIES FROM PROCESSING ANY PERSONAL DATA WHICH HAS BEEN WRITTEN ONTO THE BLOCKCHAIN. IN THESE
      CIRCUMSTANCES WE WILL USE OUR REASONABLE ENDEAVORS TO ENSURE THAT ALL PROCESSING OF PERSONAL DATA HELD BY US IS
      RESTRICTED, NOTWITHSTANDING THIS, YOUR RIGHT TO RESTRICT TO PROCESSING MAY NOT BE ABLE TO BE FULLY ENFORCED.
    </p>
    <h5>Right to data portability</h5>
    <p>
      Where the legal basis for our processing is your consent or the processing is necessary for the performance of a
      contract to which you are party or in order to take steps at your request prior to entering into a contract, you
      have a right to receive the personal information you provided to us in a structured, commonly used and
      machine-readable format, or ask us to send it to another person.
    </p>
    <h5>Right to freedom from automated decision-making</h5>
    <p>
      As explained above, we do not use automated decision-making, but where any automated decision-making takes place,
      you have the right in this case to express your point of view and to contest the decision, as well as request that
      decisions based on automated processing concerning you or significantly affecting you and based on your personal
      data are made by natural persons, not only by computers.
    </p>
    <h5>Right to object to direct marketing (&lsquo;opting out&rsquo;)</h5>
    <p>
      You have a choice about whether or not you wish to receive information from us. We will not contact you for
      marketing purposes unless:
    </p>
    <ul>
      <li>
        you have a business relationship with us, and we rely on our legitimate interests as the lawful basis for
        processing (as described above)
      </li>
      <li>you have otherwise given your prior consent (such as when you download one of our guides)</li>
    </ul>
    <p>
      You can change your marketing preferences at any time by contacting us on the above details. On each and every
      marketing communication, we will always provide the option for you to exercise your right to object to the
      processing of your personal data for marketing purposes (known as &lsquo;opting-out&rsquo;) by clicking on the
      &lsquo;unsubscribe&rsquo; button on our marketing emails or choosing a similar opt-out option on any forms we use
      to collect your data. You may also opt-out at any time by contacting us on the below details.
    </p>
    <p>
      Please note that any administrative or service-related communications (to offer our services, or notify you of an
      update to this Privacy Policy or applicable terms of business, etc.) will solely be directed at our clients or
      business partners, and such communications generally do not offer an option to unsubscribe as they are necessary
      to provide the services requested. Therefore, please be aware that your ability to opt-out from receiving
      marketing and promotional materials does not change our right to contact you regarding your use of our website or
      as part of a contractual relationship we may have with you.
    </p>
    <h5>Right to request access</h5>
    <p>
      You also have a right to access information we hold about you. We are happy to provide you with details of your
      Personal Information that we hold or process. To protect your personal information, we follow set storage and
      disclosure procedures, which mean that we will require proof of identity from you prior to disclosing such
      information. You can exercise this right at any time by contacting us on the above details.
    </p>
    <h5>Right to withdraw consent</h5>
    <p>
      Where the legal basis for processing your personal information is your consent, you have the right to withdraw
      that consent at any time by contacting us on the above details.
    </p>
    <h5>Raising a complaint about how we have handled your personal data</h5>
    <p>
      If you wish to raise a complaint on how we have handled your personal data, you can contact us as set out above
      and we will then investigate the matter.
    </p>
    <h5>Right to lodge a complaint with a relevant supervisory authority</h5>
    <p>
      We encourage you to contact us at privacy@cc0de.dev if you have any privacy related concerns. Should you
      disapprove of the response we have provided you, you have the right to lodge a complaint with our supervisory
      authority, or with the data protection authority of the European member state you live or work in. The details of
      the supervisory authority responsible for Berlin, Germany, are:
    </p>
    <p>Berliner Beauftragte f&uuml;r Datenschutz und Informationsfreiheit</p>
    <p>
      Alt-Moabit 59-61
      <br />
      10555 Berlin
      <br />
      Germany
      <br />
      Phone: 030/138 89-0
    </p>
    <p>
      <a href="https://www.datenschutz-berlin.de" target="_blank" rel="noreferrer">
        https://www.datenschutz-berlin.de
      </a>
      &nbsp;
    </p>
    <p>
      You also have the right to lodge a complaint with the supervisory authority in the country of your habitual
      residence, place of work, or the place where you allege an infringement of one or more of our rights has taken
      place, if that is based in the EEA.
    </p>
    <h3 id="section-11">11. Storing Personal Data</h3>
    <p>
      We retain your information only for as long as is necessary for the purposes for which we process the information
      as set out in this policy.
    </p>
    <p>
      However, we may retain your Personal Data for a longer period of time where such retention is necessary for
      compliance with a legal obligation to which we are subject, or in order to protect your vital interests or the
      vital interests of another natural person.
    </p>
    <h3 id="section-12">12. Children’s data</h3>
    <p>
      Our products and services are neither designed nor intended for use by children and persons under the age of 18.
      If you suspect or discover that our products and services are being used by a child, please contact us immediately
      at <a href="mailto:privacy@cc0x.dev">privacy@cc0x.dev</a>
    </p>
    <h3 id="section-13">13. Changes to this Privacy Policy</h3>
    <p>
      We may modify this privacy policy at any time to comply with legal requirements as well as developments within our
      organization. When we do, we will revise the date at the top of this page. Each visit or interaction with our
      services will be subject to the new privacy policy. We encourage you to regularly review our privacy policy to
      stay informed about our data protection policy. Unless, we implement profound changes that we proactively notify
      you about, you acknowledge that it is your responsibility to review our privacy policy to be aware of
      modifications. If you do not agree to the revised policy, you should discontinue your use of this website.
    </p>
    <h3 id="section-14">14. Contact Us</h3>
    <h5>Contact us by post or email at:</h5>
    <p>
      Core Contributors GmbH
      <br />
      Gontardstraße 11
      <br />
      10178 Berlin
      <br />
      Germany
      <br />
      privacy@cc0x.dev
    </p>
    <h5>Contact our Data Protection Officer by post or email at:</h5>
    <p>
      TechGDPR DPC GmbH
      <br />
      Heinrich-Roller Str. 15
      <br />
      10405 Berlin
      <br />
      Germany
    </p>
    <p>
      <a href="mailto:corecontributors.dpo@techgdpr.com">corecontributors.dpo@techgdpr.com</a>
    </p>
  </SmoothScroll>
)

const PrivacyPolicy: NextPage = () => {
  return (
    <>
      <Head>
        <title>{'SuperChain SA – Privacy policy'}</title>
      </Head>

      <main>{IS_OFFICIAL_HOST && <SafePrivacyPolicy />}</main>
    </>
  )
}

export default PrivacyPolicy
