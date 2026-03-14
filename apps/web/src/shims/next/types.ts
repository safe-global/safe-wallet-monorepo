/**
 * Shim for bare `next` module types.
 * Provides the type exports that pages use (NextPage, GetServerSideProps, etc.).
 */
import type { FC } from 'react'

/** Page component type — equivalent to React.FC in Vite SPA mode. */
export type NextPage<P = Record<string, unknown>, _IP = P> = FC<P>

/** SSR data-fetching types — no-op stubs for Vite SPA compatibility. */
export type GetServerSidePropsContext = {
  query: Record<string, string | string[] | undefined>
  params?: Record<string, string>
}

export type GetServerSidePropsResult<P> =
  | { props: P }
  | { redirect: { destination: string; permanent?: boolean } }
  | { notFound: true }

export type GetServerSideProps<P extends Record<string, unknown> = Record<string, unknown>> = (
  context: GetServerSidePropsContext,
) => Promise<GetServerSidePropsResult<P>>

export type GetStaticPropsContext = {
  params?: Record<string, string>
}

export type GetStaticPropsResult<P> =
  | { props: P; revalidate?: number }
  | { redirect: { destination: string; permanent?: boolean } }
  | { notFound: true }

export type GetStaticProps<P extends Record<string, unknown> = Record<string, unknown>> = (
  context: GetStaticPropsContext,
) => Promise<GetStaticPropsResult<P>>
