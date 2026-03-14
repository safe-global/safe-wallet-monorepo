/**
 * Stub for next/document.
 * _document.tsx is not used at runtime with Vite — these exist only
 * to satisfy TypeScript and allow the file to compile.
 */
import type { ReactNode, ComponentType } from 'react'
import React from 'react'

export interface DocumentContext {
  renderPage: (options?: { enhanceApp?: (App: ComponentType) => ComponentType }) => { html: string; head?: ReactNode[] }
}

export interface DocumentInitialProps {
  html: string
  head?: ReactNode[]
}

class Document extends React.Component {
  static getInitialProps(ctx: DocumentContext): Promise<DocumentInitialProps> {
    void ctx
    return Promise.resolve({ html: '' })
  }

  render(): ReactNode {
    return null
  }
}

export default Document

export const Html: React.FC<React.HTMLAttributes<HTMLHtmlElement> & { children?: ReactNode }> = ({
  children,
  ...props
}) => React.createElement('html', props, children)

export const Head: React.FC<{ children?: ReactNode }> = ({ children }) => React.createElement('head', null, children)

export const Main: React.FC = () => React.createElement('div', { id: 'root' })

export const NextScript: React.FC = () => null
