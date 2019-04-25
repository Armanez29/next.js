import React from 'react'
import { IContext } from 'next-server/dist/lib/utils';

// Extend the React types with missing properties
declare module 'react' {
  // <html amp=""> support
  interface HtmlHTMLAttributes<T> extends React.HTMLAttributes<T> {
    amp?: string;
  }

  // <link nonce=""> support
  interface LinkHTMLAttributes<T> extends HTMLAttributes<T> {
    nonce?: string
  }

  // <style jsx> and <style jsx global> support for styled-jsx
  interface StyleHTMLAttributes<T> extends HTMLAttributes<T> {
    jsx?: boolean;
    global?: boolean;
  }
}

export type GetInitialProps<P = {}> = (context: IContext) => Promise<P>

export type NextPage<P = {}, IP = {}> = {
  (props: P): JSX.Element;
  getInitialProps?(ctx: IContext): Promise<IP>;
}

export { IContext }
