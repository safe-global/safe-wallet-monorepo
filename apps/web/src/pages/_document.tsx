/**
 * This file is needed to embed MUI theme CSS into the pre-built HTML files
 * @see https://github.com/mui/material-ui/tree/master/examples/nextjs-with-typescript
 */
import Document, { Html, Head, Main, NextScript, DocumentContext } from 'next/document'
import Script from 'next/script'
import createEmotionServer from '@emotion/server/create-instance'
import createEmotionCache from '@/utils/createEmotionCache'

const PYLON_APP_ID = process.env.NEXT_PUBLIC_PYLON_APP_ID

export default class WebCoreDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          <meta name="emotion-insertion-point" content="" />
          {(this.props as any).emotionStyleTags}
        </Head>
        <body>
          <Main />
          <NextScript />
          
          {/* Pylon Chat Widget Integration */}
          {PYLON_APP_ID && (
            <>
              {/* Initialize window.pylon.chat_settings */}
              <script
                id="pylon-chat-widget-initialize-window"
                type="text/javascript"
                dangerouslySetInnerHTML={{
                  __html: `
                    window.pylon = {
                      chat_settings: {
                        app_id: "${PYLON_APP_ID}",
                        email: "user@safewallet.com",
                        name: "Safe User"
                      }
                    };
                  `
                }}
              />
              
              {/* Load the Pylon chat widget */}
              <script
                id="pylon-chat-widget"
                type="text/javascript"
                async
                dangerouslySetInnerHTML={{
                  __html: `
                    (function(){var e=window;var t=document;var n=function(){n.e(arguments)};n.q=[];n.e=function(e){n.q.push(e)};e.Pylon=n;var r=function(){var e=t.createElement("script");e.setAttribute("type","text/javascript");e.setAttribute("async","true");e.setAttribute("src","https://widget.usepylon.com/widget/${PYLON_APP_ID}");var n=t.getElementsByTagName("script")[0];n.parentNode.insertBefore(e,n)};if(t.readyState==="complete"){r()}else if(e.addEventListener){e.addEventListener("load",r,false)}})();
                  `
                }}
              />
            </>
          )}
        </body>
      </Html>
    )
  }
}

const getInitialProps = async (ctx: DocumentContext) => {
  const originalRenderPage = ctx.renderPage

  // You can consider sharing the same Emotion cache between all the SSR requests to speed up performance.
  // However, be aware that it can have global side effects.
  const cache = createEmotionCache()
  const { extractCriticalToChunks } = createEmotionServer(cache)

  ctx.renderPage = () =>
    originalRenderPage({
      enhanceApp: (App: any) =>
        function EnhanceApp(props) {
          return <App emotionCache={cache} {...props} />
        },
    })

  const initialProps = await Document.getInitialProps(ctx)
  // This is important. It prevents Emotion to render invalid HTML.
  // See https://github.com/mui/material-ui/issues/26561#issuecomment-855286153
  const emotionStyles = extractCriticalToChunks(initialProps.html)
  const emotionStyleTags = emotionStyles.styles.map((style) => (
    <style
      data-emotion={`${style.key} ${style.ids.join(' ')}`}
      key={style.key}
      dangerouslySetInnerHTML={{ __html: style.css }}
    />
  ))

  return {
    ...initialProps,
    emotionStyleTags,
  }
}

WebCoreDocument.getInitialProps = getInitialProps
