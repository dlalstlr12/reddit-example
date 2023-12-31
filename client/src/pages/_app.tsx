import '../styles/globals.css'
import type { AppProps } from 'next/app'
import {default as Axios }from 'axios'
import { AuthProvider } from '../context/auth';
import { useRouter } from 'next/router';
import NavBar from '../components/NavBar';
import { SWRConfig } from 'swr';
import axios from 'axios';
import Head from 'next/head';

function MyApp({ Component , pageProps  }: AppProps ) {
  Axios.defaults.baseURL = process.env.NEXT_PUBLIC_SERVER_BASER_URL + "/api";
  Axios.defaults.withCredentials = true;

  const {pathname} = useRouter();
  const authRoutes = ["/register","/login"];
  const authRoute = authRoutes.includes(pathname);

  const fetcher = async(url : string) =>{
    try{
        const res = await axios.get(url);
        return res.data;
    } catch (error: any){
        throw error.response.data
    }
}
  return <>
    <Head>
      <link rel="stylesheet" 
      href="https://use.fontawesome.com/releases/v5.15.4/css/all.css" 
      integrity="sha384-DyZ88mC6Up2uqS4h/KRgHuoeGwBcD4Ng9SiP4dIRy0EXTlnuz47vAwmeGwVChigm" 
      crossOrigin="anonymous"
      />
    </Head>
  <SWRConfig
    value={{
      fetcher
    }}
  >
  <AuthProvider> 
    {!authRoute && <NavBar />}
    <div className={authRoute ? "": "pt-12"}>
      <Component {...pageProps} />
    </div>
  </AuthProvider>
  </SWRConfig>
  </>
}


export default MyApp
