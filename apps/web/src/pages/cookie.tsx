import type { NextPage } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import MUILink from '@mui/material/Link'
import { AppRoutes } from '@/config/routes'
import { useIsOfficialHost } from '@/hooks/useIsOfficialHost'
import { BRAND_NAME } from '@/config/constants'

const SafeCookiePolicy = () => (
  <div>
    <style jsx>{`
      table {
        width: 100%;
        border-spacing: 0;
        border: 0;
        border-collapse: collapse;
      }

      table td {
        border: 1px solid;
        padding: 0 8px;
      }

      table tr:first-child td {
        font-weight: bold;
      }
    `}</style>

    <h1>Cookie Policy</h1>
    <p>Last updated: January 2024.</p>
    <p>
      As described in our{' '}
      <Link href={AppRoutes.privacy} passHref legacyBehavior>
        <MUILink>Privacy Policy</MUILink>
      </Link>
      , for general web-browsing of this website, your personal data is not revealed to us, although certain statistical
      information is available to us via our internet service provider as well as through the use of special tracking
      technologies. Such information tells us about the pages you are clicking on or the hardware you are using, but not
      your name, age, address or anything we can use to identify you personally. We exclusively process your personal
      data in pseudonymised form.
    </p>
    <p>
      This Cookie Policy applies to our website at{' '}
      <Link href="https://app.safe.global" passHref legacyBehavior>
        <MUILink>https://app.safe.global</MUILink>
      </Link>
      &nbsp;and sets out some further detail on how and why we use these technologies on our website.{' '}
    </p>
    <p>
      In this policy, &quot;we&quot;, &quot;us&quot; and &quot;our&quot; refers to Core Contributors GmbH a company
      incorporated in Germany with its registered address at c/o WeWork, Dircksenstr. 3, 10179 Berlin, Germany. The
      terms &ldquo;you&rdquo; and &ldquo;your&rdquo; includes our clients, business partners and users of this website.{' '}
    </p>
    <p>
      By using our website, you consent to storage and access to cookies and other technologies on your device, in
      accordance with this Cookie Policy.
    </p>
    <h2>What are cookies?</h2>
    <p>
      Cookies are a feature of web browser software that allows web servers to recognize the computer or device used to
      access a website. A cookie is a small text file that a website saves on your computer or mobile device when you
      visit the site. It enables the website to remember your actions and preferences (such as login, language, font
      size and other display preferences) over a period of time, so you don&apos;t have to keep re-entering them
      whenever you come back to the site or browse from one page to another.
    </p>
    <h2>What are the different types of cookies?</h2>
    <p>A cookie can be classified by its lifespan and the domain to which it belongs.</p>
    <p>By lifespan, a cookie is either a:</p>
    <ol start={1}>
      <li>session cookie which is erased when the user closes the browser; or</li>
      <li>
        persistent cookie which is saved to the hard drive and remains on the user&apos;s computer/device for a
        pre-defined period of time. As for the domain to which it belongs, cookies are either:
      </li>
    </ol>
    <ol start={1}>
      <li>
        first-party cookies which are set by the web server of the visited page and share the same domain (i.e. set by
        us); or
      </li>
      <li>third-party cookies stored by a different domain to the visited page&apos;s domain.</li>
    </ol>
    <h2>What cookies do we use and why?</h2>
    <p>We list all the cookies we use on this website in the APPENDIX below.</p>
    <p>
      We do not use cookies set by ourselves via our web developers (first-party cookies). We only have those set by
      others (third-party cookies).
    </p>
    <p>
      Cookies are also sometimes classified by reference to their purpose. We use the following cookies for the
      following purposes:
    </p>
    <ol start={1}>
      <li>
        Analytical/performance cookies: They allow us to recognize and count the number of visitors and to see how
        visitors move around our website when they are using it, as well as dates and times they visit. This helps us to
        improve the way our website works, for example, by ensuring that users are finding what they are looking for
        easily.
      </li>
      <li>
        Targeting cookies: These cookies record your visit to our website, the pages you have visited and the links you
        have followed, as well as time spent on our website, and the websites visited just before and just after our
        website. We will use this information to make our website and the advertising displayed on it more relevant to
        your interests. We may also share this information with third parties for this purpose.
      </li>
    </ol>
    <p>
      In general, we use cookies and other technologies (such as web server logs) on our website to enhance your
      experience and to collect information about how our website is used.{' '}
    </p>
    <p>
      We will retain and evaluate information on your recent visits to our website and how you move around different
      sections of our website for analytics purposes to understand how people use our website so that we can make it
      more intuitive. The information also helps us to understand which parts of this website are most popular and
      generally to assess user behavior and characteristics to measure interest in and use of the various areas of our
      website. This then allows us to improve our website and the way we market our business.
    </p>
    <p>
      This information may also be used to help us to improve, administer and diagnose problems with our server and
      website. The information also helps us monitor traffic on our website so that we can manage our website&apos;s
      capacity and efficiency.
    </p>
    <h2>Other Technologies</h2>
    <p>
      We may allow others to provide analytics services and serve advertisements on our behalf. In addition to the uses
      of cookies described above, these entities may use other methods, such as the technologies described below, to
      collect information about your use of our website and other websites and online services.
    </p>
    <p>
      Pixels tags. Pixel tags (which are also called clear GIFs, web beacons, or pixels), are small pieces of code that
      can be embedded on websites and emails. Pixels tags may be used to learn how you interact with our website pages
      and emails, and this information helps us, and our partners provide you with a more tailored experience.
    </p>
    <p>
      Device Identifiers. A device identifier is a unique label that can be used to identify a mobile device. Device
      identifiers may be used to track, analyze and improve the performance of the website and ads delivered.
    </p>
    <h2>What data is collected by cookies and other technologies on our website?</h2>
    <h3>This information may include:</h3>
    <ol start={1}>
      <li>
        the IP and logical address of the server you are using (but the last digits are anonymized so we cannot identify
        you).
      </li>
      <li>the top level domain name from which you access the internet (for example .ie, .com, etc)</li>
      <li>the type of browser you are using,</li>
      <li>the date and time you access our website</li>
      <li>the internet address linking to our website.</li>
    </ol>
    <h3>This website also uses cookies to:</h3>
    <ol start={1}>
      <li>remember you and your actions while navigating between pages;</li>
      <li>remember if you have agreed (or not) to our use of cookies on our website;</li>
      <li>ensure the security of the website;</li>
      <li>monitor and improve the performance of servers hosting the site;</li>
      <li>distinguish users and sessions;</li>
      <li>Improving the speed of the site when you access content repeatedly;</li>
      <li>determine new sessions and visits;</li>
      <li>show the traffic source or campaign that explains how you may have reached our website; and</li>
      <li>allow us to store any customization preferences where our website allows this</li>
    </ol>
    <p>
      We may also use other services, such as{' '}
      <Link href="https://www.google.com/intl/en/analytics/#?modal_active=none" passHref legacyBehavior>
        <MUILink target="_blank" rel="noreferrer">
          Google Analytics
        </MUILink>
      </Link>
      &nbsp;(described below) or other third-party cookies, to assist with analyzing performance on our website. As part
      of providing these services, these service providers may use cookies and the technologies described below to
      collect and store information about your device, such as time of visit, pages visited, time spent on each page of
      our website, links clicked and conversion information, IP address, browser, mobile network information, and type
      of operating system used.
    </p>
    <h2>Google Analytics Cookies</h2>
    <p>
      This website uses{' '}
      <Link href="https://www.google.com/analytics/" passHref legacyBehavior>
        <MUILink target="_blank" rel="noreferrer">
          Google Analytics
        </MUILink>
      </Link>
      , a web analytics service provided by Google, Inc. (&quot;Google&quot;).
    </p>
    <p>
      We use Google Analytics to track your preferences and also to identify popular sections of our website. Use of
      Google Analytics in this way, enables us to adapt the content of our website more specifically to your needs and
      thereby improve what we can offer to you.
    </p>
    <p>
      Google will use this information for the purpose of evaluating your use of our website, compiling reports on
      website activity for website operators and providing other services relating to website activity and internet
      usage. Google may also transfer this information to third parties where required to do so by law, or where such
      third parties process the information on Google&apos;s behalf. Google will not associate your IP address with any
      other data held by Google.
    </p>
    <p>In particular Google Analytics tells us</p>
    <ol start={1}>
      <li>your IP address (last 3 digits are masked);</li>
      <li>the number of pages visited;</li>
      <li>the time and duration of the visit;</li>
      <li>your location;</li>
      <li>the website you came from (if any);</li>
      <li>the type of hardware you use (i.e. whether you are browsing from a desktop or a mobile device);</li>
      <li>the software used (type of browser); and</li>
      <li>your general interaction with our website.</li>
    </ol>
    <p>
      As stated above, cookie-related information is not used to identify you personally, and what is compiled is only
      aggregate data that tells us, for example, what countries we are most popular in, but not that you live in a
      particular country or your precise location when you visited our website (this is because we have only half the
      information- we know the country the person is browsing from, but not the name of person who is browsing). In such
      an example Google will analyze the number of users for us, but the relevant cookies do not reveal their
      identities.
    </p>
    <p>
      By using this website, you consent to the processing of data about you by Google in the manner and for the
      purposes set out above. Google Analytics, its purpose and function is further explained on the{' '}
      <Link href="https://www.google.com/analytics/" passHref legacyBehavior>
        <MUILink target="_blank" rel="noreferrer">
          Google Analytics website
        </MUILink>
      </Link>
      .
    </p>
    <p>
      For more information about Google Analytics cookies, please see Google&apos;s help pages and privacy policy:{' '}
      <Link href="https://www.google.com/intl/en/policies/privacy/" passHref legacyBehavior>
        <MUILink target="_blank" rel="noreferrer">
          Google&apos;s Privacy Policy
        </MUILink>
      </Link>
      &nbsp;and{' '}
      <Link
        href="https://developers.google.com/analytics/devguides/collection/analyticsjs/cookie-usage"
        passHref
        legacyBehavior
      >
        <MUILink target="_blank" rel="noreferrer">
          Google Analytics Help pages
        </MUILink>
      </Link>
      . For further information about the use of these cookies by Google{' '}
      <Link href="https://support.google.com/analytics/answer/6004245" passHref legacyBehavior>
        <MUILink target="_blank" rel="noreferrer">
          click here
        </MUILink>
      </Link>
      .
    </p>
    <h2>
      What if you don&rsquo;t agree with us monitoring your use of our website (even if we don&apos;t collect your
      personal data)?
    </h2>
    <p>
      Enabling these cookies is not strictly necessary for our website to work but it will provide you with a better
      browsing experience. You can delete or block the cookies we set, but if you do that, some features of this website
      may not work as intended.
    </p>
    <p>
      Most browsers are initially set to accept cookies. If you prefer, you can set your browser to refuse cookies and
      control and/or delete cookies as you wish &ndash; for details, see{' '}
      <Link href="https://www.aboutcookies.org/" passHref legacyBehavior>
        <MUILink target="_blank" rel="noreferrer">
          https://aboutcookies.org
        </MUILink>
      </Link>
      . You can delete all cookies that are already on your device and you can set most browsers to prevent them from
      being placed. You should be aware that if you do this, you may have to manually adjust some preferences every time
      you visit an Internet site and some services and functionalities may not work if you do not accept the cookies
      they send.
    </p>
    <p>
      Advertisers and business partners that you access on or through our website may also send you cookies. We do not
      control any cookies outside of our website.
    </p>
    <p>
      If you have any further questions regarding disabling cookies you should consult with your preferred
      browser&rsquo;s provider or manufacturer.
    </p>
    <p>
      In order to implement your objection it may be necessary to install an opt-out cookie on your browser. This cookie
      will only indicate that you have opted out. It is important to note, that for technical reasons, the opt-out
      cookie will only affect the browser from which you actively object from. If you delete the cookies in your browser
      or use a different end device or browser, you will need to opt out again.
    </p>
    <p>
      To opt out of being tracked by Google Analytics across all websites, Google has developed Google Analytics opt-out
      browser add-on. If you would like to opt out of Google Analytics, you have the option of downloading and
      installing this browser add-on which can be found under the link:{' '}
      <Link href="https://tools.google.com/dlpage/gaoptout" passHref legacyBehavior>
        <MUILink target="_blank" rel="noreferrer">
          https://tools.google.com/dlpage/gaoptout
        </MUILink>
      </Link>
      .
    </p>
    <h2>Revisions to this Cookie Policy</h2>
    <p>
      On this website, you can always view the latest version of our Privacy Policy and our Cookie Policy. We may modify
      this Cookie Policy from time to time. If we make changes to this Cookie Policy, we will provide notice of such
      changes, such as by sending an email notification, providing notice through our website or updating the
      &lsquo;Last Updated&rsquo; date at the beginning of this Cookie Policy. The amended Cookie Policy will be
      effective immediately after the date it is posted. By continuing to access or use our website after the effective
      date, you confirm your acceptance of the revised Cookie Policy and all of the terms incorporated therein by
      reference. We encourage you to review our Privacy Policy and our Cookie Policy whenever you access or use our
      website to stay informed about our information practices and the choices available to you.
    </p>
    <p>
      If you do not accept changes which are made to this Cookie Policy, or take any measures described above to opt-out
      by removing or rejecting cookies, you may continue to use this website but accept that it may not display and/or
      function as intended by us. Any social media channels connected to us and third party applications will be subject
      to the privacy and cookie policies and practices of the relevant platform providers which, unless otherwise
      indicated, are not affiliated or associated with us Your exercise of any rights to opt-out may also impact how our
      information and content is displayed and/or accessible to you on this website and on other websites.
    </p>
    <h2>APPENDIX</h2>
    <p>Overview of cookies placed and the consequences if the cookies are not placed.</p>
    <h3>First-party cookies</h3>
    <table>
      <tbody>
        <tr>
          <td colSpan={1} rowSpan={1}>
            <p>#</p>
          </td>
          <td colSpan={1} rowSpan={1}>
            <p>Name of cookie</p>
          </td>
          <td colSpan={1} rowSpan={1}>
            <p>Domain</p>
          </td>
          <td colSpan={1} rowSpan={1}>
            <p>Purpose(s) of cookie</p>
          </td>
          <td colSpan={1} rowSpan={1}>
            <p>Storage period of cookie</p>
          </td>
          <td colSpan={1} rowSpan={1}>
            <p>Consequences is cookie is not accepted</p>
          </td>
        </tr>
        <tr>
          <td colSpan={1} rowSpan={1}>
            <p>1</p>
          </td>
          <td colSpan={1} rowSpan={1}>
            <p>_BEAMER_FILTER_BY_URL_{'{productID}'}</p>
          </td>
          <td colSpan={1} rowSpan={1}>
            <p>app.safe.global</p>
          </td>
          <td colSpan={1} rowSpan={1}>
            <p>Stores whether to apply URL filtering on the feed.</p>
          </td>
          <td colSpan={1} rowSpan={1}>
            <p>20 minutes</p>
          </td>
          <td colSpan={1} rowSpan={1}>
            <p>User activity won&apos;t be tracked</p>
          </td>
        </tr>
        <tr>
          <td colSpan={1} rowSpan={1}>
            <p>2</p>
          </td>
          <td colSpan={1} rowSpan={1}>
            <p>_BEAMER_DATE_{'{productID}'}</p>
          </td>
          <td colSpan={1} rowSpan={1}>
            <p>app.safe.global</p>
          </td>
          <td colSpan={1} rowSpan={1}>
            <p>Stores the latest date in which the feed was opened.</p>
          </td>
          <td colSpan={1} rowSpan={1}>
            <p>300 days</p>
          </td>
          <td colSpan={1} rowSpan={1}>
            <p>User activity won&apos;t be tracked</p>
          </td>
        </tr>
        <tr>
          <td colSpan={1} rowSpan={1}>
            <p>3</p>
          </td>
          <td colSpan={1} rowSpan={1}>
            <p>_BEAMER_LAST_POST_SHOWN_{'{productID}'}</p>
          </td>
          <td colSpan={1} rowSpan={1}>
            <p>app.safe.global</p>
          </td>
          <td colSpan={1} rowSpan={1}>
            <p>Stores the ID of the last post shown as a teaser.</p>
          </td>
          <td colSpan={1} rowSpan={1}>
            <p>Session</p>
          </td>
          <td colSpan={1} rowSpan={1}>
            <p>User activity won&apos;t be tracked</p>
          </td>
        </tr>
        <tr>
          <td colSpan={1} rowSpan={1}>
            <p>4</p>
          </td>
          <td colSpan={1} rowSpan={1}>
            <p>_BEAMER_BOOSTED_ANNOUNCEMENT_DATE_{'{productID}'}</p>
          </td>
          <td colSpan={1} rowSpan={1}>
            <p>app.safe.global</p>
          </td>
          <td colSpan={1} rowSpan={1}>
            <p>Stores the latest date in which a boosted announcement was displayed.</p>
          </td>
          <td colSpan={1} rowSpan={1}>
            <p>300 days</p>
          </td>
          <td colSpan={1} rowSpan={1}>
            <p>User activity won&apos;t be tracked</p>
          </td>
        </tr>
        <tr>
          <td colSpan={1} rowSpan={1}>
            <p>5</p>
          </td>
          <td colSpan={1} rowSpan={1}>
            <p>_BEAMER_FIRST_VISIT_{'{productID}'}</p>
          </td>
          <td colSpan={1} rowSpan={1}>
            <p>app.safe.global</p>
          </td>
          <td colSpan={1} rowSpan={1}>
            <p>Stores the date of this user&rsquo;s first visit to the site.</p>
          </td>
          <td colSpan={1} rowSpan={1}>
            <p>300 days</p>
          </td>
          <td colSpan={1} rowSpan={1}>
            <p>User activity won&apos;t be tracked</p>
          </td>
        </tr>
        <tr>
          <td colSpan={1} rowSpan={1}>
            <p>6</p>
          </td>
          <td colSpan={1} rowSpan={1}>
            <p>_BEAMER_USER_ID_{'{productID}'}</p>
          </td>
          <td colSpan={1} rowSpan={1}>
            <p>app.safe.global</p>
          </td>
          <td colSpan={1} rowSpan={1}>
            <p>Stores an internal ID for this user.</p>
          </td>
          <td colSpan={1} rowSpan={1}>
            <p>300 days</p>
          </td>
          <td colSpan={1} rowSpan={1}>
            <p>User activity won&apos;t be tracked</p>
          </td>
        </tr>
      </tbody>
    </table>
    <h3>Third-party cookies</h3>
    <p>The cookies from this table can be set by third-party wallets.</p>
    <table>
      <tbody>
        <tr>
          <td colSpan={1} rowSpan={1}>
            <p>#</p>
          </td>
          <td colSpan={1} rowSpan={1}>
            <p>Name of cookie</p>
          </td>
          <td colSpan={1} rowSpan={1}>
            <p>Domain</p>
          </td>
          <td colSpan={1} rowSpan={1}>
            <p>Purpose(s) of cookie</p>
          </td>
          <td colSpan={1} rowSpan={1}>
            <p>Storage period of cookie</p>
          </td>
          <td colSpan={1} rowSpan={1}>
            <p>Consequences is cookie is not accepted</p>
          </td>
        </tr>
        <tr>
          <td colSpan={1} rowSpan={1}>
            <p>1</p>
          </td>
          <td colSpan={1} rowSpan={1}>
            <p>_ga</p>
          </td>
          <td colSpan={1} rowSpan={1}>
            <p>safe.global</p>
          </td>
          <td colSpan={1} rowSpan={1}>
            <p>Used to distinguish users</p>
          </td>
          <td colSpan={1} rowSpan={1}>
            <p>2 years from set/update</p>
          </td>
          <td colSpan={1} rowSpan={1}>
            <p>User activity won&apos;t be tracked</p>
          </td>
        </tr>
        <tr>
          <td colSpan={1} rowSpan={1}>
            <p>2</p>
          </td>
          <td colSpan={1} rowSpan={1}>
            <p>_ga</p>
          </td>
          <td colSpan={1} rowSpan={1}>
            <p>getbeamer.com</p>
          </td>
          <td colSpan={1} rowSpan={1}>
            <p>Used to distinguish users</p>
          </td>
          <td colSpan={1} rowSpan={1}>
            <p>2 years from set/update</p>
          </td>
          <td colSpan={1} rowSpan={1}>
            <p>User activity won&apos;t be tracked</p>
          </td>
        </tr>
        <tr>
          <td colSpan={1} rowSpan={1}>
            <p>3</p>
          </td>
          <td colSpan={1} rowSpan={1}>
            <p>_gid</p>
          </td>
          <td colSpan={1} rowSpan={1}>
            <p>getbeamer.com</p>
          </td>
          <td colSpan={1} rowSpan={1}>
            <p>Used to distinguish users</p>
          </td>
          <td colSpan={1} rowSpan={1}>
            <p>24 hours</p>
          </td>
          <td colSpan={1} rowSpan={1}>
            <p>User activity won&apos;t be tracked</p>
          </td>
        </tr>
        <tr>
          <td colSpan={1} rowSpan={1}>
            <p>4</p>
          </td>
          <td colSpan={1} rowSpan={1}>
            <p>_BEAMER_USER_ID_{'{productID}'}</p>
          </td>
          <td colSpan={1} rowSpan={1}>
            <p>getbeamer.com</p>
          </td>
          <td colSpan={1} rowSpan={1}>
            <p>Stores an internal ID for this user.</p>
          </td>
          <td colSpan={1} rowSpan={1}>
            <p>300 days</p>
          </td>
          <td colSpan={1} rowSpan={1}>
            <p>User activity won&apos;t be tracked</p>
          </td>
        </tr>
        <tr>
          <td colSpan={1} rowSpan={1}>
            <p>5</p>
          </td>
          <td colSpan={1} rowSpan={1}>
            <p>JSESSIONID</p>
          </td>
          <td colSpan={1} rowSpan={1}>
            <p>app.getbeamer.com</p>
          </td>
          <td colSpan={1} rowSpan={1}>
            <p>Stores an internal ID for this user.</p>
          </td>
          <td colSpan={1} rowSpan={1}>
            <p>Session</p>
          </td>
          <td colSpan={1} rowSpan={1}>
            <p>User activity won&apos;t be tracked</p>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
)

const CookiePolicy: NextPage = () => {
  const isOfficialHost = useIsOfficialHost()

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Cookie policy`}</title>
      </Head>

      <main>{isOfficialHost && <SafeCookiePolicy />}</main>
    </>
  )
}

export default CookiePolicy
