import type {Metadata,Viewport} from "next";
import {Montserrat} from "next/font/google";
import "./globals.css";
const montserrat=Montserrat({subsets:["latin"],variable:"--font-derio",display:"swap"});
export const metadata:Metadata={title:"Derio Cup",description:"Benjamin 2017 • 20 de Septiembre",applicationName:"Derio Cup",icons:{icon:"/logo%20derio%20cup.png",shortcut:"/logo%20derio%20cup.png",apple:"/logo%20derio%20cup.png"}};
export const viewport:Viewport={themeColor:"#071b33",width:"device-width",initialScale:1};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="es"><body className={montserrat.variable}>{children}</body></html>}