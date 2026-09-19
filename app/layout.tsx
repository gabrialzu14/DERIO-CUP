import type {Metadata,Viewport} from "next";
import {Montserrat} from "next/font/google";
import "./globals.css";
const montserrat=Montserrat({subsets:["latin"],variable:"--font-derio",display:"swap"});
export const metadata:Metadata={title:"Derio Cup",description:"Benjamin 2017 • 20 de Septiembre",applicationName:"Derio Cup",icons:{icon:[{url:"/logo%20derio%20cup.png",type:"image/png",sizes:"any"}],shortcut:"/logo%20derio%20cup.png",apple:[{url:"/logo%20derio%20cup.png",sizes:"180x180",type:"image/png"}]},manifest:"/manifest.webmanifest"};
export const viewport:Viewport={themeColor:"#071b33",width:"device-width",initialScale:1,maximumScale:1,userScalable:false,viewportFit:"cover"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="es"><body className={montserrat.variable}>{children}</body></html>}