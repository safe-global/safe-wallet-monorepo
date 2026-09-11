import Document, { Html, Head, Main, NextScript } from 'next/document'

export default class WebCoreDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head />
        <body>
          <div className="root">
            <Main />
          </div>
          <NextScript />
        </body>
      </Html>
    )
  }
}
