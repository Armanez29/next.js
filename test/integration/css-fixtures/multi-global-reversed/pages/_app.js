import React from "react";
import App from "next/app";
import "../styles/global2.css";
import "../styles/global1.css";

class MyApp extends App {
  render() {
    const { Component, pageProps } = this.props;
    return <Component {...pageProps} />;
  }
}

export default MyApp;
