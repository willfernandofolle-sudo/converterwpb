import { createGlobalStyle, ThemeProvider } from "styled-components";

const GlobalStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap');

  :root {
    color-scheme: dark;
  }

  body {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    background: rgb(26, 26, 26);
    color: #ffffff;
    font-family: "Poppins", sans-serif;
  }

  * {
    box-sizing: border-box;
  }
`;

const theme = {
  colors: {
    primary: "#54E360",
    secondary: "#3fc24c",
    background: "rgb(26, 26, 26)",
    text: "#ffffff",
    mutedText: "#ffffff",
  },
};

export default function App({ Component, pageProps }) {
  return (
    <>
      <GlobalStyle />
      <ThemeProvider theme={theme}>
        <Component {...pageProps} />
      </ThemeProvider>
    </>
  );
}
